import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import { detenerImpersonacion } from "../services/api";
import { getNoLeidasCount } from "../services/notificationService";
import Loading from "../components/common/Loading";
import ConfirmModal from "../components/common/ConfirmModal";

const ROL_CONFIG = {
  Administrador: {
    color: "#7c3aed",
    bg: "#faf5ff",
    accent: "#ede9fe",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z" />
        <path d="M20 21v-1a6 6 0 0 0-6-6H10a6 6 0 0 0-6 6v1" />
        <path d="M16 11h6M19 8v6" />
      </svg>
    ),
    greeting: "Panel de Administración",
    desc: "Gestiona carreras, cursos, usuarios y toda la configuración del sistema académico.",
    links: [
      {
        label: "Gestionar Oferta Académica",
        icon: "ph ph-books",
        // Estructura interna para habilitar el despliegue dinámico
        subLinks: [
          { label: "Crear Oferta Académica", href: "/admin/cursos/gestion", icon: "ph ph-gear" },
          { label: "Consultar Oferta Académica", href: "/admin/cursos/consulta", icon: "ph ph-magnifying-glass" }
        ]
      },
      { label: "Gestionar Usuarios", href: "/admin/GestionarUsuarios", icon: "ph ph-users" },
      {
        label: "Ver Reportes",
        icon: "ph ph-chart-bar",
        subLinks: [
          { label: "Generar Reportes por Carrera", href: "/admin/reportes", icon: "ph ph-file-text" },
          { label: "Generar Reportes de Estudiantes", href: "/admin/reportes/estudiantes", icon: "ph ph-student" },
          { label: "Generar Reportes de Docentes", href: "/admin/reportes/docentes", icon: "ph ph-chalkboard-teacher" }
        ]
      },
      { label: "Gestionar Carreras y Pensums", href: "/admin/pensum", icon: "ph ph-folders" },
      { label: "Gestionar Perfil", href: "/admin/perfil", icon: "ph ph-user" },
    ],
  },
  Docente: {
    color: "#0369a1",
    bg: "#f0f9ff",
    accent: "#e0f2fe",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    greeting: "Portal Docente",
    desc: "Consulta tus cursos asignados, registra calificaciones y gestiona horarios.",
    links: [
      { label: "Ver mis Cursos", href: "/docente/cursos", icon: "ph ph-chalkboard-teacher" },
      { label: "Generar Reportes", href: "/docente/reportes", icon: "ph ph-chart-bar" },
      { label: "Mi Perfil", href: "/docente/perfil", icon: "ph ph-user" },
    ],
  },
  Estudiante: {
    color: "#0d9488",
    bg: "#f0fdfa",
    accent: "#ccfbf1",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    greeting: "Portal Estudiantil",
    desc: "Consulta cursos disponibles, tus inscripciones y el progreso en tu carrera.",
    links: [
      { label: "Mis Cursos", href: "/estudiante/inscripciones", icon: "ph ph-notebook" },
      { label: "Registrar Nueva Materia", href: "/estudiante/cursos", icon: "ph ph-book-bookmark" },
      { label: "Generar Reportes", href: "/estudiante/reportes", icon: "ph ph-chart-bar" },
      { label: "Mi Perfil", href: "/estudiante/perfil", icon: "ph ph-user" },
    ],
  },
};

