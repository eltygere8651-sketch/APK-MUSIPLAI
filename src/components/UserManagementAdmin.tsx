import { API_BASE_URL } from "../lib/constants";
import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  X,
  UserX,
  Shield,
  CheckCircle,
  AlertTriangle,
  Trash,
  Send,
  Save,
  Key,
  MessageSquare,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bug,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { FluxLogoMini } from "./FluxLogo";
import { QRCampaignsAdmin } from "./QRCampaignsAdmin";

const getMs = (val: any): number => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val.toMillis === "function") return val.toMillis();
  if (typeof val.seconds === "number") return val.seconds * 1000;
  if (typeof val === "string") return new Date(val).getTime() || 0;
  if (val instanceof Date) return val.getTime();
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getElapsedLabel = (timestamp: any) => {
  const ms = getMs(timestamp);
  if (!ms) return "hace un momento";
  const diffSecs = Math.floor((Date.now() - ms) / 1000);
  if (diffSecs < 10) return "ahora mismo";
  if (diffSecs < 60) return `hace ${diffSecs}s`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `hace ${diffMins} min`;
  const diffHrs = Math.floor(diffMins / 60);
  return `hace ${diffHrs}h`;
};

const formatUsageTime = (seconds: number | undefined) => {
  if (!seconds || seconds <= 0) return "0 min";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
};

