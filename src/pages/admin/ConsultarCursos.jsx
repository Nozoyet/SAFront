import { useState, useEffect, useCallback } from "react";
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

// ── UI ────────────────────────────────────────────────────────────────────────
function Tag({ children, color = C.accent }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>;
}

function Btn({ children, onClick, variant = "primary", disabled, type = "button", style, title }) {
  const vs = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.textMuted, border: `1.5px solid ${C.border}` },
    success: { background: C.green, color: "#052e16", border: "none" },
    danger: { background: "transparent", color: C.red, border: `1.5px solid ${C.red}` },
    warning: { background: C.amber, color: "#1c1000", border: "none" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} style={{
      ...vs[variant],
      padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", transition: "all .15s", ...style
    }}>
      {children}
    </button>
  );
}

function Alert({ msg, type = "error" }) {
  if (!msg) return null;
  const col = { error: C.red, success: C.green, warning: C.amber, info: C.accent }[type];
  return <div style={{ background: col + "18", border: `1px solid ${col}44`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: col, marginBottom: 16 }}>{msg}</div>;
}

function FieldWrap({ label, required, error, style, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: C.textSub, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>}
      {children}
      {error && <span style={{ color: C.red, fontSize: 11, fontWeight: 500 }}>⚠ {error}</span>}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required, error, style, placeholder, min }) {
  return (
    <FieldWrap label={label} required={required} error={error} style={style}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min}
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

function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmar", variant = "danger" }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, boxShadow: C.shadow }}>
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

// ── Validación choque docente dentro del período ───────────────────────────────
function detectarChoque(idDocente, nuevosHorarios, todosLosCursosPeriodo, excluirCursoId = null) {
  const cursosDocente = todosLosCursosPeriodo.filter(
    c => String(c.idDocente) === String(idDocente) && c.id !== excluirCursoId
  );
  for (const curso of cursosDocente) {
    for (const ex of (curso.horarios || [])) {
      for (const nuevo of nuevosHorarios) {
        if (nuevo.diaSemana === ex.diaSemana && nuevo.horaInicio && nuevo.horaFin) {
          if (nuevo.horaInicio < ex.horaFin && nuevo.horaFin > ex.horaInicio) {
            return `El docente ya tiene clase el ${ex.diaSemana} de ${ex.horaInicio} a ${ex.horaFin} en este período (grupo: ${curso.codigoGrupo})`;
          }
        }
      }
    }
  }
  return null;
}

// ── HorarioForm reutilizable ──────────────────────────────────────────────────
function HorarioForm({ horarios, onChange, errores = {} }) {
  const set = (idx, k) => e => { const h = [...horarios]; h[idx] = { ...h[idx], [k]: e.target.value }; onChange(h); };
  const add = () => onChange([...horarios, { diaSemana: "Lunes", horaInicio: "", horaFin: "", aula: "", edificio: "", turno: "" }]);
  const remove = idx => onChange(horarios.filter((_, i) => i !== idx));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em" }}>Horarios</span>
        <Btn variant="ghost" onClick={add} style={{ padding: "4px 12px", fontSize: 12 }}>+ Añadir bloque</Btn>
      </div>
      {errores.horariosGeneral && <span style={{ color: C.red, fontSize: 11, display: "block", marginBottom: 8 }}>⚠ {errores.horariosGeneral}</span>}
      {horarios.map((h, idx) => {
        const eH = errores.horarios?.[idx] || {};
        return (
          <div key={idx} style={{ background: C.bg, border: `1.5px solid ${Object.keys(eH).length ? C.red : C.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
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
              <Sel label="Turno" value={h.turno || ""} onChange={set(idx, "turno")} options={turnos.map(t => ({ value: t, label: t }))} placeholder="— Opcional —" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Modal de edición completa ──────────────────────────────────────────────────
function EditModal({ open, curso, docentes, cursosDelPeriodo, onSave, onClose }) {
  const emptyHorario = () => ({ diaSemana: "Lunes", horaInicio: "", horaFin: "", aula: "", edificio: "", turno: "" });
  const [form, setForm] = useState({ idDocente: "", cupoMaximo: "", horarios: [] });
  const [saving, setSaving] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState("");
  const [fe, setFe] = useState({});

  useEffect(() => {
    if (!open || !curso) return;
    setForm({
      idDocente: String(curso.idDocente || ""),
      cupoMaximo: String(curso.cupoMaximo || ""),
      horarios: (curso.horarios || []).map(h => ({
        diaSemana: h.diaSemana, horaInicio: h.horaInicio?.slice(0, 5) || "",
        horaFin: h.horaFin?.slice(0, 5) || "", aula: h.aula || "",
        edificio: h.edificio || "", turno: h.turno || "",
      })),
    });
    setFe({}); setErrorGeneral("");
  }, [open, curso]);

  if (!open) return null;

  const validar = () => {
    const errs = {};
    if (!form.idDocente) errs.idDocente = "Selecciona un docente.";
    if (!form.cupoMaximo) errs.cupoMaximo = "El cupo es obligatorio.";
    else if (parseInt(form.cupoMaximo) < (curso.inscritosCount || 0))
      errs.cupoMaximo = `El cupo no puede ser menor a los inscritos actuales (${curso.inscritosCount}).`;
    else if (parseInt(form.cupoMaximo) < 1) errs.cupoMaximo = "Mínimo 1.";
    if (!form.horarios || form.horarios.length === 0) {
      errs.horariosGeneral = "Agrega al menos un bloque.";
    } else {
      const errH = [];
      form.horarios.forEach((h, i) => {
        const e = {};
        if (!h.horaInicio) e.horaInicio = "Requerida.";
        if (!h.horaFin) e.horaFin = "Requerida.";
        if (h.horaInicio && h.horaFin && h.horaInicio >= h.horaFin) e.horaFin = "Debe ser mayor a inicio.";
        if (!h.aula?.trim()) e.aula = "Requerida.";
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
    // Validar choque docente dentro del período
    const choque = detectarChoque(form.idDocente, form.horarios, cursosDelPeriodo, curso.id);
    if (choque) { setErrorGeneral(choque); return; }
    setSaving(true);
    try {
      const res = await api.put(`/cursos/${curso.id}`, {
        idDocente: form.idDocente,
        cupoMaximo: Number(form.cupoMaximo),
        horarios: form.horarios,
      });
      onSave(res.data.data); onClose();
    } catch (err) { setErrorGeneral(err.response?.data?.message || "Error al guardar."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "92vh", overflowY: "auto", padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 3px" }}>Editar curso — {curso?.codigoGrupo}</h3>
            <span style={{ fontSize: 12, color: C.textMuted }}>{curso?.materia?.nombre} · {curso?.materia?.codigo}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 20, display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {errorGeneral && <Alert msg={errorGeneral} type="error" />}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
            <Sel label="Docente" value={form.idDocente}
              onChange={e => { setFe(p => ({ ...p, idDocente: "" })); setForm(p => ({ ...p, idDocente: e.target.value })); }}
              options={docentes.map(d => ({ value: d.id, label: d.nombre }))} placeholder="Selecciona un docente"
              required error={fe.idDocente} style={{ gridColumn: "1 / -1" }} />
            <Input label="Cupo máximo" value={form.cupoMaximo}
              onChange={e => { setFe(p => ({ ...p, cupoMaximo: "" })); setForm(p => ({ ...p, cupoMaximo: e.target.value })); }}
              type="number" min="1" required error={fe.cupoMaximo} />
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>
                Inscritos actuales: <strong style={{ color: curso?.inscritosCount > 0 ? C.amber : C.green }}>{curso?.inscritosCount || 0}</strong>
              </span>
            </div>
          </div>

          <HorarioForm
            horarios={form.horarios}
            onChange={h => { setFe(p => ({ ...p, horarios: undefined, horariosGeneral: "" })); setForm(p => ({ ...p, horarios: h })); }}
            errores={fe} />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Btn>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ConsultaCursos() {
  const navigate = useNavigate();
  const [periodos, setPeriodos] = useState([]);
  const [todasCarreras, setTodasCarreras] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtros
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroCodigo, setFiltroCodigo] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  // Modales
  const [editingCurso, setEditingCurso] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const toast = (msg, type = "success") => {
    if (type === "success") setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(""); setError(""); }, 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resCursos, resDocentes, resCarreras] = await Promise.all([
        api.get("/cursos/historial-periodos"),
        api.get("/docentes"),
        api.get("/carrera"),
      ]);
      // Período más reciente primero (ya viene ordenado del backend, pero por si acaso)
      const ordenados = (resCursos.data.data || []).sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
      setPeriodos(ordenados);
      setDocentes(resDocentes.data.data || []);
      setTodasCarreras(resCarreras.data.data || []);
    } catch (err) { toast("Error al cargar el historial de cursos.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtrado
  const periodosFiltrados = periodos.filter(p => {
    if (filtroCarrera && String(p.idCarrera) !== String(filtroCarrera)) return false;
    if (filtroCodigo && !p.codigo.toLowerCase().includes(filtroCodigo.toLowerCase())) return false;
    if (filtroDesde && p.fechaInicio < filtroDesde) return false;
    if (filtroHasta && p.fechaFin > filtroHasta) return false;
    return true;
  });

  const hoy = new Date().toISOString().slice(0, 10);
  const esPeriodoVigente = p => p.fechaInicio <= hoy && p.fechaFin >= hoy;

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/cursos/${deleteConfirm.id}`);
      toast("Curso eliminado exitosamente.");
      fetchData();
    } catch (err) { toast(err.response?.data?.message || "No se pudo eliminar el curso.", "error"); }
    setDeleteConfirm(null);
  };

  const handleSaveEdit = (cursoActualizado) => {
    // Actualizar localmente sin recargar todo
    setPeriodos(prev => prev.map(p => ({
      ...p,
      cursos: (p.cursos || []).map(c => c.id === cursoActualizado.id ? {
        ...c,
        idDocente: cursoActualizado.idDocente,
        cupoMaximo: cursoActualizado.cupoMaximo,
        horarios: cursoActualizado.horarios,
        docente: cursoActualizado.docente,
      } : c),
    })));
    toast("Curso actualizado correctamente.");
  };

  // Todos los cursos del período del curso que se edita (para validar choque)
  const cursosDelPeriodoEditando = editingCurso
    ? (periodos.find(p => p.cursos?.some(c => c.id === editingCurso.id))?.cursos || [])
    : [];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ textAlign: "center", color: C.textMuted }}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
        <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
        <p style={{ margin: 0 }}>Cargando historial de cursos…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`@keyframes spin { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }`}</style>
      <ConfirmModal open={!!deleteConfirm} title="¿Eliminar este curso?"
        message={`Se eliminará el grupo "${deleteConfirm?.codigoGrupo}" de la materia "${deleteConfirm?.materia?.nombre}". Esta acción no se puede deshacer.`}
        onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} confirmLabel="Eliminar" />

      <EditModal open={!!editingCurso} curso={editingCurso} docentes={docentes}
        cursosDelPeriodo={cursosDelPeriodoEditando}
        onSave={handleSaveEdit} onClose={() => setEditingCurso(null)} />

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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Gestión de Cursos</span>
        </div>
      </header>

      <main style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px" }}>
        <Alert msg={error} type="error" />
        <Alert msg={success} type="success" />

        {/* Panel de filtros */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24, boxShadow: C.shadow }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px" }}>Filtros</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, alignItems: "end" }}>
            <Sel label="Carrera" value={filtroCarrera} onChange={e => setFiltroCarrera(e.target.value)}
              options={todasCarreras.map(c => ({ value: c.id, label: c.nombre }))} placeholder="Todas las carreras" />
            <Input label="Código período" value={filtroCodigo} onChange={e => setFiltroCodigo(e.target.value)} placeholder="Ej: 2025-1S" />
            <Input label="Desde" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} type="date" />
            <Input label="Hasta" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} type="date" />
          </div>
          {(filtroCarrera || filtroCodigo || filtroDesde || filtroHasta) && (
            <button onClick={() => { setFiltroCarrera(""); setFiltroCodigo(""); setFiltroDesde(""); setFiltroHasta(""); }}
              style={{ background: "none", border: "none", color: C.accent, fontSize: 12, cursor: "pointer", marginTop: 10, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              Limpiar filtros
            </button>
          )}
        </div>

        {periodosFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.textMuted, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <polyline points="2 4 12 13 22 4" />
            </svg>
            <p style={{ margin: 0, fontWeight: 600 }}>No se encontraron períodos con los filtros aplicados</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {periodosFiltrados.map((p, idx) => {
              const vigente = esPeriodoVigente(p);
              const esPrimero = idx === 0;
              return (
                <div key={p.id} style={{ background: C.card, border: `2px solid ${vigente ? C.accent : C.border}`, borderRadius: 16, padding: 24, boxShadow: vigente ? `0 4px 20px ${C.accent}18` : C.shadow, transition: "box-shadow .2s" }}>

                  {/* Header del período */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{p.codigo}</h3>
                        {vigente && <Tag color={C.green}>● Período actual</Tag>}
                        {esPrimero && !vigente && <Tag color={C.accent}>Más reciente</Tag>}
                        {p.carrera && <Tag color={C.textMuted}>{p.carrera}</Tag>}
                      </div>
                      <span style={{ fontSize: 12, color: C.textMuted }}>
                        {new Date(p.fechaInicio + "T12:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                        {" — "}
                        {new Date(p.fechaFin + "T12:00:00").toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: C.accent }}>{p.cursos?.length || 0}</span>
                      <span style={{ fontSize: 11, color: C.textMuted }}>curso{(p.cursos?.length || 0) !== 1 ? "s" : ""}</span>
                    </div>
                  </div>

                  {/* Lista de cursos */}
                  {!p.cursos || p.cursos.length === 0 ? (
                    <p style={{ fontSize: 13, color: C.textSub, margin: "8px 0", fontStyle: "italic" }}>No se crearon cursos en este período.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {p.cursos.map(c => {
                        const inscritos = c.inscritosCount || 0;
                        const tieneInscritos = inscritos > 0;
                        const pct = Math.round((inscritos / c.cupoMaximo) * 100);
                        const cupoColor = pct >= 90 ? C.red : pct >= 70 ? C.amber : C.green;

                        return (
                          <div key={c.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                <Tag color={C.green}>{c.codigoGrupo}</Tag>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.materia?.nombre || "Materia"}</span>
                                <span style={{ fontSize: 12, color: C.textSub }}>({c.materia?.codigo})</span>
                                {c.materia?.creditos && <Tag color={C.textMuted}>{c.materia.creditos} cr.</Tag>}
                              </div>

                              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                  {c.docente ? c.docente.nombre : <span style={{ color: C.red }}>Sin docente</span>}
                                </span>
                                {/* Barra de cupo */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ width: 70, height: 5, background: C.border, borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: cupoColor, borderRadius: 99, transition: "width .3s" }} />
                                  </div>
                                  <span style={{ fontSize: 12, color: cupoColor, fontWeight: 600 }}>{inscritos}/{c.cupoMaximo}</span>
                                  <span style={{ fontSize: 11, color: C.textMuted }}>inscritos</span>
                                </div>
                              </div>

                              {c.horarios && c.horarios.length > 0 && (
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {c.horarios.map((h, i) => (
                                    <span key={i} style={{ fontSize: 11, background: "#e2e8f0", color: C.textMuted, padding: "2px 9px", borderRadius: 6 }}>
                                      {h.diaSemana} {h.horaInicio}–{h.horaFin} · {h.aula}{h.edificio ? ` (${h.edificio})` : ""}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Acciones */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                              <Btn variant="ghost" onClick={() => setEditingCurso({ ...c, _periodoId: p.id })} style={{ padding: "6px 12px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Editar
                              </Btn>
                              <Btn variant="danger" disabled={tieneInscritos}
                                title={tieneInscritos ? "No se puede eliminar: tiene estudiantes inscritos" : "Eliminar curso"}
                                onClick={() => setDeleteConfirm(c)} style={{ padding: "6px 12px" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                Eliminar
                              </Btn>
                              {tieneInscritos && (
                                <span style={{ fontSize: 10, color: C.amber, textAlign: "center", maxWidth: 100 }}>
                                  {inscritos} inscrito{inscritos !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}