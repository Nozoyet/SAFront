export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.iconWrap}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 style={styles.title}>{title || "¿Estás seguro?"}</h3>
        {message && <p style={styles.message}>{message}</p>}
        <div style={styles.actions}>
          <button onClick={onConfirm} style={styles.btnDanger}>Sí, eliminar</button>
          <button onClick={onCancel} style={styles.btnCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    background: "white", borderRadius: 16, padding: "2rem", maxWidth: 380, width: "90%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)", textAlign: "center",
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: "50%", background: "#fef2f2",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 1rem",
  },
  title: { fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem" },
  message: { fontSize: "0.88rem", color: "#64748b", margin: "0 0 1.5rem", lineHeight: 1.5 },
  actions: { display: "flex", gap: 10, justifyContent: "center" },
  btnDanger: {
    padding: "0.55rem 1.3rem", background: "#dc2626", color: "white", border: "none",
    borderRadius: 8, fontSize: "0.88rem", fontWeight: 600, cursor: "pointer",
  },
  btnCancel: {
    padding: "0.55rem 1.3rem", background: "white", color: "#475569", border: "1.5px solid #e2e8f0",
    borderRadius: 8, fontSize: "0.88rem", fontWeight: 500, cursor: "pointer",
  },
};
