const fs = require('fs');
let code = fs.readFileSync('src/components/TrackList.tsx', 'utf8');

// Fix import
code = code.replace(
  "import AutoSizer from 'react-virtualized-auto-sizer';",
  "import { AutoSizer } from 'react-virtualized-auto-sizer';"
);

// Fix usage
const oldUsage = `<AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={tracks.length}
            itemSize={60} // 40px cover + 10px top + 10px bottom padding
            width={width}
            itemData={itemData}
            overscanCount={5}
          >
            {TrackRow}
          </List>
        )}
      </AutoSizer>`;

const newUsage = `<AutoSizer
        renderProp={({ height, width }) => (
          <List
            height={height || 400}
            itemCount={tracks.length}
            itemSize={60}
            width={width || '100%'}
            itemData={itemData}
            overscanCount={5}
          >
            {TrackRow}
          </List>
        )}
      />`;

code = code.replace(oldUsage, newUsage);
fs.writeFileSync('src/components/TrackList.tsx', code);
console.log("Patched AutoSizer");
