const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const activeDownloads = new Map();

async function getAudioFile(youtubeId) {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const filePath = path.join(tmpDir, `${youtubeId}.mp3`);
  
  if (fs.existsSync(filePath)) {
    return filePath;
  }

  if (activeDownloads.has(youtubeId)) {
    return activeDownloads.get(youtubeId);
  }

  const downloadPromise = new Promise((resolve, reject) => {
    const ytProcess = spawn('./yt-dlp', [
      '--no-warnings', 
      '--no-playlist', 
      '-f', 'ba/b', 
      '-x', 
      '--audio-format', 'mp3', 
      '--audio-quality', '128K', 
      '-o', `tmp/%(id)s.%(ext)s`, 
      `https://www.youtube.com/watch?v=${youtubeId}`
    ]);

    ytProcess.on('close', (code) => {
      if (code === 0 && fs.existsSync(filePath)) {
        resolve(filePath);
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }
      activeDownloads.delete(youtubeId);
    });
    
    ytProcess.on('error', (err) => {
      reject(err);
      activeDownloads.delete(youtubeId);
    });
  });

  activeDownloads.set(youtubeId, downloadPromise);
  return downloadPromise;
}

module.exports = { getAudioFile };
