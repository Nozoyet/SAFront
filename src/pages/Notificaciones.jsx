import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from "../services/notificationService";
import useAuthStore from "../stores/useAuthStore";

const notificationSubject = {
  _observers: [],
  _state: { notifications: [], loading: true, error: null },

  subscribe(observer) {
    this._observers.push(observer);
    observer({ ...this._state });
    return () => {
      this._observers = this._observers.filter(fn => fn !== observer);
    };
  },

  _notify() {
    const snapshot = { ...this._state };
    this._observers.forEach(fn => fn(snapshot));
  },

  async fetchAll() {
    this._state = { ...this._state, loading: true, error: null };
    this._notify();
    try {
      const res = await getNotificaciones();
      this._state = { ...this._state, notifications: res.data.data, loading: false };
    } catch {
      this._state = { ...this._state, error: "Error al cargar notificaciones", loading: false };
    }
    this._notify();
  },

  async markOne(id) {
    try {
      await marcarLeida(id);
      this._state = {
        ...this._state,
        notifications: this._state.notifications.map(n =>
          n.id === id ? { ...n, estado: "Leida", leida: true } : n
        ),
      };
      this._notify();
    } catch { /* ignore */ }
  },

  async markAll() {
    try {
      await marcarTodasLeidas();
      this._state = {
        ...this._state,
        notifications: this._state.notifications.map(n => ({ ...n, estado: "Leida", leida: true })),
      };
      this._notify();
    } catch { /* ignore */ }
  },
};

const ROL_CONFIG = {
  Administrador: { color: "#7C3AED", bg: "#EDE9FE" },
  Docente:       { color: "#0369A1", bg: "#E0F2FE" },
  Estudiante:    { color: "#047857", bg: "#D1FAE5" },
};

const TIPO_CONFIG = {
  curso_asignado: {
    icon: "ph ph-chalkboard-teacher",
    bg: "#e0f2fe",
    color: "#0369a1",
    redirect: () => "/docente/cursos",
  },
  inscripcion_exitosa: {
    icon: "ph ph-check-circle",
    bg: "#d1fae5",
    color: "#065f46",
    redirect: () => "/estudiante/inscripciones",
  },
  calificacion_asignada: {
    icon: "ph ph-note-pencil",
    bg: "#fef3c7",
    color: "#92400e",
    redirect: () => "/estudiante/inscripciones",
  },
};

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const config = ROL_CONFIG[user?.rol] || ROL_CONFIG.Estudiante;
  const [state, setState] = useState(notificationSubject._state);

  useEffect(() => {
    const unsubscribe = notificationSubject.subscribe(setState);
    notificationSubject.fetchAll();
    return unsubscribe;
  }, []);

  const handleClick = async (notif) => {
    if (!notif.leida) await notificationSubject.markOne(notif.id);
    const cfg = TIPO_CONFIG[notif.tipo];
    if (cfg) {
      const ruta = typeof cfg.redirect === "function" ? cfg.redirect(user) : cfg.redirect;
      navigate(ruta);
    }
  };

  const handleMarcarTodas = () => notificationSubject.markAll();

  const handleVolver = () => {
    const rutas = {
      Administrador: "/admin/bienvenida",
      Docente: "/docente/bienvenida",
      Estudiante: "/estudiante/bienvenida",
    };
    navigate(rutas[user?.rol] || "/login");
  };

  const { notifications: notificaciones, loading, error } = state;
  const noLeidasCount = notificaciones.filter((n) => !n.leida).length;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spin {
            display: inline-block;
            animation: spin 1s linear infinite;
          }
        `}</style>
        <div style={{ fontSize: 36, marginBottom: 12, color: config.color }}>
          <i className="bi bi-hourglass-split spin"></i>
        </div>
        <p style={{ margin: 0 }}>Cargando notificaciones.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleVolver}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0.45rem 1rem",
              border: "none",
              borderRadius: 8,
              background: config.color,
              color: "white",
              fontSize: "0.84rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = config.color === "#7C3AED" ? "#5b21b6" : config.color === "#0369A1" ? "#075985" : "#065f46" }}
            onMouseOut={(e) => { e.currentTarget.style.background = config.color }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          {noLeidasCount > 0 && (
            <button
              onClick={handleMarcarTodas}
              style={{
                ...styles.actionBtn,
                background: "#f8fafc",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#e2e8f0" }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#f8fafc" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Marcar todas
            </button>
          )}
        </div>
        <div style={styles.headerBrand}>
          <i className="ph ph-student" style={{ fontSize: "32px", color: config.color }} />
          <span style={{ ...styles.headerTitle, color: config.color }}>Sistema Académico</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1.5rem" }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> {error}
          </div>
        )}

        {!error && notificaciones.length === 0 && (
          <div className="text-center py-5">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: "1rem" }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h5 style={{ color: "#64748b", fontWeight: 500 }}>No tienes notificaciones</h5>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Las notificaciones aparecerán aquí cuando tengas actividad nueva.</p>
          </div>
        )}

        <div className="list-group">
          {notificaciones.map((notif) => {
            const tipoCfg = TIPO_CONFIG[notif.tipo] || {
              icon: "ph ph-bell",
              bg: "#f1f5f9", color: "#475569",
            };

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className="list-group-item list-group-item-action d-flex gap-3 py-3 border-0"
                style={{
                  background: notif.leida ? "#ffffff" : "#f8fafc",
                  borderRadius: 0,
                  opacity: notif.leida ? 0.75 : 1,
                  cursor: "pointer",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: tipoCfg.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    flexShrink: 0,
                  }}
                >
                  <i className={tipoCfg.icon}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{notif.titulo}</strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {!notif.leida && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "#ef4444",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <small style={{ color: "#94a3b8", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                        {notif.fechaEnvio ? new Date(notif.fechaEnvio + "Z").toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : ""}
                      </small>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>
                    {notif.mensaje}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

const styles = {
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
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0.45rem 0.9rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: "0.82rem",
    fontWeight: 500,
    cursor: "pointer",
    color: "#475569",
    transition: "background .15s",
  },
};
