import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import { getUsuarios, eliminarUsuario, impersonarUsuario } from "../../services/api";
import FormCrearUsuario from "../../components/forms/FormCrearUsuario";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

const ROLES = ["Estudiante", "Docente", "Administrador"];

const ROL_CONFIG = {
  Administrador: { color: "#7C3AED", bg: "#EDE9FE" },
  Docente: { color: "#0369A1", bg: "#E0F2FE" },
  Estudiante: { color: "#047857", bg: "#D1FAE5" },
};

function Avatar({ nombre, apellido }) {
  const initials = `${nombre?.[0] ?? ""}${apellido?.[0] ?? ""}`.toUpperCase();
  const colors = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#14B8A6"];
  const color = colors[(nombre?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      backgroundColor: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5,
    }}>
      {initials || "?"}
    </div>
  );
}

export default function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [notif, setNotif] = useState(null);

  const impersonate = useAuthStore((s) => s.impersonate);

  useEffect(() => { cargarUsuarios(); }, []);
  useEffect(() => { setPagina(1); }, [busqueda, filtroRol]);

  const cargarUsuarios = async () => {
    setCargando(true); setError("");
    try { const r = await getUsuarios(); setUsuarios(r.data); }
    catch { setError("No se pudieron cargar los usuarios. Verifica tu conexión."); }
    finally { setCargando(false); }
  };

  const RUTAS_BIENVENIDA = {
  Docente: "/docente/bienvenida",
  Estudiante: "/estudiante/bienvenida",
};

