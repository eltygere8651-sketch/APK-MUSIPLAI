const fs = require('fs');
let code = fs.readFileSync('src/components/FirebaseProvider.tsx', 'utf-8');

const targetCheck = `      } else {
        // No auth.currentUser
        setAccessData({
          isValid: false,
          plan: "none",
          trialStart: null,
        });
        setLoading(false);
      }`;
      
const replacementCheck = `      } else {
        // No auth.currentUser - Check if device had a VIP trial that expired
        const checkDevice = async () => {
          let hasExpiredTrial = false;
          try {
            const generateDeviceHash = async () => {
              const w = window.screen.width || 0;
              const h = window.screen.height || 0;
              const screenRes = Math.max(w, h) + 'x' + Math.min(w, h);
              const ua = navigator.userAgent;
              let os = 'Unknown';
              if (ua.indexOf('Win') !== -1) os = 'Windows';
              if (ua.indexOf('Mac') !== -1) os = 'MacOS';
              if (ua.indexOf('Linux') !== -1) os = 'Linux';
              if (ua.indexOf('Android') !== -1) os = 'Android';
              if (ua.indexOf('like Mac') !== -1) os = 'iOS';
              let canvasFingerprint = '';
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.textBaseline = 'top';
                  ctx.font = '14px Arial';
                  ctx.fillStyle = '#f60';
                  ctx.fillRect(125, 1, 62, 20);
                  ctx.fillStyle = '#069';
                  ctx.fillText('FluxVIP_Fingerprint', 2, 15);
                  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                  ctx.fillText('FluxVIP_Fingerprint', 4, 17);
                  canvasFingerprint = canvas.toDataURL();
                }
              } catch (e) {}
              const rawString = \`\${screenRes}-\${os}-\${canvasFingerprint}\`;
              const msgBuffer = new TextEncoder().encode(rawString);
              const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
              const hashArray = Array.from(new Uint8Array(hashBuffer));
              return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            };

            const hash = await generateDeviceHash();
            const hashRef = doc(db, 'vip_devices', hash);
            const hashDoc = await getDoc(hashRef);
            if (hashDoc.exists()) {
              const hd = hashDoc.data();
              const deviceTrialStart = hd.activatedAt || 0;
              if (Date.now() > deviceTrialStart + 7 * 24 * 60 * 60 * 1000) {
                 hasExpiredTrial = true;
              }
            }
          } catch(e) {}
          
          if (hasExpiredTrial) {
            setAccessData({
              isValid: false,
              plan: "free",
              trialStart: 1, // Expired timestamp
            });
          } else {
            setAccessData({
              isValid: false,
              plan: "none",
              trialStart: null,
            });
          }
          setLoading(false);
        };
        checkDevice();
      }`;

code = code.replace(targetCheck, replacementCheck);
fs.writeFileSync('src/components/FirebaseProvider.tsx', code);
