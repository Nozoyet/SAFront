import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../services/api";

const ADMIN_CONFIG = {
  color: "#7c3aed",
  bg: "#faf5ff",
  accent: "#ede9fe",
};

const SEM_COLORS = [
  { label: "Sem 1", color: "#3b82f6", bg: "#eff6ff" },
  { label: "Sem 2", color: "#10b981", bg: "#ecfdf5" },
  { label: "Sem 3", color: "#f59e0b", bg: "#fffbeb" },
  { label: "Sem 4", color: "#ef4444", bg: "#fef2f2" },
  { label: "Sem 5", color: "#8b5cf6", bg: "#f5f3ff" },
  { label: "Sem 6", color: "#ec4899", bg: "#fdf2f8" },
  { label: "Sem 7", color: "#14b8a6", bg: "#f0fdfa" },
  { label: "Sem 8", color: "#f97316", bg: "#fff7ed" },
  { label: "Sem 9", color: "#6366f1", bg: "#eef2ff" },
  { label: "Sem 10", color: "#84cc16", bg: "#f7fee7" },
];

function cs(sem) {
  if (!sem || sem < 1 || sem > SEM_COLORS.length) return { color: "#64748b", bg: "#f1f5f9" };
  return SEM_COLORS[sem - 1];
}

function buildTree(materias) {
  const map = {};
  materias.forEach((m) => { map[m.id] = { ...m, children: [] }; });
  const roots = [];
  materias.forEach((m) => {
    if (m.idPrerequisito && map[m.idPrerequisito]) {
      map[m.idPrerequisito].children.push(map[m.id]);
    } else {
      roots.push(map[m.id]);
    }
  });
  return roots;
}

function MateriaCard({ m, onTip, dependientes }) {
  const sc = cs(m.semestre);
  const esRaiz = !m.idPrerequisito;

  return (
    <div
      style={css.card(sc)}
      onMouseEnter={(e) => onTip && onTip(m.descripcion, e)}
      onMouseMove={(e) => onTip && onTip(m.descripcion, e)}
      onMouseLeave={() => onTip && onTip(null)}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 6px 16px ${sc.color}33`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 2px 8px ${sc.color}22`;
      }}
    >
      {esRaiz && <div style={{ ...css.rootBadge, background: sc.color }}>Inicio</div>}
      <div style={css.ch}>
        <span style={{ ...css.code, background: sc.color, color: "#fff" }}>{m.codigo}</span>
        <span style={css.cr}>{m.creditos} cr</span>
      </div>
      <div style={css.name}>{m.nombre}</div>
      <div style={css.cf}>
        <span style={{ ...css.st, color: sc.color }}>● {sc.label}</span>
        {dependientes > 0 && (
          <span style={css.depBadge}>{dependientes} →</span>
        )}
      </div>
    </div>
  );
}

function ConnectorLine() {
  return (
    <div style={css.connector}>
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" style={{ display: "block" }}>
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>
        <line x1="0" y1="12" x2="26" y2="12" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
      </svg>
    </div>
  );
}

