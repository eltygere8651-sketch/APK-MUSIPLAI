const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf8');

code = code.replace(
  `                      </button>\n                    </div>\n                  </div>\n                  {loading ? (`,
  `                      </button>\n                    </div>\n                  </div>\n                </div>\n                {loading ? (`
);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
