const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// Find the line that declares activeTab
const activeTabDecl = '  const [activeTab, setActiveTab] = useState<"requests" | "subscriptions" | "notifications" | "monitor" | "analytics" | "qr_campaigns">("subscriptions");\n';

code = code.replace(activeTabDecl, '');

// Insert it before the useEffect
const target = '  const [realtimeActiveUsers, setRealtimeActiveUsers] = useState<any[]>([]);\n';
code = code.replace(target, target + '\n' + activeTabDecl);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
