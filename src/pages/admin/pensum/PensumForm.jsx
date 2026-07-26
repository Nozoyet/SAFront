import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import ConfirmModal from "../../../components/common/ConfirmModal";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

let tempIdCounter = 0;
function newTempId() { return `temp_${++tempIdCounter}`; }

export default function PensumForm() {
  const navigate = useNavigate();
    const [searchParams] = useSearchParams();

  const [carreras, setCarreras] = useState([]);
  const [form, setForm] = useState({ idCarrera: searchParams.get("idCarrera") || "", anioCreacion: new Date().getFullYear().toString(), estado: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [materias, setMaterias] = useState([]);
  const [pensumsExistentes, setPensumsExistentes] = useState([]);

  const [modal, setModal] = useState(null);
  const [mForm, setMForm] = useState({ codigo: "", nombre: "", creditos: "", semestre: "", descripcion: "", idPrerequisito: "", estado: 1 });
  const [saving, setSaving] = useState(false);
  const [mError, setMError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [existingMaterias, setExistingMaterias] = useState([]);
  const [showExistingModal, setShowExistingModal] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [prereqOverrides, setPrereqOverrides] = useState({});
  const [busquedaMateria, setBusquedaMateria] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/carrera"),
      api.get("/pensum"),
    ]).then(([carrerasRes, pensumsRes]) => {
      setCarreras(carrerasRes.data.data);
      setPensumsExistentes(pensumsRes.data.data);
    });
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const pensumAnterior = (() => {
    if (!form.idCarrera || !form.anioCreacion) return null;
    return pensumsExistentes
      .filter((p) => p.idCarrera == form.idCarrera && p.anioCreacion < Number(form.anioCreacion))
      .sort((a, b) => b.anioCreacion - a.anioCreacion)[0] || null;
  })();

  const copiarPensumAnterior = async () => {
    if (!pensumAnterior) return;
    try {
      const res = await api.get(`/pensum/${pensumAnterior.id}`);
      const origMaterias = res.data.data.materias || [];
      const nuevas = origMaterias.map((m) => ({
        _tempId: newTempId(),
        codigo: m.codigo,
        nombre: m.nombre,
        creditos: m.creditos,
        semestre: m.semestre,
        descripcion: m.descripcion || "",
        _prereqTemp: m.idPrerequisito ? null : null,
        estado: m.estado ? 1 : 0,
      }));
      const mapaViejoANuevo = {};
      origMaterias.forEach((m, i) => { mapaViejoANuevo[m.id] = nuevas[i]._tempId; });
      nuevas.forEach((n, i) => {
        const orig = origMaterias[i];
        n._prereqTemp = orig.idPrerequisito ? mapaViejoANuevo[orig.idPrerequisito] || null : null;
      });
      setMaterias((prev) => [...prev, ...nuevas]);
    } catch (err) {
      setError("Error al cargar materias del pensum anterior");
    }
  };

  const abrirExistentes = async () => {
    setShowExistingModal(true);
    setSelectedExisting([]);
    setPrereqOverrides({});
    setBusquedaMateria("");
    if (existingMaterias.length > 0) return;
    setLoadingExisting(true);
    try {
      const res = await api.get("/materia");
      setExistingMaterias(res.data.data);
    } catch (err) {
      setError("Error al cargar materias existentes");
    } finally {
      setLoadingExisting(false);
    }
  };

  const toggleExisting = (m) => {
    setSelectedExisting((prev) =>
      prev.some((x) => x.id === m.id)
        ? prev.filter((x) => x.id !== m.id)
        : [...prev, m]
    );
  };

  const handlePrereqOverride = (mId, prereqId) => {
    setPrereqOverrides((prev) => ({ ...prev, [mId]: prereqId }));
  };

  const agregarSeleccionadas = () => {
    const newTempIds = {};
    const nuevas = selectedExisting.map((m) => {
      const tempId = newTempId();
      newTempIds[m.id] = tempId;
      return {
        _tempId: tempId,
        codigo: m.codigo,
        nombre: m.nombre,
        creditos: m.creditos,
        semestre: m.semestre,
        descripcion: m.descripcion || "",
        _prereqTemp: null,
        estado: m.estado ? 1 : 0,
      };
    });
    nuevas.forEach((n) => {
      const orig = selectedExisting.find((m) => newTempIds[m.id] === n._tempId);
      const override = prereqOverrides[orig?.id];
      const targetPrereq = override !== undefined ? override : (orig?.idPrerequisito || null);
      if (targetPrereq && newTempIds[targetPrereq]) {
        n._prereqTemp = newTempIds[targetPrereq];
      }
    });
    setMaterias((prev) => [...prev, ...nuevas]);
    setShowExistingModal(false);
  };

  const preReqNombre = (tempId) => {
    if (!tempId) return "—";
    const m = materias.find((x) => x._tempId === tempId);
    return m ? `${m.codigo} — ${m.nombre}` : "—";
  };

  const dependientes = (tempId) => {
    return materias.filter((m) => m._prereqTemp === tempId);
  };

  const abrirNueva = () => {
    setMForm({ codigo: "", nombre: "", creditos: "", semestre: "", descripcion: "", idPrerequisito: "", estado: 1 });
    setMError("");
    setModal("nueva");
  };

  const abrirEditar = (m) => {
    setMForm({
      codigo: m.codigo || "",
      nombre: m.nombre || "",
      creditos: m.creditos?.toString() || "",
      semestre: m.semestre?.toString() || "",
      descripcion: m.descripcion || "",
      idPrerequisito: m._prereqTemp || "",
      estado: m.estado ? 1 : 0,
    });
    setMError("");
    setModal({ tipo: "editar", tempId: m._tempId });
  };

  const handleMChange = (e) => setMForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const guardarMateriaLocal = (e) => {
    e.preventDefault();
    setMError("");
     if (!mForm.codigo.trim()) {
    setMError("El código es obligatorio");
    return;
  }
  if (!mForm.nombre.trim()) {
    setMError("El nombre es obligatorio");
    return;
  }
  if (!mForm.creditos || Number(mForm.creditos) < 1) {
    setMError("Los créditos deben ser al menos 1");
    return;
  }
  if (!mForm.semestre) {
    setMError("Debes seleccionar un semestre");
    return;
  }

    if (materias.some((m) => m._tempId !== modal?.tempId && m.codigo === mForm.codigo)) {
      setMError("Ya existe una materia con ese código");
      return;
    }

    if (modal?.tipo === "editar") {
      setMaterias((prev) => prev.map((m) =>
        m._tempId === modal.tempId
          ? { ...m, codigo: mForm.codigo, nombre: mForm.nombre, creditos: Number(mForm.creditos), semestre: mForm.semestre ? Number(mForm.semestre) : null, descripcion: mForm.descripcion, _prereqTemp: mForm.idPrerequisito || null, estado: Number(mForm.estado) }
          : m
      ));
    } else {
      setMaterias((prev) => [...prev, {
        _tempId: newTempId(),
        codigo: mForm.codigo,
        nombre: mForm.nombre,
        creditos: Number(mForm.creditos),
        semestre: mForm.semestre ? Number(mForm.semestre) : null,
        descripcion: mForm.descripcion,
        _prereqTemp: mForm.idPrerequisito || null,
        estado: Number(mForm.estado),
      }]);
    }
    setModal(null);
  };

  const eliminarMateriaLocal = () => {
    if (!deleteTarget) return;
    setMaterias((prev) => prev.filter((m) => m._tempId !== deleteTarget._tempId));
    setDeleteTarget(null);
  };

 const validarFormulario = () => {
  if (!form.idCarrera) {
    return "Debes seleccionar una carrera.";
  }
  if (!form.anioCreacion || !/^\d{4}$/.test(form.anioCreacion.toString())) {
    return "El año de creación debe tener 4 dígitos.";
  }
  const anio = Number(form.anioCreacion);
  const anioActual = new Date().getFullYear();
  if (anio < anioActual) {
    return `El año de creación no puede ser anterior a ${anioActual}.`;
  }
  if (anio > 2099) {
    return "El año de creación no puede ser mayor a 2099.";
  }
  
  return null;
};

const guardarTodo = async () => {
  const errorValidacion = validarFormulario();
  if (errorValidacion) {
    setError(errorValidacion);
    return;
  }

  setLoading(true);
  setError("");
  try {
    const pensumRes = await api.post("/pensum", form);
    const pensumId = pensumRes.data.data.id;

    const tempAReal = {};
    const errores = [];
    for (const m of materias) {
      try {
        const payload = {
          codigo: m.codigo,
          nombre: m.nombre,
          creditos: m.creditos,
          semestre: m.semestre,
          descripcion: m.descripcion,
          idPensum: pensumId,
          idPrerequisito: null,
          estado: m.estado,
        };
        const res = await api.post("/materia", payload);
        tempAReal[m._tempId] = res.data.data.id;
      } catch (err) {
        errores.push(`${m.codigo} — ${m.nombre}`);
      }
    }

    for (const m of materias) {
      if (m._prereqTemp && tempAReal[m._tempId]) {
        const realPrereqId = tempAReal[m._prereqTemp];
        if (realPrereqId) {
          try {
            await api.put(`/materia/${tempAReal[m._tempId]}`, { idPrerequisito: realPrereqId });
          } catch (err) { }
        }
      }
    }

    if (errores.length > 0) {
      setError(`Pensum creado, pero no se pudieron agregar estas materias (código duplicado): ${errores.join(", ")}`);
      setTimeout(() => navigate("/admin/pensum"), 2000);
    } else {
      navigate("/admin/pensum");
    }
  } catch (err) {
    setError(err.response?.data?.message || "Error al guardar el pensum");
    setLoading(false);
    return;
  } finally {
    setLoading(false);
  }
};
  const creditosReales = materias.reduce((s, m) => s + (m.creditos || 0), 0);
  const semsDisponibles = [...new Set(materias.map((m) => m.semestre).filter(Boolean))].sort((a, b) => a - b);
  const semActual = Number(mForm.semestre);

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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Nuevo Pensum</span>
        </div>
      </header>
      <main style={styles.contentContainer}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>Nuevo pensum</h1>
            <p style={styles.sub}>Crea un nuevo plan de estudio con sus materias</p>
          </div>
          <div style={styles.cardBody}>
            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.grid2}>
              <div style={styles.field}>
  <label style={styles.label}>Carrera</label>
  <select name="idCarrera" value={form.idCarrera} onChange={handleChange} style={styles.input} required>
    <option value="">Seleccionar carrera</option>
    {carreras.map((c) => (
      <option key={c.id} value={c.id}>{c.nombre} ({c.codigo})</option>
    ))}
  </select>
  <button
    type="button"
    onClick={() => navigate("/admin/carreras")}
    style={{ background: "none", border: "none", color: "#1D4ED8", fontSize: "0.78rem", padding: 0, marginTop: 4, cursor: "pointer", textAlign: "left" }}
  >
    + ¿No existe la carrera? Créala aquí
  </button>
</div>

              <div style={styles.field}>
                <label style={styles.label}>Año de creación</label>
                <input name="anioCreacion" type="number" min={new Date().getFullYear()} max="2099" value={form.anioCreacion} onChange={handleChange} style={styles.input} required />
              </div>

              

              <div style={styles.field}>
                <label style={styles.label}>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} style={styles.input}>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
              </div>
            </div>

            <hr style={{ margin: "1.5rem 0", border: "none", borderTop: "2px dashed #e2e8f0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>Materias del pensum</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {pensumAnterior && materias.length === 0 && (
                  <button onClick={copiarPensumAnterior} style={{ ...styles.btnOutline, color: "#d97706", borderColor: "#fde68a", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2a2 2 0 0 1 2-2h5.5L14 3.5V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" /><path d="M2 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-.5a.5.5 0 0 0-1 0V14a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h.5a.5.5 0 0 0 0-1H2z" /></svg>
                    Copiar de {pensumAnterior.anioCreacion}
                  </button>
                )}
                <button onClick={abrirExistentes} style={{ ...styles.btnOutline, color: "#1D4ED8", borderColor: "#bfdbfe", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 0a.5.5 0 0 1 .5.5V2h3V.5a.5.5 0 0 1 1 0V2h2a2 2 0 0 1 2 2v.5H1V4a2 2 0 0 1 2-2h2V.5a.5.5 0 0 1 .5-.5zM1 6h14v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6zm6 3H5.5a.5.5 0 0 0 0 1H7v1.5a.5.5 0 0 0 1 0V10h1.5a.5.5 0 0 0 0-1H8V7.5a.5.5 0 0 0-1 0V9z" /></svg>
                  Agregar existente</button>
                <button onClick={abrirNueva} style={styles.btnAdd}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#047857" }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "#059669" }}
                >+ Agregar materia</button>
              </div>
            </div>

            {materias.length === 0 ? (
              <div style={styles.empty}>
                <p>Aún no hay materias. {pensumAnterior ? "Puedes copiarlas del pensum anterior o" : ""} agrégalas una por una.</p>
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
                      <th style={styles.th}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materias.map((m) => {
                      const deps = dependientes(m._tempId);
                      return (
                        <tr key={m._tempId} style={styles.tr}>
                          <td style={{ ...styles.td, fontFamily: "monospace", fontWeight: 600, fontSize: "0.8rem" }}>{m.codigo}</td>
                          <td style={{ ...styles.td, fontWeight: 500 }}>{m.nombre}</td>
                          <td style={styles.td}>
                            {m.semestre ? <span style={{ ...styles.badgeSem, background: "#e0f2fe", color: "#0369a1" }}>Sem {m.semestre}</span> : "—"}
                          </td>
                          <td style={styles.td}>{m.creditos}</td>
                          <td style={styles.td}>
                            {m._prereqTemp ? (
                              <span style={{ fontFamily: "monospace", fontSize: "0.78rem", background: "#fef3c7", padding: "0.1rem 0.4rem", borderRadius: 4 }}>{preReqNombre(m._prereqTemp)}</span>
                            ) : <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>Ninguno</span>}
                          </td>
                          <td style={styles.td}>
                            {deps.length > 0 ? <span style={{ ...styles.badgeSem, background: "#f0fdfa", color: "#0d9488" }}>{deps.length}</span> : <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>—</span>}
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, background: m.estado ? "#dcfce7" : "#fef2f2", color: m.estado ? "#16a34a" : "#dc2626" }}>
                              {m.estado ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => abrirEditar(m)} style={{ ...styles.btnSm, color: "#1D4ED8", borderColor: "#bfdbfe", display: "inline-flex", alignItems: "center", gap: 4 }} title="Editar">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Editar
                              </button>
                              <button onClick={() => setDeleteTarget(m)} style={{ ...styles.btnSm, color: "#dc2626", borderColor: "#fecaca", display: "inline-flex", alignItems: "center", gap: 4 }} title="Eliminar">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {materias.length > 0 && (
              <div style={{ marginTop: "0.75rem", padding: "0.6rem 1rem", background: "#fafafa", borderRadius: 8, display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem", color: "#475569" }}>
                <span><strong>Total materias:</strong> {materias.length}</span>
                <span><strong>Créditos:</strong> {creditosReales}</span>
                {semsDisponibles.length > 0 && <span><strong>Semestres:</strong> 1 - {Math.max(...semsDisponibles)}</span>}
              </div>
            )}

            <div style={styles.actions}>
              <button onClick={guardarTodo} disabled={loading} style={{ ...styles.btnPrimary, opacity: loading ? 0.6 : 1 }}>
                {loading ? "Guardando..." : "Crear pensum con materias"}
              </button>
              <button type="button" onClick={() => navigate("/admin/pensum")} style={styles.btnSecondary}>Cancelar</button>
            </div>
          </div>
        </div>


        {modal && (
          <div style={styles.overlay} onClick={() => setModal(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>
                  {modal?.tipo === "editar" ? "Editar materia" : "Nueva materia"}
                </h3>
                <button onClick={() => setModal(null)} style={styles.modalClose}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <form onSubmit={guardarMateriaLocal} noValidate style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {mError && <div style={styles.error}>{mError}</div>}

                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <label style={styles.label}>Código *</label>
                    <input name="codigo" value={mForm.codigo} onChange={handleMChange} style={styles.input} required placeholder="Ej: GAST101" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Créditos *</label>
                    <input name="creditos" type="number" min="1" max="20" value={mForm.creditos} onChange={handleMChange} style={styles.input} required />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Semestre</label>
                    <select name="semestre" value={mForm.semestre} onChange={handleMChange} style={styles.input}>
                      <option value="">Seleccionar</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Semestre {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Estado</label>
                    <select name="estado" value={mForm.estado} onChange={handleMChange} style={styles.input}>
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Nombre *</label>
                  <input name="nombre" value={mForm.nombre} onChange={handleMChange} style={styles.input} required placeholder="Nombre completo de la materia" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Descripción</label>
                  <textarea name="descripcion" rows="2" value={mForm.descripcion} onChange={handleMChange} style={{ ...styles.input, resize: "vertical", minHeight: 60, fontFamily: "inherit" }} placeholder="Breve descripción" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Prerrequisito</label>
                  <select name="idPrerequisito" value={mForm.idPrerequisito} onChange={handleMChange} style={styles.input}>
                    <option value="">Sin prerrequisito</option>
                    {semActual > 0 && materias.filter((m) => m.semestre && Number(m.semestre) < semActual && m._tempId !== modal?.tempId).length === 0 && (
                      <option value="" disabled>— No hay materias de semestres anteriores —</option>
                    )}
                    {[...new Set(materias.filter((m) => {
                      if (m._tempId === modal?.tempId) return false;
                      if (semActual && m.semestre) return Number(m.semestre) < semActual;
                      return true;
                    }).map((m) => m.semestre).filter(Boolean))].sort((a, b) => a - b).map((sem) => (
                      <optgroup key={sem} label={`Semestre ${sem}`}>
                        {materias.filter((m) => m.semestre === sem && m._tempId !== modal?.tempId).map((m) => (
                          <option key={m._tempId} value={m._tempId}>{m.codigo} — {m.nombre} ({m.creditos} cr)</option>
                        ))}
                      </optgroup>
                    ))}
                    {materias.filter((m) => !m.semestre && m._tempId !== modal?.tempId).length > 0 && (
                      <optgroup label="Sin semestre">
                        {materias.filter((m) => !m.semestre && m._tempId !== modal?.tempId).map((m) => (
                          <option key={m._tempId} value={m._tempId}>{m.codigo} — {m.nombre} ({m.creditos} cr)</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {semActual > 0 && (
                    <div style={{ marginTop: "0.3rem", fontSize: "0.72rem", color: "#64748b" }}>
                      {materias.filter((m) => m.semestre && Number(m.semestre) < semActual).length > 0
                        ? `Solo materias de semestres anteriores al ${semActual}°`
                        : `No hay materias antes del ${semActual}°`}
                    </div>
                  )}
                  {mForm.idPrerequisito && (
                    <div style={{ marginTop: "0.4rem", padding: "0.4rem 0.6rem", background: "#f0fdfa", borderRadius: 6, fontSize: "0.78rem", color: "#0d9488", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      Prerrequisito: <strong>{preReqNombre(mForm.idPrerequisito)}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setModal(null)} style={styles.btnSecondary}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                    {modal?.tipo === "editar" ? "Actualizar" : "Agregar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showExistingModal && (
          <div style={styles.overlay} onClick={() => setShowExistingModal(false)}>
            <div style={styles.modalGrande} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>
                  Materias existentes en el sistema
                </h3>
                <button onClick={() => setShowExistingModal(false)} style={styles.modalClose}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div style={{ padding: "1.25rem", maxHeight: "60vh", overflowY: "auto" }}>
                <input
                  type="text"
                  placeholder="Buscar materia por nombre..."
                  value={busquedaMateria}
                  onChange={(e) => setBusquedaMateria(e.target.value)}
                  style={{
                    width: "100%", padding: "0.6rem 0.85rem", marginBottom: "1rem",
                    border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.85rem",
                    color: "#0f172a", background: "#f8fafc", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {loadingExisting ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
                    <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
                    <p style={{ margin: 0 }}>Cargando materias...</p>
                  </div>
                ) : existingMaterias.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No hay materias registradas en el sistema.</div>
                ) : (
                  (() => {
                    const filtradas = existingMaterias.filter((m) =>
                      !busquedaMateria.trim() || m.nombre.toLowerCase().includes(busquedaMateria.toLowerCase())
                    );
                    if (filtradas.length === 0) {
                      return <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No se encontraron materias con ese nombre.</div>;
                    }
                    const grupos = {};
                    filtradas.forEach((m) => {
                      const key = m.pensum?.carrera?.nombre || "Sin carrera";
                      if (!grupos[key]) grupos[key] = {};
                      const pensumKey = m.pensum ? `Pensum ${m.pensum.anioCreacion}` : "Sin pensum";
                      if (!grupos[key][pensumKey]) grupos[key][pensumKey] = [];
                      grupos[key][pensumKey].push(m);
                    });
                    const yaEnLocal = new Set(materias.map((m) => m.codigo));
                    return Object.entries(grupos).map(([carrera, pensums]) => (
                      <div key={carrera} style={{ marginBottom: "1rem" }}>
                        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#0f172a", fontWeight: 600 }}>{carrera}</h4>
                        {Object.entries(pensums).map(([pensumLabel, ms]) => (
                          <div key={pensumLabel} style={{ marginLeft: "0.75rem", marginBottom: "0.75rem" }}>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.25rem", fontWeight: 500 }}>{pensumLabel}</div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                              <thead>
                                <tr>
                                  <th style={{ width: 32 }}></th>
                                  <th style={styles.thEx}>Código</th>
                                  <th style={styles.thEx}>Nombre</th>
                                  <th style={styles.thEx}>Sem</th>
                                  <th style={styles.thEx}>Cr</th>
                                  <th style={styles.thEx}>Prerreq.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ms.map((m) => (
                                  <tr key={m.id} style={styles.trEx}>
                                    <td style={{ ...styles.tdEx, textAlign: "center" }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedExisting.some((x) => x.id === m.id)}
                                        onChange={() => toggleExisting(m)}
                                        style={{ cursor: "pointer" }}
                                      />
                                    </td>
                                    <td style={{ ...styles.tdEx, fontFamily: "monospace", fontWeight: 600, fontSize: "0.78rem" }}>{m.codigo}</td>
                                    <td style={{ ...styles.tdEx, fontWeight: 500 }}>
                                      {m.nombre}
                                      {yaEnLocal.has(m.codigo) && <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "#d97706", background: "#fef3c7", padding: "0.05rem 0.35rem", borderRadius: 4 }}>ya agregada</span>}
                                    </td>
                                    <td style={styles.tdEx}>{m.semestre || "—"}</td>
                                    <td style={styles.tdEx}>{m.creditos}</td>
                                    <td style={styles.tdEx}>
                                      {selectedExisting.some((x) => x.id === m.id) ? (
                                        <select
                                          value={prereqOverrides[m.id] !== undefined ? prereqOverrides[m.id] : (m.idPrerequisito || "")}
                                          onChange={(e) => handlePrereqOverride(m.id, e.target.value === "" ? null : Number(e.target.value))}
                                          style={styles.selectMini}
                                        >
                                          <option value="">Sin prerreq.</option>
                                          {selectedExisting.filter((x) => x.id !== m.id).map((x) => {
                                            const nom = x.codigo.length > 18 ? x.codigo : `${x.codigo} — ${x.nombre.slice(0, 20)}`;
                                            return <option key={x.id} value={x.id}>{nom}</option>;
                                          })}
                                        </select>
                                      ) : m.prerrequisito ? (
                                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#475569" }}>{m.prerrequisito.codigo}</span>
                                      ) : (
                                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ));
                  })()
                )}
              </div>
              <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "#475569" }}>
                  {selectedExisting.length > 0 ? `${selectedExisting.length} materia(s) seleccionada(s)` : "Selecciona materias para agregar"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowExistingModal(false)} style={styles.btnSecondary}>Cancelar</button>
                  <button onClick={agregarSeleccionadas} disabled={selectedExisting.length === 0} style={{ ...styles.btnPrimary, opacity: selectedExisting.length === 0 ? 0.5 : 1 }}>
                    Agregar seleccionadas
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Eliminar materia"
          message={
            deleteTarget
              ? `¿Estás seguro de eliminar "${deleteTarget.nombre}" (${deleteTarget.codigo})?` +
              (dependientes(deleteTarget._tempId).length > 0
                ? `\n\nEs prerrequisito de ${dependientes(deleteTarget._tempId).length} materia(s).`
                : "")
              : ""
          }
          onConfirm={eliminarMateriaLocal}
          onCancel={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh" },
  contentContainer: { maxWidth: 1100, margin: "0 auto", padding: "2rem 2.5rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
  card: { background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" },
  cardHeader: { background: "#1e293b", padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0" },
  title: { fontSize: "1.15rem", fontWeight: 700, color: "white", margin: 0, letterSpacing: "-0.01em" },
  sub: { fontSize: "0.82rem", color: "#94a3b8", margin: "0.25rem 0 0" },
  cardBody: { padding: "1.75rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem", color: "#0f172a", background: "#f8fafc", outline: "none" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.84rem", color: "#dc2626", marginBottom: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "start" },
  actions: { display: "flex", gap: 10, marginTop: "1.5rem" },
  btnPrimary: { padding: "0.65rem 1.5rem", background: "#1D4ED8", color: "white", border: "none", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  btnSecondary: { padding: "0.65rem 1.5rem", background: "white", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" },
  btnOutline: { padding: "0.4rem 0.85rem", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer" },
  btnAdd: { padding: "0.45rem 1rem", background: "#059669", color: "white", border: "none", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" },
  btnSm: { padding: "0.2rem 0.5rem", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 4, fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", lineHeight: 1 },
  tableWrap: { background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" },
  th: { textAlign: "left", padding: "0.65rem 0.85rem", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "0.55rem 0.85rem", color: "#1e293b" },
  badge: { padding: "0.15rem 0.5rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 },
  badgeSem: { padding: "0.1rem 0.45rem", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600 },
  empty: { textAlign: "center", padding: "2rem", color: "#64748b", background: "#fafafa", borderRadius: 8, border: "1px dashed #e2e8f0" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "white", borderRadius: 16, width: "90%", maxWidth: 600, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" },
  modalGrande: { background: "white", borderRadius: 16, width: "90%", maxWidth: 720, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", overflow: "hidden" },
  selectMini: { padding: "0.2rem 0.3rem", fontSize: "0.75rem", border: "1px solid #d1d5db", borderRadius: 4, maxWidth: 170, color: "#1e293b", background: "white" },
  thEx: { textAlign: "left", padding: "0.4rem 0.6rem", color: "#64748b", fontWeight: 600, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" },
  tdEx: { padding: "0.35rem 0.6rem", color: "#1e293b", borderBottom: "1px solid #f1f5f9" },
  trEx: { borderBottom: "1px solid #f1f5f9" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" },
  modalClose: { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8", padding: "0.2rem" },
};
