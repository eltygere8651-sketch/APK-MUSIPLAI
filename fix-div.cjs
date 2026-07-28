const fs = require('fs');
let code = fs.readFileSync('src/components/FullScreenPlayerModal.tsx', 'utf8');

code = code.replace(
  "            </div>\n          </div>\n        </div>\n      ) : activeTab === 'video' && youtubeId ? (",
  "            </div>\n          </div>\n        </div>\n        </div>\n      ) : activeTab === 'video' && youtubeId ? ("
);

fs.writeFileSync('src/components/FullScreenPlayerModal.tsx', code);
