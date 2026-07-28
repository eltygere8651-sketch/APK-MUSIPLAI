package com.remixgym.app;

import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;
import android.util.Log;

public class NativeAudioService extends MediaSessionService {
    private static final String TAG = "NativeAudioService";
    private MediaSession mediaSession = null;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate");
        
        DefaultHttpDataSource.Factory httpDataSourceFactory = new DefaultHttpDataSource.Factory()
                .setUserAgent("Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36")
                .setAllowCrossProtocolRedirects(true);

        InstrumentedHttpDataSource.Factory instrumentedFactory = new InstrumentedHttpDataSource.Factory(httpDataSourceFactory);

        DefaultMediaSourceFactory mediaSourceFactory = new DefaultMediaSourceFactory(this)
                .setDataSourceFactory(instrumentedFactory);

        ExoPlayer player = new ExoPlayer.Builder(this)
                .setMediaSourceFactory(mediaSourceFactory)
                .build();

        mediaSession = new MediaSession.Builder(this, player).build();
    }

    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy");
        if (mediaSession != null) {
            mediaSession.getPlayer().release();
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
}
