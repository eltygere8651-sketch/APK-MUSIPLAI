const fs = require('fs');
let code = fs.readFileSync('src/components/NotificationsModal.tsx', 'utf-8');

let count = 0;
code = code.replace(/createdAt: new Date\(\),/g, () => {
    count++;
    // Assign decreasing dates starting from a fixed date
    const d = new Date(Date.now() - count * 86400000);
    return `createdAt: new Date("${d.toISOString()}"),`;
});

fs.writeFileSync('src/components/NotificationsModal.tsx', code);
