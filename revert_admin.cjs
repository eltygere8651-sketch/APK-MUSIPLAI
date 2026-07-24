const fs = require('fs');
let file = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

// Remove analytics tab button
file = file.replace(/<button\s*onClick={\(\) => setActiveTab\("analytics"\)}[\s\S]*?<span>Analíticas<\/span>\s*<\/button>/, '');

// Remove analytics state and fetch function
file = file.replace(/const \[activeTab, setActiveTab\] = useState<"users" \| "notifications" \| "monitor" \| "analytics">/g, 'const [activeTab, setActiveTab] = useState<"users" | "notifications" | "monitor">');
file = file.replace(/const \[globalAnalytics, setGlobalAnalytics\] = useState<any\[\]>\(\[\]\);\s*const \[loadingAnalytics, setLoadingAnalytics\] = useState\(false\);/, '');

file = file.replace(/const fetchAnalytics = async \(\) => {[\s\S]*?};\s*(?=const fetchUsers)/, '');

file = file.replace(/fetchAnalytics\(\);\s*/, '');

// Remove the analytics UI block
const startToken = '{activeTab === "analytics" && (';
const endToken = '          {/* Mobile Fixed Close Button */}';
const startIndex = file.indexOf(startToken);
const endIndex = file.indexOf(endToken);
if (startIndex !== -1 && endIndex !== -1) {
  file = file.substring(0, startIndex) + file.substring(endIndex);
}

fs.writeFileSync('src/components/UserManagementAdmin.tsx', file);
