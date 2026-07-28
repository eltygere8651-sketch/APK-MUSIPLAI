package com.remixgym.app;

import android.content.ComponentName;
import android.util.Log;

import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.Player;
import androidx.media3.session.MediaController;
import androidx.media3.session.SessionToken;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.common.util.concurrent.MoreExecutors;

import java.util.Map;

@CapacitorPlugin(name = "NativeAudio")
public class NativeAudioPlugin extends Plugin {
    private static final String TAG = "NativeAudioPlugin";
    private MediaController mediaController;
    private ListenableFuture<MediaController> controllerFuture;
    
    @Override
    public void load() {
        super.load();
        Log.d(TAG, "NativeAudioPlugin initialized");
        
        SessionToken sessionToken = new SessionToken(getContext(), new ComponentName(getContext(), NativeAudioService.class));
        controllerFuture = new MediaController.Builder(getContext(), sessionToken).buildAsync();
        
        controllerFuture.addListener(() -> {
            try {
                mediaController = controllerFuture.get();
                mediaController.addListener(new Player.Listener() {
                    @Override
                    public void onPlaybackStateChanged(int playbackState) {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onPlaybackStateChanged: " + playbackState);
                        JSObject ret = new JSObject();
                        String stateStr = "IDLE";
                        switch (playbackState) {
                            case Player.STATE_IDLE:
                                Log.d(TAG, "[DEBUG_NATIVE_JAVA] STATE_IDLE");
                                stateStr = "IDLE";
                                break;
                            case Player.STATE_BUFFERING:
                                Log.d(TAG, "[DEBUG_NATIVE_JAVA] STATE_BUFFERING");
                                stateStr = "BUFFERING";
                                JSObject buff = new JSObject();
                                buff.put("isBuffering", true);
                                notifyListeners("onBuffering", buff);
                                break;
                            case Player.STATE_READY:
                                Log.d(TAG, "[DEBUG_NATIVE_JAVA] STATE_READY (PlayWhenReady: " + mediaController.getPlayWhenReady() + ")");
                                stateStr = mediaController.getPlayWhenReady() ? "PLAYING" : "PAUSED";
                                JSObject buffEnd = new JSObject();
                                buffEnd.put("isBuffering", false);
                                notifyListeners("onBuffering", buffEnd);
                                break;
                            case Player.STATE_ENDED:
                                Log.d(TAG, "[DEBUG_NATIVE_JAVA] STATE_ENDED");
                                stateStr = "STOPPED";
                                break;
                        }
                        ret.put("status", stateStr);
                        ret.put("playbackStateCode", playbackState);
                        ret.put("playWhenReady", mediaController.getPlayWhenReady());
                        ret.put("isPlaying", mediaController.isPlaying());
                        ret.put("bufferedPosition", mediaController.getBufferedPosition());
                        ret.put("currentPosition", mediaController.getCurrentPosition());
                        notifyListeners("onStateChanged", ret);
                    }
                    
                    @Override
                    public void onIsPlayingChanged(boolean isPlaying) {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onIsPlayingChanged: " + isPlaying);
                        JSObject ret = new JSObject();
                        ret.put("status", isPlaying ? "PLAYING" : "PAUSED");
                        ret.put("isPlaying", isPlaying);
                        ret.put("playWhenReady", mediaController != null && mediaController.getPlayWhenReady());
                        ret.put("bufferedPosition", mediaController != null ? mediaController.getBufferedPosition() : 0);
                        ret.put("currentPosition", mediaController != null ? mediaController.getCurrentPosition() : 0);
                        notifyListeners("onStateChanged", ret);
                    }
                    
                    @Override
                    public void onPlayWhenReadyChanged(boolean playWhenReady, int reason) {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onPlayWhenReadyChanged: playWhenReady=" + playWhenReady + ", reason=" + reason);
                    }

                    @Override
                    public void onMediaItemTransition(MediaItem mediaItem, int reason) {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onMediaItemTransition: mediaItem=" + (mediaItem != null ? mediaItem.mediaId : "null") + ", reason=" + reason);
                    }

                    @Override
                    public void onRenderedFirstFrame() {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onRenderedFirstFrame() triggered");
                    }

                    @Override
                    public void onEvents(Player player, Player.Events events) {
                        Log.d(TAG, "[DEBUG_NATIVE_JAVA] onEvents triggered, contains error? " + events.contains(Player.EVENT_PLAYER_ERROR));
                    }

                    @Override
                    public void onPlayerError(androidx.media3.common.PlaybackException error) {
                        Log.e(TAG, "[DEBUG_NATIVE_JAVA] onPlayerError: ", error);
                        JSObject ret = new JSObject();
                        ret.put("error", error.getMessage() != null ? error.getMessage() : error.toString());
                        ret.put("errorCodeName", error.getErrorCodeName());
                        ret.put("fatal", true);

                        StringBuilder sb = new StringBuilder();
                        Throwable cause = error;
                        int httpCode = -1;
                        while (cause != null) {
                            sb.append(cause.getClass().getName()).append(": ").append(cause.getMessage()).append("\n");
                            if (cause instanceof androidx.media3.datasource.HttpDataSource.InvalidResponseCodeException) {
                                httpCode = ((androidx.media3.datasource.HttpDataSource.InvalidResponseCodeException) cause).responseCode;
                            }
                            for (StackTraceElement ste : cause.getStackTrace()) {
                                sb.append("   at ").append(ste.toString()).append("\n");
                            }
                            cause = cause.getCause();
                            if (cause != null) sb.append("Caused by: ");
                        }
                        ret.put("stackTrace", sb.toString());
                        ret.put("httpResponseCode", httpCode);

                        notifyListeners("onError", ret);
                    }
                });
                
                // Start a thread to poll progress
                new Thread(() -> {
                    while (true) {
                        try {
                            Thread.sleep(1000);
                            if (mediaController != null && mediaController.isPlaying()) {
                                JSObject ret = new JSObject();
                                ret.put("position", mediaController.getCurrentPosition());
                                ret.put("duration", mediaController.getDuration());
                                notifyListeners("onProgress", ret);
                            }
                        } catch (InterruptedException e) {
                            break;
                        }
                    }
                }).start();
                
            } catch (Exception e) {
                Log.e(TAG, "Error building media controller", e);
            }
        }, MoreExecutors.directExecutor());
    }
    
