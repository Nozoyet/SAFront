import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { docenteService } from "../../services/docenteService";

import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0f9ff", surface: "#ffffff", border: "#e0f2fe", borderMid: "#bae6fd",
  accent: "#0369a1", accentDim: "#e0f2fe", green: "#059669", greenDim: "#d1fae5",
  amber: "#d97706", amberDim: "#fef3c7", red: "#dc2626", redDim: "#fee2e2",
  gray: "#64748b", grayDim: "#f1f5f9", text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
};

function NotaSlider({ value, onChange }) {
  const num = value !== "" ? Number(value) : null;
  const pct = num !== null ? Math.min(100, Math.max(0, num)) : 0;
  const color = num !== null ? (num >= 51 ? C.green : C.red) : C.textMuted;
  return (
    <div style={{ position: "relative", width: 170 }}>
      <div style={{ height: 7, background: C.grayDim, borderRadius: 999, marginBottom: 8, position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.red}, ${C.amber} 51%, ${C.green})`, borderRadius: 999, transition: "width .15s ease" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" min="0" max="100" step="0.5"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="—"
          style={{ width: 85, padding: "8px 10px", textAlign: "center", border: `2px solid ${color}`, borderRadius: 8, fontSize: 17, fontWeight: 700, color, outline: "none", background: color === C.textMuted ? "white" : color + "05" }} />
        {num !== null ? <i className={`bi ${num >= 51 ? "bi-check-lg" : "bi-x-lg"}`} style={{ fontSize: 20, color, fontWeight: 700, minWidth: 36 }}></i> : <span style={{ minWidth: 36 }}></span>}
      </div>
    </div>
  );
}

export default function CursoEstudiantes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notas, setNotas] = useState({});
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    setLoading(true);
    docenteService.obtenerEstudiantes(id)
      .then(r => {
        setCurso(r.curso);
        const estudiantes = r.data || [];
        setEstudiantes(estudiantes);
        const notasMap = {};
        estudiantes.forEach(e => {
          if (e.notaFinal !== null && e.notaFinal !== undefined) {
            notasMap[e.idInscripcion] = String(e.notaFinal);
          }
        });
        setNotas(notasMap);
      })
      .catch(err => setError(err.response?.data?.message || "Error al cargar estudiantes"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleNotaChange = (idInscripcion, value) => {
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setNotas(prev => ({ ...prev, [idInscripcion]: value }));
    }
  };

  const guardarTodas = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    const calificaciones = Object.entries(notas)
      .filter(([, nota]) => nota !== "" && nota !== undefined && nota !== null)
      .map(([idInscripcion, notaFinal]) => ({
        idInscripcion: Number(idInscripcion),
        notaFinal: Number(notaFinal),
      }));

    if (calificaciones.length === 0) {
      setError("Debes ingresar al menos una calificación");
      setSaving(false);
      return;
    }

    try {
      await docenteService.guardarCalificaciones(id, calificaciones);
      setSuccess("Calificaciones guardadas correctamente");
      cargarEstudiantes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar calificaciones");
    } finally {
      setSaving(false);
    }
  };

  const cargarEstudiantes = () => {
    docenteService.obtenerEstudiantes(id)
      .then(r => {
        setEstudiantes(r.data || []);
        const notasMap = {};
        (r.data || []).forEach(e => {
          if (e.notaFinal !== null && e.notaFinal !== undefined) {
            notasMap[e.idInscripcion] = String(e.notaFinal);
          }
        });
        setNotas(notasMap);
      })
      .catch(() => {});
  };

  const filtrarNotasValidas = () => Object.values(notas).filter(n => n !== "" && n !== undefined && n !== null).length;

  const filtrados = estudiantes.filter(e => {
    if (!busqueda) return true;
    const b = busqueda.toLowerCase();
    return e.nombre?.toLowerCase().includes(b) || e.matricula?.toLowerCase().includes(b);
  });

  const conNota = filtrarNotasValidas();
  const aprobados = Object.entries(notas).filter(([, n]) => n !== "" && n !== undefined && n !== null && Number(n) >= 51).length;
  const reprobados = conNota - aprobados;
  const sinNota = estudiantes.length - conNota;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        .btn-volver {
          background-color: ${C.accent};
          border: 1.5px solid ${C.accent};
          color: white;
          cursor: pointer;
          font-size: 0.9rem; /* Mantenido */
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
        .input-busqueda {
          flex: 1;
          min-width: 240px;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px; /* Aumentado */
          outline: none;
          color: ${C.text};
          transition: border-color 0.15s;
        }
        .input-busqueda:focus {
          border-color: ${C.accent};
        }
        .btn-guardar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 10px;
          border: none;
          background: ${C.accent};
          color: white;
          font-size: 15px; /* Aumentado */
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-guardar:hover:not(:disabled) {
          background: #025a8b;
          box-shadow: 0 2px 8px rgba(3, 105, 161, 0.25);
        }
      `}</style>

      {/* Header */}
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
          <button onClick={() => navigate("/docente/cursos")} className="btn-volver">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>
        </div>
        <span style={{ fontWeight: 700, fontSize: "1.2rem", letterSpacing: "-0.01em", color: C.text }}>
          {curso?.materia || "Curso"} — Grupo {curso?.codigoGrupo} {/* Mantenido */}
        </span>
      </header>

      {/* Franja de Datos Estadísticos Uniforme */}
      {!loading && (
        <div style={{ 
          width: "100%", 
          background: "#ffffff", 
          borderBottom: "1px solid #e2e8f0", 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          gap: "4rem", 
          padding: "1.2rem 2rem", 
          boxSizing: "border-box", 
          flexWrap: "wrap" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Alumnos Inscritos</span>
            <span style={{ fontSize: "1.15rem", color: C.accent, fontWeight: 700 }}>{estudiantes.length}</span>
          </div>
          <div style={{ width: 1, height: 24, background: "#dbe3ee" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Aprobados</span>
            <span style={{ fontSize: "1.15rem", color: C.green, fontWeight: 700 }}>{aprobados}</span>
          </div>
          <div style={{ width: 1, height: 24, background: "#dbe3ee" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "0.95rem", color: "#64748b", fontWeight: 600 }}>Reprobados</span>
            <span style={{ fontSize: "1.15rem", color: C.red, fontWeight: 700 }}>{reprobados}</span>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 3rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Alertas */}
        {error && (
          <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 12, padding: "14px 18px", color: C.red, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 18 }}></i> {error}
          </div>
        )}
        {success && (
          <div style={{ background: C.greenDim, border: `1px solid ${C.green}33`, borderRadius: 12, padding: "14px 18px", color: C.green, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: 18 }}></i> {success}
          </div>
        )}

        {loading ? (
  <Loading 
    texto="Cargando estudiantes asignados…" 
    color={C.accent} 
    size={36} 
  />
) : (
          <>
            {/* Barra de progreso de calificaciones */}
            {estudiantes.length > 0 && (
              <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: C.textSub, fontWeight: 600 }}>Progreso del Curso</span>
                  <span style={{ fontSize: 14, color: C.accent, fontWeight: 700 }}>{conNota} de {estudiantes.length} evaluados</span>
                </div>
                <div style={{ height: 12, background: C.grayDim, borderRadius: 999, overflow: "hidden", display: "flex" }}>
                  {aprobados > 0 && <div style={{ width: `${(aprobados / estudiantes.length) * 100}%`, background: C.green, transition: "width .3s" }} />}
                  {reprobados > 0 && <div style={{ width: `${(reprobados / estudiantes.length) * 100}%`, background: C.red, transition: "width .3s" }} />}
                  {sinNota > 0 && <div style={{ width: `${(sinNota / estudiantes.length) * 100}%`, background: C.gray, transition: "width .3s" }} />}
                </div>
                <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
                  <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}><i className="bi bi-circle-fill" style={{ fontSize: 7, marginRight: 6, verticalAlign: "middle" }}></i> {aprobados} aprobados</span>
                  <span style={{ fontSize: 12, color: C.red, fontWeight: 600 }}><i className="bi bi-circle-fill" style={{ fontSize: 7, marginRight: 6, verticalAlign: "middle" }}></i> {reprobados} reprobados</span>
                  <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}><i className="bi bi-circle-fill" style={{ fontSize: 7, marginRight: 6, verticalAlign: "middle" }}></i> {sinNota} pendientes</span>
                </div>
              </div>
            )}

            {/* Barra de herramientas y filtros */}
            <div style={{ 
              background: "white", 
              border: "1px solid #e2e8f0", 
              borderRadius: 16, 
              padding: "16px 22px", 
              display: "flex", 
              gap: 16, 
              flexWrap: "wrap", 
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <i className="bi bi-search" style={{ color: C.textMuted, fontSize: 16 }}></i>
              <input 
                value={busqueda} 
                onChange={e => setBusqueda(e.target.value)} 
                placeholder="Buscar estudiante por nombre o matrícula…"
                className="input-busqueda" 
              />
              <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />
              <button 
                onClick={guardarTodas} 
                disabled={saving}
                className="btn-guardar"
                style={{
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? "Guardando…" : <><i className="bi bi-floppy-fill"></i> Guardar calificaciones</>}
              </button>
            </div>

            {/* Ayuda Textual para el Usuario Principiante */}
            <div style={{ 
              background: "#f8fafc", 
              border: "1px dashed #cbd5e1", 
              borderRadius: 12, 
              padding: "14px 18px", 
              display: "flex", 
              alignItems: "flex-start", 
              gap: 12 
            }}>
              <i className="bi bi-info-circle-fill" style={{ color: C.accent, fontSize: 18, marginTop: 2 }}></i>
              <div style={{ fontSize: 14, color: C.textSub, lineHeight: "1.5" }}>
                <strong>Instrucciones de llenado:</strong> Use el campo numérico para asignar la nota de cada estudiante (rango de <strong>0 a 100</strong>). Los estudiantes con <strong>51 puntos o más</strong> se considerarán aprobados de manera automática. No olvide presionar el botón azul <strong>"Guardar calificaciones"</strong> arriba para registrar los cambios en el sistema.
              </div>
            </div>

            {/* Listado de Estudiantes */}
            {filtrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: C.textMuted }}>
                <i className="bi bi-inbox" style={{ fontSize: 48, display: "block", marginBottom: 14 }}></i>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "1.1rem" }}>No se encontraron registros coincidentes</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filtrados.map((est, idx) => {
                  const nota = notas[est.idInscripcion];
                  const notaNum = nota !== undefined && nota !== "" ? Number(nota) : null;
                  const estado = est.estadoNota || (notaNum !== null ? (notaNum >= 51 ? "Aprobado" : "Reprobado") : null);
                  const borderColor = notaNum !== null ? (notaNum >= 51 ? C.green : C.red) : "#e2e8f0";
                  
                  return (
                    <div key={est.idInscripcion} style={{ 
                      background: "white", 
                      border: `1.5px solid ${borderColor}`, 
                      borderRadius: 16, 
                      overflow: "hidden", 
                      boxShadow: "0 3px 12px rgba(0,0,0,0.03)",
                      transition: "border-color .15s" 
                    }}>
                      <div style={{ height: 4, background: notaNum !== null ? (notaNum >= 51 ? C.green : C.red) : "#f1f5f9" }} />
                      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                        
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: C.accent }}>{idx + 1}</span>
                        </div>

                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, color: C.text, letterSpacing: "-0.01em" }}>{est.nombre}</div>
                          <div style={{ fontSize: 14, color: C.textMuted, display: "flex", gap: 14, marginTop: 5 }}>
                            <span style={{ fontWeight: 500, color: C.textSub }}>{est.matricula || "—"}</span>
                            {est.email && <span>• {est.email}</span>}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", flexShrink: 0 }}>
                          <NotaSlider value={notas[est.idInscripcion] !== undefined ? notas[est.idInscripcion] : ""} onChange={v => handleNotaChange(est.idInscripcion, v)} />
                          
                          {estado && (
                            <span style={{
                              background: estado === "Aprobado" ? C.greenDim : estado === "Reprobado" ? C.redDim : C.grayDim,
                              color: estado === "Aprobado" ? C.green : estado === "Reprobado" ? C.red : C.textMuted,
                              borderRadius: 999, padding: "6px 16px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                            }}>{estado}</span>
                          )}
                          {est.estadoNota && (
                            <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", fontWeight: 500 }}>
                              <i className="bi bi-cloud-check-fill" style={{ marginRight: 4 }}></i> Guardado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}