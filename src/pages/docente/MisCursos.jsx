import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { docenteService } from "../../services/docenteService";

import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0f9ff", 
  surface: "#ffffff", 
  border: "#e0f2fe", 
  borderMid: "#bae6fd",
  accent: "#0369a1", 
  accentDim: "#e0f2fe", 
  green: "#059669", 
  amber: "#d97706",
  red: "#dc2626", 
  gray: "#64748b", 
  grayDim: "#f1f5f9",
  text: "#0f172a", 
  textSub: "#475569", 
  textMuted: "#94a3b8",
};

const diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

function Tag({ children, color = C.accent }) {
  return (
    <span style={{ 
      background: color + "18", 
      color, 
      border: `1px solid ${color}33`,
      borderRadius: 999, 
      padding: "4px 12px", 
      fontSize: 12, 
      fontWeight: 600, 
      whiteSpace: "nowrap" 
    }}>
      {children}
    </span>
  );
}

export default function MisCursos() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");

  useEffect(() => {
    setLoading(true);
    docenteService.obtenerCursos()
      .then(r => setCursos(r.data || []))
      .catch(err => setError(err.response?.data?.message || "Error al cargar cursos"))
      .finally(() => setLoading(false));
  }, []);

  const periodos = [...new Set(cursos.map(c => c.periodo?.codigo).filter(Boolean))];

  const filtrados = cursos.filter(c => {
    if (periodoFiltro !== "todos" && c.periodo?.codigo !== periodoFiltro) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return c.materia?.nombre?.toLowerCase().includes(b) ||
             c.materia?.codigo?.toLowerCase().includes(b) ||
             c.codigoGrupo?.toLowerCase().includes(b);
    }
    return true;
  });

  const totalEstudiantes = cursos.reduce((s, c) => s + (c.cupoActual || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Estilos dinámicos para interactividad y efectos hover */}
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
        .input-control {
          flex: 1;
          min-width: 260px;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          color: ${C.text};
          transition: border-color 0.15s;
        }
        .input-control:focus {
          border-color: ${C.accent};
        }
        .select-control {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: ${C.textSub};
          outline: none;
          background: white;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .select-control:focus {
          border-color: ${C.accent};
        }
        .btn-calificar {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1.5px solid ${C.accent};
          background: ${C.accent};
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .btn-calificar:hover {
          background: #025a8b;
          border-color: #025a8b;
        }
        .btn-reporte {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: white;
          color: ${C.textSub};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .btn-reporte:hover {
          border-color: ${C.accent};
          color: ${C.accent};
          background: #fafafa;
        }
      `}</style>

      {/* Header con tamaño aumentado */}
      <header style={{ 
        background: "white", 
        borderBottom: "1px solid #e2e8f0", 
        padding: "1.25rem 2.5rem", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        position: "sticky", 
        top: 0, 
        zIndex: 10 
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button onClick={() => navigate("/docente/bienvenida")} className="btn-volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>
        </div>
        <span style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.01em", color: C.text }}>
          Mis Cursos Asignados
        </span>
      </header>

      {/* Franja de Datos Estadísticos Ampliada */}
      <div style={{ 
        width: "100%", 
        background: "#ffffff", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        gap: "4rem", 
        padding: "1.1rem 2rem", 
        boxSizing: "border-box", 
        flexWrap: "wrap" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Cursos totales</span>
          <span style={{ fontSize: "1.05rem", color: C.accent, fontWeight: 700 }}>{cursos.length}</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#dbe3ee" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Estudiantes totales</span>
          <span style={{ fontSize: "1.05rem", color: C.green, fontWeight: 700 }}>{totalEstudiantes}</span>
        </div>
        <div style={{ width: 1, height: 22, background: "#dbe3ee" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Periodos activos</span>
          <span style={{ fontSize: "1.05rem", color: C.amber, fontWeight: 700 }}>{periodos.length}</span>
        </div>
      </div>

      {/* Contenido principal con mayor anchura y espaciado */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Barra de Filtros */}
        <div style={{ 
          background: "white", 
          border: "1px solid #e2e8f0", 
          borderRadius: 16, 
          padding: "16px 20px", 
          display: "flex", 
          gap: 16, 
          flexWrap: "wrap", 
          alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <input 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
            placeholder="Buscar por materia, código o grupo…"
            className="input-control" 
          />
          {periodos.length > 0 && (
            <select 
              value={periodoFiltro} 
              onChange={e => setPeriodoFiltro(e.target.value)}
              className="select-control"
            >
              <option value="todos">Todos los periodos</option>
              {periodos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>

        {/* Estados de Carga y Mensajes */}
        {loading ? (
  <Loading 
    texto="Cargando asignaciones académicas…" 
    color={C.accent || "#0284c7"} // Usa C.accent si tienes esa paleta en MisCursos, si no, usa el azul por defecto
    size={36} 
  />
) : error ? (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: 12, padding: "16px 20px", color: "#991b1b", fontSize: 14 }}>{error}</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: C.textMuted }}>
            <i className="bi bi-inbox" style={{ fontSize: 48, marginBottom: 16, display: "block" }}></i>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "1.05rem" }}>No se encontraron cursos coincidentes</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {filtrados.map(curso => (
              <div key={curso.id} style={{ 
                background: "white", 
                border: "1.5px solid #e2e8f0", 
                borderRadius: 16, 
                overflow: "hidden", 
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                borderTop: `5px solid ${C.accent}` 
              }}>
                <div style={{ padding: "24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                    
                    {/* Indicador de Semestre */}
                    <div style={{ 
                      width: 52, 
                      height: 52, 
                      borderRadius: 14, 
                      background: C.accentDim, 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      flexShrink: 0 
                    }}>
                      <span style={{ fontSize: 19, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{curso.materia?.semestre || "—"}</span>
                      <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 700 }}>SEM</span>
                    </div>

                    {/* Detalles de la materia */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{curso.materia?.nombre}</span>
                        <Tag color={C.accent}>Grupo {curso.codigoGrupo}</Tag>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Tag color={C.textMuted}>{curso.materia?.codigo}</Tag>
                        <Tag color={C.textSub}>{curso.materia?.creditos} créditos</Tag>
                        {curso.periodo && <Tag color={C.textMuted}>{curso.periodo.codigo}</Tag>}
                      </div>
                    </div>

                    {/* Contador de Alumnos */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{curso.cupoActual}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase" }}>/{curso.cupoMaximo} Alumnos</div>
                    </div>
                  </div>

                  {/* Horarios con mayor visibilidad */}
                  <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                    {curso.horarios?.sort((a, b) => diasOrden.indexOf(a.diaSemana) - diasOrden.indexOf(b.diaSemana)).map((h, i) => (
                      <span key={i} style={{ fontSize: 12, color: C.accent, background: C.accentDim, borderRadius: 8, padding: "6px 12px", fontWeight: 500 }}>
                        <i className="bi bi-clock" style={{ marginRight: 5 }}></i>
                        {h.diaSemana.slice(0, 3)} {h.horaInicio}–{h.horaFin} · Aula {h.aula}
                      </span>
                    ))}
                  </div>

                  {/* Botones de acción unificados y equilibrados */}
                  <div style={{ 
                    borderTop: "1px solid #e2e8f0", 
                    marginTop: 20, 
                    paddingTop: 18, 
                    display: "flex", 
                    justifyContent: "flex-end", 
                    gap: 12 
                  }}>
                    <button 
                      onClick={() => navigate(`/docente/reportes/curso/${curso.id}`)}
                      className="btn-reporte"
                    >
                      <i className="bi bi-bar-chart-fill" style={{ marginRight: 6 }}></i> Generar Reporte
                    </button>
                    <button 
                      onClick={() => navigate(`/docente/cursos/${curso.id}/estudiantes`)}
                      className="btn-calificar"
                    >
                      <i className="bi bi-pencil-fill" style={{ marginRight: 6 }}></i> Ingresar Calificaciones
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}