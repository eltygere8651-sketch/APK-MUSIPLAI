import { Capacitor } from '@capacitor/core';

export async function resolveClientStream(videoId: string): Promise<string> {
  const platform = Capacitor.getPlatform();
  console.log(`[CLIENT_RESOLVER] Starting resolution for videoId: ${videoId}, platform: ${platform}`);
  
  try {
    const { Innertube, UniversalCache } = await import('youtubei.js');
    
    // Create innertube instance locally
    const yt = await Innertube.create({ 
      generate_session_locally: true,
      cache: new UniversalCache(false)
    });
    
    const info = await yt.getInfo(videoId);
    const formats = info.streaming_data?.adaptive_formats || [];
    
    let targetFormat = formats.find((f: any) => f.itag === 140) || formats.find((f: any) => f.itag === 251);
    
    if (targetFormat) {
      const url = targetFormat.url || (targetFormat.decipher ? targetFormat.decipher(yt.session.player) : null);
      if (url) {
        console.log(`[CLIENT_RESOLVER_TEST]\nvideoId: ${videoId}\nplatform: ${platform}\nresolved: true\naudioUrl length: ${url.length}\nformat: ${targetFormat.itag} (${targetFormat.mime_type})`);
        console.log(`[CLIENT_RESOLVER] Success for videoId: ${videoId}`);
        return url;
      }
    }
    
    console.warn(`[CLIENT_RESOLVER_TEST]\nvideoId: ${videoId}\nplatform: ${platform}\nresolved: false\nerror: No suitable format found\nformats available: ${formats.map((f: any) => f.itag).join(', ')}`);
    throw new Error('No suitable format found');
    
  } catch (error: any) {
    console.error(`[CLIENT_RESOLVER_TEST]\nvideoId: ${videoId}\nplatform: ${platform}\nresolved: false\nerror:`, error);
    throw error;
  }
}
