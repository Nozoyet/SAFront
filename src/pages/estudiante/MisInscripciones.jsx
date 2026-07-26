import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import Loading from "../../components/common/Loading";

const C = {
  bg: "#f0f9ff", surface: "#ffffff", border: "#e0f2fe", borderMid: "#bae6fd",
  accent: "#0284c7", accentDim: "#e0f2fe", green: "#059669", greenDim: "#d1fae5",
  amber: "#d97706", amberDim: "#fef3c7", red: "#dc2626", redDim: "#fee2e2",
  gray: "#64748b", grayDim: "#f1f5f9", text: "#0f172a", textSub: "#475569", textMuted: "#94a3b8",
};

const diasOrden = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

/* ── Estilos de hover inyectados una sola vez ────────────────────────────── */
const hoverStyle = `
  .btn-hover { transition: filter 0.15s, box-shadow 0.15s, opacity 0.15s; }
  .btn-hover:hover { filter: brightness(0.92); box-shadow: 0 3px 10px rgba(0,0,0,0.13); }
  .btn-hover:active { filter: brightness(0.85); }
`;

function StyleInjector() {
  useEffect(() => {
    if (document.getElementById("mis-inscripciones-style")) return;
    const tag = document.createElement("style");
    tag.id = "mis-inscripciones-style";
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
      borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function HorarioChip({ h }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.accentDim, borderRadius: 8, padding: "6px 12px" }}>
      <span style={{ fontWeight: 700, fontSize: 14, color: C.accent, width: 70 }}>{h.diaSemana}</span>
      <span style={{ fontSize: 14, color: C.text }}>{h.horaInicio} – {h.horaFin}</span>
      <span style={{ fontSize: 13, color: C.textSub, marginLeft: 4, display: "flex", alignItems: "center", gap: 4 }}>
        <i className="ph ph-building"></i>
        {h.aula}{h.edificio ? ` · ${h.edificio}` : ""}
      </span>
      {h.turno && <Tag color={C.textMuted}>{h.turno}</Tag>}
    </div>
  );
}

