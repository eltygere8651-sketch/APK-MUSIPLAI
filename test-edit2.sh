#!/bin/bash
sed -i '4921,4952c\
        {currentUrl && engine.render && engine.render({\
          youtubePlayerRef,\
          currentUrl,\
          isPlaying,\
          setIsPlaying,\
          isDucking,\
          volume,\
          consecutiveErrorsRef,\
          handleNextRef,\
          registerMediaSession,\
          enforceActionHandlers,\
          pendingSeekPosRef,\
          initialLoadRef,\
          isBufferingRef,\
          expectedPlayingRef,\
          wasUnexpectedlyPausedRef,\
          fallbackSilentAudioRef,\
          hasEarlySkippedRef,\
          lastSkipTimeRef,\
          trackQueueRef,\
          displayTracks,\
          currentTrackIndex,\
          setCurrentTrackIndex,\
          setPosition,\
          positionRef,\
          duration,\
          setDuration,\
          reactPlayerConfig\
        })}\
' src/components/GymMusicPlayer.tsx
