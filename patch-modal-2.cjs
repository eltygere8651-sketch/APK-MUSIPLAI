const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

const oldEffect = `      // Move to our container
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
      };`;

const newEffect = `      // Move to our container
      containerRef.current.appendChild(ytContainer);
      ytContainer.style.position = 'relative';
      ytContainer.style.left = 'auto';
      ytContainer.style.top = 'auto';
      ytContainer.style.width = '100%';
      ytContainer.style.height = '100%';
      ytContainer.style.pointerEvents = 'auto';
      
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
        ytContainer.style.pointerEvents = 'none';
      };`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
console.log("Patched FullScreenPlayerModal 2");
