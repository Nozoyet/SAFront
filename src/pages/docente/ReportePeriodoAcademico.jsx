import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import useAuthStore from "../../stores/useAuthStore";
import ReportePreviewModal from "../../components/common/ReportePreviewModal";
import FiltrosReportes from "../../components/common/FiltrosReportes";

const C = {
  color: "#0369a1", bg: "#f0f9ff", accent: "#e0f2fe",
  text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
  border: "#e2e8f0",
};

export default function ReportePeriodoAcademico() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [filtros, setFiltros] = useState({ periodo_id: "", estado: "", fecha_inicio: "", fecha_fin: "" });
  const [opciones, setOpciones] = useState({ periodos: [], materias: [], cursos: [] });
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    api.get("/docente/reportes/filtros").then(r => {
      if (r.data?.success) setOpciones(r.data.data);
    }).catch(() => {});
  }, []);

  const change = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });
  const changeFiltros = (nuevos) => setFiltros(nuevos);

  const generarPreview = async () => {
    try {
      setLoading(true); setError("");
      const res = await api.get("/docente/reportes/periodo-academico/preview", { params: filtros });
      setPreview(res.data.data || []);
      setGenerado(true);
    } catch (err) {
      setError("Error: " + (err.response?.data?.message || err.message));
      setGenerado(false);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (tipo) => {
    if (preview.length === 0) return;
    setModalType(tipo);
    setShowModal(true);
  };

  const confirmarDescarga = async () => {
    setShowModal(false);
    try {
      const ext = modalType === "pdf" ? "pdf" : "xlsx";
      const params = new URLSearchParams(filtros).toString();
      const res = await api.get(`/docente/reportes/periodo-academico/${modalType}?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-periodo-academico.${ext}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Error al descargar: " + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const columns = preview.length > 0
    ? Object.keys(preview[0]).map((k) => ({ key: k, label: k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()), width: `${Math.floor(100 / Object.keys(preview[0]).length)}%` }))
    : [];

  const infoItems = [{ label: "Total Registros", value: preview.length }];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <header style={s.header}>
        <div style={s.headerBrand}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill={C.color} fillOpacity=".12" />
            <path d="M12 34L24 14L36 34H12Z" stroke={C.color} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
            <circle cx="24" cy="24" r="3.5" fill={C.color} fillOpacity=".7" />
          </svg>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: C.color }}>Sistema Académico</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/docente/bienvenida")} style={s.backBtn}>
            <i className="bi bi-arrow-left"></i> Volver
          </button>
          <button onClick={handleLogout} style={s.logoutBtn}>Cerrar sesión</button>
        </div>
      </header>

      <main style={s.main}>
        <div style={{ ...s.heroCard, borderTop: `4px solid ${C.color}` }}>
          <div style={{ ...s.chip, background: C.accent, color: C.color }}>
            <i className="bi bi-calendar-event-fill" style={{fontSize:14}}></i> Reporte de Periodo Académico
          </div>
          <h1 style={s.heroTitle}>Reporte de <span style={{ color: C.color }}>Periodo Académico</span></h1>
          <p style={s.heroDesc}>Consulta los periodos académicos filtrando por código, estado o fechas.</p>

          {error && <div style={s.errorBox}><i className="bi bi-exclamation-triangle-fill"></i> {error}</div>}

          <FiltrosReportes
            campos={["periodo", "estado", "fecha", "buscar"]}
            opciones={opciones}
            filtros={filtros}
            onChange={changeFiltros}
            onConsultar={generarPreview}
            loading={loading}
            color={C.color}
            estadoOpciones={[
              { value: "activo", label: "Activo" },
              { value: "finalizado", label: "Finalizado" },
            ]}
          />
        </div>

        {generado && preview.length > 0 && (
          <div style={s.resultsCard}>
            <div style={s.resultsHeader}>
              <h2 style={s.resultsTitle}>Previsualización del reporte</h2>
              <div style={s.statBadge}>
                <span style={s.statLabel}>Registros</span>
                <span style={{ ...s.statValue, color: C.color }}>{preview.length}</span>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} style={{ ...s.th, textAlign: "left", width: col.width }}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                      {columns.map((col) => (
                        <td key={col.key} style={{ ...s.td, textAlign: "left" }}>
                          {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.infoStrip}>
              <div><span style={s.infoLabel}>Usuario</span><p style={s.infoVal}>{user?.username || "Docente"}</p></div>
              <div style={s.infoSep} />
              <div><span style={s.infoLabel}>Correo</span><p style={s.infoVal}>{user?.email || "—"}</p></div>
              <div style={s.infoSep} />
              <div><span style={s.infoLabel}>Rol</span><p style={{ ...s.infoVal, color: C.color }}>{user?.rol || "Docente"}</p></div>
            </div>

            <div style={s.exportSection}>
              <button onClick={() => abrirModal("pdf")} style={{ ...s.exportBtn, background: "#dc2626" }}>
                <i className="bi bi-file-earmark-pdf-fill"></i> Descargar PDF
              </button>
              <button onClick={() => abrirModal("excel")} style={{ ...s.exportBtn, background: "#16a34a" }}>
                <i className="bi bi-file-earmark-excel-fill"></i> Descargar Excel
              </button>
            </div>
          </div>
        )}

        {generado && preview.length === 0 && (
          <div style={s.emptyCard}>
            <i className="bi bi-inbox" style={{fontSize:32,color:C.textMuted}}></i>
            <h3 style={s.emptyTitle}>Sin resultados</h3>
            <p style={s.emptyDesc}>No se encontraron periodos académicos con los filtros seleccionados.</p>
          </div>
        )}
      </main>

      <ReportePreviewModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmarDescarga}
        title="Reporte de Periodo Académico"
        tipo={modalType}
        data={preview}
        columns={columns}
        infoItems={infoItems}
      />
    </div>
  );
}

const s = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", color: "#475569", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  logoutBtn: { padding: "0.45rem 1rem", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "white", color: "#475569", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  main: { maxWidth: 1000, margin: "0 auto", padding: "3rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  heroCard: { background: "white", borderRadius: 16, padding: "2rem", boxShadow: "0 2px 16px rgba(0,0,0,.06)" },
  chip: { display: "inline-flex", gap: 8, padding: ".35rem .85rem", borderRadius: 999, fontWeight: 700, fontSize: ".82rem", marginBottom: "1.2rem" },
  heroTitle: { fontSize: "2rem", fontWeight: 700, color: "#0f172a", margin: "0 0 .6rem" },
  heroDesc: { color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" },
  errorBox: { display: "flex", alignItems: "center", gap: 10, padding: ".85rem 1rem", background: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 10, marginBottom: "1rem", fontSize: ".9rem" },
  resultsCard: { background: "white", borderRadius: 16, padding: "2rem", boxShadow: "0 2px 16px rgba(0,0,0,.06)" },
  resultsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" },
  resultsTitle: { fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 },
  statBadge: { padding: ".6rem 1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, textAlign: "center" },
  statLabel: { display: "block", fontSize: ".72rem", color: "#94a3b8", fontWeight: 700 },
  statValue: { display: "block", fontSize: "1.25rem", fontWeight: 800 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: ".85rem 1rem", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", fontSize: ".78rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".05em" },
  td: { padding: ".85rem 1rem", color: "#1e293b", fontSize: ".9rem" },
  infoStrip: { display: "flex", gap: 24, padding: "1rem 0", marginTop: "1rem", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" },
  infoLabel: { fontSize: ".72rem", color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" },
  infoVal: { margin: ".25rem 0 0", color: "#0f172a", fontWeight: 700 },
  infoSep: { width: 1, height: 28, background: "#cbd5e1", flexShrink: 0 },
  exportSection: { display: "flex", gap: 12, marginTop: "1rem" },
  exportBtn: { display: "flex", alignItems: "center", gap: 8, color: "white", border: "none", borderRadius: 10, padding: ".7rem 1.25rem", fontWeight: 700, cursor: "pointer", fontSize: ".9rem" },
  emptyCard: { background: "white", borderRadius: 16, padding: "2.5rem", textAlign: "center", boxShadow: "0 2px 16px rgba(0,0,0,.06)" },
  emptyTitle: { color: "#0f172a", marginBottom: ".5rem" },
  emptyDesc: { color: "#64748b", margin: 0 },
};
