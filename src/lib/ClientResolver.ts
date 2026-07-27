import { API_BASE_URL } from "./constants";

export async function resolveAudioUrl(videoId: string): Promise<string> {
  const url = `${API_BASE_URL}/api/native-audio/resolve?id=${videoId}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch audio stream information');
  }
  
  const data = await res.json();
  if (data.success && data.audioUrl) {
    return data.audioUrl;
  }
  
  throw new Error(data.reason || 'Failed to resolve audio url');
}