function InscripcionCard({ inscripcion }) {
  const [expanded, setExpanded] = useState(false);
  const curso = inscripcion.curso;
  const materia = curso?.materia;
  const docente = curso?.docente;
  const periodo = curso?.periodo_academico || curso?.periodoAcademico;

  const estadoColor = { Activa: C.green, Completada: C.accent, Cancelada: C.red }[inscripcion.estado] || C.gray;

  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ height: 4, background: estadoColor }} />

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          {/* Semestre */}
          <div style={{ width: 46, height: 46, borderRadius: 12, background: C.accentDim, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{materia?.semestre || "—"}</span>
            <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>SEM</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{materia?.nombre}</span>
              <Tag color={estadoColor}>{inscripcion.estado}</Tag>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag color={C.textMuted}>{materia?.codigo}</Tag>
              <Tag color={C.accent}>Grupo {curso?.codigoGrupo}</Tag>
              <Tag color={C.textSub}>{materia?.creditos} créditos</Tag>
              {periodo && <Tag color={C.textMuted}>{periodo.codigo}</Tag>}
            </div>
          </div>

          <button className="btn-hover" onClick={() => setExpanded(p => !p)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.textMuted, fontSize: 13, flexShrink: 0 }}>
            <i className={`ph ${expanded ? "ph-caret-up" : "ph-caret-down"}`}></i>
          </button>
        </div>

        {/* Info rápida */}
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSub }}>
            <i className="ph ph-user"></i>
            <span>{docente ? `${docente.nombre1} ${docente.apellidoP}` : "Sin docente"}</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {curso?.horarios?.map((h, i) => (
              <span key={i} style={{ fontSize: 12, color: C.accent, background: C.accentDim, borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>
                {h.diaSemana.slice(0, 3)} {h.horaInicio}–{h.horaFin}
              </span>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#070606" }}>
            Inscrito: {new Date(inscripcion.fechaInscripcion).toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 20px", background: C.grayDim }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Horario completo</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {curso?.horarios
              ?.slice()
              .sort((a, b) => diasOrden.indexOf(a.diaSemana) - diasOrden.indexOf(b.diaSemana))
              .map((h, i) => <HorarioChip key={i} h={h} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vista de horario semanal ──────────────────────────────────────────────────
function VistaHorario({ inscripciones }) {
  const horas = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
  const colores = ["#0284c7","#059669","#d97706","#7c3aed","#db2777","#0891b2","#16a34a"];

  const bloques = {};
  diasOrden.forEach(d => bloques[d] = []);

  inscripciones.forEach((ins, idx) => {
    const color = colores[idx % colores.length];
    ins.curso?.horarios?.forEach(h => {
      bloques[h.diaSemana]?.push({ horaInicio: h.horaInicio, horaFin: h.horaFin, nombre: ins.curso.materia?.nombre, grupo: ins.curso.codigoGrupo, aula: h.aula, color });
    });
  });

  const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const diasConClases = diasOrden.filter(d => bloques[d].length > 0);

  if (diasConClases.length === 0) return null;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, color: C.text, fontWeight: 700, fontSize: 15 }}>
        <i className="ph ph-calendar-blank"></i>
        <span>Mi horario semanal</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 500, padding: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: `52px repeat(${diasConClases.length}, 1fr)`, gap: 4 }}>
            <div />
            {diasConClases.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0" }}>{d.slice(0, 3)}</div>
            ))}
            {horas.map((hora) => (
              <React.Fragment key={hora}>
                <div style={{ fontSize: 11, color: C.textMuted, textAlign: "right", paddingRight: 8, paddingTop: 2 }}>{hora}</div>
                {diasConClases.map(dia => {
                  const bloque = bloques[dia].find(b => b.horaInicio?.slice(0, 5) === hora);
                  if (bloque) {
                    const durMin = toMin(bloque.horaFin) - toMin(bloque.horaInicio);
                    const rows = Math.round(durMin / 60);
                    return (
                      <div key={dia + hora} style={{ gridRow: `span ${rows}`, background: bloque.color + "22", border: `1.5px solid ${bloque.color}55`, borderRadius: 8, padding: "6px 8px", fontSize: 11, color: bloque.color, fontWeight: 600, overflow: "hidden" }}>
                        <div style={{ fontWeight: 700, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bloque.nombre}</div>
                        <div style={{ opacity: 0.8 }}>{bloque.grupo} · {bloque.aula}</div>
                      </div>
                    );
                  }
                  return <div key={dia + hora} style={{ minHeight: 32, borderTop: `1px solid ${C.border}22` }} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta historial ─────────────────────────────────────────────────────────
function HistorialCard({ registro }) {
  const [expanded, setExpanded] = useState(false);
  const materia = registro.materia;
  const periodo = registro.periodo_academico || registro.periodoAcademico;
  const curso   = registro.inscripcion?.curso;
  const docente = curso?.docente;

  const aprobado  = registro.estado === "Aprobado";
  const reprobado = registro.estado === "Reprobado";
  const estadoColor = aprobado ? C.green : reprobado ? C.red : C.amber;

  const nota = registro.notaFinal;
  const notaColor = nota === null || nota === undefined ? C.textMuted : nota >= 51 ? C.green : C.red;

  return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div style={{ height: 4, background: estadoColor }} />
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: C.grayDim, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: C.gray, lineHeight: 1 }}>{materia?.semestre || "—"}</span>
            <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>SEM</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{materia?.nombre}</span>
              <Tag color={estadoColor}>{registro.estado}</Tag>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Tag color={C.textMuted}>{materia?.codigo}</Tag>
              <Tag color={C.textSub}>{materia?.creditos} créditos</Tag>
              {periodo && <Tag color={C.textMuted}>{periodo.codigo}</Tag>}
              {curso && <Tag color={C.accent}>Grupo {curso.codigoGrupo}</Tag>}
            </div>
          </div>

          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: notaColor, lineHeight: 1 }}>
              {nota !== null && nota !== undefined ? Number(nota).toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nota</div>
          </div>

          <button className="btn-hover" onClick={() => setExpanded(p => !p)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: C.textMuted, fontSize: 13, flexShrink: 0 }}>
            <i className={`ph ${expanded ? "ph-caret-up" : "ph-caret-down"}`}></i>
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.textSub }}>
            <i className="ph ph-user"></i>
            <span>{docente ? `${docente.nombre1} ${docente.apellidoP}` : "Sin docente"}</span>
          </div>
          {curso?.horarios?.map((h, i) => (
            <span key={i} style={{ fontSize: 12, color: C.gray, background: C.grayDim, borderRadius: 6, padding: "2px 8px", fontWeight: 500 }}>
              {h.diaSemana.slice(0, 3)} {h.horaInicio}–{h.horaFin}
            </span>
          ))}
        </div>
      </div>

      {expanded && curso?.horarios?.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px 20px", background: C.grayDim }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>Horario</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {curso.horarios
              .slice()
              .sort((a, b) => diasOrden.indexOf(a.diaSemana) - diasOrden.indexOf(b.diaSemana))
              .map((h, i) => <HorarioChip key={i} h={h} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sección historial ─────────────────────────────────────────────────────────
function SeccionHistorial() {
  const [historial, setHistorial]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [semFiltro, setSemFiltro]           = useState("todos");
  const [estadoFiltro, setEstadoFiltro]     = useState("todos");

  useEffect(() => {
    api.get("/inscripciones/historial")
      .then(r => setHistorial(r.data.data || []))
      .catch(err => setError(err.response?.data?.message || "Error al cargar historial"))
      .finally(() => setLoading(false));
  }, []);

  const semestres = [...new Set(historial.map(h => h.materia?.semestre).filter(Boolean))].sort((a, b) => a - b);

  const filtrado = historial.filter(h => {
    if (semFiltro !== "todos" && String(h.materia?.semestre) !== semFiltro) return false;
    if (estadoFiltro !== "todos" && h.estado !== estadoFiltro) return false;
    return true;
  });

  const totalAprobadas  = historial.filter(h => h.estado === "Aprobado").length;
  const totalReprobadas = historial.filter(h => h.estado === "Reprobado").length;
  const creditosAcum    = historial.filter(h => h.estado === "Aprobado").reduce((s, h) => s + (h.materia?.creditos || 0), 0);

  if (loading) return <Loading texto="Cargando historial..." />;
  if (error)   return <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", color: C.red, fontSize: 13 }}>{error}</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Materias aprobadas",  value: totalAprobadas,  color: C.green  },
          { label: "Materias reprobadas", value: totalReprobadas, color: C.red    },
          { label: "Créditos acumulados", value: creditosAcum,    color: C.accent },
        ].map(s => (
          <div key={s.label} style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Filtrar:</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[["todos","Todos"],["Aprobado","Aprobados"],["Reprobado","Reprobados"],["Retirado","Retirados"]].map(([v, l]) => (
            <button key={v} className="btn-hover" onClick={() => setEstadoFiltro(v)} style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              background: estadoFiltro === v ? C.accent : "transparent",
              color: estadoFiltro === v ? "white" : C.textMuted,
              border: `1.5px solid ${estadoFiltro === v ? C.accent : C.border}`,
            }}>{l}</button>
          ))}
        </div>
        {semestres.length > 0 && (
          <select value={semFiltro} onChange={e => setSemFiltro(e.target.value)} style={{ padding: "6px 12px", border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSub, outline: "none", background: "white", marginLeft: "auto" }}>
            <option value="todos">Todos los semestres</option>
            {semestres.map(s => <option key={s} value={String(s)}>Semestre {s}</option>)}
          </select>
        )}
      </div>

      {filtrado.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
          <i className="ph ph-folder-open"></i>
          <p style={{ margin: 0, fontSize: 14 }}>No hay registros con los filtros seleccionados</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtrado.map(h => <HistorialCard key={h.id} registro={h} />)}
        </div>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function MisInscripciones() {
  const navigate = useNavigate();
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [vista, setVista]                 = useState("lista");
  const [tab, setTab]                     = useState("activas");

  useEffect(() => {
    api.get("/inscripciones/mis")
      .then(r => setInscripciones(r.data.data || []))
      .catch(err => setError(err.response?.data?.message || "Error al cargar inscripciones"))
      .finally(() => setLoading(false));
  }, []);

  const activas       = inscripciones.filter(i => i.estado === "Activa");
  const creditosTotal = activas.reduce((sum, i) => sum + (i.curso?.materia?.creditos || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <StyleInjector />

      <header style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <button
          className="btn-hover"
          onClick={() => navigate("/estudiante/bienvenida")}
          style={{ background: C.accent, border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, boxShadow: "0 2px 8px rgba(2,132,199,0.25)" }}
        >
          <i className="ph ph-arrow-left"></i>
          Volver
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.text, marginLeft: "auto" }}>Mis Cursos</span>
      </header>

      {/* Submenu */}
      <div style={{ position: "sticky", top: 68, zIndex: 15, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.border}`, padding: "10px 28px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>

          {tab === "historial" && (
            <button
              className="btn-hover"
              onClick={() => setTab("activas")}
              style={{ padding: "8px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: C.accent, color: "white", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="ph ph-arrow-left"></i>
              Volver a las Materias Actuales
            </button>
          )}

          {tab === "activas" && (
            <button
              className="btn-hover"
              onClick={() => setTab("historial")}
              style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${C.border}`, cursor: "pointer", background: "white", color: C.textSub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <i className="ph ph-graduation-cap"></i>
              Historial
            </button>
          )}

          {tab === "activas" && (
            <>
              <button
                className="btn-hover"
                onClick={() => setVista("lista")}
                style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${vista === "lista" ? C.accent : C.border}`, cursor: "pointer", background: vista === "lista" ? C.accent : "white", color: vista === "lista" ? "white" : C.textSub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="ph ph-list"></i>
                Lista
              </button>

              <button
                className="btn-hover"
                onClick={() => setVista("horario")}
                style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${vista === "horario" ? C.accent : C.border}`, cursor: "pointer", background: vista === "horario" ? C.accent : "white", color: vista === "horario" ? "white" : C.textSub, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
              >
                <i className="ph ph-calendar"></i>
                Horario
              </button>
            </>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>

        {tab === "activas" && (
          <>
            {!loading && !error && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Cursos activos",      value: activas.length,       color: C.green  },
                  { label: "Créditos inscritos",   value: creditosTotal,        color: C.accent },
                  { label: "Total inscripciones",  value: inscripciones.length, color: C.amber  },
                ].map(s => (
                  <div key={s.label} style={{ background: "white", border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                    <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                    <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <Loading texto="Cargando tus inscripciones..." />
            ) : error ? (
              <div style={{ background: C.redDim, border: `1px solid ${C.red}33`, borderRadius: 10, padding: "12px 16px", color: C.red, fontSize: 13 }}>{error}</div>
            ) : inscripciones.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <i className="ph ph-folder-open"></i>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: "0 0 8px" }}>No tienes inscripciones aún</p>
                <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Explora los cursos disponibles e inscríbete.</p>
                <button className="btn-hover" onClick={() => navigate("/estudiante/cursos")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: C.accent, color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Ver cursos disponibles
                </button>
              </div>
            ) : (
              <>
                {vista === "horario" && <VistaHorario inscripciones={activas} />}
                {vista === "lista" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {inscripciones.map(i => <InscripcionCard key={i.id} inscripcion={i} />)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === "historial" && <SeccionHistorial />}

      </main>
    </div>
  );
}