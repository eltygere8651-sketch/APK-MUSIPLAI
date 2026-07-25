import { API_BASE_URL } from "../lib/constants";
import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  ListPlus,
  Sparkles,
  ChevronRight,
  ChevronDown,
  X,
  Loader2,
  Plus,
  Settings2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Pencil,
  Check,
} from "lucide-react";
import { MusicTrack } from "../types";
import { DEFAULT_MUSIC_COVER } from "../lib/constants";
import { Carousel } from "./Carousel";

import { LazyImage } from "./LazyImage";

interface ExploreViewProps {
  exploreData: any;
  customPlaylists?: any[];
  exploreLayout?: any[] | null;
  isAdmin?: boolean;
  onAddCustomPlaylist?: (url: string, sectionId?: string) => Promise<void>;
  onDeleteCustomPlaylist?: (docId: string) => Promise<void>;
  onUpdateExploreLayout?: (layout: any[]) => Promise<void>;
  setOverrideCurrentTrack: (track: MusicTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  showNotification: (msg: string) => void;
  addYoutubeTrackToPlaylist: (track: any) => void;
  loadPlaylistAndPlay: (item: any) => void;
  playTracksContext?: (tracks: any[], startIndex: number) => void;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
  currentTrack?: MusicTrack | null;
  isPlaying?: boolean;
}

const getTrackImage = (track?: any): string | null => {
  if (!track) return null;
  if (track.thumbnail) return track.thumbnail;
  if (track.thumbnail_url) return track.thumbnail_url;
  if (track.imageUrl) return track.imageUrl;
  if (track.artwork_url) return track.artwork_url;
  if (track.artwork) return track.artwork;
  if (
    track.url &&
    (track.url.includes("youtube.com") || track.url.includes("youtu.be"))
  ) {
    const match = track.url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
    if (match && match[1]) {
      return `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`;
    }
  }
  if (track.id?.startsWith("yt_")) {
    const vid = track.id.split("_")[1];
    if (vid) return `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`;
  }
  if (track.id && typeof track.id === "string" && track.id.length === 11) {
    return `https://i.ytimg.com/vi/${track.id}/mqdefault.jpg`;
  }
  return null;
};


const cleanUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("i.ytimg.com")) {
    let clean = url.split("?")[0];
    if (clean.endsWith("hq720.jpg") || clean.endsWith("sddefault.jpg") || clean.endsWith("maxresdefault.jpg") || clean.endsWith("hqdefault.jpg")) {
      clean = clean.replace("hq720.jpg", "mqdefault.jpg")
                   .replace("sddefault.jpg", "mqdefault.jpg")
                   .replace("hqdefault.jpg", "mqdefault.jpg")
                   .replace("maxresdefault.jpg", "mqdefault.jpg");
    }
    return clean;
  }
  return url;
};

const getItemImage = (item: any): string => {
  if (item.thumbnail) return cleanUrl(item.thumbnail);
  if (item.thumbnail_url) return cleanUrl(item.thumbnail_url);
  if (item.imageUrl) return cleanUrl(item.imageUrl);
  if (item.artwork_url) return cleanUrl(item.artwork_url);
  if (item.artwork) return cleanUrl(item.artwork);
  
  if (item.isPlaylist && item.data && item.data.tracks && item.data.tracks.length > 0) {
    const trackImg = getTrackImage(item.data.tracks[0]);
    if (trackImg) return cleanUrl(trackImg);
  }
  
  if (item.tracks && item.tracks.length > 0) {
    const trackImg = getTrackImage(item.tracks[0]);
    if (trackImg) return cleanUrl(trackImg);
  }
  
  const selfImg = getTrackImage(item);
  if (selfImg) return cleanUrl(selfImg);
  
  return DEFAULT_MUSIC_COVER;
};