    @PluginMethod
    public void load(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "Unknown Title");
        String artist = call.getString("artist", "Unknown Artist");
        
        Log.d(TAG, "[INSTRUMENTATION_4] URL recibida por NativeAudioPlugin: " + url);

        if (url == null || mediaController == null) {
            Log.e(TAG, "[DEBUG_NATIVE_JAVA] load() failed: url is null or mediaController not ready");
            call.reject("Must provide url and controller must be ready");
            return;
        }
        
        try {
            Log.d(TAG, "[INSTRUMENTATION_5] URL recibida finalmente por Media3 (MediaItem): " + url);
            MediaItem mediaItem = new MediaItem.Builder()
                    .setUri(url)
                    .setMediaMetadata(new MediaMetadata.Builder()
                            .setTitle(title)
                            .setArtist(artist)
                            .build())
                    .build();
            
            Log.d(TAG, "[DEBUG_NATIVE_JAVA] MediaItem built successfully");

            getActivity().runOnUiThread(() -> {
                Log.d(TAG, "[DEBUG_NATIVE_JAVA] Setting MediaItem and calling prepare()");
                try {
                    mediaController.setMediaItem(mediaItem);
                    mediaController.prepare();
                    Log.d(TAG, "[DEBUG_NATIVE_JAVA] prepare() called successfully");
                    call.resolve();
                } catch (Exception e) {
                    Log.e(TAG, "[DEBUG_NATIVE_JAVA] Error during prepare()", e);
                    call.reject("Error during prepare", e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "[DEBUG_NATIVE_JAVA] Exception building MediaItem", e);
            call.reject("Exception building MediaItem", e);
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        Log.d(TAG, "[DEBUG_NATIVE_JAVA] play() called");
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                try {
                    Log.d(TAG, "[DEBUG_NATIVE_JAVA] calling mediaController.play()");
                    mediaController.play();
                    Log.d(TAG, "[DEBUG_NATIVE_JAVA] play() executed successfully");
                    call.resolve();
                } catch (Exception e) {
                    Log.e(TAG, "[DEBUG_NATIVE_JAVA] Exception during play()", e);
                    call.reject("Exception during play", e);
                }
            });
        } else {
            Log.e(TAG, "[DEBUG_NATIVE_JAVA] play() failed: mediaController is null");
            call.reject("Controller not ready");
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.pause();
                call.resolve();
            });
        } else {
            call.reject("Controller not ready");
        }
    }
    
    @PluginMethod
    public void resume(PluginCall call) {
        play(call);
    }
    
    @PluginMethod
    public void stop(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.stop();
                call.resolve();
            });
        } else {
            call.reject("Controller not ready");
        }
    }
    
    @PluginMethod
    public void seek(PluginCall call) {
        Long position = call.getLong("position");
        if (position != null && mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.seekTo(position);
                call.resolve();
            });
        } else {
            call.reject("Invalid position or controller not ready");
        }
    }
    
    @PluginMethod
    public void next(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.seekToNextMediaItem();
                call.resolve();
            });
        } else {
            call.reject("Controller not ready");
        }
    }
    
    @PluginMethod
    public void previous(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.seekToPreviousMediaItem();
                call.resolve();
            });
        } else {
            call.reject("Controller not ready");
        }
    }
    
    @PluginMethod
    public void getDebugInfo(PluginCall call) {
        JSObject ret = new JSObject();
        if (mediaController != null) {
            ret.put("ready", true);
            ret.put("playbackStateCode", mediaController.getPlaybackState());
            int state = mediaController.getPlaybackState();
            String stateStr = "STATE_IDLE";
            if (state == Player.STATE_BUFFERING) stateStr = "STATE_BUFFERING";
            else if (state == Player.STATE_READY) stateStr = "STATE_READY";
            else if (state == Player.STATE_ENDED) stateStr = "STATE_ENDED";
            ret.put("playbackState", stateStr);
            ret.put("playWhenReady", mediaController.getPlayWhenReady());
            ret.put("isPlaying", mediaController.isPlaying());
            ret.put("bufferedPosition", mediaController.getBufferedPosition());
            ret.put("currentPosition", mediaController.getCurrentPosition());
            ret.put("duration", mediaController.getDuration());
            if (mediaController.getPlayerError() != null) {
                ret.put("playerError", mediaController.getPlayerError().getMessage());
                ret.put("playerErrorCode", mediaController.getPlayerError().getErrorCodeName());
            }
        } else {
            ret.put("ready", false);
        }

        if (InstrumentedHttpDataSource.lastInstrumentation != null && !InstrumentedHttpDataSource.lastInstrumentation.isEmpty()) {
            JSObject dsObj = new JSObject();
            for (Map.Entry<String, Object> entry : InstrumentedHttpDataSource.lastInstrumentation.entrySet()) {
                if (entry.getValue() != null) {
                    dsObj.put(entry.getKey(), entry.getValue().toString());
                }
            }
            ret.put("dataSourceInstrumentation", dsObj);
        }

        call.resolve(ret);
    }

    @PluginMethod
    public void destroy(PluginCall call) {
        if (mediaController != null) {
            getActivity().runOnUiThread(() -> {
                mediaController.release();
                mediaController = null;
                call.resolve();
            });
        } else {
            call.resolve();
        }
    }
}
