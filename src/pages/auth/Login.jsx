import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState({
    nombreUsuario: "",
    contrasena: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const user = await login(
        form.nombreUsuario,
        form.contrasena
      );

      const routes = {
        Administrador: "/admin/bienvenida",
        Docente: "/docente/bienvenida",
        Estudiante: "/estudiante/bienvenida",
      };

      navigate(routes[user.rol] || "/bienvenida", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Error al conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };
// Dentro del componente, antes del return, o en un archivo CSS global:


  return (
    <div style={styles.root}>
      <style>{`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`}</style>
      {/* Panel izquierdo */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logoMark}>
            <i
              className="ph ph-student"
              style={{
                fontSize: "50px",
                color: "white",
              }}
            />
          </div>

          <h1 style={styles.brandName}>
            Sistema
            <br />
            Académico
          </h1>

          <p style={styles.brandSub}>
            Gestión universitaria integral para
            estudiantes, docentes y administradores.
          </p>

          <div style={styles.dots}>
            {[...Array(9)].map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.dot,
                  opacity: 0.15 + (i % 3) * 0.12,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Bienvenido</h2>

          <p style={styles.subtitle}>
            Ingresa tus credenciales para continuar
          </p>

          <form
            onSubmit={handleSubmit}
            style={styles.form}
            noValidate
          >
            {/* Usuario */}
            <div style={styles.field}>
              <label
                style={styles.label}
                htmlFor="nombreUsuario"
              >
                Usuario
              </label>

              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </span>

                <input
                  id="nombreUsuario"
                  name="nombreUsuario"
                  type="text"
                  autoComplete="username"
                  placeholder="Nombre de usuario"
                  value={form.nombreUsuario}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "#1D4ED8";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                  }}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div style={styles.field}>
              <label
                style={styles.label}
                htmlFor="contrasena"
              >
                Contraseña
              </label>

              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                    />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>

                <input
                  id="contrasena"
                  name="contrasena"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={showPass ? "contraseña" : "••••••••"}
                  value={form.contrasena}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    paddingRight: "2.7rem",
                  }}
                  required
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "#1D4ED8";
                  }}

                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass((prev) => !prev)
                  }
                  style={styles.eyeBtn}
                >
                  <i
                    title={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className={showPass ? "ph ph-eye" : "ph ph-eye-closed"}
                    style={{ fontSize: "18px", color: "#000000" }}
                  ></i>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={
                loading
                  ? {
                    ...styles.btn,
                    ...styles.btnDisabled,
                  }
                  : styles.btn
              }
              onMouseEnter={(e) => {
                e.target.style.background = "#132863";
              }}

              onMouseLeave={(e) => {
                e.target.style.background = BRAND;
              }}
            >
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                "Iniciar sesión"
              )}

            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const BRAND = "#1D4ED8";
const BRAND_DARK = "#1E3A8A";

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    backgroundColor: "#f8fafc",
  },

  /* LEFT */
  left: {
    flex: "0 0 42%",
    background: `linear-gradient(145deg, ${BRAND_DARK} 0%, ${BRAND} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    overflow: "hidden",
  },

  leftInner: {
    maxWidth: 340,
  },

  logoMark: {
    marginBottom: "1.5rem",
  },

  brandName: {
    fontSize: "2.4rem",
    fontWeight: 700,
    color: "white",
    lineHeight: 1.15,
    margin: "0 0 1rem",
    letterSpacing: "-0.02em",
  },

  brandSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "0.95rem",
    lineHeight: 1.65,
  },

  dots: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 10,
    marginTop: "3rem",
    width: 80,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "white",
  },

  /* RIGHT */
  right: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: "2rem",
  },

  card: {
    width: "100%",
    maxWidth: 400,
    background: "#ffffff",
    borderRadius: 16,
    padding: "2.5rem 2.25rem",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.27)",
  },

  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "0.35rem",
  },

  subtitle: {
    fontSize: "0.9rem",
    color: "#64748b",
    marginBottom: "2rem",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },

  label: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#374151",
  },

  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  inputIcon: {
    position: "absolute",
    left: 12,
    color: "#000000",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },

  input: {
    width: "100%",
    padding: "0.7rem 0.85rem 0.7rem 2.5rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: "0.92rem",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },

  eyeBtn: {
    position: "absolute",
    right: 10,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
  },

  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    borderRadius: 8,
    padding: "0.7rem",
    fontSize: "0.84rem",
  },

 btn: {
  padding: "0.8rem",
  background: BRAND,
  color: "white",
  border: "none",
  borderRadius: 10,
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  minHeight: 46,
  display: "flex",           // 👈 para centrar el spinner
  alignItems: "center",
  justifyContent: "center",
},

spinner: {
  display: "inline-block",   // 👈 el fix clave: sin esto el círculo se aplasta
  width: 18,
  height: 18,
  border: "2.5px solid rgba(255,255,255,0.35)",
  borderTopColor: "white",
  borderRadius: "50%",
  animation: "spin 0.7s linear infinite",
  boxSizing: "border-box",   // evita que el border cambie el tamaño total
},

  btnDisabled: {
    background: "#93c5fd",
    cursor: "not-allowed",
  },

};