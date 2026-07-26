import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

const C = {
  bg: "#f8fafc", surface: "#ffffff", card: "#ffffff", border: "#e2e8f0", borderLight: "#f1f5f9",
  accent: "#7c3aed", accentSoft: "#ede9fe", accentDim: "#f5f3ff",
  green: "#10b981", greenDim: "#ecfdf5", amber: "#f59e0b", amberDim: "#fffbeb",
  red: "#ef4444", redDim: "#fef2f2", text: "#0f172a", textMuted: "#475569", textSub: "#94a3b8",
  shadow: "0 2px 12px rgba(15,23,42,0.06)",
};
const styles = {
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
};
const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const turnos = ["Mañana", "Tarde", "Noche"];

function StepBar({ step }) {
  const steps = [{ n: 1, label: "Período Académico" }, { n: 2, label: "Oferta Académica" }, { n: 3, label: "Crear Cursos" }];
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .3s",
              background: step > s.n ? C.green : step === s.n ? C.accent : C.border, color: step >= s.n ? "#fff" : C.textMuted
            }}>
              {step > s.n
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                : s.n}
            </div>
            <span style={{ fontSize: 11, whiteSpace: "nowrap", fontWeight: step === s.n ? 600 : 400, color: step === s.n ? C.accent : C.textMuted }}>{s.label}</span>
          </div>
          {i < 2 && <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 22, transition: "background .3s", background: step > s.n ? C.green : C.border }} />}
        </div>
      ))}
    </div>
  );
}

function FieldWrap({ label, required, error, style, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>}
      {children}
      {error && <span style={{ color: C.red, fontSize: 11, fontWeight: 500 }}>⚠ {error}</span>}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, error, style, placeholder }) {
  return (
    <FieldWrap label={label} required={required} error={error} style={style}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          background: C.surface, border: `1.5px solid ${error ? C.red : C.border}`, borderRadius: 8,
          padding: "9px 12px", color: C.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box"
        }} />
    </FieldWrap>
  );
}

function Sel({ label, value, onChange, options, placeholder, required, error, style }) {
  return (
    <FieldWrap label={label} required={required} error={error} style={style}>
      <select value={value} onChange={onChange}
        style={{
          background: C.surface, border: `1.5px solid ${error ? C.red : C.border}`, borderRadius: 8,
          padding: "9px 12px", color: value ? C.text : C.textMuted, fontSize: 14, outline: "none", width: "100%"
        }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </FieldWrap>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, type = "button", style }) {
  const vs = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.textSub, border: `1.5px solid ${C.border}` },
    success: { background: C.green, color: "#052e16", border: "none" },
    danger: { background: "transparent", color: C.red, border: `1.5px solid ${C.red}` },
    warning: { background: C.amber, color: "#1c1000", border: "none" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      ...vs[variant],
      padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "opacity .15s", ...style
    }}>
      {children}
    </button>
  );
}

function Tag({ children, color = C.accent }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>;
}

