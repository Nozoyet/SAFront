import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

export default function PensumDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pensum, setPensum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materiasPensum, setMateriasPensum] = useState([]);
  const [toggling, setToggling] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/pensum/${id}`).then((res) => {
      setPensum(res.data.data);
      setMateriasPensum(res.data.data.materias || []);
      setLoading(false);
    }).catch(() => navigate("/admin/pensum"));
  }, [id]);

  const toggleEstado = async () => {
    setToggling(true);
    setFeedback("");
    try {
      const nuevoEstado = pensum.estado ? 0 : 1;
      const res = await api.put(`/pensum/${id}`, { estado: nuevoEstado });
      setPensum(res.data.data);
      setFeedback(`Pensum ${nuevoEstado ? "activado" : "desactivado"} correctamente`);
    } catch (err) {
      setFeedback(err.response?.data?.message || "Error al actualizar estado");
    } finally {
      setToggling(false);
      setTimeout(() => setFeedback(""), 3000);
    }
  };

  const preReqNombre = (idPrereq) => {
    if (!idPrereq) return "—";
    const m = materiasPensum.find((x) => x.id === idPrereq);
    return m ? `${m.codigo} — ${m.nombre}` : "—";
  };

  const dependientes = (materiaId) => {
    return materiasPensum.filter((m) => m.idPrerequisito === materiaId);
  };

  const semsDisponibles = [...new Set(materiasPensum.map((m) => m.semestre).filter(Boolean))].sort((a, b) => a - b);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
      <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
      <p style={{ margin: 0 }}>Cargando detalle del pensum...</p>
    </div>
  );
  if (!pensum) return null;

  const creditosReales = materiasPensum.reduce((s, m) => s + (m.creditos || 0), 0);
  

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate('/admin/pensum')}
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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Lista Pensum</span>
        </div>
      </header>
      <main style={styles.contentContainer}>
        <div style={styles.contentHeader}>
          <div>
            <h1 style={styles.title}>{pensum?.carrera?.nombre || "Pensum"}</h1>
            <p style={styles.subtitle}>Plan de estudios</p>
          </div>
          <div style={styles.contentActions}>
            <button onClick={() => navigate(`/admin/pensum/${id}/arbol`)} style={styles.btnOutline}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M12 3v18M3 12h18" /></svg>
              Ver diagrama
            </button>
          </div>
        </div>

        {feedback && (
          <div style={{ padding: "0.65rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.85rem", fontWeight: 500, background: feedback.includes("Error") ? "#fef2f2" : "#ecfdf5", border: `1px solid ${feedback.includes("Error") ? "#fecaca" : "#a7f3d0"}`, color: feedback.includes("Error") ? "#dc2626" : "#065f46" }}>
            {feedback}
          </div>
        )}

        <div style={styles.infoCard}>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Año</span>
              <span style={styles.infoVal}>{pensum.anioCreacion}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Materias</span>
              <span style={styles.infoVal}>{materiasPensum.length}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Semestres</span>
              <span style={styles.infoVal}>{semsDisponibles.length > 0 ? `1 - ${Math.max(...semsDisponibles)}` : "—"}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Estado</span>
              <span style={{ ...styles.infoVal, color: pensum.estado ? "#16a34a" : "#dc2626", fontWeight: 600, marginRight: 8 }}>
                {pensum.estado ? "Activo" : "Inactivo"}
              </span>
              <button onClick={toggleEstado} disabled={toggling} style={{
                marginTop: 4, padding: "0.25rem 0.75rem", fontSize: "0.72rem", fontWeight: 600,
                background: pensum.estado ? "#fef2f2" : "#ecfdf5",
                color: pensum.estado ? "#dc2626" : "#065f46",
                border: `1.5px solid ${pensum.estado ? "#fecaca" : "#a7f3d0"}`,
                borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                opacity: toggling ? 0.6 : 1,
              }}>
                {toggling ? "..." : pensum.estado ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
          
        </div>

        <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "#0f172a", margin: "0 0 1rem" }}>Materias del pensum</h2>

        {materiasPensum.length === 0 ? (
          <div style={styles.empty}>
            <p>Este pensum no tiene materias registradas.</p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Código</th>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Semestre</th>
                  <th style={styles.th}>Créditos</th>
                  <th style={styles.th}>Prerrequisito</th>
                  <th style={styles.th}>Dependientes</th>
                  <th style={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {materiasPensum.map((m) => {
                  const deps = dependientes(m.id);
                  return (
                    <tr key={m.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 600, fontSize: "0.8rem" }}>{m.codigo}</td>
                      <td style={{ ...styles.td, fontWeight: 500 }}>{m.nombre}</td>
                      <td style={styles.td}>
                        {m.semestre ? (
                          <span style={{ ...styles.badgeSem, background: "#e0f2fe", color: "#0369a1" }}>Sem {m.semestre}</span>
                        ) : "—"}
                      </td>
                      <td style={styles.td}>{m.creditos}</td>
                      <td style={styles.td}>
                        {m.idPrerequisito ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "#fef3c7", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{preReqNombre(m.idPrerequisito)}</span>
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Ninguno</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {deps.length > 0 ? (
                          <span style={{ ...styles.badgeSem, background: "#f0fdfa", color: "#0d9488" }}>
                            {deps.length} materia{deps.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>—</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: m.estado ? "#dcfce7" : "#fef2f2", color: m.estado ? "#16a34a" : "#dc2626" }}>
                          {m.estado ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


      </main>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" },
  contentContainer: { maxWidth: 1100, margin: "0 auto", padding: "2rem 2.5rem" },
  loader: { textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "1rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
  contentHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "0.75rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.85rem", color: "#64748b", margin: "0.3rem 0 0" },
  contentActions: { display: "flex", gap: 8 },
  btnOutline: {
    padding: "0.4rem 0.85rem", background: "white", color: "#1e293b", border: "1.5px solid #e2e8f0",
    borderRadius: 6, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer",
  },
  tableWrap: { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" },
  th: {
    textAlign: "left", padding: "0.65rem 0.85rem", background: "#f8fafc", color: "#64748b",
    fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em",
    borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.55rem 0.85rem", color: "#1e293b" },
  badge: { padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 },
  badgeSem: { padding: "0.1rem 0.45rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 },
  empty: { textAlign: "center", padding: "3rem", color: "#64748b", background: "white", borderRadius: 12, border: "1px solid #e2e8f0" },
  infoCard: { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: "1.25rem", marginBottom: "1.5rem" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" },
  infoItem: { display: "flex", flexDirection: "column", gap: "0.15rem" },
  infoLabel: { fontSize: "0.72rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" },
  infoVal: { fontSize: "0.95rem", color: "#1e293b", fontWeight: 500 },
};
