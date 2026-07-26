import { useState, useEffect } from "react";
import { crearUsuario, obtenerCarreras } from "../../services/api";

const ROLES = ["Estudiante", "Docente"];

const RULES = {
  nombre1:      v => !v.trim() ? "El primer nombre es requerido" : v.trim().length < 2 ? "Mínimo 2 caracteres" : "",
  apellidoP:    v => !v.trim() ? "El apellido paterno es requerido" : v.trim().length < 2 ? "Mínimo 2 caracteres" : "",
  email:        v => !v.trim() ? "El correo es requerido" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Correo inválido" : "",
  nombreUsuario:v => !v.trim() ? "El nombre de usuario es requerido" : v.trim().length < 3 ? "Mínimo 3 caracteres" : /\s/.test(v) ? "Sin espacios" : "",
  contrasena:   v => !v ? "La contraseña es requerida" : v.length < 6 ? "Mínimo 6 caracteres" : "",
  idCarrera:    v => !v ? "Selecciona una carrera" : "",
  matricula:    v => !v.trim() ? "La matrícula es requerida" : "",
  telefonoEst:  v => v && !/^\d{7,15}$/.test(v.replace(/\s/g, "")) ? "Teléfono inválido" : "",
  telefonoDoc:  v => v && !/^\d{7,15}$/.test(v.replace(/\s/g, "")) ? "Teléfono inválido" : "",
};

const REQUIRED_ESTUDIANTE = ["nombre1", "apellidoP", "email", "nombreUsuario", "contrasena", "idCarrera", "matricula"];
const REQUIRED_DOCENTE     = ["nombre1", "apellidoP", "email", "nombreUsuario", "contrasena"];

