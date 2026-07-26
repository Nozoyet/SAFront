import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import ConfirmModal from "../../../components/common/ConfirmModal";

const ADMIN_CONFIG = { color: "#7c3aed", bg: "#faf5ff", accent: "#ede9fe" };

export default function CarreraLista() {
  const navigate = useNavigate();
  const [carreras, setCarreras] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ codigo: "", nombre: "", descripcion: "", idModalidad: "", estado: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editTarget, setEditTarget] = useState(null);
const [editForm, setEditForm] = useState({ codigo: "", nombre: "", descripcion: "", idModalidad: "", estado: 1 });
const [editSaving, setEditSaving] = useState(false);
const [editError, setEditError] = useState("");


  useEffect(() => {
  api.get("/carrera")
    .then((res) => setCarreras(res.data.data))
    .catch(() => setCarreras([]))
    .finally(() => setLoading(false));

  api.get("/modalidad")
    .then((res) => setModalidades(res.data.data))
    .catch(() => setModalidades([])); // si falla, el select de modalidad queda vacío pero no bloquea nada
}, []);

  const abrirNueva = () => {
    setForm({ codigo: "", nombre: "", descripcion: "", idModalidad: "", estado: 1 });
    setError("");
    setModal(true);
  };

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/carrera", form);
      setCarreras((prev) => [...prev, res.data.data]);
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la carrera");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/carrera/${deleteTarget.id}`);
      setCarreras((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Error al eliminar");
    }
  };
  const abrirEditar = (c) => {
  setEditForm({
    codigo: c.codigo || "",
    nombre: c.nombre || "",
    descripcion: c.descripcion || "",
    idModalidad: c.idModalidad || "",
    estado: c.estado ? 1 : 0,
  });
  setEditError("");
  setEditTarget(c);
};

