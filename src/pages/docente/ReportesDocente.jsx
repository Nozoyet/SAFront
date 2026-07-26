import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { docenteService } from "../../services/docenteService";
import useAuthStore from "../../stores/useAuthStore";
import FiltrosReportes from "../../components/common/FiltrosReportes";
import ReportePreviewModal from "../../components/common/ReportePreviewModal";
import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0f9ff", surface: "#ffffff", border: "#e0f2fe", borderMid: "#bae6fd",
  accent: "#0369a1", accentDim: "#e0f2fe", green: "#059669", greenDim: "#d1fae5",
  amber: "#d97706", amberDim: "#fef3c7", red: "#dc2626", redDim: "#fee2e2",
  gray: "#64748b", grayDim: "#f1f5f9", text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
};

export default function ReportesDocente() {
  const navigate = useNavigate();
  const { cursoId: paramCursoId } = useParams();
  const { user, logout } = useAuthStore();
  const [filtros, setFiltros] = useState({ periodo_id: "", materia_id: "", curso_id: paramCursoId || "", condicion: "" });
  const [opciones, setOpciones] = useState({ periodos: [], materias: [], cursos: [] });
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const debounceRef = useRef(null);

  const cargarPreview = async (f) => {
    setLoading(true);
    setError("");
    try {
      const payload = {};
      if (f.periodo_id) payload.periodo_id = f.periodo_id;
      if (f.materia_id) payload.materia_id = f.materia_id;
      if (f.curso_id) payload.curso_id = f.curso_id;
      if (f.condicion) payload.estado = f.condicion;
      const r = await docenteService.reportePreview('calificaciones', payload);
      setReporte({ estudiantes: r.data });
    } catch (err) {
      setError(err.response?.data?.message || "Error al generar reporte");
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    docenteService.obtenerFiltrosReportes()
      .then(data => {
        setOpciones(data);
        if (paramCursoId) {
          const curso = data.cursos.find(c => Number(c.id) === Number(paramCursoId));
          if (curso) {
            setFiltros({
              periodo_id: String(curso.idPeriodoAcademico),
              materia_id: String(curso.idMateria),
              curso_id: String(curso.id),
              condicion: ""
            });
          }
        }
      })
      .catch(err => setError("Error al cargar filtros"));
  }, [paramCursoId]);

  useEffect(() => {
    if (opciones.cursos.length === 0) return;
    const tieneFiltro = filtros.periodo_id || filtros.materia_id || filtros.curso_id;
    if (!tieneFiltro) {
      setReporte(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => cargarPreview(filtros), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filtros, opciones.cursos.length]);

  const changeFiltros = (nuevos) => setFiltros(nuevos);

  const exportFiltros = () => {
    const p = {};
    if (filtros.periodo_id) p.periodo_id = filtros.periodo_id;
    if (filtros.materia_id) p.materia_id = filtros.materia_id;
    if (filtros.curso_id) p.curso_id = filtros.curso_id;
    if (filtros.condicion) p.estado = filtros.condicion;
    return p;
  };

  const abrirModal = (type) => {
    if (estudiantesFiltrados.length === 0) return;
    setModalType(type);
    setShowModal(true);
  };

  const confirmarDescarga = async () => {
    setShowModal(false);
    try {
      if (modalType === "pdf") {
        await docenteService.exportarPreviewPdf('calificaciones', exportFiltros());
      } else {
        await docenteService.exportarPreviewExcel('calificaciones', exportFiltros());
      }
    } catch (err) {
      setError("Error al descargar: " + (err.response?.data?.message || err.message));
    }
  };

  const estudiantesFiltrados = reporte?.estudiantes?.map(e => ({
    ...e,
    notaFinal: e.notaFinal,
    estado: e.estado,
  })) || [];

  const resumenFiltrado = {
    aprobados: estudiantesFiltrados.filter(e => e.estado === "Aprobado").length,
    reprobados: estudiantesFiltrados.filter(e => e.estado === "Reprobado").length,
    cursando: estudiantesFiltrados.filter(e => e.estado !== "Aprobado" && e.estado !== "Reprobado").length,
    promedio: estudiantesFiltrados.length > 0
      ? (estudiantesFiltrados.reduce((s, e) => s + (Number(e.notaFinal) || 0), 0) / estudiantesFiltrados.length)
      : 0,
  };

  const previewData = estudiantesFiltrados.map((e, idx) => ({ ...e, _idx: idx + 1 }));

  const columns = [
    { key: "_idx", label: "#", width: "40px", align: "center" },
    { key: "estudiante", label: "Estudiante" },
    { key: "materia", label: "Materia", render: (r) => r.materia || "—" },
    { key: "notaFinal", label: "Nota Final", align: "center", render: (r) => {
      const n = r.notaFinal !== null && r.notaFinal !== undefined ? Number(r.notaFinal) : null;
      return n !== null ? n.toFixed(1) : "—";
    }},
    { key: "estado", label: "Estado", align: "center" },
  ];

  const infoItems = [
    { label: "Total Alumnos", value: estudiantesFiltrados.length },
    { label: "Aprobados", value: resumenFiltrado.aprobados },
    { label: "Reprobados", value: resumenFiltrado.reprobados },
    { label: "Promedio General", value: resumenFiltrado.promedio ? resumenFiltrado.promedio.toFixed(1) : "—" },
  ];

  const stats = [
    { label: "Total", value: estudiantesFiltrados.length, bg: "#e0f2fe", text: "#0369a1" },
    { label: "Aprobados", value: resumenFiltrado.aprobados, bg: "#d1fae5", text: "#059669" },
    { label: "Reprobados", value: resumenFiltrado.reprobados, bg: "#fee2e2", text: "#dc2626" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        .btn-volver {
          background-color: ${C.accent};
          border: 1.5px solid ${C.accent};
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.55rem 1.25rem;
          border-radius: 8px;
          transition: all 0.15s ease-in-out;
        }
        .btn-volver:hover {
          background-color: #025a8b;
          border-color: #025a8b;
          transform: translateY(-1px);
        }
        .btn-logout {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0.55rem 1.25rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: ${C.textSub};
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-logout:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: ${C.text};
        }
        .btn-pdf {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-pdf:hover {
          background: #b91c1c;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }
        .btn-excel {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-excel:hover {
          background: #15803d;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
        }
        .fila-tabla {
          transition: all 0.15s ease;
        }
        .fila-tabla:hover {
          background-color: #f1f5f9 !important;
          transform: scale(1.002);
          box-shadow: inset 4px 0 0 ${C.accent};
        }
      `}</style>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2.5rem", background: "white", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/docente/bienvenida")} className="btn-volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>
          <div style={{ width: 1, height: 22, background: C.border }} />
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text }}>Reportes Docente</span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <i className="bi bi-box-arrow-right"></i> Cerrar sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem 1.5rem 3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Panel de Filtros */}
        <div style={{ background: "white", borderRadius: 16, padding: "2rem", boxShadow: "0 3px 12px rgba(0,0,0,0.03)", border: "1.5px solid #e2e8f0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.4rem 1rem", borderRadius: 999, fontSize: "0.85rem", fontWeight: 600, background: C.accentDim, color: C.accent, marginBottom: "1.25rem" }}>
            <i className="bi bi-bar-chart-fill" style={{ fontSize: 14 }}></i> Calificaciones
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: C.text, margin: "0 0 0.6rem", letterSpacing: "-0.02em" }}>
            Reporte de <span style={{ color: C.accent }}>Calificaciones</span>
          </h1>
          <p style={{ fontSize: "1rem", color: C.textSub, margin: "0 0 1.75rem", lineHeight: 1.6 }}>
            Consulta las calificaciones de tus cursos. Selecciona cualquier filtro para ver resultados al instante.
          </p>
          
          {error && (
            <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "14px 18px", color: C.red, fontSize: 15, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16 }}></i> {error}
            </div>
          )}

          <FiltrosReportes
            campos={["periodo", "materia", "curso", "condicion"]}
            opciones={opciones}
            filtros={filtros}
            onChange={changeFiltros}
            loading={loading}
            color={C.accent}
            titulo="Calificaciones"
            descripcion="Selecciona filtros para ver las calificaciones al instante"
            condicionOpciones={[
              { value: "Aprobado", label: "Aprobado" },
              { value: "Reprobado", label: "Reprobado" },
            ]}
          />
        </div>

        {/* Cargando */}
       {loading && (
  <Loading 
    texto="Procesando listado de estudiantes…" 
    color={C.accent} 
    size={36} 
  />
)}

        {/* Tabla de Resultados + Métricas */}
        {reporte && !loading && (
          <div style={{ background: "white", borderRadius: 16, padding: "2rem", boxShadow: "0 3px 12px rgba(0,0,0,0.03)", border: "1.5px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: `1px solid ${C.grayDim}` }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: C.text, margin: 0 }}>Resultados Encontrados</h2>
            </div>

            {/* Métricas con iconos limpios removidos */}
            <div style={{ 
              width: "100%", 
              background: "#f8fafc", 
              borderRadius: 12,
              border: "1px solid #e2e8f0", 
              display: "flex", 
              justifyContent: "space-around", 
              alignItems: "center", 
              padding: "1.2rem 1.5rem", 
              boxSizing: "border-box", 
              flexWrap: "wrap",
              gap: "1.5rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Total Alumnos:</span>
                <span style={{ fontSize: "1.2rem", color: C.accent, fontWeight: 800 }}>{estudiantesFiltrados.length}</span>
              </div>
              <div style={{ width: 1, height: 20, background: "#cbd5e1" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Promedio General:</span>
                <span style={{ fontSize: "1.2rem", color: C.text, fontWeight: 800 }}>{resumenFiltrado.promedio ? resumenFiltrado.promedio.toFixed(1) : "—"}</span>
              </div>
              <div style={{ width: 1, height: 20, background: "#cbd5e1" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Aprobados:</span>
                <span style={{ fontSize: "1.2rem", color: C.green, fontWeight: 800 }}>{resumenFiltrado.aprobados}</span>
              </div>
              <div style={{ width: 1, height: 20, background: "#cbd5e1" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Reprobados:</span>
                <span style={{ fontSize: "1.2rem", color: C.red, fontWeight: 800 }}>{resumenFiltrado.reprobados}</span>
              </div>
            </div>

            {/* Listado / Tabla */}
            <div style={{ overflowX: "auto", borderRadius: 12, border: "1.5px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.grayDim }}>
                    <th style={{ padding: "1.1rem 1.25rem", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid #e2e8f0` }}>#</th>
                    <th style={{ padding: "1.1rem 1.25rem", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid #e2e8f0` }}>Estudiante</th>
                    <th style={{ padding: "1.1rem 1.25rem", textAlign: "left", fontSize: "0.85rem", fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid #e2e8f0` }}>Materia</th>
                    <th style={{ padding: "1.1rem 1.25rem", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid #e2e8f0` }}>Nota Final</th>
                    <th style={{ padding: "1.1rem 1.25rem", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid #e2e8f0` }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesFiltrados.map((e, idx) => {
                    const esAprobado = e.estado === "Aprobado";
                    const esReprobado = e.estado === "Reprobado";
                    const estadoColor = esAprobado ? C.green : esReprobado ? C.red : C.amber;
                    
                    // Selección de icono dinámico para el estado
                    const estadoIcono = esAprobado 
                      ? "bi-check-circle-fill" 
                      : esReprobado 
                        ? "bi-x-circle-fill" 
                        : "bi-hourglass-split";

                    const notaNum = e.notaFinal !== null ? Number(e.notaFinal) : null;
                    
                    return (
                      <tr key={idx} className="fila-tabla" style={{ borderBottom: `1px solid #e2e8f0`, background: idx % 2 === 0 ? "#f8fafc" : "white" }}>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "0.95rem" }}>
                          <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: "50%", background: C.grayDim, alignItems: "center", justifyContent: "center", color: C.textSub, fontWeight: 700, fontSize: 13 }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "1rem", color: C.text, fontWeight: 600 }}>
                          {e.estudiante}
                        </td>
                        <td style={{ padding: "1rem 1.25rem", fontSize: "1rem", color: C.textSub }}>{e.materia || e.curso?.materia?.nombre || "—"}</td>
                        
                        {/* Nota Final completamente limpia */}
                        <td style={{ padding: "1rem 1.25rem", fontSize: "1.1rem", textAlign: "center", color: notaNum !== null ? (notaNum >= 51 ? C.green : C.red) : C.textMuted, fontWeight: 800 }}>
                          {notaNum !== null ? notaNum.toFixed(1) : "—"}
                        </td>
                        
                        {/* Estado con Badge e Iconos integrados */}
                        <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                          <span style={{ 
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: estadoColor + "14", 
                            color: estadoColor, 
                            borderRadius: 999, 
                            padding: "6px 16px", 
                            fontSize: 13, 
                            fontWeight: 700, 
                            whiteSpace: "nowrap" 
                          }}>
                            <i className={`bi ${estadoIcono}`} style={{ fontSize: 14 }}></i>
                            {e.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Botones de Descarga */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: "0.5rem" }}>
              <button onClick={() => abrirModal("pdf")} className="btn-pdf">
                <i className="bi bi-file-earmark-pdf-fill"></i> Descargar PDF
              </button>
              
              <button onClick={() => abrirModal("excel")} className="btn-excel">
                <i className="bi bi-file-earmark-excel-fill"></i> Descargar Excel
              </button>
            </div>
          </div>
        )}

        {/* Estados vacíos */}
        {!loading && !reporte && (filtros.periodo_id || filtros.materia_id || filtros.curso_id) && (
          <div style={{ background: "white", borderRadius: 16, padding: "4rem 2rem", boxShadow: "0 3px 12px rgba(0,0,0,0.03)", border: "1.5px solid #e2e8f0", textAlign: "center", color: C.textMuted }}>
            <i className="bi bi-inbox" style={{ fontSize: 44, display: "block", marginBottom: 14 }}></i>
            <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: 0 }}>No hay registros para los filtros seleccionados</p>
          </div>
        )}

        {!loading && !reporte && !filtros.periodo_id && !filtros.materia_id && !filtros.curso_id && (
          <div style={{ background: "white", borderRadius: 16, padding: "4rem 2rem", boxShadow: "0 3px 12px rgba(0,0,0,0.03)", border: "1.5px solid #e2e8f0", textAlign: "center", color: C.textMuted }}>
            <i className="bi bi-search" style={{ fontSize: 44, display: "block", marginBottom: 14 }}></i>
            <p style={{ fontWeight: 600, fontSize: "1.1rem", margin: 0 }}>Selecciona un filtro para ver las calificaciones en tiempo real</p>
          </div>
        )}
      </main>

      <ReportePreviewModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmarDescarga}
        title="Reporte de Calificaciones"
        tipo={modalType}
        data={previewData}
        columns={columns}
        infoItems={infoItems}
        stats={stats}
        color={C.accent}
      />
    </div>
  );
}