import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QrCode, Plus, MoreVertical, Copy, Trash2, Edit2, Download, Check, X, Loader2, Play, Pause, BarChart2, Eye } from 'lucide-react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FluxLogo, FluxLogoLarge } from './FluxLogo';

interface Campaign {
  id: string;
  name: string;
  template: string;
  status: 'active' | 'inactive';
  scans: number;
  vipActivations: number;
  premiumConversions: number;
  createdAt: any;
}

const TEMPLATES = [
  { id: 'premium-oscuro', name: 'Premium Oscuro' },
  { id: 'minimalista', name: 'Minimalista' },
  { id: 'neon', name: 'Neón' },
  { id: 'gimnasio', name: 'Gimnasio' },
  { id: 'cafeteria', name: 'Cafetería' },
  { id: 'hotel', name: 'Hotel' },
  { id: 'comercio', name: 'Comercio' },
  { id: 'evento', name: 'Evento' }
];

export const QRCampaignsAdmin = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('premium-oscuro');
  const [isSaving, setIsSaving] = useState(false);

  // View state
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'qr_campaigns'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setCampaigns(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      if (editingCampaign) {
        await updateDoc(doc(db, 'qr_campaigns', editingCampaign.id), {
          name,
          template
        });
        setIsModalOpen(false);
      } else {
        const docRef = await addDoc(collection(db, 'qr_campaigns'), {
          name,
          template,
          status: 'active',
          scans: 0,
          vipActivations: 0,
          premiumConversions: 0,
          createdAt: serverTimestamp()
        });
        setIsModalOpen(false);
        setViewingCampaign({
          id: docRef.id,
          name,
          template,
          status: 'active',
          scans: 0,
          vipActivations: 0,
          premiumConversions: 0,
          createdAt: { toMillis: () => Date.now() } as any
        });
      }
    } catch (e: any) {
      console.error("Error saving campaign", e);
      alert("Error al guardar: " + (e.message || "desconocido"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (c: Campaign) => {
    try {
      const newStatus = c.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'qr_campaigns', c.id), { status: newStatus });
      setCampaigns(prev => prev.map(camp => camp.id === c.id ? { ...camp, status: newStatus } : camp));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDuplicate = async (c: Campaign) => {
    try {
      await addDoc(collection(db, 'qr_campaigns'), {
        name: `${c.name} (Copia)`,
        template: c.template,
        status: 'inactive',
        scans: 0,
        vipActivations: 0,
        premiumConversions: 0,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'qr_campaigns', id));
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (viewingCampaign?.id === id) setViewingCampaign(null);
      setCampaignToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: string) => {
    setCampaignToDelete(id);
  };

  const openNew = () => {
    setEditingCampaign(null);
    setName('');
    setTemplate('premium-oscuro');
    setIsModalOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setName(c.name);
    setTemplate(c.template);
    setIsModalOpen(true);
  };

  // -------------------------------------------------------------
  // EXPORT LOGIC
  // -------------------------------------------------------------
  const generateExport = async (format: 'pdf-a3' | 'pdf-a4' | 'pdf-a5' | 'pdf-4x4' | 'pdf-5x5' | 'pdf-7x7' | 'png' | 'svg') => {
    if (!printRef.current || !viewingCampaign) return;
    setIsExporting(true);
    
    try {
      await document.fonts.ready;
      // Wait a tiny bit more just in case DOM needs a tick
      await new Promise(resolve => setTimeout(resolve, 300));
      const scale = 3; // High res
      const canvas = await html2canvas(printRef.current, { 
        scale,
        useCORS: true,
        backgroundColor: '#000000'
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `Campaña-${viewingCampaign.name.replace(/\s+/g, '-')}.png`;
        link.href = imgData;
        link.click();
      } else if (format === 'svg') {
        alert("La exportación nativa a SVG con imágenes incrustadas no es óptima en el cliente. Exportando como PNG de alta calidad. Para vectores usa el botón de descarga del QR aislado.");
      } else {
        // PDF Export
        let pdfFormat: [number, number] = [210, 297]; // A4
        if (format === 'pdf-a3') pdfFormat = [297, 420];
        if (format === 'pdf-a5') pdfFormat = [148, 210];
        if (format === 'pdf-4x4') pdfFormat = [40, 40];
        if (format === 'pdf-5x5') pdfFormat = [50, 50];
        if (format === 'pdf-7x7') pdfFormat = [70, 70];

        const pdf = new jsPDF({
          orientation: pdfFormat[0] > pdfFormat[1] ? 'landscape' : 'portrait',
          unit: 'mm',
          format: pdfFormat
        });

        pdf.setProperties({
            title: `Flux Music - Campaña ${viewingCampaign.name}`,
            subject: 'Material promocional para imprenta',
            author: 'Flux Music System',
            keywords: 'pdf/x-1a, pre-press, rgb-to-cmyk-required',
            creator: 'Flux Music App'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const imgRatio = imgProps.width / imgProps.height;
        const pdfRatio = pdfWidth / pdfHeight;
        
        let finalW = pdfWidth;
        let finalH = pdfHeight;
        let finalX = 0;
        let finalY = 0;
        
        // Fit object inside (or crop, but fit is safer)
        if (format.includes('x')) {
            // Stickers - exact fit
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        } else {
            // A-series
            if (imgRatio > pdfRatio) {
                finalH = pdfWidth / imgRatio;
                finalY = (pdfHeight - finalH) / 2;
            } else {
                finalW = pdfHeight * imgRatio;
                finalX = (pdfWidth - finalW) / 2;
            }
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
            pdf.addImage(imgData, 'PNG', finalX, finalY, finalW, finalH, undefined, 'FAST');
        }
        
        pdf.save(`Campaña-${viewingCampaign.name.replace(/\s+/g, '-')}-${format.toUpperCase()}.pdf`);
      }
    } catch (e) {
      console.error("Export error:", e);
      alert("Error al exportar. Revisa la consola.");
    } finally {
      setIsExporting(false);
    }
  };

  const getQRUrl = (id: string) => {
    // Ensure we use https for the QR code URLs to avoid security warnings
    const origin = window.location.origin.replace(/^http:\/\//i, 'https://');
    return `${origin}/vip?campaign=${id}`;
  };

  const downloadQRSvg = () => {
    if (!viewingCampaign) return;
    const svg = document.getElementById('qr-code-svg');
    if (!svg) {
      alert("El QR no es válido o no se ha cargado.");
      return;
    }
    
    // Verificar que el QR es válido
    const qrUrl = getQRUrl(viewingCampaign.id);
    if (!qrUrl || !qrUrl.includes('campaign=')) {
      alert("La URL del QR no es válida.");
      return;
    }
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-${viewingCampaign.name.replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadQRPng = () => {
    if (!viewingCampaign) return;
    const svg = document.getElementById('qr-code-svg');
    if (!svg) {
      alert("El QR no es válido o no se ha cargado.");
      return;
    }
    
    // Verificar que el QR es válido
    const qrUrl = getQRUrl(viewingCampaign.id);
    if (!qrUrl || !qrUrl.includes('campaign=')) {
      alert("La URL del QR no es válida.");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Add padding/margin to the generated PNG
      const padding = 20;
      canvas.width = img.width + (padding * 2);
      canvas.height = img.height + (padding * 2);
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);
        
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `QR-${viewingCampaign.name.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="p-4 sm:p-6 text-white h-full flex flex-col min-h-0 overflow-y-auto premium-scrollbar">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <QrCode className="text-emerald-400 w-7 h-7" /> Campañas QR
          </h2>
          <p className="text-slate-400 text-sm mt-1">Genera y administra material promocional para espacios físicos.</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openNew(); }}
          className="bg-emerald-500 active:bg-emerald-400 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nueva Campaña
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-emerald-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 active:bg-white/[0.04] transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg truncate pr-2">{c.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">{TEMPLATES.find(t => t.id === c.template)?.name || c.template}</p>
                </div>
                <button 
                  onClick={() => handleToggleStatus(c)}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-2 ${c.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}
                  title={c.status === 'active' ? 'Activa (Clic para pausar)' : 'Inactiva (Clic para activar)'}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Escaneos</p>
                  <p className="text-lg font-black text-white">{c.scans}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-emerald-500/80 font-bold uppercase">VIPs</p>
                  <p className="text-lg font-black text-emerald-400">{c.vipActivations}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-amber-500/80 font-bold uppercase">Premium</p>
                  <p className="text-lg font-black text-amber-400">{c.premiumConversions}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                <button onClick={() => setViewingCampaign(c)} className="flex-1 bg-white/5 active:bg-white/10 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Ver Diseño
                </button>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 bg-white/5 active:bg-white/10 rounded-lg text-slate-400 active:text-white transition-colors" title="Editar">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDuplicate(c)} className="p-2 bg-white/5 active:bg-white/10 rounded-lg text-slate-400 active:text-white transition-colors" title="Duplicar">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 bg-red-500/10 active:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-white/[0.02] border border-white/5 rounded-3xl border-dashed">
              <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay campañas QR creadas.</p>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[20000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">{editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nombre de Campaña (Ej: Gym Norte)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plantilla de Diseño</label>
                <select 
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                >
                  {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-white/5 active:bg-white/10 rounded-xl font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving || !name.trim()} className="flex-1 py-3 bg-emerald-500 active:bg-emerald-400 text-black rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />} {editingCampaign ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Design Viewer Modal */}
      {viewingCampaign && createPortal(
        <div className="fixed inset-0 z-[20000] bg-black/90 backdrop-blur-md flex flex-col lg:flex-row">
          <div className="flex-1 h-full overflow-auto p-4 md:p-8 flex items-start lg:items-center justify-center premium-scrollbar relative">
            <button onClick={() => setViewingCampaign(null)} className="absolute top-4 right-4 p-2 bg-white/10 active:bg-white/20 rounded-full z-[100] transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            {/* The Design Container for HTML2Canvas */}
            <div className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] md:w-[640px] md:h-[640px] lg:w-[800px] lg:h-[800px] relative shrink-0 my-8 lg:my-0 flex items-center justify-center">
              <div className="absolute top-0 left-0 origin-top-left transform scale-[0.4] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 shadow-[0_0_50px_rgba(30,215,96,0.15)] ring-1 ring-white/10" style={{ width: '800px', height: '800px' }}>
                <div ref={printRef} className="w-[800px] h-[800px] relative overflow-hidden flex flex-col justify-center items-center" style={{ backgroundColor: '#070708', transform: 'scale(1)', transformOrigin: 'top left' }}>
                {/* Background Styles based on template */}
                {viewingCampaign.template === 'neon' && (
                  <>
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] transform translate-x-[200px] -translate-y-[200px]" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.5) 0%, rgba(30,215,96,0) 70%)' }} />
                    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] transform -translate-x-[200px] translate-y-[200px]" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.5) 0%, rgba(37,99,235,0) 70%)' }} />
                  </>
                )}
                {viewingCampaign.template === 'premium-oscuro' && (
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #121212, #050505, #000000)' }} />
                )}
                {viewingCampaign.template === 'minimalista' && (
                  <div className="absolute inset-0" style={{ backgroundColor: '#000000', border: '20px solid #1ED760' }} />
                )}
                
                {/* Content */}
                <div className="relative z-10 w-full h-full" style={{ padding: '80px 60px', boxSizing: 'border-box', textAlign: 'center' }}>
                  <div style={{ marginBottom: '60px' }}>
                    <h1 style={{ 
                      color: '#ffffff', 
                      fontSize: '56px', 
                      fontWeight: 900, 
                      margin: 0, 
                      fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap'
                    }}>
                      MÚSICA ILIMITADA<br/>
                      <span style={{ color: '#1ED760' }}>PASE VIP GRATIS</span>
                    </h1>
                  </div>
                  
                  <div style={{ position: 'relative', display: 'inline-block', backgroundColor: '#ffffff', boxShadow: '0 0 80px rgba(30,215,96,0.5)', padding: '24px', borderRadius: '40px' }}>
                    <QRCodeCanvas 
                      id="qr-code-canvas"
                      value={getQRUrl(viewingCampaign.id)}
                      size={460}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      includeMargin={false}
                      imageSettings={{
                        src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(100,116,139,0.5)' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='34' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='38' cy='50' r='6' fill='%231ED760'/%3E%3Ccircle cx='62' cy='50' r='6' fill='%231ED760'/%3E%3C/svg%3E",
                        height: 100,
                        width: 100,
                        excavate: true,
                      }}
                    />
                    <div style={{ display: 'none' }}>
                      <QRCodeSVG 
                        id="qr-code-svg"
                        value={getQRUrl(viewingCampaign.id)}
                        size={460}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                        includeMargin={false}
                        imageSettings={{
                          src: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(100,116,139,0.5)' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='34' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='38' cy='50' r='6' fill='%231ED760'/%3E%3Ccircle cx='62' cy='50' r='6' fill='%231ED760'/%3E%3C/svg%3E`,
                          x: undefined,
                          y: undefined,
                          height: 100,
                          width: 100,
                          excavate: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
          
          {/* Sidebar Tools */}
          <div className="w-full lg:w-[350px] h-auto lg:h-full max-h-[50vh] lg:max-h-full bg-[#121214] border-t lg:border-t-0 lg:border-l border-white/5 p-6 flex flex-col shrink-0 overflow-y-auto">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Download className="w-5 h-5 text-emerald-400" /> Exportar</h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Impresión Profesional (CMYK Pre-press) *</p>
                <div className="grid grid-cols-1 gap-2">
                  <button disabled={isExporting} onClick={() => generateExport('pdf-a3')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF A3 (Cartel) {isExporting && <Loader2 className="w-4 h-4 animate-spin"/>}
                  </button>
                  <button disabled={isExporting} onClick={() => generateExport('pdf-a4')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF A4 (Folleto) {isExporting && <Loader2 className="w-4 h-4 animate-spin"/>}
                  </button>
                  <button disabled={isExporting} onClick={() => generateExport('pdf-a5')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF A5 (Mesa) {isExporting && <Loader2 className="w-4 h-4 animate-spin"/>}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pegatinas</p>
                <div className="grid grid-cols-1 gap-2">
                  <button disabled={isExporting} onClick={() => generateExport('pdf-4x4')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF 4x4 cm 
                  </button>
                  <button disabled={isExporting} onClick={() => generateExport('pdf-5x5')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF 5x5 cm 
                  </button>
                  <button disabled={isExporting} onClick={() => generateExport('pdf-7x7')} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PDF 7x7 cm
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Archivos Digitales</p>
                <div className="grid grid-cols-1 gap-2">
                  <button disabled={isExporting} onClick={() => generateExport('png')} className="bg-emerald-500/10 text-emerald-400 active:bg-emerald-500/20 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    Folleto Completo (PNG)
                  </button>
                  <button disabled={isExporting} onClick={downloadQRPng} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    PNG (Solo QR)
                  </button>
                  <button disabled={isExporting} onClick={downloadQRSvg} className="bg-white/5 active:bg-white/10 px-4 py-3 rounded-xl font-semibold text-sm text-left flex justify-between items-center transition-colors">
                    SVG (Solo QR)
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-4">
                <p className="text-[10px] text-amber-500/90 leading-relaxed font-medium">
                  * <strong>Atención Imprenta:</strong> Los PDF generados por el navegador utilizan el espacio de color <strong>sRGB</strong> debido a restricciones nativas del motor web. Para garantizar el estándar <strong>PDF/X-1a</strong> y colores exactos, proporcione el PDF o PNG generado al preimpresor para su conversión a CMYK con el perfil de impresión adecuado (ej. FOGRA39).
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {campaignToDelete && (
          <div className="fixed inset-0 z-[30000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4 text-white">¿Eliminar campaña?</h3>
              <p className="text-slate-400 mb-8">
                ¿Estás seguro de eliminar esta campaña? Se perderán las estadísticas de escaneos, pero los pases VIP activos generados seguirán funcionando sin problemas.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setCampaignToDelete(null)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-white/5 active:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => confirmDelete(campaignToDelete)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-red-500 active:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
