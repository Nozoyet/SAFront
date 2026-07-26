import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { estudianteService } from "../../services/estudianteService";
import useAuthStore from "../../stores/useAuthStore";
import ReportePreviewModal from "../../components/common/ReportePreviewModal";
import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0fdfa", surface: "#ffffff", border: "#ccfbf1", borderMid: "#99f6e4",
  accent: "#0d9488", accentDim: "#ccfbf1", green: "#059669", greenDim: "#d1fae5",
  amber: "#d97706", amberDim: "#fef3c7", red: "#dc2626", redDim: "#fee2e2",
  gray: "#64748b", grayDim: "#f1f5f9", text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
};

/* ── Hover ─────────────────────────────────────────────────────────────────── */
const hoverStyle = `
  .btn-hover { transition: filter 0.15s, box-shadow 0.15s; }
  .btn-hover:hover { filter: brightness(0.92); box-shadow: 0 3px 10px rgba(0,0,0,0.13); }
  .btn-hover:active { filter: brightness(0.85); }
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("reportes-style")) return;
    const tag = document.createElement("style");
    tag.id = "reportes-style";
    tag.textContent = hoverStyle;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, []);
  return null;
}

function Tag({ children, color = C.accent }) {
  return (
    <span style={{
      background: color + "18", color, border: `1px solid ${color}33`,
      borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

export default function ReportesEstudiante() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [semestreFiltro, setSemestreFiltro] = useState("todos");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");
  const [materiaFiltro, setMateriaFiltro] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  useEffect(() => { cargarReporte(); }, []);

  const cargarReporte = async () => {
    setLoading(true); setError("");
    try {
      const r = await estudianteService.obtenerReporte();
      setData(r);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cargar reporte");
    } finally {
      setLoading(false);
    }
  };

  const historial      = data?.historial || [];
  const resumen        = data?.resumen   || {};
  const estudianteData = data?.estudiante || {};

  const semestres = [...new Set(historial.map(h => h.materia?.semestre).filter(Boolean))].sort((a, b) => a - b);
  const periodos  = [...new Set(historial.map(h => h.periodo?.codigo).filter(Boolean))].sort().reverse();
  const materias  = [...new Map(historial.filter(h => h.materia?.id).map(h => [h.materia.id, { id: h.materia.id, nombre: h.materia.nombre, codigo: h.materia.codigo }])).values()].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const filtrados = historial.filter(h => {
    if (semestreFiltro !== "todos" && String(h.materia?.semestre) !== semestreFiltro) return false;
    if (estadoFiltro   !== "todos" && h.estado !== estadoFiltro) return false;
    if (periodoFiltro  !== "todos" && h.periodo?.codigo !== periodoFiltro) return false;
    if (materiaFiltro  !== "todos" && h.materia?.id !== Number(materiaFiltro)) return false;
    return true;
  });

  const abrirModal = (tipo) => { setModalType(tipo); setShowModal(true); };

  const confirmarDescarga = async () => {
    setShowModal(false);
    try {
      if (modalType === "pdf") await estudianteService.exportarPDF();
      else await estudianteService.exportarExcel();
    } finally { setModalType(""); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <StyleInjector />

      {/* Header — igual al de MisInscripciones */}
      <header style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <button
          className="btn-hover"
          onClick={() => navigate("/estudiante/bienvenida")}
          style={{ background: C.accent, border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, boxShadow: "0 2px 8px rgba(13,148,136,0.25)" }}
        >
          <i className="ph ph-arrow-left"></i>
          Volver
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text, marginLeft: "auto" }}>Mis Reportes</span>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>

        {error && (
          <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", color: C.red, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ph ph-warning"></i> {error}
          </div>
        )}

        {loading ? (
          <Loading texto="Cargando reporte académico…" color={C.accent} />
        ) : data ? (
          <>
            {/* Tarjeta del estudiante */}
            <div style={{ background: C.surface, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: `1.5px solid ${C.border}`, marginBottom: 20 }}>
              <div style={{ height: 4, background: C.accent }} />
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Tag color={C.accent}>
                    <i className="ph ph-graduation-cap" style={{ marginRight: 4 }}></i>
                    Reporte Académico
                  </Tag>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>
                  {estudianteData.nombre || user?.nombre1}
                </h1>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { label: "Matrícula", value: estudianteData.matricula || "—" },
                    { label: "Carrera",   value: estudianteData.carrera   || "—" },
                    { label: "Email",     value: estudianteData.email     || user?.email },
                  ].map(item => (
                    <span key={item.label} style={{ background: C.grayDim, padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.textSub }}>
                      <span style={{ fontWeight: 700, color: C.text }}>{item.label}:</span> {item.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats × 4 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Materias cursadas",   value: resumen.totalMaterias       || 0, color: C.accent },
                { label: "Aprobadas",           value: resumen.aprobadas           || 0, color: C.green  },
                { label: "Reprobadas",          value: resumen.reprobadas          || 0, color: C.red    },
                { label: "Créditos acumulados", value: resumen.creditosAcumulados  || 0, color: C.amber  },
              ].map(s => (
                <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Promedio + cursos activos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Promedio General",  value: resumen.promedioGeneral ? Number(resumen.promedioGeneral).toFixed(1) : "—" },
                { label: "Cursos en curso",   value: resumen.inscripcionesActivas || 0 },
              ].map(s => (
                <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px", textAlign: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 34, fontWeight: 800, color: C.accent }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Filtrar:</span>

              <select value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)}
                style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSub, outline: "none", background: "white" }}>
                <option value="todos">Todos los periodos</option>
                {periodos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select value={materiaFiltro} onChange={e => setMateriaFiltro(e.target.value)}
                style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSub, outline: "none", background: "white", minWidth: 180 }}>
                <option value="todos">Todas las materias</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>)}
              </select>

              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Estado:</span>
                {[["todos","Todos"],["Aprobado","Aprobados"],["Reprobado","Reprobados"]].map(([v, l]) => (
                  <button key={v} className="btn-hover" onClick={() => setEstadoFiltro(v)} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    background: estadoFiltro === v ? C.accent : "transparent",
                    color: estadoFiltro === v ? "white" : C.textMuted,
                    border: `1.5px solid ${estadoFiltro === v ? C.accent : C.border}`,
                  }}>{l}</button>
                ))}
              </div>

              {semestres.length > 0 && (
                <select value={semestreFiltro} onChange={e => setSemestreFiltro(e.target.value)}
                  style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSub, outline: "none", background: "white" }}>
                  <option value="todos">Todos los semestres</option>
                  {semestres.map(s => <option key={s} value={String(s)}>Semestre {s}</option>)}
                </select>
              )}
            </div>

            {/* Tabla historial */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.grayDim }}>
                    {["Código","Materia","Créd.","Nota","Estado","Periodo"].map((h, i) => (
                      <th key={h} style={{
                        padding: "12px 14px",
                        textAlign: i <= 1 ? "left" : "center",
                        fontSize: 11, fontWeight: 700, color: C.textSub,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        borderBottom: `2px solid ${C.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: "2.5rem", textAlign: "center", color: C.textMuted, fontSize: 14 }}>
                        <i className="ph ph-folder-open" style={{ fontSize: 28, display: "block", marginBottom: 8 }}></i>
                        No hay registros con los filtros seleccionados
                      </td>
                    </tr>
                  ) : filtrados.map((h, idx) => {
                    const estadoColor = h.estado === "Aprobado" ? C.green : h.estado === "Reprobado" ? C.red : C.amber;
                    const notaColor   = h.notaFinal !== null ? (h.notaFinal >= 51 ? C.green : C.red) : C.textMuted;
                    return (
                      <tr key={h.id} style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? "#f8fafc" : "white" }}>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: C.textSub }}>{h.materia?.codigo}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: C.text, fontWeight: 500 }}>{h.materia?.nombre}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, textAlign: "center", color: C.textSub }}>{h.materia?.creditos}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, textAlign: "center", fontWeight: 700, color: notaColor }}>
                          {h.notaFinal !== null ? Number(h.notaFinal).toFixed(1) : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <span style={{ background: estadoColor + "18", color: estadoColor, border: `1px solid ${estadoColor}33`, borderRadius: 999, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
                            {h.estado}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: 13, textAlign: "center", color: C.textSub }}>{h.periodo?.codigo || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botones de exportación */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                className="btn-hover"
                onClick={() => abrirModal("pdf")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: C.red, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                <i className="ph ph-file-pdf"></i>
                Descargar PDF
              </button>
              <button
                className="btn-hover"
                onClick={() => abrirModal("excel")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: C.green, color: "white", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                <i className="ph ph-file-xls"></i>
                Descargar Excel
              </button>
            </div>

            <ReportePreviewModal
              show={showModal}
              title="Reporte Académico"
              tipo={modalType}
              data={filtrados}
              color={C.accent}
              columns={[
                { key: "codigo",    label: "Código",  render: (r) => r.materia?.codigo },
                { key: "nombre",    label: "Materia", render: (r) => r.materia?.nombre },
                { key: "creditos",  label: "Créd.",   width: "10%", align: "center", render: (r) => r.materia?.creditos },
                { key: "notaFinal", label: "Nota",    width: "12%", align: "center", render: (r) => r.notaFinal !== null ? Number(r.notaFinal).toFixed(1) : "—" },
                { key: "estado",    label: "Estado",  width: "14%", align: "center", render: (r) => (
                  <span style={{
                    background: (r.estado === "Aprobado" ? C.green : r.estado === "Reprobado" ? C.red : C.amber) + "18",
                    color: r.estado === "Aprobado" ? C.green : r.estado === "Reprobado" ? C.red : C.amber,
                    borderRadius: 999, padding: "2px 12px", fontSize: 11, fontWeight: 600,
                  }}>{r.estado}</span>
                )},
                { key: "periodo", label: "Período", render: (r) => r.periodo?.codigo || "—" },
              ]}
              infoItems={[
                { label: "Estudiante", value: estudianteData.nombre || user?.nombre1 },
                { label: "Matrícula",  value: estudianteData.matricula || "—" },
                { label: "Carrera",    value: estudianteData.carrera   || "—" },
              ]}
              stats={[
                { label: "Aprobadas",  value: resumen.aprobadas          || 0, bg: C.greenDim, color: C.green  },
                { label: "Reprobadas", value: resumen.reprobadas         || 0, bg: C.redDim,   color: C.red    },
                { label: "Créditos",   value: resumen.creditosAcumulados || 0, bg: C.accentDim, color: C.accent },
              ]}
              footerExtra={
                <span><strong>Promedio General:</strong> {resumen.promedioGeneral ? Number(resumen.promedioGeneral).toFixed(1) : "—"}</span>
              }
              onClose={() => { setShowModal(false); setModalType(""); }}
              onConfirm={confirmarDescarga}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}