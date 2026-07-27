#!/bin/bash
sed -i '4948c\
          reactPlayerConfig\
        })}\
      </div>\
' src/components/GymMusicPlayer.tsx