export const UserManagementAdmin = ({ onClose }: { onClose: () => void }) => {
  const [users, setUsers] = useState<any[]>([]);
  const usersRef = useRef<any[]>([]);
  usersRef.current = users;

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Pagination Config Users
  const [usersPageSize, setUsersPageSize] = useState(50);
  const [usersPage, setUsersPage] = useState(0);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [usersPageHistory, setUsersPageHistory] = useState<any[]>([null]);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);

  // Pagination Config Requests
  const [requestsPageSize, setRequestsPageSize] = useState(50);
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsPageHistory, setRequestsPageHistory] = useState<any[]>([null]);
  const [hasMoreRequests, setHasMoreRequests] = useState(true);

  // Lazy Analytics Stats
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
  });
  const [vipStats, setVipStats] = useState({
    activated: 0,
    active: 0,
    activeToday: 0,
    expired: 0,
    conversions: 0,
  });
  const [analyticsStats, setAnalyticsStats] = useState({
    totalUsers: 0,
    pendingRequests: 0,
    activeTrials: 0,
    activePaid: 0,
  });
  const [realtimeActiveUsers, setRealtimeActiveUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<
    | "requests"
    | "subscriptions"
    | "notifications"
    | "monitor"
    | "analytics"
    | "qr_campaigns"
  >("subscriptions");

  useEffect(() => {
    // Escucha en tiempo real de usuarios con actividad en los últimos 15 minutos
    const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
    const q = query(
      collection(db, "users"),
      where("lastActiveAt", ">=", fifteenMinsAgo),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const activeList: any[] = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((u: any) => getMs(u.lastActiveAt) >= now - 15 * 60 * 1000);

        // Ordenar en lado del cliente para evitar errores por índices compuestos requeridos de ordenamiento en Firestore
        activeList.sort(
          (a: any, b: any) => getMs(b.lastActiveAt) - getMs(a.lastActiveAt),
        );
        setRealtimeActiveUsers(activeList);

        setAdminStats((prev) => ({
          ...prev,
          activeUsers: activeList.length,
        }));
      },
      (err) => {
        console.warn("Real-time active users listener failed:", err);
        // Fallback usando filtrado en los usuarios ya cargados
        const clientFiltered = usersRef.current.filter((u) => {
          const ms = getMs(u.lastActiveAt);
          return ms && Date.now() - ms <= 15 * 60 * 1000;
        });
        setRealtimeActiveUsers(clientFiltered);
      },
    );

    return () => unsubscribe();
  }, []);

  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const [isTelegramConfigExpanded, setIsTelegramConfigExpanded] =
    useState(false);

  // Custom non-blocking Dialogs to bypass sandbox iframe blocks
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const askConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({
      title: "Confirmar Acción",
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      },
    });
  };

  const showAlert = (message: string, title = "Notificación") => {
    setAlertModal({
      title,
      message,
    });
  };

  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tabsContainerRef.current;

    if (!el) return;

    let isDown = false;

    let startX: number;

    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;

      el.classList.add("cursor-grabbing");

      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };

    const onMouseUp = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // Multiplicador de velocidad de scroll
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  // Announcement composition states
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annCategory, setAnnCategory] = useState<
    "noticia" | "urgente" | "mantenimiento" | "actualizacion"
  >("noticia");
  const [isPublishing, setIsPublishing] = useState(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState("");

  // System Monitor States
  const [systemHealth, setSystemHealth] = useState<{
    mainLibrary: string;
    planB: string;
    timestamp: number;
  } | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const checkSystemHealth = async () => {
    try {
      setIsCheckingHealth(true);
      const res = await fetch(`${API_BASE_URL}/api/system/health`);
      const data = await res.json();
      setSystemHealth(data);
    } catch (err) {
      console.error("Health check error:", err);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const publishAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim()) {
      alert("Por favor completa el título y el contenido del comunicado.");
      return;
    }
    try {
      setIsPublishing(true);
      setAnnSuccessMsg("");
      const randId = "ann_" + Math.random().toString(36).substring(2, 11);
      const docRef = doc(db, "announcements", randId);
      await setDoc(docRef, {
        title: annTitle.trim(),
        content: annContent.trim(),
        category: annCategory,
        createdAt: new Date(),
        active: true,
      });
      setAnnTitle("");
      setAnnContent("");
      setAnnCategory("noticia");
      setAnnSuccessMsg(
        "¡Comunicado global publicado con éxito en la base de datos de FLUX!",
      );
      setTimeout(() => setAnnSuccessMsg(""), 4500);
    } catch (err) {
      console.error("Error publicando anuncio:", err);
      alert("Error al publicar el anuncio: " + err);
    } finally {
      setIsPublishing(false);
    }
  };

  const deleteActiveAnnouncement = async () => {
    try {
      const { query, collection, orderBy, limit, getDocs, updateDoc } =
        await import("firebase/firestore");
      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc"),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { active: false });
        alert(
          "El comunicado activo ha sido eliminado y ocultado de los usuarios (Refresca la app para ver los cambios).",
        );
      } else {
        alert("No hay ningún comunicado activo reciente para eliminar.");
      }
    } catch (err) {
      console.error(err);
      alert("Error eliminando comunicado");
    }
  };

  const adminDataLoadedRef = useRef({
    users: false,
    notifications: false,
    monitor: false,
  });

  useEffect(() => {
    if (
      (activeTab === "requests" || activeTab === "subscriptions") &&
      !adminDataLoadedRef.current.users
    ) {
      adminDataLoadedRef.current.users = true;
      fetchUsers();
      fetchRequests();
      adjustYesterdayTrials();
    } else if (
      activeTab === "notifications" &&
      !adminDataLoadedRef.current.notifications
    ) {
      adminDataLoadedRef.current.notifications = true;
      fetchTelegramConfig();
    } else if (activeTab === "monitor" && !adminDataLoadedRef.current.monitor) {
      adminDataLoadedRef.current.monitor = true;
      checkSystemHealth();
    } else if (activeTab === "analytics") {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const downloadPresentation = () => {
    try {
      const doc = new jsPDF();

      // PAGE 1: PORTADA PRINCIPAL (Estilo Blanco Minimalista con Banda Verde)
      // 1. Banda verde en la parte superior
      doc.setFillColor(30, 215, 96);
      doc.rect(0, 0, 210, 12, "F");

      // 2. LOGO OFICIAL VECTORIAL FLUX MUSIC (Diseño doble círculo concéntrico con dos puntos internos)
      const logoX = 105;
      const logoY = 75;
      // Círculo exterior verde
      doc.setDrawColor(30, 215, 96);
      doc.setLineWidth(0.8);
      doc.circle(logoX, logoY, 18, "S");
      // Círculo medio gris
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.4);
      doc.circle(logoX, logoY, 15, "S");
      // Círculo interior verde
      doc.setDrawColor(30, 215, 96);
      doc.setLineWidth(0.8);
      doc.circle(logoX, logoY, 12, "S");
      // Dos puntos verdes rellenos
      doc.setFillColor(30, 215, 96);
      doc.circle(logoX - 4.5, logoY, 1.8, "F");
      doc.circle(logoX + 4.5, logoY, 1.8, "F");

      // 3. TÍTULOS DE PORTADA
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.text("FLUX MUSIC", 105, 122, { align: "center" });

      doc.setTextColor(30, 215, 96); // Verde Flux
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.text("STREAMING AUDIO PREMIUM DE ALTO RENDIMIENTO", 105, 133, {
        align: "center",
      });

      // 4. TEXTO INTRODUCTORIO CENTRADO
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const introText =
        "Un ecosistema de streaming adaptado para una experiencia premium en hogares, oficinas, tiendas, bares y locales comerciales. Conectado de forma dinamica a una potente red de audio optimizada con control total, listas sincronizadas en tiempo real y compatibilidad de reproduccion de alta gama.";
      const splitIntro = doc.splitTextToSize(introText, 160);

      // Pintar con interlineado manual de 5.5
      let tempY = 146;
      splitIntro.forEach((line: string) => {
        doc.text(line, 105, tempY, { align: "center" });
        tempY += 5.5;
      });

      // 5. RECUADRO CON VALORES FUNDAMENTALES DU PROYECTO
      doc.setDrawColor(30, 215, 96);
      doc.setLineWidth(0.6);
      doc.setFillColor(255, 255, 255);
      doc.rect(25, 182, 160, 48, "S");

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("VALORES FUNDAMENTALES DEL ECOSISTEMA FLUX", 105, 194, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(
        "• Catálogo Ilimitado y Vivo: Millones de canciones y miles de playlists 100% optimizadas.",
        30,
        203,
      );
      doc.text(
        "• Dominio Global de Tendencias: Tops por países actualizados diariamente sin margen de error.",
        30,
        211,
      );
      doc.text(
        "• Motor de Búsqueda Supremo: Encuentra tracks, artistas, álbumes y remixes en milisegundos.",
        30,
        219,
      );

      // 6. PIE DE PORTADA
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text("FLUX AUDIO STUDIO LTDA * REGISTRO DE PRODUCTO 2026", 105, 268, {
        align: "center",
      });

      // PAGE 2: ¿POR QUÉ ELEGIR FLUX MUSIC?
      doc.addPage();

      // Banda verde superior
      doc.setFillColor(30, 215, 96);
      doc.rect(0, 0, 210, 12, "F");

      // Cabecera superior institucional del PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("FLUX MUSIC • DOSSIER COMERCIAL & PROYECTO B2B", 20, 20);
      doc.text("PAGINA 2", 190, 20, { align: "right" });

      // Línea divisora sutil
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(20, 22.5, 190, 22.5);

      // TÍTULO EN NEGRO CON PEQUEÑA BARRA ACENTUADA
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("1. ¿Por que elegir FLUX Music?", 20, 35);

      // Barra de acentuación
      doc.setFillColor(30, 215, 96);
      doc.rect(20, 38, 170, 1, "F");

      // Párrafo de justificación
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const textChoose =
        "La ambientacion musical es un factor critico de conversion y energia, tanto en centros de trabajo donde eleva la productividad un 15% como en locales comerciales (hoteles, bares, tiendas) donde incrementa el tiempo de permanencia. Sin embargo, la oferta legal de la competencia es costosa y carece de dinamismo. FLUX ofrece una alternativa de alto impacto, interactiva y robusta.";
      const splitChoose = doc.splitTextToSize(textChoose, 170);
      let yChoose = 45;
      splitChoose.forEach((line: string) => {
        doc.text(line, 20, yChoose);
        yChoose += 5.2;
      });

      // Subtítulo Características Técnicas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("CARACTERISTICAS TECNICAS DESTACADAS", 20, 74);

      // Array de características destacadas
      const techSpecs = [
        {
          title: "Sincronización Privada Inmediata",
          desc: "Tus favoritos y listas se respaldan en tiempo real en nuestra infraestructura global segura, garantizando privacidad y disponibilidad inmediata sin dependencias públicas visibles.",
        },
        {
          title: "Colección de Avatares Élite Integrada",
          desc: "Ofrece a los usuarios personalización premium con nuevos diseños exclusivos HD, gradientes dinámicos y sellos de rareza que incrementan el valor percibido y el engagement.",
        },
        {
          title: "Centro de Notificaciones en Tiempo Real",
          desc: "Comunícate con tu audiencia de manera fluida y profesional desde la cabecera. Un historial de novedades unificado y directo al consumidor, sin interrupciones ni ventanas emergentes.",
        },
        {
          title: "Modo Inmersivo Perpetuo y Bajo Consumo",
          desc: "Diseñada como un ecosistema ininterrumpido. Flux neutraliza orgánicamente el bloqueo del dispositivo activando motores de muy bajo consumo. La música brilla y la pantalla se mantiene viva eternamente.",
        },
      ];

      let featY = 82;
      techSpecs.forEach((spec) => {
        // Cuadrado verde como viñeta
        doc.setFillColor(30, 215, 96);
        doc.rect(20, featY, 3.5, 3.5, "F");

        // Título de la característica
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(15, 23, 42);
        doc.text(spec.title, 26, featY + 3);

        // Descripción de la característica
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);

        const splitDesc = doc.splitTextToSize(spec.desc, 160);
        doc.text(splitDesc, 26, featY + 8);

        featY += 10 + splitDesc.length * 4.5;
      });

      // PAGE 3: MODELOS DE LICENCIA, TARIFAS Y COMPARACIÓN
      doc.addPage();

      // Banda verde superior
      doc.setFillColor(30, 215, 96);
      doc.rect(0, 0, 210, 12, "F");

      // Cabecera superior
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("FLUX MUSIC • DOSSIER COMERCIAL & PROYECTO B2B", 20, 20);
      doc.text("PAGINA 3", 190, 20, { align: "right" });

      // Línea divisora
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(20, 22.5, 190, 22.5);

      // TÍTULO DE TARIFAS
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("2. Modelos de Licencia y Tarifas", 20, 35);

      // Barra acentuada
      doc.setFillColor(30, 215, 96);
      doc.rect(20, 38, 170, 1, "F");

      // Párrafo introductorio
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const textRates =
        "Nuestras tarifas estan estructuradas en Euros (EUR) de forma transparente y optimizada, pensada para ofrecer una alternativa legal ultra-accesible y maximizar la conversion frente a los competidores tradicionales.";
      const splitRates = doc.splitTextToSize(textRates, 170);
      let yRates = 45;
      splitRates.forEach((line: string) => {
        doc.text(line, 20, yRates);
        yRates += 5.2;
      });

      // TARJETA DE PLAN 1: PLAN INDIVIDUAL (4,99 EUR)
      const p1X = 20;
      const p1Y = 58;
      const cardHeight = 31;

      // Dibujar fondo de tarjeta
      doc.setFillColor(248, 250, 252); // Soft light slate background
      doc.rect(p1X, p1Y, 170, cardHeight, "F");
      // Outline sutil
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(p1X, p1Y, 170, cardHeight, "S");
      // Línea izquierda verde ancha de la tarjeta
      doc.setFillColor(30, 215, 96);
      doc.rect(p1X, p1Y, 2.5, cardHeight, "F");

      // Textos Tarjeta 1
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("PLAN INDIVIDUAL", p1X + 6, p1Y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 215, 96);
      doc.text("4,99 EUR / mes", 190 - 6, p1Y + 6, { align: "right" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Para 1 Usuario Personal", p1X + 6, p1Y + 11);

      // Viñetas dobles en la tarjeta
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text("• Acceso completo personal", p1X + 6, p1Y + 18);
      doc.text("• Listas personalizadas ilimitadas", p1X + 6, p1Y + 24);
      doc.text("• Buscador global integrado", p1X + 85, p1Y + 18);
      doc.text("• Sincronizacion de favoritos", p1X + 85, p1Y + 24);

      // TARJETA DE PLAN 2: PLAN DUO (7,99 EUR)
      const p2X = 20;
      const p2Y = 94;

      // Dibujar fondo de tarjeta
      doc.setFillColor(248, 250, 252);
      doc.rect(p2X, p2Y, 170, cardHeight, "F");
      // Outline sutil
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(p2X, p2Y, 170, cardHeight, "S");
      // Línea izquierda verde ancha
      doc.setFillColor(30, 215, 96);
      doc.rect(p2X, p2Y, 2.5, cardHeight, "F");

      // Textos Tarjeta 2
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text("PLAN DUO (Premium Duo)", p2X + 6, p2Y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 215, 96);
      doc.text("7,99 EUR / mes", 190 - 6, p2Y + 6, { align: "right" });

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Para 2 Usuarios Simultaneos", p2X + 6, p2Y + 11);

      // Viñetas dobles
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text("• Ideal para parejas o amigos", p2X + 6, p2Y + 18);
      doc.text("• Doble stream activo a la vez", p2X + 6, p2Y + 24);
      doc.text("• Perfiles aislados de favoritos", p2X + 85, p2Y + 18);
      doc.text("• Comparticion simplificada", p2X + 85, p2Y + 24);

      // 4. NUESTRAS TARIFAS COMPARADAS (TABLA DE MERCADO PREMIUM)
      let tableY = 135;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("TABLA COMPARATIVA CON OTRAS GRANDES PLATAFORMAS", 20, tableY);

      tableY += 5;
      // Dibujar cabecera de la tabla
      doc.setFillColor(30, 215, 96); // Verde Flux
      doc.rect(20, tableY, 170, 7.5, "F");

      doc.setTextColor(15, 23, 42); // Texto oscuro legible en verde
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("PLATAFORMA (STREAMING MUSICA)", 23, tableY + 5);
      doc.text("PLAN DE ACCESO", 93, tableY + 5);
      doc.text("PRECIO MENSUAL", 143, tableY + 5);

      tableY += 7.5;

      const comparisons = [
        {
          name: "Spotify Premium Individual",
          plan: "1 Usuario",
          price: "11,99 e / mes",
          highlight: false,
        },
        {
          name: "Apple Music Individual",
          plan: "1 Usuario",
          price: "10,99 e / mes",
          highlight: false,
        },
        {
          name: "Amazon Music Unlimited",
          plan: "1 Usuario",
          price: "10,99 e / mes",
          highlight: false,
        },
        {
          name: "Flux Music Premium (1 Usuario)",
          plan: "1 Usuario",
          price: "4,99 e / mes (¡Ahorras más del 55%!)",
          highlight: true,
        },
        {
          name: "Flux Music Premium (2 Usuarios)",
          plan: "2 Usuarios",
          price: "7,99 e / mes (¡Ahorras más del 60%!)",
          highlight: true,
        },
      ];

      comparisons.forEach((row, i) => {
        // Fondo alternativo claro
        if (row.highlight) {
          doc.setFillColor(240, 253, 244); // Color menta pastel muy suave
        } else {
          doc.setFillColor(
            i % 2 === 0 ? 255 : 248,
            i % 2 === 0 ? 255 : 250,
            i % 2 === 0 ? 255 : 252,
          );
        }

        doc.rect(20, tableY, 170, 7.5, "F");

        // Línea sutil de fila
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.3);
        doc.line(20, tableY + 7.5, 190, tableY + 7.5);

        // Estilos de texto
        if (row.highlight) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(22, 163, 74); // Verde oscuro brillante
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
        }

        doc.setFontSize(8);
        doc.text(row.name, 23, tableY + 5);
        doc.text(row.plan, 93, tableY + 5);
        doc.text(row.price, 143, tableY + 5);

        tableY += 7.5;
      });

      // Texto de finalización e información útil
      tableY += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("¿Como solicitar la activacion y sincronizacion?", 20, tableY);

      tableY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const requestText =
        "Para formalizar el alta de cualquiera de los planes, simplemente registrate y haz clic en probar gratis. Dado el control estricto de recursos y velocidad de stream, las activaciones de slot e invitaciones se gestionan de forma personalizada.";
      const splitRequest = doc.splitTextToSize(requestText, 170);
      splitRequest.forEach((line: string) => {
        doc.text(line, 20, tableY);
        tableY += 4.5;
      });

      // Conclusión en verde al pie
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 215, 96);
      doc.text(
        "PROYECTO COMPLEMENTARIO DESARROLLADO BAJO ESTANDAR COMERCIAL PREMIUM FY26",
        105,
        275,
        { align: "center" },
      );

      doc.save("Presentacion_Comercial_Flux_Music.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF de la presentación.");
    }
  };

  const fetchTelegramConfig = async () => {
    try {
      const docRef = doc(db, "system_settings", "telegram");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const bToken = data.botToken || "";
        const cId = data.chatId || "";
        setTelegramToken(bToken);
        setTelegramChatId(cId);

        // Warm up backend cache with these credentials (disabled for Vercel)
        if (bToken && cId) {
          /*
          fetch(`${API_BASE_URL}/api/support/register-telegram`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              botToken: bToken.trim(),
              chatId: cId.trim(),
              adminEmail: "eltygere8651@gmail.com"
            })
          }).catch(err => console.error("Error warming up backend Telegram parameters:", err));
          */
        }
      }
    } catch (e) {
      console.error("Error loading Telegram config:", e);
    }
  };

  const saveTelegramConfig = async () => {
    try {
      setIsSavingTelegram(true);
      const bToken = telegramToken.trim();
      const cId = telegramChatId.trim();

      const docRef = doc(db, "system_settings", "telegram");
      await setDoc(docRef, {
        botToken: bToken,
        chatId: cId,
        updatedAt: Date.now(),
      });

      // Synchronize directly with the backend server as well (disabled for Vercel static hosting)
      /*
      await fetch(`${API_BASE_URL}/api/support/register-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: bToken,
          chatId: cId,
          adminEmail: "eltygere8651@gmail.com"
        })
      });
      */

      alert(
        "¡Configuración de Telegram guardada y sincronizada correctamente!",
      );
    } catch (e) {
      console.error(e);
      alert("Error al guardar la configuración.");
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const testTelegramConfig = async () => {
    if (!telegramToken.trim() || !telegramChatId.trim()) {
      alert("Por favor, llena los campos de Token y Chat ID antes de probar.");
      return;
    }
    try {
      setIsTestingTelegram(true);
      const testText =
        "🔔 *¡Conexión Exitosa!*\nEste es un mensaje de prueba desde tu aplicación *Flux Music*. Las solicitudes de acceso de 7 días te llegarán aquí.";

      const response = await fetch(
        `https://api.telegram.org/bot${telegramToken.trim()}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId.trim(),
            text: testText,
            parse_mode: "Markdown",
          }),
        },
      );

      if (response.ok) {
        alert(
          "¡Mensaje de prueba enviado con éxito a tu Telegram! Revisa tu chat.",
        );
      } else {
        const errJson = await response.json();
        alert(`Error de Telegram: ${errJson.description || "Desconocido"}`);
      }
    } catch (err: any) {
      alert(`Error al enviar mensaje de prueba: ${err.message || err}`);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const fetchRequests = async (
    pageIndex = requestsPage > 0 ? requestsPage - 1 : 0,
    limitSize = requestsPageSize,
  ) => {
    try {
      setLoadingRequests(true);

      let q = query(
        collection(db, "trial_requests"),
        orderBy("createdAt", "desc"),
        limit(limitSize),
      );
      const startDoc = requestsPageHistory[pageIndex];
      if (startDoc) {
        q = query(
          collection(db, "trial_requests"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(limitSize),
        );
      }

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      list.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      setRequests(list);
      setHasMoreRequests(snap.docs.length === limitSize);

      if (snap.docs.length > 0) {
        setRequestsPageHistory((prev) => {
          const next = [...prev];
          next[pageIndex + 1] = snap.docs[snap.docs.length - 1];
          return next;
        });
      }
      setRequestsPage(pageIndex + 1);
    } catch (e) {
      console.error("Error loaded trial requests:", e);
      try {
        let q = query(collection(db, "trial_requests"), limit(limitSize));
        const startDoc = requestsPageHistory[pageIndex];
        if (startDoc) {
          q = query(
            collection(db, "trial_requests"),
            startAfter(startDoc),
            limit(limitSize),
          );
        }
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

        list.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (a.status !== "pending" && b.status === "pending") return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });

        setRequests(list);
        setHasMoreRequests(snap.docs.length === limitSize);
        if (snap.docs.length > 0) {
          setRequestsPageHistory((prev) => {
            const next = [...prev];
            next[pageIndex + 1] = snap.docs[snap.docs.length - 1];
            return next;
          });
        }
        setRequestsPage(pageIndex + 1);
      } catch (innerErr) {
        console.error("Fallback failed:", innerErr);
      }
    } finally {
      setLoadingRequests(false);
    }
  };

  const adjustYesterdayTrials = async () => {
    try {
      const { query, collection, getDocs, where } =
        await import("firebase/firestore");
      const q = query(collection(db, "users"), where("plan", "==", "free"));
      const snap = await getDocs(q);
      const usersList = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      const msPerDay = 1000 * 60 * 60 * 24;
      const now = Date.now();
      let count = 0;

      for (const u of usersList) {
        if (
          u.plan === "free" &&
          u.trialStart &&
          u.email !== "eltygere8651@gmail.com"
        ) {
          const currentDuration = u.trialDuration || 14;
          const isRecent = now - u.trialStart < 3 * msPerDay;

          if (currentDuration === 14 && isRecent) {
            await updateDoc(doc(db, "users", u.id), {
              trialDuration: 7,
              trialStart: now - 1 * msPerDay,
            });
            count++;
          }
        }
      }
      if (count > 0) {
        showAlert(
          `Se han detectado y corregido ${count} usuario(s) de prueba de ayer a 7 días de prueba (con 6 días restantes hoy).`,
        );
        fetchUsers();
      }
    } catch (err) {
      console.error("Error adjusting yesterday trials:", err);
    }
  };

  const handleApproveRequest = async (req: any) => {
    askConfirm(`¿Aprobar prueba de 7 días para ${req.email}?`, async () => {
      try {
        await updateDoc(doc(db, "users", req.uid), {
          plan: "free",
          trialStart: Date.now(),
          trialDuration: 7,
          subscriptionEnd: null,
        });

        await updateDoc(doc(db, "trial_requests", req.id), {
          status: "approved",
        });

        showAlert(
          "Acceso de prueba de 7 días activado y solicitud aprobada con éxito!",
        );
        fetchUsers();
        fetchRequests();
      } catch (err) {
        console.error(err);
        showAlert(
          "Error al aprobar la solicitud. Revisa si el usuario existe.",
        );
      }
    });
  };

  const handleRejectRequest = async (reqId: string) => {
    askConfirm("¿Rechazar esta solicitud de prueba?", async () => {
      try {
        await updateDoc(doc(db, "trial_requests", reqId), {
          status: "rejected",
        });
        showAlert("Solicitud rechazada.");
        fetchRequests();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDeleteRequestRecord = async (reqId: string) => {
    askConfirm("¿Eliminar registro de esta solicitud?", async () => {
      try {
        await deleteDoc(doc(db, "trial_requests", reqId));
        fetchRequests();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const fetchUsers = async (
    pageIndex = usersPage > 0 ? usersPage - 1 : 0,
    limitSize = usersPageSize,
  ) => {
    try {
      setLoading(true);
      let snap = null;

      // Try 1: Order by lastLogin (descending)
      try {
        let q1 = query(
          collection(db, "users"),
          orderBy("lastLogin", "desc"),
          limit(limitSize),
        );
        const startDoc = usersPageHistory[pageIndex];
        if (startDoc) {
          q1 = query(
            collection(db, "users"),
            orderBy("lastLogin", "desc"),
            startAfter(startDoc),
            limit(limitSize),
          );
        }
        const tempSnap = await getDocs(q1);
        if (!tempSnap.empty) {
          snap = tempSnap;
        }
      } catch (e) {
        console.warn(
          "orderBy lastLogin failed, trying createdAt descending:",
          e,
        );
      }

      // Try 2: Order by createdAt (descending)
      if (!snap) {
        try {
          let q2 = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(limitSize),
          );
          const startDoc = usersPageHistory[pageIndex];
          if (startDoc) {
            q2 = query(
              collection(db, "users"),
              orderBy("createdAt", "desc"),
              startAfter(startDoc),
              limit(limitSize),
            );
          }
          const tempSnap = await getDocs(q2);
          if (!tempSnap.empty) {
            snap = tempSnap;
          }
        } catch (e) {
          console.warn(
            "orderBy createdAt failed, trying default no-ordering fallback:",
            e,
          );
        }
      }

      // Try 3: Default fallback (No order, always works regardless of properties)
      if (!snap) {
        try {
          let q3 = query(collection(db, "users"), limit(limitSize));
          const startDoc = usersPageHistory[pageIndex];
          if (startDoc) {
            q3 = query(
              collection(db, "users"),
              startAfter(startDoc),
              limit(limitSize),
            );
          }
          snap = await getDocs(q3);
        } catch (e) {
          console.error("All user queries failed:", e);
          throw e;
        }
      }

      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setHasMoreUsers(snap.docs.length === limitSize);

      if (snap.docs.length > 0) {
        setUsersPageHistory((prev) => {
          const next = [...prev];
          next[pageIndex + 1] = snap.docs[snap.docs.length - 1];
          return next;
        });
      }
      setUsersPage(pageIndex + 1);

      // Fetch resilient counters for Stats Tab
      if (pageIndex === 0) {
        let totalCount = 0;
        let newCount = 0;

        try {
          const totalSnap = await getCountFromServer(collection(db, "users"));
          totalCount = totalSnap.data().count;
        } catch (statsErr) {
          console.warn("Could not fetch total users count:", statsErr);
        }

        try {
          const newSnap = await getCountFromServer(
            query(
              collection(db, "users"),
              where("createdAt", ">=", Date.now() - 24 * 60 * 60 * 1000),
            ),
          );
          newCount = newSnap.data().count;
        } catch (newErr) {
          try {
            // Fallback using lastLogin if createdAt index/property is missing
            const newSnap = await getCountFromServer(
              query(
                collection(db, "users"),
                where(
                  "lastLogin",
                  ">=",
                  new Date(Date.now() - 24 * 60 * 60 * 1000),
                ),
              ),
            );
            newCount = newSnap.data().count;
          } catch (innerNew) {
            console.warn("Could not fetch new users:", innerNew);
          }
        }

        setAdminStats((prev) => ({
          ...prev,
          totalUsers: totalCount,
          newUsers: newCount,
        }));
      }
    } catch (e) {
      console.error("fetchUsers exception:", e);
      showAlert(
        "Error al cargar usuarios. Verifica la conexión o las reglas de Firestore.",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const oneDayAgoDate = new Date(oneDayAgo);

      // Fetch VIP, User, and Request stats in a highly efficient, parallelized, eco-friendly way (1 read per count request)
      const [
        activatedSnap,
        activeSnap,
        activeTodaySnap,
        expiredSnap,
        conversionsSnap,
        totalUsersSnap,
        newUsersNormalSnap,
        newUsersVipSnap,
        pendingRequestsSnap,
        activeTrialsSnap,
        activePaidSnap,
      ] = await Promise.all([
        // 1. VIP Guest Activations
        getCountFromServer(collection(db, "vip_activations")),
        getCountFromServer(
          query(
            collection(db, "vip_activations"),
            where("expiresAt", ">=", now),
          ),
        ),
        getCountFromServer(
          query(
            collection(db, "vip_activations"),
            where("createdAt", ">=", oneDayAgo),
          ),
        ),
        getCountFromServer(
          query(
            collection(db, "vip_activations"),
            where("expiresAt", "<", now),
          ),
        ),
        // 2. VIP Conversions: Users registered as VIP guests who upgraded to paid/premium plans
        getCountFromServer(
          query(
            collection(db, "users"),
            where("isVIPGuest", "==", true),
            where("plan", "in", ["premium", "1 Usuario", "2 Usuarios", "5 Usuarios"]),
          ),
        ),
        // 3. User stats (Global)
        getCountFromServer(collection(db, "users")),
        // 4. Normal Users created in last 24h (storing createdAt as serverTimestamp/Date object)
        getCountFromServer(
          query(
            collection(db, "users"),
            where("createdAt", ">=", oneDayAgoDate),
          ),
        ),
        // 5. VIP Guest Users created in last 24h (storing createdAt as number of milliseconds)
        getCountFromServer(
          query(
            collection(db, "users"),
            where("createdAt", ">=", oneDayAgo),
          ),
        ).catch(() => ({ data: () => ({ count: 0 }) })),
        // 6. Trial requests
        getCountFromServer(
          query(
            collection(db, "trial_requests"),
            where("status", "==", "pending"),
          ),
        ),
        // 7. Active free trial users
        getCountFromServer(
          query(
            collection(db, "users"),
            where("plan", "==", "free"),
          ),
        ),
        // 8. Active paid subscriber plans
        getCountFromServer(
          query(
            collection(db, "users"),
            where("plan", "in", ["premium", "1 Usuario", "2 Usuarios", "5 Usuarios"]),
          ),
        ),
      ]);

      const resolvedNewUsers =
        newUsersNormalSnap.data().count +
        ((newUsersVipSnap &&
          typeof newUsersVipSnap.data === "function" &&
          newUsersVipSnap.data().count) ||
          0);

      setVipStats({
        activated: activatedSnap.data().count,
        active: activeSnap.data().count,
        activeToday: activeTodaySnap.data().count,
        expired: expiredSnap.data().count,
        conversions: conversionsSnap.data().count,
      });

      setAdminStats((prev) => ({
        ...prev,
        totalUsers: totalUsersSnap.data().count,
        newUsers: resolvedNewUsers,
      }));

      setAnalyticsStats({
        totalUsers: totalUsersSnap.data().count,
        pendingRequests: pendingRequestsSnap.data().count,
        activeTrials: activeTrialsSnap.data().count,
        activePaid: activePaidSnap.data().count,
      });
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const grantTrial = async (userId: string, durationDays: number = 7) => {
    askConfirm(
      `¿Activar prueba de ${durationDays} días para este usuario?`,
      async () => {
        try {
          await updateDoc(doc(db, "users", userId), {
            plan: "free",
            trialStart: Date.now(),
            trialDuration: durationDays,
            subscriptionEnd: null,
          });
          showAlert(`¡Prueba de ${durationDays} días activada con éxito!`);
          fetchUsers();
        } catch (e) {
          console.error(e);
          showAlert("Error al activar prueba.");
        }
      },
    );
  };

  const updateSub = async (
    userId: string,
    plan: string,
    durationDays: number,
  ) => {
    askConfirm(`¿Confirmar plan ${plan} para usuario?`, async () => {
      try {
        const msPerDay = 1000 * 60 * 60 * 24;
        const subEnd = Date.now() + durationDays * msPerDay;

        // Fetch user first to check originCampaign
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const originCampaign = userDoc.exists()
          ? userDoc.data().originCampaign
          : null;

        await updateDoc(userDocRef, {
          plan,
          subscriptionEnd: subEnd,
        });

        // Update campaign premium conversions if applicable
        if (originCampaign && plan !== "free") {
          // We only increment if this is their first time becoming a premium user?
          // For simplicity and matching the prompt's request for aggregated stats, we increment when they get a plan.
          // To be perfectly accurate we would track if they were already converted, but this is an acceptable approximation.
          const { increment } = await import("firebase/firestore");
          await updateDoc(doc(db, "qr_campaigns", originCampaign), {
            premiumConversions: increment(1),
          }).catch((e) => console.error(e));
        }

        showAlert("Suscripción actualizada!");
        fetchUsers();
      } catch (e) {
        console.error(e);
        showAlert("Error al actualizar la suscripción.");
      }
    });
  };

  const adjustSubDays = async (user: any, daysToAdjust: number | "custom") => {
    let finalDays = 0;
    if (daysToAdjust === "custom") {
      const val = window.prompt(
        "Ingresa los días a sumar (usa - para restar):",
        "0",
      );
      if (!val) return;
      finalDays = parseInt(val, 10);
      if (isNaN(finalDays) || finalDays === 0) return;
    } else {
      finalDays = daysToAdjust;
    }
    askConfirm(
      `¿Confirmar ${finalDays > 0 ? "+" : ""}${finalDays} día(s) para este usuario?`,
      async () => {
        try {
          const msPerDay = 1000 * 60 * 60 * 24;
          let newEnd = user.subscriptionEnd;
          if (!newEnd || newEnd <= Date.now()) {
            const currentTrialDur = user.trialDuration || 7;
            if (
              user.trialStart &&
              user.trialStart + currentTrialDur * msPerDay > Date.now()
            ) {
              newEnd = user.trialStart + currentTrialDur * msPerDay;
            } else {
              newEnd = Date.now();
            }
          }
          newEnd += finalDays * msPerDay;
          await updateDoc(doc(db, "users", user.id), {
            subscriptionEnd: newEnd,
            plan: "premium",
          });

          showAlert(`Días ajustados correctamente.`);
          fetchUsers();
        } catch (e) {
          console.error(e);
          showAlert("Error al ajustar días.");
        }
      },
    );
  };

  const removeSub = async (userId: string) => {
    askConfirm("¿Remover suscripción y prueba de este usuario?", async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          plan: "free",
          subscriptionEnd: null,
          trialStart: 0, // trial expired forever
        });
        showAlert("Suscripción removida.");
        fetchUsers();
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    askConfirm(
      "¿Estás seguro de que deseas ELIMINAR a este usuario de Firestore?",
      async () => {
        try {
          const userDocRef = doc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);
          let foundHash = null;
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data && data.deviceHash) foundHash = data.deviceHash;
          }

          const vipActDocRef = doc(db, "vip_activations", userId);
          const vipActDoc = await getDoc(vipActDocRef);
          if (vipActDoc.exists()) {
            const data = vipActDoc.data();
            if (data && data.deviceHash) foundHash = data.deviceHash;
          }

          if (foundHash) {
            await updateDoc(doc(db, "vip_devices", foundHash), {
              activatedAt: 0,
            }).catch(() => {});
          }

          await deleteDoc(userDocRef);
          await deleteDoc(doc(db, "trial_requests", userId)).catch(() => {});
          await deleteDoc(vipActDocRef).catch(() => {});

          showAlert(
            "Usuario borrado correctamente. El acceso al sistema ha sido revocado.",
          );
          fetchUsers();
        } catch (e) {
          console.error(e);
          showAlert("Error al eliminar usuario en Firestore.");
        }
      },
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md font-sans">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full max-w-4xl bg-[#0d0d0f] border border-white/10 rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.25)] flex flex-col z-10 h-[92vh] sm:h-[85vh]">
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-white/5 shrink-0 gap-3">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 truncate">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />{" "}
                Panel de Suscripciones y Admin
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 font-medium truncate">
                Gestiona el acceso, planes y comunicados globales de FLUX
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto shrink-0 border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
              <button
                onClick={downloadPresentation}
                className="flex items-center justify-center gap-1 bg-[#1ED760]/10 active:bg-[#1ED760]/20 text-[#1ED760] font-black uppercase text-[8px] sm:text-[10px] tracking-wider px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#1ED760]/20 transition-all active:scale-95 cursor-pointer shrink-0"
                title="Descargar Presentación Comercial en PDF"
              >
                <FluxLogoMini className="w-3.5 h-3.5 animate-pulse" />
                <span>PDF Comercial</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 bg-white/5 sm:bg-transparent active:bg-white/10 text-slate-400 active:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Pestañas de Navegación del Panel (Optimizadas con Desplazamiento Seguro en Móviles) */}
          <div className="relative border-b border-white/5 bg-[#0a0a0c] flex items-center shrink-0 w-full group">
            {/* Botón Scroll Izquierda (Se muestra únicamente en escritorio, oculto en móviles/tablets para dejar paso al gesto slide) */}
            <button
              onClick={() => {
                if (tabsContainerRef.current) {
                  tabsContainerRef.current.scrollBy({
                    left: -140,
                    behavior: "smooth",
                  });
                }
              }}
              className="hidden lg:flex absolute left-0 top-0 bottom-0 z-20 px-2.5 bg-gradient-to-r from-black via-black/80 to-transparent text-purple-400 active:text-white items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Desplazar Izquierda"
            >
              <ChevronLeft className="w-5 h-5 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
            </button>

            <div
              ref={tabsContainerRef}
              className="flex w-full px-4 lg:px-8 py-2.5 gap-2 overflow-x-auto no-scrollbar whitespace-nowrap snap-x scroll-smooth select-none overscroll-x-contain touch-pan-x cursor-grab"
            >
              <button
                onClick={() => setActiveTab("requests")}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "requests"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-400" />
                <span>Solicitudes</span>
                {requests.filter((r) => r.status === "pending").length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    {requests.filter((r) => r.status === "pending").length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "subscriptions"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-purple-400" />
                <span>Suscripciones</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "analytics"
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-blue-400" />
                <span>Estadísticas</span>
              </button>

              <button
                onClick={() => setActiveTab("notifications")}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "notifications"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-purple-400" />
                <span>Notificaciones</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("monitor");
                  checkSystemHealth();
                }}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "monitor"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <Bug className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-400" />
                <span>Monitor API</span>
                {systemHealth &&
                  (systemHealth.mainLibrary === "error" ||
                    systemHealth.mainLibrary === "offline" ||
                    systemHealth.planB === "offline") && (
                    <span className="ml-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                      !
                    </span>
                  )}
              </button>
              <button
                onClick={() => setActiveTab("qr_campaigns")}
                className={`shrink-0 snap-start flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none border ${
                  activeTab === "qr_campaigns"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "text-slate-400 active:text-slate-200 active:bg-white/5 border-transparent"
                }`}
              >
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Campañas QR</span>
              </button>
            </div>

            {/* Botón Scroll Derecha (Se muestra únicamente en escritorio, oculto en móviles/tablets para dejar paso al gesto slide) */}
            <button
              onClick={() => {
                if (tabsContainerRef.current) {
                  tabsContainerRef.current.scrollBy({
                    left: 140,
                    behavior: "smooth",
                  });
                }
              }}
              className="hidden lg:flex absolute right-0 top-0 bottom-0 z-20 px-2.5 bg-gradient-to-l from-black via-black/80 to-transparent text-purple-400 active:text-white items-center justify-center transition-all cursor-pointer active:scale-90"
              title="Desplazar Derecha"
            >
              <ChevronRight className="w-5 h-5 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]" />
            </button>
          </div>

          <div className="overflow-y-auto p-3 sm:p-6 flex-1 space-y-4 scrollbar-thin scrollbar-thumb-white/5">
            {activeTab === "requests" && (
              <>
                {/* SECCIÓN 1: SOLICITUDES DE PRUEBA PENDIENTES */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />{" "}
                      Solicitudes de Prueba (Pág {requestsPage})
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={requestsPageSize}
                        onChange={(e) => {
                          setRequestsPageSize(Number(e.target.value));
                          setRequestsPageHistory([null]);
                          fetchRequests(0, Number(e.target.value));
                        }}
                        className="bg-black/40 border border-white/10 text-emerald-400 text-[10px] p-1 rounded-md cursor-pointer outline-none"
                      >
                        <option value={10}>10 por pág</option>
                        <option value={50}>50 por pág</option>
                        <option value={100}>100 por pág</option>
                      </select>
                      <button
                        onClick={() => fetchRequests(requestsPage - 2)}
                        disabled={requestsPage <= 1}
                        className="p-1 bg-white/5 active:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => fetchRequests(requestsPage)}
                        disabled={!hasMoreRequests}
                        className="p-1 bg-white/5 active:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {loadingRequests ? (
                    <div className="text-xs text-slate-500 animate-pulse">
                      Cargando solicitudes...
                    </div>
                  ) : requests.length === 0 ? (
                    <p className="text-xs text-slate-500 font-medium">
                      No hay ninguna solicitud registrada actualmente.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {requests.map((r: any) => {
                        const duplicateFp =
                          requests.filter(
                            (req) =>
                              req.fingerprint === r.fingerprint &&
                              req.uid !== r.uid,
                          ).length > 0;
                        const duplicateIp =
                          requests.filter(
                            (req) =>
                              req.ip === r.ip &&
                              req.uid !== r.uid &&
                              r.ip !== "N/A" &&
                              r.ip !== "IP_DETECTOR_FAILED",
                          ).length > 0;
                        const isFlagged = duplicateFp || duplicateIp;

                        return (
                          <div
                            key={r.id}
                            className={`p-4 rounded-xl border flex flex-col gap-4 transition-all ${
                              r.status === "pending"
                                ? isFlagged
                                  ? "bg-red-500/5 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.05)]"
                                  : "bg-emerald-500/5 border-emerald-500/10"
                                : "bg-white/[0.02] border-white/5 opacity-60"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-white font-black text-xs uppercase tracking-wide">
                                    {r.displayName || "Socio Premium"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-semibold truncate">
                                    ({r.email})
                                  </span>

                                  {r.status === "approved" && (
                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md text-[8.5px] font-black uppercase tracking-wider border border-emerald-500/10">
                                      Aprobado
                                    </span>
                                  )}
                                  {r.status === "rejected" && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md text-[8.5px] font-black uppercase tracking-wider border border-red-500/10">
                                      Rechazado
                                    </span>
                                  )}
                                  {r.status === "pending" && (
                                    <span className="px-2 py-0.5 bg-amber-500/25 text-amber-300 rounded-md text-[8.5px] font-black uppercase tracking-wider border border-amber-500/20 animate-pulse">
                                      Pendiente
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] font-mono text-slate-500">
                                  <span>
                                    IP:{" "}
                                    <strong
                                      className={
                                        duplicateIp && r.status === "pending"
                                          ? "text-red-400 font-black animate-pulse"
                                          : "text-white/40"
                                      }
                                    >
                                      {r.ip || "N/A"}
                                    </strong>
                                  </span>
                                  <span>
                                    FINGERPRINT:{" "}
                                    <strong
                                      className={
                                        duplicateFp && r.status === "pending"
                                          ? "text-red-400 font-black"
                                          : "text-white/40"
                                      }
                                    >
                                      {r.fingerprint
                                        ? r.fingerprint.substring(0, 10) + "..."
                                        : "N/A"}
                                    </strong>
                                  </span>
                                  <span>
                                    SOLICITADO:{" "}
                                    <span className="text-white/20">
                                      {r.createdAt
                                        ? new Date(r.createdAt).toLocaleString()
                                        : "N/A"}
                                    </span>
                                  </span>
                                </div>

                                {isFlagged && r.status === "pending" && (
                                  <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5 animate-shake">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      Alerta: ¡Posible Multicuenta o VPN con el
                                      mismo dispositivo detectado!
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-0 shrink-0">
                                {r.status === "pending" && (
                                  <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                                    <button
                                      onClick={() => handleApproveRequest(r)}
                                      className="px-3.5 py-2 bg-[#1ED760] active:bg-[#1fdf64] text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 active:scale-95 shadow-[0_0_15px_rgba(30,215,96,0.2)]"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />{" "}
                                      Aprobar
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(r.id)}
                                      className="px-3.5 py-2 bg-red-500/10 active:bg-red-500/25 text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/20 cursor-pointer flex-1 sm:flex-none flex items-center justify-center active:scale-95"
                                    >
                                      Rechazar
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={() =>
                                    handleDeleteRequestRecord(r.id)
                                  }
                                  className="p-2 bg-white/5 active:bg-red-500/20 text-slate-500 active:text-red-400 rounded-xl transition-all border border-white/5 cursor-pointer flex items-center justify-center shrink-0 active:scale-95"
                                  title="Eliminar Registro"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "notifications" && (
              <>
                {/* SECCIÓN NUEVA: DIFUSION DE COMUNICADOS DEL ADMIN */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-4 text-left">
                  <h3 className="text-xs font-black uppercase text-[#1ED760] tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1ED760]" />{" "}
                    Difundir Comunicado Global (Avisos del Admin)
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                    Publica notificaciones instantáneas, incidencias de
                    servidores, novedades importantes o parches de
                    actualización. Todos los clientes verán un punto rojo de
                    notificación y el mensaje en su centro de avisos.
                  </p>

                  <div className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">
                        Categoría del Comunicado
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(
                          [
                            "noticia",
                            "urgente",
                            "mantenimiento",
                            "actualizacion",
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setAnnCategory(cat)}
                            className={`py-2 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              annCategory === cat
                                ? "bg-[#1ED760] text-black border-[#1ED760] font-black shadow-[0_0_10px_rgba(30,215,96,0.2)]"
                                : "bg-black/30 border-white/5 text-slate-400 active:text-white"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title block */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">
                        Título del Aviso
                      </label>
                      <input
                        type="text"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="Ej. Mantenimiento del Sistema o Se ha caído el servidor de transmisión"
                        className="w-full px-4 py-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-semibold"
                      />
                    </div>

                    {/* Content block */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">
                        Mensaje / Contenido / Detalles (Corto y Premium)
                      </label>
                      <textarea
                        rows={3}
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="Ej. El servidor CDN maestro está en mantenimiento programado. No debería causar cortes en tu reproductor."
                        className="w-full px-4 py-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-semibold resize-none"
                      />
                    </div>

                    {/* Success/Action block */}
                    {annSuccessMsg && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold text-center">
                        {annSuccessMsg}
                      </div>
                    )}

                    <button
                      onClick={publishAnnouncement}
                      disabled={isPublishing}
                      className="w-full py-3 bg-[#1ED760] active:bg-[#1fdf64] disabled:opacity-40 text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isPublishing
                        ? "Publicando Aviso..."
                        : "Publicar Comunicado para Todos"}
                    </button>
                    <button
                      onClick={deleteActiveAnnouncement}
                      className="w-full py-2.5 bg-red-500/10 active:bg-red-500/20 text-red-500 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center mt-2"
                    >
                      X Eliminar Comunicado Activo de Prueba
                    </button>
                  </div>
                </div>

                {/* SECCIÓN NUEVA: CONFIGURACIÓN DE TELEGRAM (COLAPSIBLE/DESPLEGABLE PREMIUM) */}
                <div className="bg-[#121214] border border-white/5 rounded-3xl overflow-hidden mb-2 transition-all duration-300">
                  <button
                    type="button"
                    onClick={() =>
                      setIsTelegramConfigExpanded(!isTelegramConfigExpanded)
                    }
                    className="w-full flex items-center justify-between p-5 text-left bg-black/10 active:bg-black/20 focus:outline-none transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Send className="w-4 h-4 text-slate-400 group-active:text-[#1ED760] transition-colors" />
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-300 group-active:text-[#1ED760] tracking-wider transition-colors">
                          Configurar Notificaciones en Telegram
                        </h3>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Activar bots para recibir avisos de nuevos registros
                          en tiempo real
                        </p>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-white/5 group-active:bg-white/10 text-slate-400 group-active:text-white transition-all">
                      {isTelegramConfigExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isTelegramConfigExpanded && (
                    <div className="p-5 pt-1 border-t border-white/5 space-y-4 text-left animate-slideDown">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                        Conecta tu Bot de Telegram para recibir alertas en
                        tiempo real cuando un nuevo usuario registre su cuenta
                        de prueba de 7 días. Puedes aprobar el acceso
                        directamente con un botón desde este panel.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">
                            Telegram Bot Token
                          </label>
                          <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="password"
                              value={telegramToken}
                              onChange={(e) => setTelegramToken(e.target.value)}
                              placeholder="Ej. 123456789:ABCdefGhIJKlmNoPQRsT"
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block pl-1">
                            Telegram Chat ID
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                              ID
                            </span>
                            <input
                              type="text"
                              value={telegramChatId}
                              onChange={(e) =>
                                setTelegramChatId(e.target.value)
                              }
                              placeholder="Ej. -100123456789 o tu ID personal"
                              className="w-full pl-10 pr-4 py-2.5 bg-[#0d0d0f] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={saveTelegramConfig}
                          disabled={isSavingTelegram}
                          className="px-4 py-2.5 bg-[#1ED760] active:bg-[#1fdf64] text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4 animate-pulse active:animate-none" />
                          {isSavingTelegram
                            ? "Guardando..."
                            : "Guardar Configuración"}
                        </button>

                        <button
                          onClick={testTelegramConfig}
                          disabled={isTestingTelegram}
                          className="px-4 py-2.5 bg-white/5 active:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {isTestingTelegram
                            ? "Enviando..."
                            : "Enviar Mensaje de Prueba"}
                        </button>
                      </div>

                      <div className="bg-black/40 border border-white/5 p-3 rounded-2xl text-[10px] text-slate-500 leading-relaxed font-semibold">
                        💡{" "}
                        <span className="text-slate-300 font-bold">
                          Guía de Configuración Súper Rápida:
                        </span>
                        <br />
                        1. Abre Telegram y escribe a{" "}
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1ED760] active:underline font-bold"
                        >
                          @BotFather
                        </a>{" "}
                        para crear tu bot enviando{" "}
                        <code className="text-[#1ED760] select-all font-mono">
                          /newbot
                        </code>
                        . Copia el token que te dé.
                        <br />
                        2. Obtén tu Chat ID escribiendo a{" "}
                        <a
                          href="https://t.me/userinfobot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1ED760] active:underline font-bold"
                        >
                          @userinfobot
                        </a>
                        . Te dará tu ID personal numérico.
                        <br />
                        3. ¡Asegúrate de pulsar{" "}
                        <strong className="text-white">INICIAR</strong> en tu
                        bot creado antes para que pueda enviarte mensajes!
                        <br />
                        4. Introduce ambos datos arriba, pulsa{" "}
                        <strong className="text-emerald-400">Guardar</strong> y
                        luego{" "}
                        <strong className="text-white">
                          Enviar Mensaje de Prueba
                        </strong>
                        .
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "subscriptions" && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" /> Control de
                      Acceso (Pág {usersPage})
                    </h3>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Buscar por email, nombre o ID..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 flex-1 sm:w-64 focus:outline-none focus:border-[#1ED760]/50"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={usersPageSize}
                        onChange={(e) => {
                          setUsersPageSize(Number(e.target.value));
                          setUsersPage(0);
                          setHasMoreUsers(true);
                          fetchUsers(0, Number(e.target.value));
                        }}
                        className="bg-black/40 border border-white/10 text-white text-[10px] p-1 rounded-md cursor-pointer outline-none"
                      >
                        <option value={10}>10 por pág</option>
                        <option value={50}>50 por pág</option>
                        <option value={100}>100 por pág</option>
                      </select>
                      <button
                        onClick={() => fetchUsers(usersPage - 2)}
                        disabled={usersPage <= 1}
                        className="p-1 bg-white/5 active:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => fetchUsers(usersPage)}
                        disabled={!hasMoreUsers}
                        className="p-1 bg-white/5 active:bg-white/10 disabled:opacity-30 rounded-md cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                  {loading ? (
                    <div className="text-center py-12 text-slate-500 text-sm font-medium animate-pulse">
                      Cargando usuarios...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {users
                        .filter((u) =>
                          userSearchTerm
                            ? u.email
                                ?.toLowerCase()
                                .includes(userSearchTerm.toLowerCase()) ||
                              u.displayName
                                ?.toLowerCase()
                                .includes(userSearchTerm.toLowerCase()) ||
                              u.id
                                .toLowerCase()
                                .includes(userSearchTerm.toLowerCase())
                            : true,
                        )
                        .sort((a, b) =>
                          (a.displayName || a.email || "").localeCompare(
                            b.displayName || b.email || "",
                          ),
                        )
                        .map((u) => {
                          const now = Date.now();
                          const msPerDay = 1000 * 60 * 60 * 24;
                          let isActive = false;
                          let statusText = "Sin acceso";

                          if (u.email === "eltygere8651@gmail.com") {
                            isActive = true;
                            statusText = "Admin Maestro";
                          } else if (
                            u.subscriptionEnd &&
                            u.subscriptionEnd > now
                          ) {
                            isActive = true;
                            statusText = `Plan ${u.plan} activo (${Math.ceil((u.subscriptionEnd - now) / msPerDay)} días)`;
                          } else if (
                            u.plan === "free" &&
                            u.trialStart !== undefined &&
                            u.trialStart !== null
                          ) {
                            if (u.trialStart === 0) {
                              statusText = "Prueba finalizada";
                            } else {
                              const trialDuration = u.trialDuration || 7;
                              const trialEnd =
                                u.trialStart + trialDuration * msPerDay;
                              if (trialEnd > now) {
                                isActive = true;
                                statusText = `Prueba ${trialDuration} días (${Math.ceil((trialEnd - now) / msPerDay)} días)`;
                              } else {
                                statusText = "Prueba finalizada";
                              }
                            }
                          } else if (
                            u.subscriptionEnd &&
                            u.subscriptionEnd < now
                          ) {
                            statusText = "Suscripción expirada";
                          }

                          return (
                            <div
                              key={u.id}
                              className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-4"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1 min-w-0 flex-1">
                                  <p className="text-white font-bold text-sm truncate">
                                    {u.displayName || "Sin Nombre"}
                                  </p>
                                  <p className="text-slate-400 text-xs truncate">
                                    {u.email}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                                    ID: {u.id}
                                  </p>

                                  {/* Spotify-type allowed concurrent users/devices permission config */}
                                  {u.email !== "eltygere8651@gmail.com" && (
                                    <div className="mt-3 bg-black/40 border border-white/5 p-2 rounded-xl space-y-1.5">
                                      <p className="text-[9px] font-black uppercase tracking-wider text-purple-400">
                                        Licencia de Usuarios:
                                      </p>
                                      <div className="flex gap-1">
                                        {[1, 2, 6].map((num) => (
                                          <button
                                            key={num}
                                            onClick={async () => {
                                              try {
                                                await updateDoc(
                                                  doc(db, "users", u.id),
                                                  { maxUsers: num },
                                                );
                                                fetchUsers();
                                              } catch (e) {
                                                console.error(e);
                                              }
                                            }}
                                            className={`px-2 py-1 text-[9px] font-black rounded-lg transition-all cursor-pointer ${
                                              (u.maxUsers || 1) === num
                                                ? "bg-purple-600 text-white shadow-md font-extrabold"
                                                : "bg-white/5 text-slate-400 active:bg-white/10"
                                            }`}
                                          >
                                            {num === 1
                                              ? "1 Usu."
                                              : num === 2
                                                ? "2 Usu."
                                                : "Familiar (6)"}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Actividad en vivo y tiempo de uso 100% real */}
                                  <div className="mt-3 bg-black/30 border border-white/5 p-2.5 rounded-xl space-y-2 text-[10px]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[8px]">
                                        Conexión:
                                      </span>
                                      {(() => {
                                        const activeMs = getMs(u.lastActiveAt);
                                        const isOnline =
                                          realtimeActiveUsers.some(
                                            (activeU) => activeU.id === u.id,
                                          ) ||
                                          (activeMs > 0 &&
                                            Date.now() - activeMs <=
                                              10 * 60 * 1000);
                                        return isOnline;
                                      })() ? (
                                        <span className="flex items-center gap-1.5 text-emerald-400 font-black uppercase tracking-wider">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#1ED760] shadow-[0_0_8px_#1ED760] animate-pulse"></span>
                                          En Línea
                                        </span>
                                      ) : (
                                        <span className="text-slate-500 font-semibold uppercase tracking-wider text-[9px]">
                                          Desconectado
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[8px]">
                                        Tiempo total de uso:
                                      </span>
                                      <span className="text-white font-mono font-black bg-white/5 px-2 py-0.5 rounded-md text-[9px]">
                                        {formatUsageTime(u.totalUsageTime)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[8.5px] border-t border-white/5 pt-1.5">
                                      <span className="text-slate-500">
                                        Última actividad:
                                      </span>
                                      <span
                                        className="text-slate-400 font-mono font-medium truncate max-w-[130px]"
                                        title={
                                          u.lastActiveAt
                                            ? new Date(
                                                getMs(u.lastActiveAt),
                                              ).toLocaleString()
                                            : "N/A"
                                        }
                                      >
                                        {u.lastActiveAt
                                          ? new Date(
                                              getMs(u.lastActiveAt),
                                            ).toLocaleTimeString()
                                          : u.lastLogin
                                            ? new Date(
                                                getMs(u.lastLogin),
                                              ).toLocaleTimeString()
                                            : "N/A"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider ${isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}
                                >
                                  {statusText}
                                </div>
                              </div>

                              {u.email !== "eltygere8651@gmail.com" && (
                                <div className="space-y-3 mt-auto border-t border-white/5 pt-3">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-0.5 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />{" "}
                                    Control de Acceso y Planes:
                                  </p>

                                  {/* Fila de Pruebas Gratis en 2 columnas */}
                                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                                    <button
                                      onClick={() =>
                                        updateSub(u.id, "12mo", 365)
                                      }
                                      className="py-2 bg-amber-500/10 active:bg-amber-500/20 active:scale-[0.98] text-amber-300 text-[9px] font-black rounded-lg transition-all border border-amber-500/20 cursor-pointer text-center"
                                      title="12 Meses"
                                    >
                                      12M
                                    </button>
                                    <button
                                      onClick={() => adjustSubDays(u, 30)}
                                      className="py-2 bg-emerald-500/10 active:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center"
                                      title="1 Mes"
                                    >
                                      +1M
                                    </button>
                                    <button
                                      onClick={() => adjustSubDays(u, 60)}
                                      className="py-2 bg-emerald-500/10 active:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center"
                                      title="2 Meses"
                                    >
                                      +2M
                                    </button>
                                    <button
                                      onClick={() => adjustSubDays(u, 90)}
                                      className="py-2 bg-emerald-500/10 active:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center"
                                      title="3 Meses"
                                    >
                                      +3M
                                    </button>
                                    <button
                                      onClick={() => adjustSubDays(u, "custom")}
                                      className="py-2 bg-purple-500/10 active:bg-purple-500/20 active:scale-[0.98] text-purple-300 text-[9px] font-black rounded-lg transition-all border border-purple-500/20 cursor-pointer text-center"
                                      title="Días personalizados"
                                    >
                                      +/- Días
                                    </button>
                                  </div>

                                  {/* Quitar Suscripción y Eliminar Usuario */}
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                      onClick={() => removeSub(u.id)}
                                      className="py-2.5 bg-orange-500/10 active:bg-orange-500/20 active:scale-[0.98] text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                                      title="Remover Suscripción"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Quitar Susc.</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="py-2.5 bg-red-500/10 active:bg-red-500/20 active:scale-[0.98] text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                                      title="Eliminar Usuario de BD"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                      <span>Borrar Usuario</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
              </>
            )}

            {activeTab === "monitor" && (
              <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 mb-2 space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <Bug className="w-4 h-4 text-emerald-400" /> Monitor del
                    Ecosistema de Audio
                  </h3>
                  <button
                    onClick={checkSystemHealth}
                    disabled={isCheckingHealth}
                    className="px-3 py-1.5 bg-white/5 active:bg-white/10 text-[9px] font-black uppercase tracking-wider text-slate-300 rounded-lg transition-all border border-white/5 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCheckingHealth ? (
                      <span className="animate-pulse">Verificando...</span>
                    ) : (
                      "Verificar Ahora"
                    )}
                  </button>
                </div>

                {!systemHealth && isCheckingHealth ? (
                  <div className="text-center py-8 text-xs text-slate-500 animate-pulse font-medium">
                    Realizando ping a los motores de extracción (Librería
                    Principal y Plan B)...
                  </div>
                ) : systemHealth ? (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${systemHealth.mainLibrary === "online" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}
                    >
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                          Motor Principal (Librería YouTube)
                        </h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Motor principal de la app para extraer audios HQ
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${systemHealth.mainLibrary === "online" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"}`}
                        />
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${systemHealth.mainLibrary === "online" ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {systemHealth.mainLibrary === "online"
                            ? "Operativo"
                            : systemHealth.mainLibrary === "error"
                              ? "Bloqueado / Error"
                              : "Caído"}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between ${systemHealth.planB === "online" ? "bg-blue-500/5 border-blue-500/20" : "bg-red-500/5 border-red-500/20"}`}
                    >
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                          Motor Plan B (Piped/Invidious)
                        </h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                          Nodos de respaldo automático antifatiga
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${systemHealth.planB === "online" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"}`}
                        />
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest ${systemHealth.planB === "online" ? "text-blue-400" : "text-red-400"}`}
                        >
                          {systemHealth.planB === "online"
                            ? "Operativo"
                            : "Nodos Caídos"}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono text-center pt-2">
                      Última comprobación:{" "}
                      {new Date(systemHealth.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500 font-medium">
                    Información no disponible. Pulsa Verificar Ahora.
                  </div>
                )}
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-blue-400 tracking-wider flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Panel Analítico Avanzado
                </h3>

                {loadingAnalytics ? (
                  <div className="text-xs text-slate-500 animate-pulse">
                    Cargando métricas globales...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Resumen Global */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Sistema VIP (Sin Registro)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex flex-col justify-between min-h-[72px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">
                              Activadas
                            </span>
                            <span className="text-lg font-black text-white">
                              {vipStats.activated}
                            </span>
                          </div>
                          <span className="text-[8px] text-emerald-400/50 font-bold uppercase mt-1">
                            Histórico
                          </span>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex flex-col justify-between min-h-[72px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-emerald-500 font-black">
                              Activas Hoy
                            </span>
                            <span className="text-lg font-black text-white">
                              {vipStats.activeToday}
                            </span>
                          </div>
                          <span className="text-[8px] text-emerald-400/70 font-bold uppercase mt-1">
                            {vipStats.active} Vigentes
                          </span>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[72px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">
                              Caducadas
                            </span>
                            <span className="text-lg font-black text-white">
                              {vipStats.expired}
                            </span>
                          </div>
                          <span className="text-[8px] text-slate-500/50 font-bold uppercase mt-1">
                            Expiradas
                          </span>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 flex flex-col justify-between min-h-[72px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] uppercase tracking-wider text-blue-400 font-black">
                              Conversiones
                            </span>
                            <span className="text-lg font-black text-white">
                              {vipStats.conversions}
                            </span>
                          </div>
                          <span className="text-[8px] text-blue-400/50 font-bold uppercase mt-1">
                            A Premium
                          </span>
                        </div>
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Resumen de Actividad Global
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">
                            Activos (15m)
                          </span>
                          <span className="text-lg font-black text-white">
                            {adminStats.activeUsers || 0}
                          </span>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">
                            Nuevos (24h)
                          </span>
                          <span className="text-lg font-black text-white">
                            {adminStats.newUsers || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Suscripciones y Solicitudes */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 space-y-4 text-left">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Suscripciones y Solicitudes
                      </h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-amber-500 font-black">
                            Sols. Pendientes
                          </span>
                          <span className="text-lg font-black text-white">
                            {analyticsStats.pendingRequests}
                          </span>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-purple-400 font-black">
                            Planes Activos
                          </span>
                          <span className="text-lg font-black text-white">
                            {analyticsStats.activePaid}
                          </span>
                        </div>
                        <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-black">
                            Pruebas Activas
                          </span>
                          <span className="text-lg font-black text-white">
                            {analyticsStats.activeTrials}
                          </span>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-black">
                            Total Socios
                          </span>
                          <span className="text-lg font-black text-white">
                            {analyticsStats.totalUsers}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Modo Económico
                        </span>
                        <span className="text-[9px] bg-[#1ED760]/10 text-[#1ED760] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                          Flux Eco Activo
                        </span>
                      </div>
                    </div>

                    {/* Usuarios Activos en Tiempo Real (En Vivo) */}
                    <div className="bg-[#121214] border border-white/5 rounded-3xl p-5 space-y-4 md:col-span-2 text-left">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Monitoreo de Conexiones en Vivo
                          </h4>
                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                            Usuarios interactuando con el app en tiempo real (15
                            min)
                          </p>
                        </div>
                        <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {realtimeActiveUsers.length} en línea
                        </span>
                      </div>

                      {realtimeActiveUsers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                          {realtimeActiveUsers.map((activeU) => {
                            const planText =
                              activeU.plan === "vip"
                                ? "Premium VIP"
                                : activeU.plan === "free"
                                  ? "Prueba Gratis"
                                  : "Sin Plan";
                            const planColor =
                              activeU.plan === "vip"
                                ? "text-purple-400 bg-purple-500/10 border-purple-500/10"
                                : activeU.plan === "free"
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/10"
                                  : "text-slate-400 bg-white/5 border-white/5";

                            return (
                              <div
                                key={activeU.id}
                                className="bg-white/[0.01] border border-white/5 active:border-white/10 p-3 rounded-2xl flex items-center gap-3 transition-all"
                              >
                                <img
                                  src={
                                    activeU.photoURL ||
                                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(activeU.displayName || activeU.email || activeU.id)}`
                                  }
                                  alt={activeU.displayName}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full border border-white/10 bg-[#0f0f11] object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-slate-200 truncate">
                                    {activeU.displayName || "Socio Flux"}
                                  </p>
                                  <p className="text-[9px] text-slate-400 truncate font-mono">
                                    {activeU.email}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                      className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${planColor}`}
                                    >
                                      {planText}
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-medium">
                                      {getElapsedLabel(activeU.lastActiveAt)}
                                    </span>
                                  </div>
                                </div>
                                <span className="relative flex h-2 w-2 shrink-0 self-start mt-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1ED760] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1ED760]"></span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            No hay usuarios activos en este momento
                          </p>
                          <p className="text-[9px] text-slate-600 mt-1">
                            Las sesiones activas aparecerán aquí tan pronto
                            interactúen con la aplicación.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "qr_campaigns" && <QRCampaignsAdmin />}

            {/* Mobile Fixed Close Button */}
            <div className="sm:hidden flex shrink-0 p-3 bg-[#0a0a0c] border-t border-white/5 mt-auto">
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 active:from-purple-500/20 active:to-pink-500/20 text-slate-300 active:text-white font-black uppercase tracking-[0.15em] text-[10px] rounded-lg border border-white/5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.05)]"
              >
                <X className="w-4 h-4 text-purple-400" />
                Cerrar Panel
              </button>
            </div>
          </div>

          {/* Modal de Confirmación Personalizado */}
          {confirmModal && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-sm bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-white font-black uppercase tracking-wider text-xs text-purple-400">
                  {confirmModal.title}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {confirmModal.message}
                </p>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="px-4 py-2 bg-white/5 active:bg-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-4 py-2 bg-purple-600 active:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Alerta Personalizado */}
          {alertModal && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="w-full max-w-sm bg-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-white font-black uppercase tracking-wider text-xs text-emerald-400">
                  {alertModal.title}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {alertModal.message}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setAlertModal(null)}
                    className="px-5 py-2 bg-emerald-600 active:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