export default function FormCrearUsuario({ onUsuarioCreado, onCancelar }) {
  const [form, setForm] = useState({
    nombre1: "", nombre2: "", apellidoP: "", apellidoM: "",
    email: "", nombreUsuario: "", contrasena: "", rol: "Estudiante",
    matricula: "", telefonoEst: "", fechaNac: "", idCarrera: "",
    especialidad: "", telefonoDoc: "",
  });
  const [touched, setTouched]   = useState({});
  const [errores, setErrores]   = useState({});
  const [apiError, setApiError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [contrasenaVisible, setContrasenaVisible] = useState("");
  const [carreras, setCarreras] = useState([]);

  useEffect(() => {
    obtenerCarreras()
      .then((res) => {
        const d = res.data;
        const lista = Array.isArray(d) ? d : Array.isArray(d?.carreras) ? d.carreras : Array.isArray(d?.data) ? d.data : [];
        setCarreras(lista);
      })
      .catch(() => setCarreras([]));
  }, []);

  const validarCampo = (name, value) => {
    const rule = RULES[name];
    return rule ? rule(value) : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrores(prev => ({ ...prev, [name]: validarCampo(name, value) }));
  };

  const validarTodo = () => {
    const required = form.rol === "Estudiante" ? REQUIRED_ESTUDIANTE : REQUIRED_DOCENTE;
    const nuevosErrores = {};
    required.forEach(name => {
      nuevosErrores[name] = validarCampo(name, form[name]);
    });
    if (form.telefonoEst) nuevosErrores.telefonoEst = validarCampo("telefonoEst", form.telefonoEst);
    if (form.telefonoDoc) nuevosErrores.telefonoDoc = validarCampo("telefonoDoc", form.telefonoDoc);
    setErrores(nuevosErrores);
    const allTouched = {};
    required.forEach(n => allTouched[n] = true);
    setTouched(allTouched);
    return Object.values(nuevosErrores).every(e => !e);
  };

  const generarCredenciales = (nombre1, apellidoP) => {
    const base = `${nombre1?.[0] ?? "u"}${apellidoP ?? "user"}`.toLowerCase().replace(/\s/g, "");
    const num = Math.floor(Math.random() * 900) + 100;
    const nombreUsuario = `${base}${num}`;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const contrasena = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return { nombreUsuario, contrasena };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validarTodo()) return;
    setCargando(true);
    try {
      const payload = {
        nombre1: form.nombre1, nombre2: form.nombre2,
        apellidoP: form.apellidoP, apellidoM: form.apellidoM,
        email: form.email, nombreUsuario: form.nombreUsuario,
        contrasena: form.contrasena, rol: form.rol,
      };
      if (form.rol === "Estudiante") {
        payload.matricula = form.matricula;
        payload.telefono  = form.telefonoEst;
        payload.fechaNac  = form.fechaNac;
        payload.idCarrera = form.idCarrera;
      } else {
        payload.especialidad = form.especialidad;
        payload.telefono     = form.telefonoDoc;
      }
      const res = await crearUsuario(payload);
      onUsuarioCreado(res.data.usuario);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) {
        setApiError(Object.values(errs)[0][0]);
      } else {
        setApiError(err.response?.data?.message || "Error al crear el usuario.");
      }
    } finally {
      setCargando(false);
    }
  };

  /* ─── Helpers de estilo ─── */
  const inputBorder = (name) => {
    if (errores[name]) return "#EF4444";
    if (touched[name] && !errores[name] && form[name]) return "#10B981";
    return "#E2E8F0";
  };

  const inputBg = (name) => {
    if (errores[name]) return "#FFF5F5";
    if (touched[name] && !errores[name] && form[name]) return "#F0FDF4";
    return "#F8FAFC";
  };

  const inp = (name) => ({
    width: "100%", padding: "9px 12px", outline: "none", fontSize: 13,
    borderRadius: 8, boxSizing: "border-box", color: "#0F172A",
    border: `1px solid ${inputBorder(name)}`,
    backgroundColor: inputBg(name),
    transition: "border-color 0.15s, background-color 0.15s",
  });

  const errMsg = (name) => errores[name] && touched[name] ? (
    <span style={{ fontSize: 11, color: "#EF4444", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
      <i className="ph ph-warning"></i> {errores[name]}
    </span>
  ) : null;

  const okMsg = (name, label) => !errores[name] && touched[name] && form[name] ? (
    <span style={{ fontSize: 11, color: "#10B981", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
      <i className="ph ph-check-circle"></i> {label}
    </span>
  ) : null;

  const lbl = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#64748B", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.6,
  };

  const secHdr = (color) => ({
    fontSize: 11, fontWeight: 700, color, textTransform: "uppercase",
    letterSpacing: 1.5, margin: "6px 0 12px", display: "flex", alignItems: "center", gap: 8,
  });

  const SecIcon = ({ icon, bg }) => (
    <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#475569" }}>
      <i className={`ph ${icon}`}></i>
    </span>
  );

  const esDocente = form.rol === "Docente";

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#6366F1", textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ph ph-users"></i> Gestión de Usuarios
        </p>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: -0.3 }}>
          Crear nuevo usuario
        </h2>
      </div>

      {/* Error API */}
      {apiError && (
        <div style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ph ph-warning-circle"></i> {apiError}
        </div>
      )}

      {/* Área scrolleable */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", paddingRight: 4, flex: 1 }}>

        {/* ROL */}
        <div>
          <label style={lbl}>Rol <span style={{ color: "#EF4444" }}>*</span></label>
          <select name="rol" value={form.rol} onChange={handleChange} style={{
            width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 13, outline: "none",
            boxSizing: "border-box", cursor: "pointer", fontWeight: 700,
            backgroundColor: esDocente ? "#E0F2FE" : "#D1FAE5",
            color: esDocente ? "#0369A1" : "#047857",
            border: `1px solid ${esDocente ? "#BAE6FD" : "#A7F3D0"}`,
          }}>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* ── DATOS PERSONALES ── */}
        <div style={{ height: 1, backgroundColor: "#F1F5F9" }} />
        <p style={secHdr("#6366F1")}>
          <SecIcon icon="ph-user" bg="#E0E7FF" />
          Datos personales
        </p>

        {/* Nombres */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Primer nombre <span style={{ color: "#EF4444" }}>*</span></label>
            <input name="nombre1" value={form.nombre1} onChange={handleChange} onBlur={handleBlur} style={inp("nombre1")} />
            {errMsg("nombre1")}
            {okMsg("nombre1", "Correcto")}
          </div>
          <div>
            <label style={lbl}>Segundo nombre</label>
            <input name="nombre2" value={form.nombre2} onChange={handleChange}
              style={{ ...inp("nombre2"), border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }} />
          </div>
        </div>

        {/* Apellidos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Apellido paterno <span style={{ color: "#EF4444" }}>*</span></label>
            <input name="apellidoP" value={form.apellidoP} onChange={handleChange} onBlur={handleBlur} style={inp("apellidoP")} />
            {errMsg("apellidoP")}
            {okMsg("apellidoP", "Correcto")}
          </div>
          <div>
            <label style={lbl}>Apellido materno</label>
            <input name="apellidoM" value={form.apellidoM} onChange={handleChange}
              style={{ ...inp("apellidoM"), border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }} />
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={lbl}>Correo electrónico <span style={{ color: "#EF4444" }}>*</span></label>
          <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} style={inp("email")} />
          {errMsg("email")}
          {okMsg("email", "Correo válido")}
        </div>

        {/* ── DATOS DEL ROL ── */}
        <div style={{ height: 1, backgroundColor: "#F1F5F9" }} />
        <p style={secHdr(esDocente ? "#0369A1" : "#047857")}>
          <SecIcon icon={esDocente ? "ph-chalkboard-teacher" : "ph-student"} bg={esDocente ? "#DBEAFE" : "#D1FAE5"} />
          {esDocente ? "Datos del docente" : "Datos del estudiante"}
        </p>

        {/* ── ESTUDIANTE ── */}
        {!esDocente && (
          <>
            <div>
              <label style={lbl}>Carrera <span style={{ color: "#EF4444" }}>*</span></label>
              <select name="idCarrera" value={form.idCarrera} onChange={handleChange} onBlur={handleBlur}
                style={{ ...inp("idCarrera"), cursor: "pointer" }}>
                <option value="">— Seleccionar carrera —</option>
                {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              {errMsg("idCarrera")}
              {okMsg("idCarrera", "Carrera seleccionada")}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Matrícula <span style={{ color: "#EF4444" }}>*</span></label>
                <input name="matricula" value={form.matricula} onChange={handleChange} onBlur={handleBlur}
                  placeholder="MAT-2025001" style={inp("matricula")} />
                {errMsg("matricula")}
                {okMsg("matricula", "Correcto")}
              </div>
              <div>
                <label style={lbl}>Teléfono</label>
                <input type="tel" name="telefonoEst" value={form.telefonoEst} onChange={handleChange} onBlur={handleBlur}
                  style={inp("telefonoEst")} />
                {errMsg("telefonoEst")}
                {okMsg("telefonoEst", "Correcto")}
              </div>
            </div>

            <div>
              <label style={lbl}>Fecha de nacimiento</label>
              <input type="date" name="fechaNac" value={form.fechaNac} onChange={handleChange}
                style={{ ...inp("fechaNac"), border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }} />
            </div>
          </>
        )}

        {/* ── DOCENTE ── */}
        {esDocente && (
          <>
            <div>
              <label style={lbl}>Especialidad</label>
              <input name="especialidad" value={form.especialidad} onChange={handleChange}
                placeholder="Ej. Chef Ejecutivo - Cocina Internacional"
                style={{ ...inp("especialidad"), border: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }} />
            </div>

            <div>
              <label style={lbl}>Teléfono</label>
              <input type="tel" name="telefonoDoc" value={form.telefonoDoc} onChange={handleChange} onBlur={handleBlur}
                style={inp("telefonoDoc")} />
              {errMsg("telefonoDoc")}
              {okMsg("telefonoDoc", "Correcto")}
            </div>
          </>
        )}

        {/* ── CREDENCIALES ── */}
        <div style={{ height: 1, backgroundColor: "#F1F5F9" }} />
        <p style={secHdr("#6366F1")}>
          <SecIcon icon="ph-key" bg="#F5F3FF" />
          Credenciales de acceso
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => {
            const { nombreUsuario, contrasena } = generarCredenciales(form.nombre1, form.apellidoP);
            setForm(f => ({ ...f, nombreUsuario, contrasena }));
            setContrasenaVisible(contrasena);
            setTouched(prev => ({ ...prev, nombreUsuario: true, contrasena: true }));
            setErrores(prev => ({ ...prev, nombreUsuario: "", contrasena: "" }));
          }} style={{ fontSize: 12, fontWeight: 600, color: "#6366F1", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <i className="ph ph-lightning"></i> Generar automáticamente
          </button>
        </div>

        {contrasenaVisible && (
          <div style={{ fontSize: 12, color: "#047857", backgroundColor: "#D1FAE5", padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ph ph-eye"></i>
            Contraseña: <strong>{contrasenaVisible}</strong> — guárdala antes de continuar
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={lbl}>Nombre de usuario <span style={{ color: "#EF4444" }}>*</span></label>
            <input name="nombreUsuario" value={form.nombreUsuario} onChange={handleChange} onBlur={handleBlur} style={inp("nombreUsuario")} />
            {errMsg("nombreUsuario")}
            {okMsg("nombreUsuario", "Disponible")}
          </div>
          <div>
            <label style={lbl}>Contraseña <span style={{ color: "#EF4444" }}>*</span></label>
            <input type="password" name="contrasena" value={form.contrasena} onChange={handleChange} onBlur={handleBlur} style={inp("contrasena")} />
            {errMsg("contrasena")}
            {!errores["contrasena"] && touched["contrasena"] && form.contrasena && (
              <span style={{ fontSize: 11, color: "#10B981", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <i className="ph ph-shield-check"></i>
                {form.contrasena.length >= 8 ? "Contraseña fuerte" : "Contraseña aceptable"}
              </span>
            )}
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, backgroundColor: "#F1F5F9", margin: "4px 0" }} />

        {/* Botones */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancelar}
            style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background-color 0.15s" }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "#F8FAFC"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "#fff"}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={cargando}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              backgroundColor: cargando ? "#A5B4FC" : "#6366F1",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: cargando ? "not-allowed" : "pointer",
              boxShadow: cargando ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background-color 0.15s",
            }}
            onMouseOver={e => { if (!cargando) e.currentTarget.style.backgroundColor = "#4F46E5"; }}
            onMouseOut={e => { if (!cargando) e.currentTarget.style.backgroundColor = "#6366F1"; }}
          >
            {cargando
              ? <><i className="ph ph-circle-notch" style={{ animation: "spin 0.8s linear infinite" }}></i> Creando...</>
              : <><i className="ph ph-user-plus"></i> Crear usuario</>
            }
          </button>
        </div>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}