import React, { useState } from 'react';
import { Search, Play, Plus, Clock, Disc } from 'lucide-react';
import { Track } from '../domain/types';

interface SearchViewProps {
  onPlayTrack: (track: Track, trackList?: Track[]) => void;
  onAddTrack: (track: Track) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onPlayTrack, onAddTrack }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(query));
      if (!res.ok) throw new Error("Error al buscar");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToTrack = (result: any): Track => {
    return {
      id: result.id,
      title: result.title,
      artist: result.author,
      sourceType: 'youtube',
      youtubeId: result.id,
      duration: result.duration,
      createdAt: Date.now(),
      url: '',
      addedAt: Date.now()
    };
  };

  const formatDuration = (sec?: number) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 pb-32 max-w-4xl mx-auto w-full h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buscar Música</h1>
        <p className="text-neutral-400">Busca canciones globales en YouTube Music.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. lofi hip hop, bad bunny, the beatles..."
          className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl focus:outline-none focus:border-neutral-700 text-white shadow-xl transition-all"
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 px-6 bg-white text-black font-medium rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-xl mb-8 border border-red-900/50">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <div key={result.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-800">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:shadow-lg">
                  <Disc className="w-6 h-6 text-neutral-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onPlayTrack(convertToTrack(result), results.map(convertToTrack))} className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform">
                      <Play className="w-4 h-4" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-medium truncate text-sm sm:text-base">{result.title}</h4>
                  <p className="text-neutral-400 text-xs sm:text-sm truncate">{result.author}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pl-4">
                <div className="hidden sm:flex items-center text-neutral-500 text-sm gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(result.duration)}
                </div>
                <button
                  onClick={() => onAddTrack(convertToTrack(result))}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors flex-shrink-0"
                  title="Añadir a biblioteca"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
