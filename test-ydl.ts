import youtubedl from 'youtube-dl-exec';

async function main() {
  try {
    const output = await youtubedl('https://www.youtube.com/watch?v=jNQXAC9IVRw', {
      dumpJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
      ]
    });
    
    // @ts-ignore
    const formats = output.formats;
    const m4a = formats.find((f: any) => f.format_id === '140');
    console.log("M4A:", !!m4a?.url);
    if (m4a?.url) {
      console.log(m4a.url.substring(0, 100));
    }
  } catch(e: any) {
    console.log("Error:", e.message);
  }
}
main();
