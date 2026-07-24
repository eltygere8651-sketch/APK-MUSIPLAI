const fs = require('fs');
let code = fs.readFileSync('src/components/GymMusicPlayer.tsx', 'utf-8');

const oldCode = `           const snap = await getDocs(qComm);
           return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
           }));
        });
        communityDocsRef.current = data;`;

const newCode = `           const snap = await getDocs(qComm);
           return snap.docs.map(doc => ({
             id: doc.id,
             _data: doc.data(),
             ref: { path: doc.ref.path }
           }));
        }, force);
        communityDocsRef.current = data;`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/GymMusicPlayer.tsx', code);
