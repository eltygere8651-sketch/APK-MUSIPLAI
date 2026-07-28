package com.remixgym.app;

import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.media3.common.C;
import androidx.media3.datasource.DataSpec;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.HttpDataSource;
import androidx.media3.datasource.TransferListener;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class InstrumentedHttpDataSource implements HttpDataSource {
    private static final String TAG = "InstrumentedDataSource";
    
    public static Map<String, Object> lastInstrumentation = new HashMap<>();

    private final DefaultHttpDataSource delegate;
    private boolean firstReadDone = false;

    public InstrumentedHttpDataSource(DefaultHttpDataSource delegate) {
        this.delegate = delegate;
    }

    public static class Factory implements HttpDataSource.Factory {
        private final DefaultHttpDataSource.Factory delegateFactory;

        public Factory(DefaultHttpDataSource.Factory delegateFactory) {
            this.delegateFactory = delegateFactory;
        }

        @Override
        public HttpDataSource createDataSource() {
            return new InstrumentedHttpDataSource(delegateFactory.createDataSource());
        }

        @Override
        public HttpDataSource.Factory setDefaultRequestProperties(Map<String, String> defaultRequestProperties) {
            delegateFactory.setDefaultRequestProperties(defaultRequestProperties);
            return this;
        }
    }

    @Override
    public void addTransferListener(TransferListener transferListener) {
        delegate.addTransferListener(transferListener);
    }

    @Override
    public long open(DataSpec dataSpec) throws HttpDataSourceException {
        long startTime = System.currentTimeMillis();
        String reqUrl = dataSpec.uri != null ? dataSpec.uri.toString() : "null";
        firstReadDone = false;

        Log.d(TAG, "[DATASOURCE_INSTRUMENTATION] 1. Requesting URL: " + reqUrl + " at Timestamp: " + startTime);

        Map<String, Object> info = new HashMap<>();
        info.put("reqUrl", reqUrl);
        info.put("startTime", startTime);

        try {
            long bytesToRead = delegate.open(dataSpec);
            long duration = System.currentTimeMillis() - startTime;

            int responseCode = delegate.getResponseCode();
            Uri finalUri = delegate.getUri();
            String finalUriStr = finalUri != null ? finalUri.toString() : reqUrl;
            Map<String, List<String>> headers = delegate.getResponseHeaders();

            String contentType = getHeaderValue(headers, "content-type");
            String contentLength = getHeaderValue(headers, "content-length");
            String location = getHeaderValue(headers, "location");

            info.put("durationMs", duration);
            info.put("responseCode", responseCode);
            info.put("finalUri", finalUriStr);
            info.put("contentType", contentType);
            info.put("contentLength", contentLength);
            info.put("location", location);
            info.put("bytesToRead", bytesToRead);

            lastInstrumentation = info;

            Log.d(TAG, String.format(
                "[DATASOURCE_INSTRUMENTATION] <<< OPEN SUCCESS in %d ms\n" +
                "  - Original URL: %s\n" +
                "  - Final URI: %s\n" +
                "  - HTTP Response Code: %d\n" +
                "  - Content-Type: %s\n" +
                "  - Content-Length: %s\n" +
                "  - Location Header: %s\n" +
                "  - Expected Bytes: %d",
                duration, reqUrl, finalUriStr, responseCode, contentType, contentLength, location, bytesToRead
            ));

            if (contentType != null && (contentType.contains("text/html") || contentType.contains("application/json"))) {
                Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ⚠️ NON-AUDIO Content-Type received: " + contentType);
            }

            return bytesToRead;
        } catch (HttpDataSourceException e) {
            long duration = System.currentTimeMillis() - startTime;
            info.put("durationMs", duration);
            info.put("openException", e.getMessage() != null ? e.getMessage() : e.toString());
            if (e instanceof HttpDataSource.InvalidResponseCodeException) {
                info.put("responseCode", ((HttpDataSource.InvalidResponseCodeException) e).responseCode);
            } else {
                info.put("responseCode", -1);
            }

            StringBuilder sb = new StringBuilder();
            Throwable cause = e;
            while (cause != null) {
                sb.append(cause.getClass().getName()).append(": ").append(cause.getMessage()).append("\n");
                for (StackTraceElement ste : cause.getStackTrace()) {
                    sb.append("   at ").append(ste.toString()).append("\n");
                }
                cause = cause.getCause();
                if (cause != null) sb.append("Caused by: ");
            }
            info.put("openStackTrace", sb.toString());
            lastInstrumentation = info;

            Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ❌ OPEN FAILED in " + duration + " ms for URL: " + reqUrl, e);
            throw e;
        } catch (RuntimeException e) {
            long duration = System.currentTimeMillis() - startTime;
            info.put("durationMs", duration);
            info.put("openException", e.getMessage() != null ? e.getMessage() : e.toString());

            StringBuilder sb = new StringBuilder();
            Throwable cause = e;
            while (cause != null) {
                sb.append(cause.getClass().getName()).append(": ").append(cause.getMessage()).append("\n");
                for (StackTraceElement ste : cause.getStackTrace()) {
                    sb.append("   at ").append(ste.toString()).append("\n");
                }
                cause = cause.getCause();
                if (cause != null) sb.append("Caused by: ");
            }
            info.put("openStackTrace", sb.toString());
            lastInstrumentation = info;

            Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ❌ OPEN FAILED in " + duration + " ms for URL: " + reqUrl, e);
            throw e;
        }
    }

    @Override
    public int read(byte[] buffer, int offset, int length) throws HttpDataSourceException {
        try {
            int bytesRead = delegate.read(buffer, offset, length);
            if (!firstReadDone) {
                firstReadDone = true;
                if (bytesRead == C.RESULT_END_OF_INPUT || bytesRead == 0) {
                    Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ❌ FIRST READ returned " + (bytesRead == C.RESULT_END_OF_INPUT ? "EOF (-1)" : "0 bytes"));
                    lastInstrumentation.put("firstReadStatus", bytesRead == C.RESULT_END_OF_INPUT ? "EOF (-1)" : "0 bytes");
                } else {
                    String snippet = new String(buffer, offset, Math.min(bytesRead, 120)).replaceAll("[\\r\\n]", " ");
                    boolean isNonAudioSnippet = snippet.startsWith("<!DOCTYPE") || snippet.startsWith("<html") || snippet.startsWith("{") || snippet.startsWith("<HTML");
                    
                    lastInstrumentation.put("firstReadBytes", bytesRead);
                    lastInstrumentation.put("firstReadSnippet", snippet);
                    lastInstrumentation.put("isNonAudioContent", isNonAudioSnippet);

                    Log.d(TAG, "[DATASOURCE_INSTRUMENTATION] ✅ FIRST READ: " + bytesRead + " bytes. Snippet: " + snippet);
                    if (isNonAudioSnippet) {
                        Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ⚠️ CRITICAL: Stream content is HTML/JSON, NOT AUDIO!");
                    }
                }
            }
            return bytesRead;
        } catch (HttpDataSourceException e) {
            Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ❌ READ FAILED: " + e.getMessage(), e);
            lastInstrumentation.put("readException", e.getMessage());
            throw e;
        } catch (RuntimeException e) {
            Log.e(TAG, "[DATASOURCE_INSTRUMENTATION] ❌ READ FAILED: " + e.getMessage(), e);
            lastInstrumentation.put("readException", e.getMessage());
            throw e;
        }
    }

    @Nullable
    @Override
    public Uri getUri() {
        return delegate.getUri();
    }

    @Override
    public Map<String, List<String>> getResponseHeaders() {
        return delegate.getResponseHeaders();
    }

    @Override
    public int getResponseCode() {
        return delegate.getResponseCode();
    }

    @Override
    public void close() throws HttpDataSourceException {
        delegate.close();
    }

    @Override
    public void setRequestProperty(String name, String value) {
        delegate.setRequestProperty(name, value);
    }

    @Override
    public void clearRequestProperty(String name) {
        delegate.clearRequestProperty(name);
    }

    @Override
    public void clearAllRequestProperties() {
        delegate.clearAllRequestProperties();
    }

    private String getHeaderValue(Map<String, List<String>> headers, String keyName) {
        if (headers == null) return "null";
        for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
            if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(keyName)) {
                List<String> vals = entry.getValue();
                if (vals != null && !vals.isEmpty()) {
                    return vals.get(0);
                }
            }
        }
        return "not found";
    }
}