export default function Bienvenida() {
  const navigate = useNavigate();
  const { user, logout, isImpersonating, stopImpersonating } = useAuthStore();

  // Estado para alternar menús desplegables (almacena el índice del menú abierto, o null)
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const [confirmando, setConfirmando] = useState(false);
  // Notificaciones
  const [noLeidas, setNoLeidas] = useState(0);
  const prevCountRef = useRef(0);
  const [newNotifCount, setNewNotifCount] = useState(0);


  const fetchNoLeidas = useCallback(async () => {
    try {
      const res = await getNoLeidasCount();
      const count = res.data.data.count;
      const prev = prevCountRef.current;

      if (count > prev) {
        setNewNotifCount(count - prev);
        setTimeout(() => setNewNotifCount(0), 4000);
      }

      prevCountRef.current = count;
      setNoLeidas(count);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNoLeidas();
    const interval = setInterval(fetchNoLeidas, 30000);
    return () => clearInterval(interval);
  }, [fetchNoLeidas]);

  const config = ROL_CONFIG[user?.rol] || ROL_CONFIG.Estudiante;
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const handleLogout = async () => {
  if (isImpersonating) {
    try { await detenerImpersonacion(); } catch (_) {}
    stopImpersonating();
    setConfirmando(false);
    navigate("/admin/GestionarUsuarios", { replace: true });
    return;
  }
  await logout();
  navigate("/login", { replace: true });
};

  return (
    <div style={{ ...styles.root, background: config.bg }}>
      <style>{`
        @keyframes notifPop {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerBrand}>
          <i className="ph ph-student" style={{ fontSize: "32px", color: config.color }} />
          <span style={{ ...styles.headerTitle, color: config.color }}>Sistema Académico</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.rol !== "Administrador" && (
            <button
              onClick={() => {
                setNewNotifCount(0);
                const rutas = {
                  Administrador: "/admin/notificaciones",
                  Docente: "/docente/notificaciones",
                  Estudiante: "/estudiante/notificaciones",
                };
                navigate(rutas[user?.rol] || "/notificaciones");
              }}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#475569",
              }}
              title="Notificaciones"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {newNotifCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: -4,
                    right: -10,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#16a34a",
                    background: "#dcfce7",
                    borderRadius: 8,
                    padding: "0 5px",
                    lineHeight: "16px",
                    animation: "notifPop 0.4s ease-out",
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  +{newNotifCount}
                </span>
              )}
              {noLeidas > 0 && (
                <span
                  className="badge rounded-pill bg-danger"
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    fontSize: "0.6rem",
                    minWidth: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {noLeidas}
                </span>
              )}
            </button>
          )}
<button
  onClick={() => (isImpersonating ? setConfirmando(true) : handleLogout())}
  style={isImpersonating ? styles.returnBtn : styles.logoutBtn}
>
  {isImpersonating ? (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 14l-4-4 4-4" />
        <path d="M5 10h11a4 4 0 0 1 4 4v1" />
      </svg>
      Volver a mi cuenta
    </>
  ) : (
    <>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Cerrar sesión
    </>
  )}
</button>
        </div>
      </header>
      {/* Info strip */}
        <div style={styles.infoStrip}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Usuario</span>
            <span style={styles.infoVal}>{user?.username}</span>
          </div>
          <div style={styles.infoSep} />
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Correo</span>
            <span style={styles.infoVal}>{user?.email}</span>
          </div>
          <div style={styles.infoSep} />
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Rol</span>
            <span style={{ ...styles.infoVal, color: config.color, fontWeight: 600 }}>{user?.rol}</span>
          </div>
        </div>

      {/* Main content */}
      <main style={styles.main}>

        {/* Hero card */}
        <div style={{ ...styles.heroCard, borderTop: `4px solid ${config.color}` }}>
          <div style={{ ...styles.roleChip, background: config.accent, color: config.color }}>
            <span style={{ display: "flex" }}>{config.icon}</span>
            {user?.rol}
          </div>

          <h1 style={styles.heroTitle}>
            {saludo}, <span style={{ color: config.color }}>{user?.nombre || "usuario"}</span>
          </h1>
          <p style={styles.heroDesc}>{config.desc}</p>

          {/* Quick links */}
          <div style={styles.linksGrid}>
            {config.links.map((link, index) => {

              // Renderizado condicional si el botón posee sub-enlaces
              if (link.subLinks) {
                const isOpen = openMenuIndex === index;
                return (
                  <div key={index} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => setOpenMenuIndex(isOpen ? null : index)}
                      style={{ ...styles.linkCard, "--accent": config.color }}
                      onMouseOver={(e) => (e.currentTarget.style.borderColor = config.color)}
                      onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                    >
                      <i className={link.icon} style={styles.linkIcon}></i>
                      <span style={styles.linkLabel}>{link.label}</span>
                      {/* La flecha rota 90 grados si el menú está activo */}
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2.5"
                        style={{ marginLeft: "auto", flexShrink: 0, transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Sub-enlaces que aparecen únicamente al hacer clic */}
                    {isOpen && link.subLinks.map((subLink) => (
                      <button
                        key={subLink.href}
                        onClick={() => navigate(subLink.href)}
                        style={{ ...styles.linkCard, marginLeft: "1.5rem", width: "calc(100% - 1.5rem)", background: "#ffffff", borderColor: config.accent }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = config.color)}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = config.accent)}
                      >
                        <i className={subLink.icon} style={styles.linkIcon}></i>
                        <span style={{ ...styles.linkLabel, fontSize: "0.85rem" }}>{subLink.label}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2.5" style={{ marginLeft: "auto" }}>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                );
              }

              // Renderizado normal para enlaces estándar sin dependencias
              return (
                <button
                  key={`${link.href}-${link.label}`}
                  onClick={() => navigate(link.href)}
                  style={{ ...styles.linkCard, "--accent": config.color }}
                  onMouseOver={(e) => (e.currentTarget.style.borderColor = config.color)}
                  onMouseOut={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                >
                  <i className={link.icon} style={styles.linkIcon}></i>
                  <span style={styles.linkLabel}>{link.label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth="2.5" style={{ marginLeft: "auto", flexShrink: 0 }}>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
<ConfirmModal
  open={confirmando}
  title="Volver a mi cuenta"
  message={`Estás viendo el sistema como ${user?.nombre} (${user?.rol}). ¿Deseas salir de este modo y volver a tu cuenta de administrador?`}
  onConfirm={handleLogout}
  onCancel={() => setConfirmando(false)}
/>
      </main>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "0.45rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: "white",
    color: "#475569",
    fontSize: "0.84rem",
    fontWeight: 500,
    cursor: "pointer",
  }, main: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "1.25rem 1.5rem 2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  heroCard: {
    background: "white",
    borderRadius: 16,
    padding: "2rem 2rem 1.75rem",
    boxShadow: "0 2px 16px rgba(0, 0, 0, 0.31)",
  },
  roleChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "0.35rem 0.85rem",
    borderRadius: 999,
    fontSize: "0.82rem",
    fontWeight: 600,
    marginBottom: "1.25rem",
  },
  heroTitle: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: "0 0 0.6rem",
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  heroDesc: {
    fontSize: "0.92rem",
    color: "#64748b",
    margin: "0 0 1.75rem",
    lineHeight: 1.65,
  },
  linksGrid: { display: "flex", flexDirection: "column", gap: 10 },
  linkCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0.85rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    background: "#f8fafc",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color .15s, background .15s",
    width: "100%",
  }, linkIcon: {
  fontSize: "1.2rem",
  color: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
},
  linkLabel: { fontSize: "0.9rem", fontWeight: 500, color: "#1e293b" },
  infoStrip: {
    width: "100%",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "3rem",
    padding: "0.9rem 2rem",
    boxSizing: "border-box",
    flexWrap: "wrap",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: "0.78rem",
    color: "#64748b",
    fontWeight: 600,
  },
  infoVal: {
    fontSize: "0.88rem",
    color: "#0f172a",
    fontWeight: 500,
  },
  infoSep: {
    width: 1,
    height: 18,
    background: "#dbe3ee",
  },
  returnBtn: {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "0.45rem 1rem",
  border: "none",
  borderRadius: 8,
  background: "#0f172a",
  color: "white",
  fontSize: "0.84rem",
  fontWeight: 600,
  cursor: "pointer",
},
};