const handleImpersonar = async (u) => {
  try {
    const res = await impersonarUsuario(u.id);
    const { token, user } = res.data;
    impersonate(token, user);
    navigate(RUTAS_BIENVENIDA[user.rol] || "/", { replace: true });
  } catch (e) {
    console.error("Error real de impersonación:", e);
    mostrarNotif(e.response?.data?.message || "No se pudo iniciar la suplantación.", "error");
  }
};
  const mostrarNotif = (msg, tipo = "ok") => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3000);
  };

  const handleCreado = (u) => {
    setUsuarios(p => [...p, u]);
    setMostrarForm(false);
    mostrarNotif(`Usuario ${u.nombreUsuario} creado correctamente.`);
  };

  const handleEliminar = async (id) => {
    try {
      await eliminarUsuario(id);
      setUsuarios(p => p.filter(u => u.id !== id));
      mostrarNotif("Usuario eliminado del sistema.");
    } catch (e) {
      mostrarNotif(e.response?.data?.message || "Error al eliminar.", "error");
    } finally { setConfirmId(null); }
  };

  const filtrados = usuarios.filter(u => {
    const t = busqueda.toLowerCase();
    const matchBusq = !t || [u.nombre1, u.apellidoP, u.email, u.nombreUsuario, u.rol]
      .some(v => v?.toLowerCase().includes(t));
    const matchRol = filtroRol === "Todos" || u.rol === filtroRol;
    return matchBusq && matchRol;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
const paginaSegura = Math.min(pagina, totalPaginas);
const inicio = (paginaSegura - 1) * porPagina;
const paginados = filtrados.slice(inicio, inicio + porPagina);

  const conteo = (rol) => usuarios.filter(u => u.rol === rol).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8FAFC", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate('/admin/bienvenida')}
            style={styles.backBtn}
            onMouseOver={(e) => { e.currentTarget.style.background = '#5b21b6' }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#7c3aed' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>
        <div style={styles.headerBrand}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill={ADMIN_CONFIG.color} fillOpacity=".12" />
            <path d="M12 34L24 14L36 34H12Z" stroke={ADMIN_CONFIG.color} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
            <circle cx="24" cy="24" r="3.5" fill={ADMIN_CONFIG.color} fillOpacity=".7" />
          </svg>
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Gestion Cursos</span>
        </div>
      </header>

      {/* Notificación */}
      {notif && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          backgroundColor: notif.tipo === "error" ? "#FEF2F2" : "#F0FDF4",
          color: notif.tipo === "error" ? "#DC2626" : "#16A34A",
          border: `1px solid ${notif.tipo === "error" ? "#FECACA" : "#BBF7D0"}`,
          padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)", animation: "slideIn 0.3s ease",
        }}>
          {notif.tipo === "error"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, display: "inline", verticalAlign: "middle", marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, display: "inline", verticalAlign: "middle", marginRight: 4 }}><polyline points="20 6 9 17 4 12" /></svg>}
          {notif.msg}
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4, margin: "0 0 4px" }}>
                Panel de Administración
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0F172A", margin: "0 0 4px", letterSpacing: -0.5 }}>
                Gestión de Usuarios
              </h1>
              <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>
                {usuarios.length} usuarios registrados en el sistema
              </p>
            </div>
            <button
              onClick={() => setMostrarForm(true)}
              style={{
                backgroundColor: "#6366F1", color: "#fff", border: "none",
                padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#4F46E5"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "#6366F1"}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nuevo usuario
            </button>
          </div>

          {/* Tarjetas resumen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
            {[
              { label: "Total", valor: usuarios.length, color: "#6366F1" },
              { label: "Administradores", valor: conteo("Administrador"), color: "#7C3AED" },
              { label: "Docentes", valor: conteo("Docente"), color: "#0369A1" },
              { label: "Estudiantes", valor: conteo("Estudiante"), color: "#047857" },
            ].map(({ label, valor, color }) => (
              <div key={label} style={{
                backgroundColor: "#fff", border: "1px solid #E2E8F0",
                borderRadius: 12, padding: "14px 18px",
                borderLeft: `4px solid ${color}`,
              }}>
                <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 4px" }}>{label}</p>
                <p style={{ fontSize: 26, fontWeight: 800, color, margin: 0 }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          backgroundColor: "#fff", border: "1px solid #E2E8F0",
          borderRadius: 12, padding: "14px 18px", marginBottom: 14,
          display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
        }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", display: "flex" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, email o usuario..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 34px",
                border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13,
                outline: "none", backgroundColor: "#F8FAFC", boxSizing: "border-box", color: "#0F172A",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Todos", ...ROLES].map(r => (
              <button key={r} onClick={() => setFiltroRol(r)} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: "1px solid", cursor: "pointer",
                backgroundColor: filtroRol === r ? "#6366F1" : "#fff",
                borderColor: filtroRol === r ? "#6366F1" : "#E2E8F0",
                color: filtroRol === r ? "#fff" : "#64748B",
              }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "12px 16px", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg> {error}
          </div>
        )}

        {/* Tabla */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
          {cargando ? (
            <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>
              <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
              <p style={{ margin: 0 }}>Cargando usuarios...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" style={{ margin: "0 0 8px" }}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#64748B" }}>No se encontraron usuarios</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#94A3B8" }}>Prueba con otros términos de búsqueda</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  {["Usuario", "Nombre de usuario", "Correo electrónico", "Rol", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 700, color: "#64748B", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginados.map((u, i) => (
                  <tr key={u.id}
                    style={{ borderBottom: i < paginados.length - 1 ? "1px solid #F1F5F9" : "none" }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = "#FAFBFF"}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar nombre={u.nombre1} apellido={u.apellidoP} />
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>
                          {u.nombre1} {u.nombre2 || ""} {u.apellidoP} {u.apellidoM || ""}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <code style={{ backgroundColor: "#F1F5F9", padding: "2px 8px", borderRadius: 5, fontSize: 12, color: "#475569" }}>
                        {u.nombreUsuario}
                      </code>
                    </td>
                    <td style={{ padding: "13px 16px", color: "#475569" }}>{u.email}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{
                        backgroundColor: ROL_CONFIG[u.rol]?.bg ?? "#F3F4F6",
                        color: ROL_CONFIG[u.rol]?.color ?? "#6B7280",
                        border: `1px solid ${ROL_CONFIG[u.rol]?.color ?? "#6B7280"}44`,
                        borderRadius: 20, padding: "4px 10px",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {u.rol}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <button
                        onClick={() => setConfirmId(u.id)}
                        style={{
                          backgroundColor: "#FEF2F2", color: "#DC2626",
                          border: "1px solid #FECACA", borderRadius: 7,
                          padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                        onMouseOver={e => { e.currentTarget.style.backgroundColor = "#DC2626"; e.currentTarget.style.color = "#fff"; }}
                        onMouseOut={e => { e.currentTarget.style.backgroundColor = "#FEF2F2"; e.currentTarget.style.color = "#DC2626"; }}
                      >
                        Eliminar
                      </button>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
  <div style={{ display: "flex", gap: 6 }}>
    {u.rol !== "Administrador" && (
      <button
        onClick={() => handleImpersonar(u)}
        title="Entrar como este usuario"
        style={{
          backgroundColor: "#EEF2FF", color: "#4F46E5",
          border: "1px solid #C7D2FE", borderRadius: 7,
          padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}
      >
        Entrar como
      </button>
    )}
    
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!cargando && filtrados.length > 0 && (
  <div style={{
    padding: "10px 16px", backgroundColor: "#F8FAFC", borderTop: "1px solid #F1F5F9",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    flexWrap: "wrap", gap: 10,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#94A3B8" }}>
      <span>
        Mostrando {inicio + 1}–{Math.min(inicio + porPagina, filtrados.length)} de {filtrados.length}
      </span>
      <select
        value={porPagina}
        onChange={(e) => { setPorPagina(Number(e.target.value)); setPagina(1); }}
        style={{
          border: "1px solid #E2E8F0", borderRadius: 6, padding: "3px 6px",
          fontSize: 12, color: "#475569", background: "#fff", cursor: "pointer", outline: "none",
        }}
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>{n} por página</option>
        ))}
      </select>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <button
        onClick={() => setPagina((p) => Math.max(1, p - 1))}
        disabled={paginaSegura === 1}
        style={{
          padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0",
          background: "#fff", color: paginaSegura === 1 ? "#CBD5E1" : "#475569",
          fontSize: 12, fontWeight: 600, cursor: paginaSegura === 1 ? "not-allowed" : "pointer",
        }}
      >
        ‹ Anterior
      </button>
      <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600, padding: "0 4px" }}>
        Página {paginaSegura} de {totalPaginas}
      </span>
      <button
        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        disabled={paginaSegura === totalPaginas}
        style={{
          padding: "5px 10px", borderRadius: 6, border: "1px solid #E2E8F0",
          background: "#fff", color: paginaSegura === totalPaginas ? "#CBD5E1" : "#475569",
          fontSize: 12, fontWeight: 600, cursor: paginaSegura === totalPaginas ? "not-allowed" : "pointer",
        }}
      >
        Siguiente ›
      </button>
    </div>
  </div>
)}
        </div>
      </div>

      {/* Modal Crear */}
      {mostrarForm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
            <FormCrearUsuario onUsuarioCreado={handleCreado} onCancelar={() => setMostrarForm(false)} />
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmId && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 52, height: 52, backgroundColor: "#FEF2F2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>¿Eliminar usuario?</h3>
            <p style={{ color: "#64748B", fontSize: 13, margin: "0 0 24px" }}>
              Esta acción desactivará al usuario. No podrá iniciar sesión en el sistema.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmId(null)} style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0",
                backgroundColor: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmId)} style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                backgroundColor: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } } @keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } } .spin { display:inline-block; animation:spin 1s linear infinite; }`}</style>
    </div>
  );
}

const styles = {
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
};