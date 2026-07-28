const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const importStr = "import { downloadTrackAsMp3 } from '../utils/downloadHelper';\nimport { audioEngine } from '../domain/audio/AudioEngine';\n\n" + 
`const YoutubeVideoContainer = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const ytContainer = audioEngine.getYoutubeContainer();
    if (ytContainer && containerRef.current) {
      // Save original styles
      const origPos = ytContainer.style.position;
      const origLeft = ytContainer.style.left;
      const origTop = ytContainer.style.top;
      const origWidth = ytContainer.style.width;
      const origHeight = ytContainer.style.height;
      const origParent = ytContainer.parentNode;
      
      // Move to our container
      containerRef.current.appendChild(ytContainer);
      ytContainer.style.position = 'relative';
      ytContainer.style.left = 'auto';
      ytContainer.style.top = 'auto';
      ytContainer.style.width = '100%';
      ytContainer.style.height = '100%';
      
      return () => {
        // Restore
        if (origParent) {
          origParent.appendChild(ytContainer);
        } else {
          document.body.appendChild(ytContainer);
        }
        ytContainer.style.position = origPos;
        ytContainer.style.left = origLeft;
        ytContainer.style.top = origTop;
        ytContainer.style.width = origWidth;
        ytContainer.style.height = origHeight;
      };
    }
  }, []);
  
  return <div ref={containerRef} className="w-full h-full" />;
};
`;

code = code.replace("import { downloadTrackAsMp3 } from '../utils/downloadHelper';", importStr);

// Replace the iframe in Video view
const badVideoBlock = `<iframe
              src={\`https://www.youtube.com/embed/\${youtubeId}?autoplay=1\`}
              title={currentTrack.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />`;

code = code.replace(badVideoBlock, "<YoutubeVideoContainer />");

fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched FullScreenPlayerModal");
