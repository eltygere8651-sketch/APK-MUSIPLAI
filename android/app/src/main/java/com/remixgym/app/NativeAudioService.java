package com.remixgym.app;

import androidx.media3.exoplayer.ExoPlayer;
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
        
        ExoPlayer player = new ExoPlayer.Builder(this).build();
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
