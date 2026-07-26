import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import { detenerImpersonacion } from "../../services/api";
import ConfirmModal from "./ConfirmModal";

const RUTAS_BIENVENIDA = {
  Administrador: "/admin/bienvenida",
  Docente: "/docente/bienvenida",
  Estudiante: "/estudiante/bienvenida",
};

export default function ImpersonationBar() {
  const navigate = useNavigate();
  const { isImpersonating, user, stopImpersonating } = useAuthStore();
  const [confirmando, setConfirmando] = useState(false);

  if (!isImpersonating) return null;

  const volver = async () => {
    try { await detenerImpersonacion(); } catch (_) {}
    stopImpersonating();
    setConfirmando(false);
    navigate("/admin/GestionarUsuarios", { replace: true });
  };

  return (
    <>
      <div style={styles.bar}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>
          Viendo el sistema como <strong>{user?.nombre}</strong> ({user?.rol}) — modo suplantación
        </span>
        <button onClick={() => setConfirmando(true)} style={styles.btn}>Volver a mi cuenta</button>
      </div>

      <ConfirmModal
        open={confirmando}
        title="Volver a mi cuenta"
        message={`Estás viendo el sistema como ${user?.nombre} (${user?.rol}). ¿Deseas salir de este modo y volver a tu cuenta de administrador?`}
        onConfirm={volver}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}

const styles = {
  bar: {
    position: "sticky", top: 0, zIndex: 100,
    background: "#0f172a", color: "white",
    padding: "0.5rem 1rem", display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, fontSize: "0.82rem", fontWeight: 500,
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  btn: {
    background: "white", color: "#0f172a", border: "none", borderRadius: 6,
    padding: "0.3rem 0.8rem", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
  },
};