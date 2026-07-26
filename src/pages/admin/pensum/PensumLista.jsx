import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import ConfirmModal from "../../../components/common/ConfirmModal";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

export default function PensumLista() {
  const navigate = useNavigate();
  const [pensums, setPensums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    api.get("/pensum").then((res) => {
      setPensums(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const eliminar = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pensum/${deleteTarget.id}`);
      setPensums((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Error al eliminar");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F8FAFC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
      <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
      <p style={{ margin: 0 }}>Cargando pensums...</p>
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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Gestion de Pensums</span>
        </div>
      </header>
      <main style={styles.contentContainer}>
        <div style={styles.contentHeader}>
  <div>
    <h1 style={styles.title}>Pensums</h1>
    <p style={styles.subtitle}>Gestiona los planes de estudio de cada carrera</p>
  </div>
  <div style={{ display: "flex", gap: 8 }}>
    <button onClick={() => navigate("/admin/carreras")} style={styles.btnOutline}>
      Gestionar carreras
    </button>
    <button
      onClick={() => navigate("/admin/pensum/nuevo")}
      style={styles.btnPrimary}
      onMouseOver={(e) => { e.currentTarget.style.background = "#6d28d9" }}
      onMouseOut={(e) => { e.currentTarget.style.background = "#7c3aed" }}
    >
      + Nuevo pensum
    </button>
  </div>
</div>

        {pensums.length === 0 ? (
          <div style={styles.empty}>
            <p>No hay pensums registrados</p>
            <button onClick={() => navigate("/admin/pensum/nuevo")} style={styles.btnPrimary}>
              Crear primer pensum
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {pensums.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{p.carrera?.nombre || "Sin carrera"}</h3>
                  <div style={styles.cardMeta}>
                    <span style={styles.badge}>{p.anioCreacion}</span>
                    {p.duracion && <span style={{ ...styles.badge, background: "rgba(16,185,129,0.15)", color: "#34d399" }}>{p.duracion} sem</span>}
                    <span style={{ ...styles.badge, background: p.estado ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: p.estado ? "#34d399" : "#f87171" }}>
                      {p.estado ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p style={styles.cardCodigo}>Código carrera: {p.carrera?.codigo || "—"}</p>
                </div>
                <div style={styles.cardActions}>
                  <button onClick={() => navigate(`/admin/pensum/${p.id}`)} style={styles.btnOutline}>
                    Ver detalle
                  </button>
                  <button onClick={() => { setDeleteTarget(p); setDeleteError(""); }} style={{ ...styles.btnOutline, color: "#f87171", borderColor: "#fecaca" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <ConfirmModal
          open={!!deleteTarget}
          title="Eliminar pensum"
          message={`¿Estás seguro de eliminar el pensum de ${deleteTarget?.carrera?.nombre || "esta carrera"} (${deleteTarget?.anioCreacion})?`}
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
  btnPrimary: {
    padding: "0.55rem 1.2rem", background: "#7c3aed", color: "white", border: "none",
    borderRadius: 8, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },
  btnOutline: {
    padding: "0.4rem 0.85rem", background: "transparent", color: "#7c3aed", border: "1.5px solid #e9d5ff",
    borderRadius: 6, fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" },
  card: {
    background: "#ffffff", borderRadius: 12, border: "1px solid #E2E8F0",
    overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
  },
  cardBody: { padding: "1.25rem 1.25rem 0.75rem" },
  cardTitle: { fontSize: "1.05rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" },
  cardMeta: { display: "flex", gap: 8, marginBottom: "0.4rem" },
  badge: {
    padding: "0.2rem 0.6rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
    background: "rgba(124,58,237,0.1)", color: "#7c3aed",
  },
  cardCodigo: { fontSize: "0.82rem", color: "#64748b", margin: 0 },
  cardActions: {
    display: "flex", gap: 8, padding: "0.6rem 1.25rem 1rem",
    borderTop: "1px solid #F1F5F9", background: "#FAFBFF",
  },
  loader: { textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "1rem" },
  empty: { textAlign: "center", padding: "4rem 1rem", color: "#64748b" },
  errorBar: {
    marginTop: "1rem", padding: "0.6rem 0.85rem", background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: 8, fontSize: "0.84rem", color: "#dc2626", textAlign: "center",
  },
};