function Subtree({ node, padres = [], onTip }) {
  const hasKids = node.children.length > 0;
  const todos = [...padres, node];

  return (
    <div style={css.subtree}>
      {padres.length > 0 && <ConnectorLine />}
      <MateriaCard m={node} onTip={onTip} dependientes={node.children.length} />
      {hasKids && (
        <div style={css.kids}>
          {node.children.length === 1 ? (
            <Subtree node={node.children[0]} padres={todos} onTip={onTip} />
          ) : (
            <div style={css.branch}>
              <div style={css.branchLine} />
              <div style={css.branchKids}>
                {node.children.map((child) => (
                  <div key={child.id} style={css.branchItem}>
                    <div style={css.branchConn}>
                      <svg width="24" height="30" viewBox="0 0 24 30" fill="none" style={{ display: "block" }}>
                        <line x1="0" y1="15" x2="20" y2="15" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                      </svg>
                    </div>
                    <Subtree node={child} padres={todos} onTip={onTip} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PensumArbol() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [pensum, setPensum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState(null);
  const [tip, setTip] = useState(null);

  const onTip = (texto, e) => {
    if (!texto) { setTip(null); return; }
    setTip({ texto, x: e.clientX, y: e.clientY - 12 });
  };

  useEffect(() => {
    api.get(`/pensum/${id}`).then((res) => {
      setPensum(res.data.data);
      setLoading(false);
    }).catch(() => navigate("/admin/pensum"));
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin{display:inline-block;animation:spin 1s linear infinite}`}</style>
      <div style={{ fontSize: 36, marginBottom: 12, color: "#7c3aed" }}><i className="bi bi-hourglass-split spin"></i></div>
      <p style={{ margin: 0 }}>Cargando árbol del pensum...</p>
    </div>
  );
  if (!pensum) return null;

  const todas = pensum.materias || [];
  const totalM = todas.length;
  const totalC = todas.reduce((s, m) => s + (m.creditos || 0), 0);
  const sems = [...new Set(todas.map((m) => m.semestre).filter(Boolean))].sort((a, b) => a - b);

  let arbol = buildTree(todas);
  if (filtro) arbol = todas.filter((m) => m.semestre == filtro).map((m) => ({ ...m, children: [] }));

  return (
    <div style={css.root}>
      <header style={css.header}>
        <div style={css.headerActions}>
          <button
            onClick={() => navigate('/admin/pensum')}
            style={css.backBtn}
            onMouseOver={(e) => { e.currentTarget.style.background = '#5b21b6' }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#7c3aed' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
        </div>
        <div style={css.headerBrand}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill={ADMIN_CONFIG.color} fillOpacity=".12" />
            <path d="M12 34L24 14L36 34H12Z" stroke={ADMIN_CONFIG.color} strokeWidth="2.2" strokeLinejoin="round" fill="none" />
            <circle cx="24" cy="24" r="3.5" fill={ADMIN_CONFIG.color} fillOpacity=".7" />
          </svg>
          <span style={{ ...css.headerTitle, color: ADMIN_CONFIG.color }}>Diagrama Pensum</span>
        </div>
      </header>

      <main style={css.contentContainer}>
        <div style={css.contentHeader}>
          <div>
            <h1 style={css.tt}>{pensum.carrera?.nombre || "Pensum"}</h1>
            <div style={css.statsRow}>
              <span style={css.statPill}>{pensum.anioCreacion}</span>
              <span style={css.statPill}>{totalM} materias</span>
              <span style={css.statPill}>{totalC} créditos</span>
              {sems.length > 0 && <span style={css.statPill}>{sems.length} semestres</span>}
            </div>
          </div>
          <button onClick={() => navigate(`/admin/pensum/${id}`)} style={css.btn}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f1f5f9" }}
            onMouseOut={(e) => { e.currentTarget.style.background = "white" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Detalle
          </button>
        </div>

        <div style={css.filters}>
          <button onClick={() => setFiltro(null)} style={{ ...css.fb, ...(filtro === null ? css.fba : {}) }}>Todas</button>
          {SEM_COLORS.filter((_, i) => sems.includes(i + 1)).map((s, i) => (
            <button key={s.label} onClick={() => setFiltro(filtro === i + 1 ? null : i + 1)} style={{
              ...css.fb, borderColor: s.color, color: filtro === i + 1 ? "#fff" : s.color,
              background: filtro === i + 1 ? s.color : "white",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={css.legend}>
          <span style={css.legendItem}><span style={{ ...css.legendDot, background: "#7c3aed" }} /> Inicio (sin prerrequisito)</span>
          <span style={css.legendItem}><span style={css.legendArrow}>→</span> N° de materias que dependen de esta</span>
        </div>

        <div style={css.canvas}>
          {arbol.length > 0 ? (
            <div style={css.forest}>
              {arbol.map((root) => (
                <div key={root.id} style={css.tree}>
                  <Subtree node={root} onTip={onTip} />
                </div>
              ))}
            </div>
          ) : (
            <div style={css.empty}>No hay materias en este semestre</div>
          )}
        </div>

        {tip && (
          <div style={{ ...css.tooltip, left: tip.x, top: tip.y }}>{tip.texto}</div>
        )}

        <div style={css.footer}>
          <button onClick={() => navigate("/admin/pensum")} style={{ ...css.btn, border: "none", color: "#1D4ED8", padding: "0.5rem 0", display: "inline-flex", alignItems: "center", gap: 4 }}
            onMouseOver={(e) => { e.currentTarget.style.color = "#1e40af" }}
            onMouseOut={(e) => { e.currentTarget.style.color = "#1D4ED8" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Volver a pensums
          </button>
        </div>
      </main>
    </div>
  );
}

const css = {
  root: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", minHeight: "100vh", background: "#fafafa" },
  contentContainer: { maxWidth: 1100, margin: "0 auto", padding: "2rem" },
  loader: { textAlign: "center", padding: "4rem", color: "#64748b", fontSize: "1rem" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 },
  headerActions: { display: "flex", alignItems: "center", gap: 10 },
  backBtn: { display: "flex", alignItems: "center", gap: 7, padding: "0.45rem 1rem", border: "none", borderRadius: 8, background: "#7c3aed", color: "white", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer" },
  headerBrand: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em" },

  contentHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem", maxWidth: 960, margin: "0 auto 1.25rem" },
  tt: { fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" },

  statsRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" },
  statPill: {
    padding: "0.25rem 0.7rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
    background: "#ede9fe", color: "#6d28d9",
  },

  btn: { padding: "0.4rem 0.85rem", background: "white", color: "#1e293b", border: "1.5px solid #e2e8f0", borderRadius: 6, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", height: "fit-content" },

  filters: { display: "flex", gap: "0.5rem", flexWrap: "wrap", maxWidth: 960, margin: "0 auto 0.75rem" },
  fb: { padding: "0.3rem 0.85rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, border: "2px solid #e2e8f0", cursor: "pointer", transition: "all .15s ease" },
  fba: { borderColor: "#1D4ED8", color: "#1D4ED8", background: "#eff6ff" },

  legend: { display: "flex", gap: "1.5rem", flexWrap: "wrap", maxWidth: 960, margin: "0 auto 1.5rem", fontSize: "0.75rem", color: "#64748b" },
  legendItem: { display: "flex", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  legendArrow: { fontWeight: 700, color: "#94a3b8" },

  canvas: {
    overflowX: "auto", overflowY: "auto", padding: "3rem 2.5rem", background: "#ffffff",
    backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
    backgroundSize: "20px 20px",
    borderRadius: 14, border: "1px solid #e2e8f0", minHeight: 320,
    boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
  },
  forest: { display: "flex", flexDirection: "column", gap: "4rem", minWidth: "max-content" },
  tree: {},
  subtree: { display: "flex", alignItems: "center", gap: 0 },
  kids: { display: "flex", alignItems: "center" },
  connector: { display: "flex", alignItems: "center", justifyContent: "center", width: 34, flexShrink: 0 },
  branch: { display: "flex", alignItems: "stretch", marginLeft: "2px" },
  branchLine: { width: 2, background: "#cbd5e1", flexShrink: 0, marginLeft: "16px", borderRadius: 2 },
  branchKids: { display: "flex", flexDirection: "column", gap: "2.25rem", paddingLeft: "0.75rem" },
  branchItem: { display: "flex", alignItems: "center", gap: 0 },
  branchConn: { display: "flex", alignItems: "center", justifyContent: "center", width: 24, flexShrink: 0 },

  card: (sc) => ({
    position: "relative",
    borderRadius: 12,
    border: `2px solid ${sc.color}`,
    background: sc.bg,
    padding: "0.75rem 0.95rem",
    minWidth: 175,
    maxWidth: 215,
    boxShadow: `0 2px 8px ${sc.color}22`,
    transition: "transform .15s ease, box-shadow .15s ease",
    cursor: "default",
  }),
  rootBadge: {
    position: "absolute", top: -9, left: 10, color: "white", fontSize: "0.6rem", fontWeight: 700,
    padding: "0.1rem 0.45rem", borderRadius: 999, letterSpacing: "0.03em", textTransform: "uppercase",
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  },
  ch: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" },
  code: { fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: 4, letterSpacing: "0.02em" },
  cr: { fontSize: "0.7rem", color: "#64748b", fontWeight: 600 },
  name: { fontSize: "0.82rem", fontWeight: 500, color: "#0f172a", lineHeight: 1.35 },
  cf: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.4rem" },
  st: { fontSize: "0.68rem", fontWeight: 700 },
  depBadge: {
    fontSize: "0.65rem", fontWeight: 700, color: "#0d9488", background: "#f0fdfa",
    padding: "0.05rem 0.4rem", borderRadius: 999,
  },

  tooltip: {
    position: "fixed", padding: "0.5rem 0.75rem", background: "#0f172a", color: "white",
    fontSize: "0.75rem", lineHeight: 1.4, borderRadius: 8, maxWidth: 260,
    boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 9999, pointerEvents: "none", textAlign: "center",
    transform: "translateX(-50%) translateY(-100%)",
  },
  empty: { textAlign: "center", padding: "3rem", color: "#64748b" },
  footer: { marginTop: "2rem", maxWidth: 960, margin: "2rem auto 0" },
};