function Alert({ msg, type = "error" }) {
  if (!msg) return null;
  const col = { error: C.red, success: C.green, warning: C.amber, info: C.accent }[type];
  return <div style={{ background: col + "18", border: `1px solid ${col}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: col, marginBottom: 16 }}>{msg}</div>;
}

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmar", variant = "primary" }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: C.shadow }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>{title}</h3>
        <p style={{ fontSize: 14, color: C.textSub, margin: "0 0 24px", lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onCancel}>Cancelar</Btn>
          <Btn variant={variant} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>
  );
}

// Choque SOLO dentro del periodo actual
function detectarChoqueLocal(idDocente, nuevosHorarios, cursosDelPeriodo, excluirId = null) {
  const cursosDocente = cursosDelPeriodo.filter(c => String(c.idDocente) === String(idDocente) && c.id !== excluirId);
  for (const curso of cursosDocente) {
    for (const ex of (curso.horarios || [])) {
      for (const nuevo of nuevosHorarios) {
        if (nuevo.diaSemana === ex.diaSemana && nuevo.horaInicio && nuevo.horaFin) {
          if (nuevo.horaInicio < ex.horaFin && nuevo.horaFin > ex.horaInicio) {
            return `El docente ya tiene clase el ${ex.diaSemana} de ${ex.horaInicio?.slice(0, 5)} a ${ex.horaFin?.slice(0, 5)} en este período (grupo: ${curso.codigoGrupo})`;
          }
        }
      }
    }
  }
  return null;
}

function HorarioForm({ horarios, onChange, errores = {} }) {
  const set = (idx, k) => e => { const h = [...horarios]; h[idx] = { ...h[idx], [k]: e.target.value }; onChange(h); };
  const add = () => onChange([...horarios, { diaSemana: "Lunes", horaInicio: "", horaFin: "", aula: "", edificio: "", turno: "" }]);
  const remove = idx => onChange(horarios.filter((_, i) => i !== idx));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Horarios</span>
        <Btn variant="ghost" onClick={add} style={{ padding: "4px 12px", fontSize: 12 }}>+ Añadir día</Btn>
      </div>
      {errores.horariosGeneral && <span style={{ color: C.red, fontSize: 11, fontWeight: 500, display: "block", marginBottom: 8 }}>⚠ {errores.horariosGeneral}</span>}
      {horarios.map((h, idx) => {
        const eH = errores.horarios?.[idx] || {};
        return (
          <div key={idx} style={{ background: C.surface, border: `1.5px solid ${Object.keys(eH).length ? C.red : C.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Bloque {idx + 1}</span>
              {horarios.length > 1 && <button type="button" onClick={() => remove(idx)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Eliminar
              </button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Sel label="Día" value={h.diaSemana} onChange={set(idx, "diaSemana")} options={dias.map(d => ({ value: d, label: d }))} error={eH.diaSemana} />
              <Input label="Hora inicio" value={h.horaInicio} onChange={set(idx, "horaInicio")} type="time" required error={eH.horaInicio} />
              <Input label="Hora fin" value={h.horaFin} onChange={set(idx, "horaFin")} type="time" required error={eH.horaFin} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <Input label="Aula" value={h.aula} onChange={set(idx, "aula")} required error={eH.aula} />
              <Input label="Edificio" value={h.edificio} onChange={set(idx, "edificio")} />
              <Sel label="Turno" value={h.turno} onChange={set(idx, "turno")} options={turnos.map(t => ({ value: t, label: t }))} placeholder="— Opcional —" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PasoPeriodo({ onNext }) {
  const [carreras, setCarreras] = useState([]);
  const [form, setForm] = useState({ codigo: "", fechaInicio: "", fechaFin: "", idCarrera: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fe, setFe] = useState({});
  useEffect(() => { api.get("/carrera").then(r => setCarreras(r.data.data || [])); }, []);
  const set = k => e => { setFe(p => ({ ...p, [k]: "" })); setForm(p => ({ ...p, [k]: e.target.value })); };
  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setFe({});
    const errs = {};
    if (!form.codigo.trim()) errs.codigo = "El código del período es obligatorio.";
    if (!form.fechaInicio) errs.fechaInicio = "La fecha de inicio es obligatoria.";
    if (!form.fechaFin) errs.fechaFin = "La fecha de fin es obligatoria.";
    if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) errs.fechaFin = "La fecha de fin debe ser posterior a la de inicio.";
    if (!form.idCarrera) errs.idCarrera = "Selecciona una carrera.";
    if (Object.keys(errs).length) { setFe(errs); return; }
    setLoading(true);
    try { const res = await api.post("/periodos", form); onNext(res.data.data); }
    catch (err) { setError(err.response?.data?.message || "Error al crear el período"); }
    finally { setLoading(false); }
  };
  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Definir Período Académico</h2>
      <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 24px" }}>Establece el período antes de generar la oferta de cursos.</p>
      <Alert msg={error} />
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Input label="Código del período" value={form.codigo} onChange={set("codigo")} required error={fe.codigo} style={{ gridColumn: "1 / -1" }} />
          <Input label="Fecha inicio" value={form.fechaInicio} onChange={set("fechaInicio")} type="date" required error={fe.fechaInicio} />
          <Input label="Fecha fin" value={form.fechaFin} onChange={set("fechaFin")} type="date" required error={fe.fechaFin} />
          <Sel label="Carrera" value={form.idCarrera} onChange={set("idCarrera")}
            options={carreras.map(c => ({ value: c.id, label: c.nombre }))} placeholder="Selecciona una carrera" required error={fe.idCarrera} style={{ gridColumn: "1 / -1" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Btn type="submit" disabled={loading}>{loading ? "Creando…" : "Continuar →"}</Btn>
        </div>
      </form>
    </div>
  );
}

function PasoOferta({ periodo, onNext, onBack }) {
  const [pensum, setPensum] = useState(null);
  const [seleccionadas, setSeleccionadas] = useState(new Set());
  const [electivasDisponibles, setElectivasDisponibles] = useState([]);
  const [extras, setExtras] = useState([]);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [selectedElectivaId, setSelectedElectivaId] = useState("");
  const [semestreActivo, setSemestreActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.get(`/carrera/${periodo.idCarrera}/pensum-activo`)
      .then(r => {
        const datos = r.data.data; setPensum(datos);
        const todas = datos.materias || [];
        const electivas = todas.filter(m => m.esElectiva === true || m.esElectiva === 1 || m.esElectiva === "1");
        const regulares = todas.filter(m => !m.esElectiva || m.esElectiva === false || m.esElectiva === 0 || m.esElectiva === "0");
        setElectivasDisponibles(electivas);
        setSeleccionadas(new Set(regulares.map(m => m.id)));
        const sems = [...new Set(regulares.map(m => m.semestre || "S/N"))].sort((a, b) => Number(a) - Number(b));
        if (sems.length) setSemestreActivo(sems[0]);
      })
      .catch(() => setError("No se pudo cargar el pensum"))
      .finally(() => setLoading(false));
  }, [periodo.idCarrera]);

  const toggle = id => setSeleccionadas(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const addExtra = () => {
    if (!selectedElectivaId) return;
    const m = electivasDisponibles.find(x => String(x.id) === String(selectedElectivaId));
    if (!m) return;
    if (extras.some(e => e.id === m.id)) { setError("Esta electiva ya fue agregada."); return; }
    setExtras(p => [...p, { ...m, isExtra: true }]);
    setSelectedElectivaId(""); setShowExtraForm(false); setError("");
  };
  const confirmarPaso = () => {
    setConfirm(false);
    const regulares = (pensum.materias || []).filter(m => (!m.esElectiva || m.esElectiva === false || m.esElectiva === 0 || m.esElectiva === "0") && seleccionadas.has(m.id));
    onNext([...regulares, ...extras]);
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
      <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
      <p style={{ margin: 0, color: C.textMuted }}>Cargando pensum…</p>
    </div>
  );

  const regulares = pensum?.materias?.filter(m => !m.esElectiva || m.esElectiva === false || m.esElectiva === 0 || m.esElectiva === "0") || [];
  const semestres = [...new Set(regulares.map(m => m.semestre || "S/N"))].sort((a, b) => Number(a) - Number(b));
  const materiasSem = regulares.filter(m => (m.semestre || "S/N") === semestreActivo);
  const totalSel = seleccionadas.size + extras.length;

  return (
    <div>
      <ConfirmModal open={confirm} title="¿Continuar a crear cursos?"
        message={`Llevarás ${totalSel} materia${totalSel !== 1 ? "s" : ""} al siguiente paso.`}
        onConfirm={confirmarPaso} onCancel={() => setConfirm(false)} confirmLabel="Sí, continuar →" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Oferta Académica</h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
            <span style={{ color: C.accent }}>{periodo.codigo}</span> · {totalSel} materias seleccionadas
          </p>
        </div>
        {electivasDisponibles.length > 0 && (
          <Btn variant="ghost" onClick={() => setShowExtraForm(p => !p)}>
            {showExtraForm
              ? <span style={{ display: "flex", alignItems: "center", gap: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> Cerrar</span>
              : "+ Añadir Electiva"}
          </Btn>
        )}
      </div>
      <Alert msg={error} />
      {showExtraForm && (
        <div style={{ background: C.surface, border: `1.5px solid ${C.amber}44`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.amber, margin: "0 0 12px", textTransform: "uppercase" }}>Habilitar materia electiva</p>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <Sel label="Selecciona la materia" value={selectedElectivaId} onChange={e => setSelectedElectivaId(e.target.value)}
              options={electivasDisponibles.map(m => ({ value: m.id, label: `[${m.codigo}] ${m.nombre} (${m.creditos} cr.)` }))}
              placeholder="-- Ver electivas del pensum --" style={{ flex: 1 }} />
            <Btn variant="warning" onClick={addExtra} disabled={!selectedElectivaId}>Agregar</Btn>
          </div>
        </div>
      )}
      {extras.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, color: C.amber, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Electivas habilitadas ({extras.length})</p>
          {extras.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, background: C.amberDim + "66", border: `1px solid ${C.amber}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
              <Tag color={C.amber}>Electiva</Tag>
              <span style={{ flex: 1, fontSize: 13, color: C.text }}><b style={{ color: C.textMuted }}>{e.codigo}</b> — {e.nombre}</span>
              <span style={{ fontSize: 12, color: C.textMuted }}>{e.creditos} créditos</span>
              {e.semestre && <Tag color={C.textMuted}>Sem. {e.semestre}</Tag>}
              <Btn variant="danger" onClick={() => setExtras(p => p.filter(x => x.id !== e.id))} style={{ padding: "4px 10px", fontSize: 12 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Quitar
              </Btn>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {semestres.map(s => {
          const mats = regulares.filter(m => (m.semestre || "S/N") === s);
          const selCount = mats.filter(m => seleccionadas.has(m.id)).length;
          const activo = semestreActivo === s;
          return (
            <button key={s} onClick={() => setSemestreActivo(s)} style={{
              padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: activo ? C.accent : "transparent", color: activo ? "#fff" : C.textMuted,
              border: `1.5px solid ${activo ? C.accent : C.border}`, transition: "all .15s"
            }}>
              {s === "S/N" ? "Sin semestre" : `Semestre ${s}`}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({selCount}/{mats.length})</span>
            </button>
          );
        })}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: C.surface, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {semestreActivo === "S/N" ? "Sin semestre" : `Semestre ${semestreActivo}`}
          </span>
          <button onClick={() => {
            const all = new Set(seleccionadas);
            const allSel = materiasSem.every(m => all.has(m.id));
            materiasSem.forEach(m => allSel ? all.delete(m.id) : all.add(m.id));
            setSeleccionadas(all);
          }} style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            {materiasSem.every(m => seleccionadas.has(m.id)) ? "Deseleccionar todo" : "Seleccionar todo"}
          </button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.surface }}>
              {["", "Código", "Nombre", "Créditos", "Prerrequisito"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materiasSem.map(m => {
              const activa = seleccionadas.has(m.id);
              return (
                <tr key={m.id} onClick={() => toggle(m.id)} style={{ cursor: "pointer", background: activa ? C.accentDim + "44" : "transparent", transition: "background .15s" }}>
                  <td style={{ padding: "10px 14px" }}><input type="checkbox" checked={activa} onChange={() => toggle(m.id)} onClick={e => e.stopPropagation()} /></td>
                  <td style={{ padding: "10px 14px" }}><Tag color={C.accent}>{m.codigo}</Tag></td>
                  <td style={{ padding: "10px 14px", color: C.text, fontWeight: 500, fontSize: 13 }}>{m.nombre}</td>
                  <td style={{ padding: "10px 14px", color: C.textSub, textAlign: "center", fontSize: 13 }}>{m.creditos}</td>
                  <td style={{ padding: "10px 14px", color: C.textMuted, fontSize: 12 }}>{m.prerrequisito?.nombre || <span style={{ color: C.border }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={onBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Atrás
        </Btn>
        <Btn onClick={() => { if (totalSel === 0) { setError("Selecciona al menos una materia"); return; } setConfirm(true); }}>
          Continuar con {totalSel} materias →
        </Btn>
      </div>
    </div>
  );
}

function CursoModal({ open, materia, docentes, cursosDelPeriodo, cursoEditando, periodoId, onSave, onClose }) {
  const emptyForm = () => ({ codigoGrupo: "", idDocente: "", cupoMaximo: "", horarios: [{ diaSemana: "Lunes", horaInicio: "", horaFin: "", aula: "", edificio: "", turno: "" }] });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [fe, setFe] = useState({});

  useEffect(() => {
    if (!open) return;
    if (cursoEditando) {
      setForm({
        codigoGrupo: cursoEditando.codigoGrupo,
        idDocente: String(cursoEditando.idDocente),
        cupoMaximo: String(cursoEditando.cupoMaximo),
        horarios: (cursoEditando.horarios || []).map(h => ({
          diaSemana: h.diaSemana, horaInicio: h.horaInicio?.slice(0, 5) || "",
          horaFin: h.horaFin?.slice(0, 5) || "", aula: h.aula, edificio: h.edificio || "", turno: h.turno || "",
        })),
      });
    } else { setForm(emptyForm()); }
    setFe({}); setErrorGeneral("");
  }, [open, cursoEditando]);

  if (!open) return null;

  const validar = () => {
    const errs = {};
    if (!form.codigoGrupo.trim()) errs.codigoGrupo = "El código de grupo es obligatorio.";
    else if (form.codigoGrupo.length > 20) errs.codigoGrupo = "Máximo 20 caracteres.";
    if (!form.idDocente) errs.idDocente = "Debes seleccionar un docente.";
    if (!form.cupoMaximo) errs.cupoMaximo = "El cupo máximo es obligatorio.";
    else if (parseInt(form.cupoMaximo) < 1) errs.cupoMaximo = "El cupo mínimo es 1 estudiante.";
    if (!form.horarios || form.horarios.length === 0) {
      errs.horariosGeneral = "Agrega al menos un bloque de horario.";
    } else {
      const errH = [];
      form.horarios.forEach((h, i) => {
        const e = {};
        if (!h.horaInicio) e.horaInicio = "Requerida.";
        if (!h.horaFin) e.horaFin = "Requerida.";
        if (h.horaInicio && h.horaFin && h.horaInicio >= h.horaFin) e.horaFin = "Debe ser mayor a hora inicio.";
        if (!h.aula?.trim()) e.aula = "El aula es obligatoria.";
        if (Object.keys(e).length) errH[i] = e;
      });
      if (errH.length) errs.horarios = errH;
    }
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault(); setErrorGeneral(""); setFe({});
    const errs = validar();
    if (Object.keys(errs).length) { setFe(errs); return; }
    // Choque solo dentro del periodo actual
    const excluirId = cursoEditando?.id || null;
    const choque = detectarChoqueLocal(form.idDocente, form.horarios, cursosDelPeriodo, excluirId);
    if (choque) { setErrorGeneral(choque); return; }
    setSaving(true);
    try {
      const payload = { codigoGrupo: form.codigoGrupo, idMateria: materia.id, idPeriodoAcademico: periodoId, idDocente: form.idDocente, cupoMaximo: Number(form.cupoMaximo), horarios: form.horarios };
      const res = cursoEditando ? await api.put(`/cursos/${cursoEditando.id}`, payload) : await api.post("/cursos", payload);
      onSave(res.data.data, !!cursoEditando); onClose();
    } catch (err) { setErrorGeneral(err.response?.data?.message || "Error al guardar el curso."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 2px" }}>
              {cursoEditando ? "Editar grupo" : "Nuevo grupo"} — {materia?.nombre}
            </h3>
            <span style={{ fontSize: 12, color: C.textMuted }}>{materia?.codigo} · {materia?.creditos} créditos</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        {errorGeneral && <Alert msg={errorGeneral} type="error" />}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <Input label="Código de grupo" value={form.codigoGrupo}
              onChange={e => { setFe(p => ({ ...p, codigoGrupo: "" })); setForm(p => ({ ...p, codigoGrupo: e.target.value })); }}
              required error={fe.codigoGrupo} placeholder="Ej: GR-01" />
            <Input label="Cupo máximo" value={form.cupoMaximo}
              onChange={e => { setFe(p => ({ ...p, cupoMaximo: "" })); setForm(p => ({ ...p, cupoMaximo: e.target.value })); }}
              type="number" required error={fe.cupoMaximo} />
            <Sel label="Docente" value={form.idDocente}
              onChange={e => { setFe(p => ({ ...p, idDocente: "" })); setForm(p => ({ ...p, idDocente: e.target.value })); }}
              options={docentes.map(d => ({ value: d.id, label: d.nombre }))} placeholder="Selecciona un docente"
              required error={fe.idDocente} style={{ gridColumn: "1 / -1" }} />
          </div>
          <HorarioForm
            horarios={form.horarios}
            onChange={h => { setFe(p => ({ ...p, horarios: undefined, horariosGeneral: "" })); setForm(p => ({ ...p, horarios: h })); }}
            errores={fe} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Guardando…" : cursoEditando ? "Guardar cambios" : "Crear curso"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

function PasoCursos({ periodo, materias, onBack }) {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState([]);
  const [cursosCreados, setCursosCreados] = useState({});
  const [modal, setModal] = useState(null);
  const [editando, setEditando] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [confirmBack, setConfirmBack] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => { api.get("/docentes").then(r => setDocentes(r.data.data || [])); }, []);

  const todosLosCursos = Object.values(cursosCreados).flat();
  const totalCreados = todosLosCursos.length;
  const toast = msg => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleSave = (curso, esEdicion) => {
    const idMat = curso.idMateria ?? modal?.id;
    setCursosCreados(p => {
      const lista = [...(p[idMat] || [])];
      if (esEdicion) { const idx = lista.findIndex(c => c.id === curso.id); if (idx !== -1) lista[idx] = curso; }
      else lista.push(curso);
      return { ...p, [idMat]: lista };
    });
    toast(esEdicion ? `Curso "${curso.codigoGrupo}" actualizado` : `Curso "${curso.codigoGrupo}" creado`);
  };

  const handleDelete = async (idMateria, cursoId, grupo) => {
    try {
      await api.delete(`/cursos/${cursoId}`);
      setCursosCreados(p => ({ ...p, [idMateria]: (p[idMateria] || []).filter(c => c.id !== cursoId) }));
      toast(`Curso "${grupo}" eliminado`);
    } catch { toast("Error al eliminar el curso"); }
    setDeleteConfirm(null);
  };

  return (
    <div>
      <ConfirmModal open={confirmBack} title="¿Regresar al paso anterior?"
        message="Los cursos ya creados se mantendrán guardados. Solo regresarás a seleccionar materias."
        onConfirm={() => { setConfirmBack(false); onBack(); }} onCancel={() => setConfirmBack(false)}
        confirmLabel="Sí, regresar" variant="warning" />
      <ConfirmModal open={!!deleteConfirm} title="¿Eliminar este curso?"
        message={`Se eliminará el grupo "${deleteConfirm?.grupo}". Esta acción no se puede deshacer.`}
        onConfirm={() => handleDelete(deleteConfirm.idMateria, deleteConfirm.id, deleteConfirm.grupo)}
        onCancel={() => setDeleteConfirm(null)} confirmLabel="Eliminar" variant="danger" />
      <CursoModal open={!!modal} materia={modal} docentes={docentes}
        cursosDelPeriodo={todosLosCursos}
        cursoEditando={editando} periodoId={periodo.id}
        onSave={handleSave} onClose={() => { setModal(null); setEditando(null); }} />
      {showFinishModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, width: "100%", maxWidth: 480, boxShadow: C.shadow, textAlign: "center" }}>
            <div style={{ width: 68, height: 68, margin: "0 auto 18px", borderRadius: "50%", background: C.greenDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 700, color: C.text }}>Oferta académica creada</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: C.textMuted }}>
              Se generaron <strong style={{ color: C.accent }}>{totalCreados} cursos</strong> para el período <strong style={{ color: C.accent }}>{periodo.codigo}</strong>.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn variant="ghost" onClick={() => setShowFinishModal(false)}>Seguir editando</Btn>
              <Btn onClick={() => navigate("/admin/bienvenida")}>Ir al panel</Btn>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Crear Cursos</h2>
          <p style={{ fontSize: 13, color: C.textMuted, margin: 0 }}>
            <span style={{ color: C.accent }}>{periodo.codigo}</span> · {totalCreados} cursos creados
          </p>
        </div>
        <Btn variant="success" onClick={() => setShowFinishModal(true)} disabled={totalCreados === 0}>✓ Finalizar oferta</Btn>
      </div>
      <Alert msg={success} type="success" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {materias.map(m => {
          const cursos = cursosCreados[m.id] || [];
          return (
            <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.nombre}</span>
                    {m.isExtra && <Tag color={C.amber}>Electiva</Tag>}
                    <Tag color={C.accent}>{m.codigo}</Tag>
                    {m.semestre && <Tag color={C.textMuted}>Sem. {m.semestre}</Tag>}
                  </div>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{m.creditos} créditos</span>
                </div>
                {cursos.length > 0 && <Tag color={C.green}>{cursos.length} grupo{cursos.length > 1 ? "s" : ""}</Tag>}
                <Btn onClick={() => { setModal(m); setEditando(null); }} style={{ padding: "7px 14px", fontSize: 12 }}>+ Grupo</Btn>
              </div>
              {cursos.length > 0 && (
                <div style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
                  {cursos.map(c => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", borderBottom: `1px solid ${C.border}22`, flexWrap: "wrap" }}>
                      <Tag color={C.green}>{c.codigoGrupo}</Tag>
                      <span style={{ fontSize: 12, color: C.textSub, flex: 1 }}>
                        {c.docente ? `${c.docente.nombre1} ${c.docente.apellidoP}` : "Docente asignado"} · Cupo: {c.cupoMaximo}
                      </span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.horarios?.map((h, i) => <Tag key={i} color={C.textMuted}>{h.diaSemana} {h.horaInicio?.slice(0, 5)}–{h.horaFin?.slice(0, 5)} · {h.aula}</Tag>)}
                      </div>
                      <Btn variant="ghost" onClick={() => { setModal(m); setEditando(c); }} style={{ padding: "4px 10px", fontSize: 11 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        Editar
                      </Btn>
                      <Btn variant="danger" onClick={() => setDeleteConfirm({ id: c.id, idMateria: m.id, grupo: c.codigoGrupo })} style={{ padding: "4px 10px", fontSize: 11 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 24 }}>
        <Btn variant="ghost" onClick={() => setConfirmBack(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Atrás
        </Btn>
      </div>
    </div>
  );
}

export default function GestionCursos() {
  const [step, setStep] = useState(1);
  const [periodo, setPeriodo] = useState(null);
  const [materias, setMaterias] = useState([]);
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
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
      <main style={{ maxWidth: 880, margin: "0 auto", padding: "36px 24px" }}>
        <StepBar step={step} />
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
          {step === 1 && <PasoPeriodo onNext={p => { setPeriodo(p); setStep(2); }} />}
          {step === 2 && <PasoOferta periodo={periodo} onNext={m => { setMaterias(m); setStep(3); }} onBack={() => setStep(1)} />}
          {step === 3 && <PasoCursos periodo={periodo} materias={materias} onBack={() => setStep(2)} />}
        </div>
      </main>
    </div>
  );
}