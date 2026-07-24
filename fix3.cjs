const fs = require('fs');
let lines = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8').split('\n');

lines.splice(1868, 9, 
'              })}',
'            </div>',
'          )}', // close loading ternary
'            </div>', // close container
'            </>', // close fragment
'          )}' // close activeTab
);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', lines.join('\n'));
