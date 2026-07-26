import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0f9ff", surface: "#ffffff", card: "#ffffff", border: "#e0f2fe",
  borderMid: "#bae6fd", accent: "#0284c7", accentDim: "#e0f2fe",
  green: "#059669", greenDim: "#d1fae5", amber: "#d97706", amberDim: "#fef3c7",
  red: "#dc2626", redDim: "#fee2e2", gray: "#64748b", grayDim: "#f1f5f9",
  text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
};

const diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

/* ── Hover inyectado una sola vez ─────────────────────────────────────────── */
const hoverStyle = `
  .btn-hover { transition: filter 0.15s, box-shadow 0.15s; }
  .btn-hover:hover { filter: brightness(0.92); box-shadow: 0 3px 10px rgba(0,0,0,0.13); }
  .btn-hover:active { filter: brightness(0.85); }
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("cursos-disponibles-style")) return;
    const tag = document.createElement("style");
    tag.id = "cursos-disponibles-style";
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

function Alert({ msg, type = "error" }) {
  if (!msg) return null;
  const col = { error: C.red, success: C.green, warning: C.amber, info: C.accent }[type];
  const icon = { error: "ph-warning", success: "ph-check-circle", warning: "ph-lightning", info: "ph-info" }[type];
  return (
    <div style={{ background: col + "12", border: `1px solid ${col}33`, borderRadius: 10, padding: "12px 16px", fontSize: 13, color: col, marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
      <i className={`ph ${icon}`} style={{ flexShrink: 0, marginTop: 1 }}></i>
      {msg}
    </div>
  );
}

// ── Modal de confirmación ─────────────────────────────────────────────────────
function ConfirmModal({ open, curso, onConfirm, onCancel, loading, error }) {
  if (!open || !curso) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.borderMid}`, borderRadius: 20, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 26, color: C.accent }}>
          <i className="ph ph-clipboard-text"></i>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 8px", textAlign: "center" }}>Confirmar inscripción</h3>
        <p style={{ fontSize: 13, color: C.textSub, textAlign: "center", margin: "0 0 20px", lineHeight: 1.6 }}>
          ¿Confirmas que deseas inscribirte en:
        </p>
        <div style={{ background: C.accentDim, borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.accent, margin: "0 0 4px" }}>{curso.materia?.nombre}</p>
          <p style={{ fontSize: 13, color: C.textSub, margin: "0 0 8px" }}>Grupo: {curso.codigoGrupo} · {curso.materia?.creditos} créditos</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {curso.horarios?.map((h, i) => (
              <Tag key={i} color={C.accent}>{h.diaSemana} {h.horaInicio}–{h.horaFin} · {h.aula}</Tag>
            ))}
          </div>
        </div>
        {error && <Alert msg={error} type="error" />}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-hover" onClick={onCancel} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${C.border}`, background: "white", color: C.textSub, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button className="btn-hover" onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: C.accent, color: "white", fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <i className="ph ph-check"></i>
            {loading ? "Inscribiendo…" : "Inscribirme"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de éxito ────────────────────────────────────────────────────────────
function SuccessModal({ open, curso, onClose }) {
  if (!open || !curso) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.green}33`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 420, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenDim, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 30, color: C.green }}>
          <i className="ph ph-check-circle"></i>
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: C.green, margin: "0 0 8px" }}>¡Inscripción exitosa!</h2>
        <p style={{ fontSize: 14, color: C.textSub, margin: "0 0 6px" }}>
          Quedaste inscrito en <span style={{ fontWeight: 600, color: C.text }}>{curso.materia?.nombre}</span>
        </p>
        <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 26px" }}>Grupo {curso.codigoGrupo}</p>
        <button className="btn-hover" onClick={onClose} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: C.green, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Continuar
        </button>
      </div>
    </div>
  );
}

// ── Tarjeta de curso ──────────────────────────────────────────────────────────
function CursoCard({ curso, onInscribir }) {
  const [expanded, setExpanded] = useState(false);
  const { disponible, yaInscrito, sinPrerequisito, materiaYaInscrita, sinCupo } = curso;

  const pct = Math.round((curso.cupoActual / curso.cupoMaximo) * 100);
  const cupoColor = pct >= 90 ? C.red : pct >= 70 ? C.amber : C.green;

  let estadoLabel = null;
  let estadoColor = C.gray;
  if (yaInscrito)            { estadoLabel = "Ya inscrito";          estadoColor = C.green; }
  else if (sinPrerequisito)  { estadoLabel = "Sin prerrequisito";     estadoColor = C.red;   }
  else if (materiaYaInscrita){ estadoLabel = "Materia ya inscrita";   estadoColor = C.amber; }
  else if (sinCupo)          { estadoLabel = "Sin cupos";             estadoColor = C.red;   }

  const btnLabel = sinPrerequisito ? "Sin prerrequisito"
    : materiaYaInscrita ? "Ya inscrito en otro grupo"
    : sinCupo ? "Sin cupos"
    : "Inscribirme";

  return (
    <div style={{
      background: C.surface,
      border: `1.5px solid ${yaInscrito ? C.green + "55" : disponible ? C.border : C.borderMid}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: disponible ? "0 2px 12px rgba(2,132,199,0.08)" : "none",
      opacity: (!disponible && !yaInscrito) ? 0.75 : 1,
    }}>
      {/* Barra de color superior igual que MisInscripciones */}
      <div style={{ height: 4, background: yaInscrito ? C.green : disponible ? C.accent : C.gray }} />

      {/* Cabecera */}
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Semestre badge */}
        <div style={{ width: 46, height: 46, borderRadius: 12, background: C.accentDim, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{curso.materia?.semestre || "—"}</span>
          <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>SEM</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{curso.materia?.nombre}</span>
            {estadoLabel && <Tag color={estadoColor}>{estadoLabel}</Tag>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color={C.textMuted}>{curso.materia?.codigo}</Tag>
            <Tag color={C.accent}>Grupo {curso.codigoGrupo}</Tag>
            <Tag color={C.textSub}>{curso.materia?.creditos} créditos</Tag>
            {curso.materia?.prerrequisito && (
              <Tag color={sinPrerequisito ? C.red : C.gray}>Prereq: {curso.materia.prerrequisito}</Tag>
            )}
          </div>
        </div>

        <button className="btn-hover" onClick={() => setExpanded(p => !p)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.textMuted, fontSize: 13, flexShrink: 0 }}>
          <i className={`ph ${expanded ? "ph-caret-up" : "ph-caret-down"}`}></i>
        </button>
      </div>

      {/* Info siempre visible */}
      <div style={{ padding: "0 18px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSub }}>
          <i className="ph ph-user"></i>
          <span>{curso.docente || "Sin docente asignado"}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {curso.horarios?.map((h, i) => (
            <span key={i} style={{ fontSize: 12, color: C.accent, background: C.accentDim, borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>
              {h.diaSemana.slice(0, 3)} {h.horaInicio}–{h.horaFin}
            </span>
          ))}
        </div>
        {/* Cupos */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 80, height: 6, background: C.grayDim, borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: cupoColor, borderRadius: 99, transition: "width .3s" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: cupoColor }}>{curso.cuposDisponibles}/{curso.cupoMaximo}</span>
        </div>
      </div>

      {/* Detalle expandido */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 18px", background: C.grayDim }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Horario detallado</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {curso.horarios
              ?.slice()
              .sort((a, b) => diasOrden.indexOf(a.diaSemana) - diasOrden.indexOf(b.diaSemana))
              .map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface, borderRadius: 8, padding: "8px 14px", border: `1px solid ${C.border}` }}>
                  <span style={{ width: 80, fontWeight: 700, fontSize: 13, color: C.accent }}>{h.diaSemana}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{h.horaInicio} – {h.horaFin}</span>
                  <span style={{ fontSize: 13, color: C.textSub, marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                    <i className="ph ph-building"></i>
                    {h.aula}{h.edificio ? ` · ${h.edificio}` : ""}
                  </span>
                  {h.turno && <Tag color={C.textMuted}>{h.turno}</Tag>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "12px 18px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
        {yaInscrito ? (
          <span style={{ fontSize: 13, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="ph ph-check-circle"></i> Inscrito
          </span>
        ) : (
          <button
            className={disponible ? "btn-hover" : ""}
            onClick={() => onInscribir(curso)}
            disabled={!disponible}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none",
              background: disponible ? C.accent : C.grayDim,
              color: disponible ? "white" : C.textMuted,
              fontSize: 13, fontWeight: 600,
              cursor: disponible ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {disponible && <i className="ph ph-plus-circle"></i>}
            {btnLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CursosDisponibles() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [semFiltro, setSemFiltro] = useState("todos");

  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
  const [cursoExitoso, setCursoExitoso] = useState(null);
  const [inscribiendo, setInscribiendo] = useState(false);
  const [inscripcionError, setInscripcionError] = useState("");

  const cargarCursos = () => {
    setLoading(true); setError("");
    api.get("/inscripciones/disponibles")
      .then(r => { setPeriodo(r.data.periodo); setCursos(r.data.data); })
      .catch(err => setError(err.response?.data?.message || "Error al cargar cursos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarCursos(); }, []);

  const confirmarInscripcion = async () => {
    if (!cursoSeleccionado) return;
    setInscribiendo(true); setInscripcionError("");
    try {
      await api.post("/inscripciones", { idCurso: cursoSeleccionado.id });
      setCursoExitoso(cursoSeleccionado);
      setCursoSeleccionado(null);
      cargarCursos();
    } catch (err) {
      setInscripcionError(err.response?.data?.message || "Error al inscribirse");
    } finally { setInscribiendo(false); }
  };

  const semestres = [...new Set(cursos.map(c => c.materia?.semestre).filter(Boolean))].sort((a, b) => a - b);

  const cursosFiltrados = cursos.filter(c => {
    if (filtro === "disponibles" && !c.disponible) return false;
    if (filtro === "inscritos" && !c.yaInscrito) return false;
    if (semFiltro !== "todos" && String(c.materia?.semestre) !== semFiltro) return false;
    if (busqueda) {
      const b = busqueda.toLowerCase();
      return c.materia?.nombre.toLowerCase().includes(b) || c.materia?.codigo.toLowerCase().includes(b) || c.docente?.toLowerCase().includes(b);
    }
    return true;
  });

  const totalInscritos   = cursos.filter(c => c.yaInscrito).length;
  const totalDisponibles = cursos.filter(c => c.disponible).length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <StyleInjector />
      <ConfirmModal open={!!cursoSeleccionado} curso={cursoSeleccionado}
        onConfirm={confirmarInscripcion} onCancel={() => { setCursoSeleccionado(null); setInscripcionError(""); }}
        loading={inscribiendo} error={inscripcionError} />
      <SuccessModal open={!!cursoExitoso} curso={cursoExitoso} onClose={() => setCursoExitoso(null)} />

      {/* Header — idéntico al de MisInscripciones */}
      <header style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <button
          className="btn-hover"
          onClick={() => navigate("/estudiante/bienvenida")}
          style={{ background: C.accent, border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, boxShadow: "0 2px 8px rgba(2,132,199,0.25)" }}
        >
          <i className="ph ph-arrow-left"></i>
          Volver
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text, marginLeft: "auto" }}>Cursos disponibles</span>
        {periodo && (
          <span style={{ fontSize: 12, color: C.accent, background: C.accentDim, borderRadius: 999, padding: "3px 12px", fontWeight: 600 }}>
            {periodo.codigo}
          </span>
        )}
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>
        {/* Stats */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Cursos ofertados",    value: cursos.length,    color: C.accent },
              { label: "Disponibles para ti", value: totalDisponibles, color: C.green  },
              { label: "Ya inscritos",         value: totalInscritos,   color: C.amber  },
            ].map(s => (
              <div key={s.label} style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Buscador */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, background: C.grayDim }}>
            <i className="ph ph-magnifying-glass" style={{ color: C.textMuted, flexShrink: 0 }}></i>
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por materia, código o docente…"
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, outline: "none", color: C.text }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 0, display: "flex" }}>
                <i className="ph ph-x"></i>
              </button>
            )}
          </div>

          {/* Filtro estado */}
          <div style={{ display: "flex", gap: 6 }}>
            {[["todos","Todos"],["disponibles","Disponibles"],["inscritos","Inscritos"]].map(([v, l]) => (
              <button key={v} className="btn-hover" onClick={() => setFiltro(v)} style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: filtro === v ? C.accent : "transparent",
                color: filtro === v ? "white" : C.textMuted,
                border: `1.5px solid ${filtro === v ? C.accent : C.border}`,
              }}>{l}</button>
            ))}
          </div>

          {/* Filtro semestre */}
          {semestres.length > 0 && (
            <select value={semFiltro} onChange={e => setSemFiltro(e.target.value)} style={{ padding: "7px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSub, outline: "none", background: "white" }}>
              <option value="todos">Todos los semestres</option>
              {semestres.map(s => <option key={s} value={String(s)}>Semestre {s}</option>)}
            </select>
          )}
        </div>

        {inscripcionError && <Alert msg={inscripcionError} type="error" />}

        {loading ? (
          <Loading texto="Cargando cursos disponibles…" />
        ) : error ? (
          <Alert msg={error} type="error" />
        ) : cursosFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted }}>
            <i className="ph ph-folder-open" style={{ fontSize: 40, display: "block", marginBottom: 12 }}></i>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No hay cursos que coincidan con los filtros</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cursosFiltrados.map(c => (
              <CursoCard key={c.id} curso={c} onInscribir={curso => { setInscripcionError(""); setCursoSeleccionado(curso); }} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}