const handleEditChange = (e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

const guardarEdicion = async (e) => {
  e.preventDefault();
  setEditError("");

  if (!editForm.nombre.trim()) {
    setEditError("El nombre es obligatorio");
    return;
  }
  if (!editForm.codigo.trim()) {
    setEditError("El código es obligatorio");
    return;
  }

  setEditSaving(true);
  try {
    const res = await api.put(`/carrera/${editTarget.id}`, editForm);
    setCarreras((prev) => prev.map((c) => (c.id === editTarget.id ? res.data.data : c)));
    setEditTarget(null);
  } catch (err) {
    setEditError(err.response?.data?.message || "Error al actualizar la carrera");
  } finally {
    setEditSaving(false);
  }
};

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
      <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
      <p style={{ margin: 0 }}>Cargando carreras...</p>
    </div>
  );

  return (
    <div style={styles.root}>
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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Gestión de Carreras</span>
        </div>
      </header>

      <main style={styles.contentContainer}>
        <div style={styles.contentHeader}>
          <div>
            <h1 style={styles.title}>Carreras</h1>
            <p style={styles.subtitle}>Crea y administra las carreras disponibles</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/admin/pensum")} style={styles.btnOutline}>Ir a Pensums</button>
            <button
              onClick={abrirNueva}
              style={styles.btnPrimary}
              onMouseOver={(e) => { e.currentTarget.style.background = "#6d28d9" }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#7c3aed" }}
            >
              + Nueva carrera
            </button>
          </div>
        </div>

        {carreras.length === 0 ? (
          <div style={styles.empty}>
            <p>No hay carreras registradas</p>
            <button onClick={abrirNueva} style={styles.btnPrimary}>Crear primera carrera</button>
          </div>
        ) : (
          <div style={styles.grid}>
            {carreras.map((c) => (
              <div key={c.id} style={styles.card}>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{c.nombre}</h3>
                  <div style={styles.cardMeta}>
                    <span style={styles.badge}>{c.codigo}</span>
                    <span style={{ ...styles.badge, background: c.estado ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: c.estado ? "#059669" : "#dc2626" }}>
                      {c.estado ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  {c.descripcion && <p style={styles.cardCodigo}>{c.descripcion}</p>}
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => abrirEditar(c)} style={styles.btnOutline}>
    Editar
  </button>
                  <button onClick={() => { setDeleteTarget(c); setDeleteError(""); }} style={{ ...styles.btnOutline, color: "#dc2626", borderColor: "#fecaca" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={styles.overlay} onClick={() => setModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>Nueva carrera</h3>
                <button onClick={() => setModal(false)} style={styles.modalClose}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <form onSubmit={guardar} noValidate style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {error && <div style={styles.error}>{error}</div>}

                <div style={styles.grid2}>
                  <div style={styles.field}>
                    <label style={styles.label}>Código *</label>
                    <input name="codigo" value={form.codigo} onChange={handleChange} style={styles.input} required placeholder="Ej: ING-SIS" />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Modalidad *</label>
                    <select name="idModalidad" value={form.idModalidad} onChange={handleChange} style={styles.input} required>
                      <option value="">Seleccionar</option>
                      {modalidades.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Nombre *</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange} style={styles.input} required placeholder="Ej: Ingeniería de Sistemas" />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Descripción</label>
                  <textarea name="descripcion" rows="2" value={form.descripcion} onChange={handleChange} style={{ ...styles.input, resize: "vertical", minHeight: 60, fontFamily: "inherit" }} />
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setModal(false)} style={styles.btnSecondary}>Cancelar</button>
                  <button type="submit" disabled={saving} style={{ ...styles.btnPrimarySm, opacity: saving ? 0.6 : 1 }}>
                    {saving ? "Guardando..." : "Crear carrera"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
{editTarget && (
  <div style={styles.overlay} onClick={() => setEditTarget(null)}>
    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#0f172a" }}>Editar carrera</h3>
        <button onClick={() => setEditTarget(null)} style={styles.modalClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <form onSubmit={guardarEdicion} noValidate style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {editError && <div style={styles.error}>{editError}</div>}

        <div style={styles.grid2}>
          <div style={styles.field}>
            <label style={styles.label}>Código *</label>
            <input name="codigo" value={editForm.codigo} onChange={handleEditChange} style={styles.input} placeholder="Ej: ING-SIS" />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Modalidad</label>
            <select name="idModalidad" value={editForm.idModalidad || ""} onChange={handleEditChange} style={styles.input}>
              <option value="">Sin especificar</option>
              {modalidades.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Nombre *</label>
          <input name="nombre" value={editForm.nombre} onChange={handleEditChange} style={styles.input} placeholder="Ej: Ingeniería de Sistemas" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Descripción</label>
          <textarea name="descripcion" rows="2" value={editForm.descripcion} onChange={handleEditChange} style={{ ...styles.input, resize: "vertical", minHeight: 60, fontFamily: "inherit" }} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Estado</label>
          <select name="estado" value={editForm.estado} onChange={handleEditChange} style={styles.input}>
            <option value={1}>Activa</option>
            <option value={0}>Inactiva</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => setEditTarget(null)} style={styles.btnSecondary}>Cancelar</button>
          <button type="submit" disabled={editSaving} style={{ ...styles.btnPrimarySm, opacity: editSaving ? 0.6 : 1 }}>
            {editSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
        <ConfirmModal
          open={!!deleteTarget}
          title="Eliminar carrera"
          message={`¿Estás seguro de eliminar "${deleteTarget?.nombre}"?`}
          onConfirm={eliminar}
          onCancel={() => { setDeleteTarget(null); setDeleteError(""); }}
        />
        {deleteError && <div style={styles.errorBar}>{deleteError}</div>}
      </main>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#F8FAFC", minHeight: "100vh" },
  contentContainer: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },
  contentHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", marginBottom: "2rem" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" },
  subtitle: { fontSize: "0.88rem", color: "#64748b", margin: "0.3rem 0 0" },
  btnPrimary: { padding: "0.55rem 1.2rem", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  btnPrimarySm: { padding: "0.65rem 1.5rem", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  btnSecondary: { padding: "0.65rem 1.5rem", background: "white", color: "#475569", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem", fontWeight: 500, cursor: "pointer" },
  btnOutline: { padding: "0.4rem 0.85rem", background: "transparent", color: "#7c3aed", border: "1.5px solid #e9d5ff", borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" },
  card: { background: "#ffffff", borderRadius: 12, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" },
  cardBody: { padding: "1.25rem 1.25rem 0.75rem" },
  cardTitle: { fontSize: "1.05rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" },
  cardMeta: { display: "flex", gap: 8, marginBottom: "0.4rem" },
  badge: { padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: "rgba(124,58,237,0.1)", color: "#7c3aed" },
  cardCodigo: { fontSize: "0.82rem", color: "#64748b", margin: 0 },
  cardActions: { display: "flex", gap: 8, padding: "0.6rem 1.25rem 1rem", borderTop: "1px solid #F1F5F9", background: "#FAFBFF" },
  empty: { textAlign: "center", padding: "4rem 1rem", color: "#64748b" },
  errorBar: { marginTop: "1rem", padding: "0.6rem 0.85rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: "0.84rem", color: "#dc2626", textAlign: "center" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "white", borderRadius: 16, width: "90%", maxWidth: 480, boxShadow: "0 16px 48px rgba(0,0,0,0.2)", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0" },
  modalClose: { background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8", padding: "0.2rem" },
  field: { display: "flex", flexDirection: "column", gap: "0.35rem" },
  label: { fontSize: "0.85rem", fontWeight: 600, color: "#374151" },
  input: { padding: "0.65rem 0.85rem", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: "0.9rem", color: "#0f172a", background: "#f8fafc", outline: "none" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  error: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.6rem 0.85rem", fontSize: "0.84rem", color: "#dc2626" },
};