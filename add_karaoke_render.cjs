const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf8');

const target = `    </div>
  );
}`;

const replacement = `      <AnimatePresence>
        {isKaraokeMode && currentTrack && (
          <KaraokeView 
            currentTrack={currentTrack} 
            onClose={() => setIsKaraokeMode(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
    console.log("Added Karaoke render block.");
} else {
    console.log("Failed to add Karaoke render block.");
}
