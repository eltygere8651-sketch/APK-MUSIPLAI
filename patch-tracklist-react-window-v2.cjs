const fs = require('fs');

let code = fs.readFileSync('src/components/TrackList.tsx', 'utf8');

// Replace import
code = code.replace(
  "import { FixedSizeList as List } from 'react-window';",
  "import { List } from 'react-window';"
);

// Modify TrackRow to match new signature
// Old: const TrackRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
// New: const TrackRow = memo(({ index, style, ...data }: { index: number; style: React.CSSProperties; [key: string]: any }) => {

const trackRowOld = `const TrackRow = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
  const { tracks, currentTrackId, isPlaying, onPlayTrack, onToggleFavorite, onDeleteTrack } = data;`;

const trackRowNew = `const TrackRow = memo(({ index, style, ...data }: { index: number; style: React.CSSProperties; [key: string]: any }) => {
  const { tracks, currentTrackId, isPlaying, onPlayTrack, onToggleFavorite, onDeleteTrack } = data;`;

code = code.replace(trackRowOld, trackRowNew);

// Modify List usage
const listUsageOld = `<List
            height={height || 400}
            itemCount={tracks.length}
            itemSize={60}
            width={width || '100%'}
            itemData={itemData}
            overscanCount={5}
          >
            {TrackRow}
          </List>`;

const listUsageNew = `<List
            style={{ height: height || 400, width: width || '100%' }}
            rowCount={tracks.length}
            rowHeight={60}
            rowProps={itemData}
            rowComponent={TrackRow}
            overscanCount={5}
          />`;

code = code.replace(listUsageOld, listUsageNew);

fs.writeFileSync('src/components/TrackList.tsx', code);
console.log("Patched TrackList for react-window v2");