export const ExploreView: React.FC<ExploreViewProps> = React.memo(
  ({
    exploreData,
    customPlaylists = [],
    exploreLayout,
    isAdmin,
    onAddCustomPlaylist,
    onDeleteCustomPlaylist,
    onUpdateExploreLayout,
    setOverrideCurrentTrack,
    setIsPlaying,
    showNotification,
    addYoutubeTrackToPlaylist,
    loadPlaylistAndPlay,
    playTracksContext,
    selectedCountry,
    setSelectedCountry,
    currentTrack,
    isPlaying,
  }) => {
    const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAddSectionModal, setShowAddSectionModal] = useState(false);
    const [newPlaylistUrl, setNewPlaylistUrl] = useState("");
    const [newSectionTitle, setNewSectionTitle] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState("custom_0");
    const [isAdding, setIsAdding] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const [itemToDelete, setItemToDelete] = useState<{
      docId?: string;
      sectionId?: string;
      itemId?: string;
    } | null>(null);

    const handleHideItem = async (sectionId: string, itemId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const sectionIndex = newLayout.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return;

      const section = newLayout[sectionIndex];
      const hiddenItems = section.hiddenItems ? [...section.hiddenItems] : [];
      if (!hiddenItems.includes(itemId)) {
        hiddenItems.push(itemId);
      }

      newLayout[sectionIndex] = { ...section, hiddenItems };
      await onUpdateExploreLayout(newLayout);
    };
    const [editingSectionId, setEditingSectionId] = useState<string | null>(
      null,
    );
    const [editingSectionTitle, setEditingSectionTitle] = useState("");
    const [draggedItem, setDraggedItem] = useState<{
      sectionId: string;
      itemId: string;
      index: number;
    } | null>(null);
    const [dragOverItem, setDragOverItem] = useState<{
      sectionId: string;
      index: number;
    } | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

    const COUNTRIES = [
      { code: "GLOBAL", label: "Global", flag: "🌎" },
      { code: "US", label: "Estados Unidos", flag: "🇺🇸" },
      { code: "ES", label: "España", flag: "🇪🇸" },
      { code: "MX", label: "México", flag: "🇲🇽" },
      { code: "AR", label: "Argentina", flag: "🇦🇷" },
      { code: "CO", label: "Colombia", flag: "🇨🇴" },
      { code: "DO", label: "República Dominicana", flag: "🇩🇴" },
      { code: "CL", label: "Chile", flag: "🇨🇱" },
      { code: "PE", label: "Perú", flag: "🇵🇪" },
      { code: "GB", label: "Reino Unido", flag: "🇬🇧" },
      { code: "DE", label: "Alemania", flag: "🇩🇪" },
      { code: "FR", label: "Francia", flag: "🇫🇷" },
      { code: "IT", label: "Italia", flag: "🇮🇹" },
    ];

    if (
      !exploreData ||
      (exploreData.top100?.length === 0 && exploreData.trending?.length === 0)
    ) {
      return (
        <div className="p-12 text-center space-y-4">
          <div className="flex justify-center">
            <Sparkles className="w-8 h-8 text-emerald-500/30 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            No se han podido cargar las tendencias en este momento.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white active:bg-white/10 transition-all"
          >
            Reintentar
          </button>
        </div>
      );
    }

    const defaultLayout = [
      {
        id: "custom_0",
        title: "💎 Recomendaciones Especiales",
        type: "custom",
        visible: true,
        order: 0,
      },
      {
        id: "mixParaTi",
        title: "✨ Mixes Para Ti",
        type: "default",
        visible: true,
        order: 1,
      },
      {
        id: "top100",
        title: "Top 100 Playlists",
        type: "default",
        visible: true,
        order: 2,
      },
      {
        id: "top20",
        title: "Top 20 Tendencias",
        type: "default",
        visible: true,
        order: 3,
      },
      {
        id: "daily20",
        title: "Daily Top 20",
        type: "default",
        visible: true,
        order: 4,
      },
      {
        id: "dailyTop",
        title: "Nuevos Videos Musicales",
        type: "default",
        visible: true,
        order: 5,
      },
      {
        id: "trending",
        title: "Tendencias Globales",
        type: "default",
        visible: true,
        order: 6,
      },
      {
        id: "pop",
        title: "🎵 Pop Playlists",
        type: "default",
        visible: true,
        order: 7,
      },
    ];

    let currentLayout =
      exploreLayout && exploreLayout.length > 0 ? exploreLayout : defaultLayout;
    // Ensure any new default sections that arent in the saved layout are appended
    const existingSectionIds = new Set(currentLayout.map((s: any) => s.id));
    defaultLayout.forEach((defaultSec) => {
      if (!existingSectionIds.has(defaultSec.id)) {
        currentLayout = [...currentLayout, { ...defaultSec, order: currentLayout.length }];
      }
    });

    const sortedLayout = [...currentLayout].sort((a, b) => a.order - b.order);

    const getSectionData = (section: any) => {
      let data: any[] = [];

      // Load default data for non-custom sections
      if (section.type !== "custom") {
        switch (section.id) {
          case "mixParaTi":
            data = exploreData?.mixParaTi || [];
            break;
          case "top100":
            data = exploreData?.top100 || [];
            break;
          case "top20":
            data = exploreData?.top20Tendencias || [];
            break;
          case "daily20":
            data = exploreData?.dailyTopPlaylists || [];
            break;
          case "dailyTop":
            data = exploreData?.dailyTop || [];
            break;
          case "trending":
            data = exploreData?.trending || [];
            break;
          case "pop":
            data = exploreData?.pop || [];
            break;
          default:
            data = [];
            break;
        }
      }

      // Add custom playlists for this section (works for BOTH custom and default sections)
      const customItemsForSection = customPlaylists.filter(
        (p: any) =>
          p.sectionId === section.id ||
          (!p.sectionId && section.id === "custom_0"),
      );

      data = [...data, ...customItemsForSection];

      if (section.hiddenItems && Array.isArray(section.hiddenItems)) {
        data = data.filter((d) => !section.hiddenItems.includes(d.id || d.url));
      }

      if (section.customItemOrder && Array.isArray(section.customItemOrder)) {
        data = [...data].sort((a, b) => {
          const idA = a.id || a.url;
          const idB = b.id || b.url;
          const idxA = section.customItemOrder.indexOf(idA);
          const idxB = section.customItemOrder.indexOf(idB);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA === -1 && idxB !== -1) return -1;
          if (idxB === -1 && idxA !== -1) return 1;
          return 0;
        });
      }
      return data;
    };

    const sectionsToRender = sortedLayout
      .filter((s) => s.visible || isAdmin)
      .map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        visible: s.visible,
        data: getSectionData(s),
      }))
      .filter(
        (s) =>
          (s.data && s.data.length > 0) || (isAdmin && s.type === "custom"),
      );

    const handleMoveSection = async (
      sectionId: string,
      direction: "up" | "down",
    ) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;

      if (direction === "up" && index > 0) {
        const temp = newLayout[index];
        newLayout[index] = newLayout[index - 1];
        newLayout[index - 1] = temp;
      } else if (direction === "down" && index < newLayout.length - 1) {
        const temp = newLayout[index];
        newLayout[index] = newLayout[index + 1];
        newLayout[index + 1] = temp;
      } else {
        return;
      }
      newLayout.forEach((s, i) => (s.order = i));
      await onUpdateExploreLayout(newLayout);
    };

    const handleToggleVisibility = async (sectionId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;
      newLayout[index].visible = !newLayout[index].visible;
      await onUpdateExploreLayout(newLayout);
    };

    const handleRenameSection = async (sectionId: string) => {
      if (!onUpdateExploreLayout || !editingSectionTitle.trim()) return;
      const newLayout = [...sortedLayout];
      const index = newLayout.findIndex((s) => s.id === sectionId);
      if (index === -1) return;
      newLayout[index].title = editingSectionTitle.trim();
      await onUpdateExploreLayout(newLayout);
      setEditingSectionId(null);
      setEditingSectionTitle("");
    };

    const handleDeleteSection = async (sectionId: string) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = sortedLayout.filter((s) => s.id !== sectionId);
      newLayout.forEach((s, i) => (s.order = i));
      await onUpdateExploreLayout(newLayout);
      setSectionToDelete(null);
    };

    const handleDropItem = async (
      sectionId: string,
      itemId: string,
      targetIndex: number,
    ) => {
      if (!onUpdateExploreLayout) return;
      const newLayout = [...sortedLayout];
      const sectionIndex = newLayout.findIndex((s) => s.id === sectionId);
      if (sectionIndex === -1) return;

      const section = newLayout[sectionIndex];
      const currentData = getSectionData(section);

      const itemOrder = currentData.map((d) => d.id || d.url);

      const itemIndex = itemOrder.indexOf(itemId);
      if (itemIndex === -1) return;

      const [removed] = itemOrder.splice(itemIndex, 1);

      // If we are dropping to a later index, and we removed an item before it,
      // the array is now 1 element shorter. So targetIndex remains the same
      // to insert exactly where the user hovered. Wait, the array `splice` with targetIndex handles this if it's the raw array index.
      itemOrder.splice(targetIndex, 0, removed);

      newLayout[sectionIndex] = { ...section, customItemOrder: itemOrder };
      await onUpdateExploreLayout(newLayout);
    };

    const handleAddSubmit = async () => {
      if (!newPlaylistUrl || !onAddCustomPlaylist) return;
      setIsAdding(true);
      await onAddCustomPlaylist(newPlaylistUrl, selectedSectionId);

      setNewPlaylistUrl("");
      setShowAddModal(false);
      setIsAdding(false);
    };

    const handleAddSectionSubmit = async () => {
      if (!onUpdateExploreLayout || !newSectionTitle.trim()) return;
      setIsAdding(true);
      const newLayout = [...sortedLayout];
      newLayout.push({
        id: "custom_" + Date.now(),
        title: newSectionTitle.trim(),
        type: "custom",
        visible: true,
        order: newLayout.length,
      });
      await onUpdateExploreLayout(newLayout);
      setNewSectionTitle("");
      setShowAddSectionModal(false);
      setIsAdding(false);
    };

    return (
      <div className="space-y-6 pb-6 px-0">
        {/* COUNTRY SELECTOR & ADMIN ACTIONS */}
        <div className="px-3 flex items-center justify-between">
          {setSelectedCountry && selectedCountry && (
            <div className="relative max-w-[200px] w-full">
              <button
                onClick={() => setIsCountryModalOpen(!isCountryModalOpen)}
                className="w-full text-left bg-[#111113] border border-white/10 text-white rounded-full px-4 py-2 text-[11px] font-bold outline-none focus:border-[#1ED760]/50 active:bg-white/[0.05] transition-colors cursor-pointer flex justify-between items-center"
              >
                <span className="truncate">
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.flag} Top
                  Listas{" "}
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.label}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#1ED760] shrink-0 transition-transform ${isCountryModalOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isCountryModalOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[40]"
                    onClick={() => setIsCountryModalOpen(false)}
                  ></div>
                  <div className="absolute top-full left-0 mt-2 z-[50] w-full min-w-[220px] bg-[#18181A] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {COUNTRIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setSelectedCountry(c.code);
                            setIsCountryModalOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${selectedCountry === c.code ? "bg-[#1ED760]/10 text-[#1ED760] font-bold" : "text-slate-300 active:bg-white/5 active:text-white"}`}
                        >
                          <span className="text-xl">{c.flag}</span>
                          <span className="text-xs">{c.label}</span>
                          {selectedCountry === c.code && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1ED760]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-1.5 bg-white/5 active:bg-white/10 text-white px-3 py-2 rounded-full text-[11px] font-bold transition-colors border border-white/10 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Añadir Categoría</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 bg-[#1ED760]/10 active:bg-[#1ED760]/20 text-[#1ED760] px-3 py-2 rounded-full text-[11px] font-bold transition-colors border border-[#1ED760]/20 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Añadir Lista / Video</span>
              </button>
            </div>
          )}
        </div>

        {showAddSectionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-white" />
                Nueva Categoría
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Crea un nuevo carrusel para añadir tus propias listas de
                reproducción y videos.
              </p>

              <input
                type="text"
                placeholder="Ej: Nuevos Álbums"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white transition-colors mb-6"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 active:text-white"
                  disabled={isAdding}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSectionSubmit}
                  disabled={!newSectionTitle.trim() || isAdding}
                  className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full disabled:opacity-50 flex items-center gap-2 active:bg-slate-200 transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Crear Categoría"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {itemToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                Eliminar Lista
              </h3>
              <p className="text-sm text-slate-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta lista recomendada?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 active:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (itemToDelete.docId && onDeleteCustomPlaylist) {
                      onDeleteCustomPlaylist(itemToDelete.docId);
                    } else if (itemToDelete.sectionId && itemToDelete.itemId) {
                      handleHideItem(
                        itemToDelete.sectionId,
                        itemToDelete.itemId,
                      );
                    }
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full active:bg-red-600 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {sectionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <X className="w-5 h-5 text-red-500" />
                Eliminar Categoría
              </h3>
              <p className="text-sm text-slate-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta categoría? Se ocultará
                de la vista de los usuarios.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSectionToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 active:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteSection(sectionToDelete)}
                  className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full active:bg-red-600 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#121212] border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1ED760]" />
                Añadir al Explorador
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Pega el enlace de una lista o video de YouTube Music para
                fijarlo en el Explorador.
              </p>

              <input
                type="text"
                placeholder="https://music.youtube.com/playlist?list=... o watch?v=..."
                value={newPlaylistUrl}
                onChange={(e) => setNewPlaylistUrl(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#1ED760]/50 transition-colors mb-4"
                disabled={isAdding}
              />

              <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 mb-2 block">
                  Categoría destino:
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full bg-[#1A1A1A] text-white border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1ED760] transition-colors appearance-none"
                >
                  {sortedLayout.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                  {sortedLayout.length === 0 && (
                    <option value="custom_0">
                      💎 Recomendaciones Especiales
                    </option>
                  )}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 active:text-white"
                  disabled={isAdding}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={!newPlaylistUrl || isAdding}
                  className="px-4 py-2 bg-[#1ED760] text-black text-xs font-bold rounded-full disabled:opacity-50 flex items-center gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Añadir Lista"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {sectionsToRender.map((section, idx) => (
          <section
            key={section.id}
            className={`space-y-3 relative group/section ${!section.visible ? "opacity-50 grayscale" : ""}`}
          >
            <Carousel
              title={
                <div className="flex items-center justify-between w-full">
                  {editingSectionId === section.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSectionTitle}
                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameSection(section.id);
                          } else if (e.key === "Escape") {
                            setEditingSectionId(null);
                            setEditingSectionTitle("");
                          }
                        }}
                        autoFocus
                        className="bg-black/50 border border-[#1ED760]/50 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none w-48"
                      />
                      <button
                        onClick={() => handleRenameSection(section.id)}
                        className="p-1 text-[#1ED760] active:bg-[#1ED760]/20 rounded transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSectionId(null);
                          setEditingSectionTitle("");
                        }}
                        className="p-1 text-slate-400 active:text-white rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer active:underline w-fit">
                      {section.title}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </h2>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 ml-4">
                      <button
                        onClick={() => {
                          setEditingSectionId(section.id);
                          setEditingSectionTitle(section.title);
                        }}
                        className="p-1 text-slate-400 active:text-white transition-colors"
                        title="Renombrar sección"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <button
                        onClick={() => handleMoveSection(section.id, "up")}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 active:text-white disabled:opacity-30 transition-colors"
                        title="Subir sección"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSection(section.id, "down")}
                        disabled={idx === sectionsToRender.length - 1}
                        className="p-1 text-slate-400 active:text-white disabled:opacity-30 transition-colors"
                        title="Bajar sección"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/20 mx-1"></div>
                      <button
                        onClick={() => handleToggleVisibility(section.id)}
                        className="p-1 text-slate-400 active:text-white transition-colors"
                        title={
                          section.visible ? "Ocultar sección" : "Mostrar sección"
                        }
                      >
                        {section.visible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                      {section.type === "custom" && (
                        <button
                          onClick={() => setSectionToDelete(section.id)}
                          className="p-1 text-red-400 active:text-red-300 transition-colors"
                          title="Eliminar categoría"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              }
              className="gap-4 pb-2 snap-x px-3 sm:px-1 min-h-[140px]"
            >
              {(!section.data || section.data.length === 0) && (
                <div className="w-full flex items-center justify-center p-8 border border-dashed border-white/10 rounded-xl text-slate-400 text-xs">
                  No hay elementos en esta categoría. Usa "Añadir Lista / Video"
                  para agregar contenido.
                </div>
              )}
              {section.data &&
                section.data.slice(0, expandedSections[section.id] ? undefined : 12).map((item: any, songIdx: number) => {
                  const isActive =
                    currentTrack &&
                    (currentTrack.url === item.url ||
                      currentTrack.id === item.id);
                  const itemId = item.id || item.url;

                  return (
                    <div
                      key={itemId + idx + songIdx}
                      className={`snap-start shrink-0 w-[130px] sm:w-36 group cursor-pointer relative transition-all ${draggedItem?.itemId === itemId ? "opacity-50 scale-95" : ""} ${dragOverItem?.sectionId === section.id && dragOverItem?.index === songIdx ? "border-l-2 border-[#1ED760] pl-1 -ml-1" : ""}`}
                      draggable={isAdmin}
                      onDragStart={(e) => {
                        if (isAdmin) {
                          setDraggedItem({
                            sectionId: section.id,
                            itemId,
                            index: songIdx,
                          });
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", itemId);
                        }
                      }}
                      onDragOver={(e) => {
                        if (isAdmin && draggedItem) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (
                            dragOverItem?.sectionId !== section.id ||
                            dragOverItem?.index !== songIdx
                          ) {
                            setDragOverItem({
                              sectionId: section.id,
                              index: songIdx,
                            });
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        if (
                          isAdmin &&
                          dragOverItem?.sectionId === section.id &&
                          dragOverItem?.index === songIdx
                        ) {
                          setDragOverItem(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (isAdmin && draggedItem) {
                          e.preventDefault();
                          if (
                            draggedItem.sectionId === section.id &&
                            draggedItem.itemId !== itemId
                          ) {
                            handleDropItem(
                              section.id,
                              draggedItem.itemId,
                              songIdx,
                            );
                          }
                          setDraggedItem(null);
                          setDragOverItem(null);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedItem(null);
                        setDragOverItem(null);
                      }}
                      onClick={() => {
                        if (item.isPlaylist) {
                          loadPlaylistAndPlay(item.data || item);
                          return;
                        }

                        if (isActive) {
                          setIsPlaying(!isPlaying);
                          return;
                        }

                        if (playTracksContext) {
                          const songsOnly = section.data.filter(
                            (t: any) => !t.isPlaylist,
                          );
                          const idxInSongs = songsOnly.findIndex(
                            (t: any) => t.id === item.id,
                          );
                          playTracksContext(
                            songsOnly,
                            idxInSongs !== -1 ? idxInSongs : 0,
                          );
                        } else {
                          const mapped: MusicTrack = {
                            id: item.id,
                            title: item.title,
                            artist: item.artist || "Artista",
                            url: `https://www.youtube.com/watch?v=${item.id}`,
                            duration: item.duration || "0:00",
                            bpm: 120,
                          };
                          setOverrideCurrentTrack(mapped);
                          setIsPlaying(true);
                          showNotification(`Reproduciendo: ${item.title}`);
                        }
                      }}
                    >
                      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#111113] border border-white/5 relative mb-2.5">
                        <LazyImage
                          src={getItemImage(item)}
                          className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500"
                          wrapperClassName="absolute inset-0"
                          referrerPolicy="no-referrer"
                          onImageError={(e, setSrc) => {
                            if (item.id) {
                              const isPlaylist = item.isPlaylist || item.id.startsWith("PL") || item.id.startsWith("MPRE");
                              const endpoint = isPlaylist 
                                ? `${API_BASE_URL}/api/youtube/playlist-info?id=${item.id}`
                                : `${API_BASE_URL}/api/youtube/video-info?id=${item.id}`;
                              
                              fetch(endpoint)
                                .then(res => {
                                  if (!res.ok) throw new Error("Backend error");
                                  return res.json();
                                })
                                .then(data => {
                                  const cUrl = cleanUrl(data.thumbnail);
                                  if (cUrl && cUrl !== getItemImage(item)) {
                                    setSrc(cUrl);
                                  }
                                })
                                .catch(() => {
                                  if (isPlaylist) {
                                    const fallbackUrl = `https://pipedapi.kavin.rocks/playlists/${item.id}`;
                                    fetch(fallbackUrl)
                                      .then(r => r.json())
                                      .then(d => {
                                        if (d && d.thumbnailUrl) {
                                           setSrc(d.thumbnailUrl);
                                        } else if (d && d.relatedStreams && d.relatedStreams.length > 0) {
                                           setSrc(`https://i.ytimg.com/vi/${d.relatedStreams[0].url.replace("/watch?v=", "")}/mqdefault.jpg`);
                                        }
                                      })
                                      .catch(() => {});
                                  } else {
                                    const fallbackUrl = `https://noembed.com/embed?dataType=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + item.id)}`;
                                    fetch(fallbackUrl)
                                      .then(r => r.json())
                                      .then(d => {
                                        if (d && d.thumbnail_url) setSrc(d.thumbnail_url);
                                        else setSrc(`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`);
                                      })
                                      .catch(() => {
                                        setSrc(`https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`);
                                      });
                                  }
                                });
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/10 group-active:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center opacity-0 group-active:opacity-100 transition-all transform scale-75 group-active:scale-100 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            {isActive && isPlaying ? (
                              <Pause className="w-5 h-5 text-black fill-black" />
                            ) : (
                              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-[9px] font-medium text-white px-1.5 py-0.5 rounded-sm backdrop-blur-sm shadow-md">
                          {item.artist !== "YouTube Music"
                            ? "PLAYLIST"
                            : "CANAL"}
                        </div>
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.docId) {
                                setItemToDelete({ docId: item.docId });
                              } else {
                                setItemToDelete({
                                  sectionId: section.id,
                                  itemId: item.id || item.url,
                                });
                              }
                            }}
                            className="absolute top-1.5 right-1.5 bg-black/60 active:bg-red-500/80 text-white p-1 rounded-full backdrop-blur-sm shadow-md transition-colors opacity-0 group-active:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p
                        className="text-[12px] font-bold text-white leading-tight line-clamp-2"
                        title={item.title}
                      >
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              {!expandedSections[section.id] && section.data?.length > 12 && (
                <div 
                  onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: true }))}
                  className="snap-start shrink-0 w-[130px] sm:w-36 group cursor-pointer relative flex flex-col justify-center items-center opacity-70 active:opacity-100 transition-opacity"
                >
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#111113] border border-white/5 relative mb-2.5 flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-white/50 group-active:text-white group-active:scale-110 transition-all" />
                  </div>
                  <p className="text-[12px] font-bold text-white leading-tight">
                    Ver más
                  </p>
                </div>
              )}
            </Carousel>
          </section>
        ))}
      </div>
    );
  },
);
