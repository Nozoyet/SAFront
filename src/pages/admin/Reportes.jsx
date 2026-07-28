import { useEffect, useState, useMemo } from 'react';
import { reporteService } from '../../services/reporteService';
import useAuthStore from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import ReportePreviewModal from '../../components/common/ReportePreviewModal';

const ADMIN_CONFIG = {
  color: '#7c3aed',
  bg: '#faf5ff',
  accent: '#ede9fe',
};

const SEMESTRES = [1, 2, 3, 4, 5, 6];

export default function Reportes() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [carreras, setCarreras] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState('');
  const [gestiones, setGestiones] = useState([]);
  const [gestionId, setGestionId] = useState('');
  const [semestre, setSemestre] = useState('');
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generado, setGenerado] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'pdf' | 'excel'

  const carreraActiva = carreras.find((c) => c.id == carreraSeleccionada);
  const gestionActiva = gestiones.find((g) => g.id == gestionId);

  const previewColumns = useMemo(() => [
    { key: 'codigo', label: 'Código', width: '15%' },
    { key: 'nombre', label: 'Nombre', width: '45%' },
    { key: 'creditos', label: 'Créditos', width: '15%', align: 'center' },
    { key: 'semestre', label: 'Semestre', width: '15%', align: 'center', render: (row) => row.semestre },
  ], []);

  const previewInfoItems = useMemo(() => [
    { label: 'Carrera', value: carreraActiva?.nombre || '-' },
    { label: 'Código', value: carreraActiva?.codigo || '-' },
    { label: 'Modalidad', value: carreraActiva?.modalidad || '-' },
    ...(gestionActiva ? [{ label: 'Gestión', value: gestionActiva.label }] : []),
  ], [carreraActiva, gestionActiva]);

  const previewStats = useMemo(() => [
    { label: 'Total Materias', value: materias.length, bg: '#ede9fe', text: '#7c3aed' },
    { label: 'Total Créditos', value: materias.reduce((sum, m) => sum + m.creditos, 0), bg: '#f0fdf4', text: '#16a34a' },
  ], [materias]);

  useEffect(() => {
    cargarCarreras();
  }, []);

  // Al cambiar de carrera, resetea lo dependiente y carga gestiones
  useEffect(() => {
    if (carreraSeleccionada) {
      setGestiones([]);
      setGestionId('');
      setSemestre('');
      setMaterias([]);
      setGenerado(false);

      cargarGestiones(carreraSeleccionada);
    } else {
      setGestiones([]);
      setGestionId('');
      setSemestre('');
      setMaterias([]);
      setGenerado(false);
    }
  }, [carreraSeleccionada]);

  const cargarCarreras = async () => {
    try {
      const data = await reporteService.obtenerCarreras();
      setCarreras(data);
      setError('');
    } catch (err) {
      setError('Error al cargar carreras: ' + (err.response?.data?.error || err.message));
    }
  };

  const cargarGestiones = async (id) => {
    try {
      const data = await reporteService.obtenerGestiones(id);
      setGestiones(data);
    } catch (err) {
      setError('Error al cargar gestiones: ' + (err.response?.data?.error || err.message));
    }
  };

  const generarReporte = async () => {
    if (!carreraSeleccionada) return;
    try {
      setLoading(true);
      setError('');
      const data = await reporteService.obtenerMateriasPorCarrera(carreraSeleccionada, semestre || undefined);
      setMaterias(data);
      setGenerado(true);
    } catch (err) {
      setError('Error al generar reporte: ' + (err.response?.data?.error || err.message));
      setGenerado(false);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const abrirModal = (type) => {
    if (materias.length === 0) return;
    setModalType(type);
    setShowModal(true);
  };

  const confirmarDescarga = async () => {
    setShowModal(false);
    try {
      if (modalType === 'pdf') {
        await reporteService.exportarPDF(carreraSeleccionada);
      } else {
        await reporteService.exportarExcel(carreraSeleccionada);
      }
    } catch (err) {
      setError('Error al descargar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ ...styles.root, background: ADMIN_CONFIG.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          <span style={{ ...styles.headerTitle, color: ADMIN_CONFIG.color }}>Sistema Académico</span>
        </div>
      </header>

      <main style={styles.main}>
        <div style={{ ...styles.heroCard, borderTop: `4px solid ${ADMIN_CONFIG.color}` }}>
          <div style={{ ...styles.roleChip, background: ADMIN_CONFIG.accent, color: ADMIN_CONFIG.color }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ADMIN_CONFIG.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Reporte de Materias
          </div>

          <h1 style={styles.heroTitle}>
            Reportes por <span style={{ color: ADMIN_CONFIG.color }}>Carrera</span>
          </h1>
          <p style={styles.heroDesc}>
            Consulta todas las materias disponibles en cada carrera. Incluye información sobre créditos y semestres.
          </p>

          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* LEYENDA INFORMATIVA PREVIA */}
          <div style={styles.instructionBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Selecciona los parámetros deseados y presiona <strong>"Generar Reporte"</strong> para realizar la consulta.</span>
          </div>

          <div style={styles.filterSection}>
            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Carrera</label>
                <select
                  value={carreraSeleccionada}
                  onChange={(e) => setCarreraSeleccionada(e.target.value)}
                  style={styles.filterSelect}
                  disabled={carreras.length === 0}
                >
                  <option value="">-- Seleccionar carrera --</option>
                  {carreras.map((carrera) => (
                    <option key={carrera.id} value={carrera.id}>
                      {carrera.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Gestión Académica</label>
                <select
                  value={gestionId}
                  onChange={(e) => setGestionId(e.target.value)}
                  style={styles.filterSelect}
                  disabled={!carreraSeleccionada || gestiones.length === 0}
                >
                  <option value="">-- Seleccionar gestión --</option>
                  {gestiones.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Periodo / Semestre</label>
                <select
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="">Todos los semestres</option>
                  {SEMESTRES.map((s) => (
                    <option key={s} value={s}>{s}° Semestre</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={generarReporte}
                disabled={loading || !carreraSeleccionada}
                style={{
                  ...styles.searchBtn,
                  opacity: (loading || !carreraSeleccionada) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  maxWidth: 220
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 16,
                      height: 16,
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Cargando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Generar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ESTADO INICIAL (Antes de pulsar Generar Reporte) */}
        {!generado && !loading && (
          <div style={styles.initialStateCard}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p style={styles.initialStateText}>
              Selecciona una carrera y haz clic en <strong>Generar Reporte</strong> para consultar los datos
            </p>
          </div>
        )}

        {generado && materias.length > 0 && (
          <div style={styles.resultsCard}>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Materias de la carrera</h2>
              <div style={styles.statsBadges}>
                <div style={styles.statBadge}>
                  <span style={styles.statLabel}>Total</span>
                  <span style={styles.statValue}>{materias.length}</span>
                </div>
                <div style={styles.statBadge}>
                  <span style={styles.statLabel}>Créditos</span>
                  <span style={styles.statValue}>{materias.reduce((sum, m) => sum + m.creditos, 0)}</span>
                </div>
              </div>
            </div>

            <div style={styles.reportMeta}>
              <span style={styles.reportMetaItem}><strong>Código:</strong> {carreraActiva?.codigo || '-'}</span>
              <span style={styles.reportMetaItem}><strong>Nombre Carrera:</strong> {carreraActiva?.nombre || '-'}</span>
              <span style={styles.reportMetaItem}><strong>Modalidad:</strong> {carreraActiva?.modalidad || '-'}</span>
              {gestionActiva && <span style={styles.reportMetaItem}><strong>Gestión:</strong> {gestionActiva.label}</span>}
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={{ ...styles.tableHeaderCell, width: '12%' }}>Código</th>
                    <th style={{ ...styles.tableHeaderCell, width: '48%' }}>Nombre</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%', textAlign: 'center' }}>Créditos</th>
                    <th style={{ ...styles.tableHeaderCell, width: '12%', textAlign: 'center' }}>Semestre</th>
                  </tr>
                </thead>
                <tbody>
                  {materias.map((materia, idx) => (
                    <tr key={materia.id} style={{ ...styles.tableRow, background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={styles.tableCell}>{materia.codigo}</td>
                      <td style={styles.tableCell}>{materia.nombre}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>{materia.creditos}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>{materia.semestre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.infoStrip}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Usuario</span>
                <span style={styles.infoVal}>{user?.username}</span>
              </div>
              <div style={styles.infoSep} />
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Correo</span>
                <span style={styles.infoVal}>{user?.email}</span>
              </div>
              <div style={styles.infoSep} />
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Rol</span>
                <span style={{ ...styles.infoVal, color: ADMIN_CONFIG.color, fontWeight: 600 }}>{user?.rol}</span>
              </div>
            </div>

            <div style={styles.exportSection}>
              <button
                onClick={() => abrirModal('pdf')}
                style={{ ...styles.exportBtn, background: '#dc2626', borderColor: '#dc2626' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#b91c1c' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#dc2626' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar PDF
              </button>
              <button
                onClick={() => abrirModal('excel')}
                style={{ ...styles.exportBtn, background: '#16a34a', borderColor: '#16a34a' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#15803d' }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#16a34a' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Exportar Excel
              </button>
            </div>
          </div>
        )}

        {generado && materias.length === 0 && (
          <div style={styles.emptyStateCard}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <h3 style={styles.emptyStateTitle}>Sin resultados</h3>
            <p style={styles.emptyStateDesc}>No hay materias registradas para esta carrera</p>
          </div>
        )}
      </main>

      <ReportePreviewModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmarDescarga}
        title="Reporte de Materias por Carrera"
        tipo={modalType}
        data={materias}
        columns={previewColumns}
        infoItems={previewInfoItems}
        stats={previewStats}
        color={ADMIN_CONFIG.color}
        footerExtra={
          <div style={{ display: 'flex', gap: 20 }}>
            <span><strong>Usuario:</strong> {user?.username}</span>
            <span><strong>Correo:</strong> {user?.email}</span>
            <span><strong>Rol:</strong> {user?.rol}</span>
          </div>
        }
      />
    </div>
  );
}


const styles = {
  root: { minHeight: '100vh', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 },
  headerBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  headerTitle: { fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 10 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '0.45rem 1rem', border: 'none', borderRadius: 8, background: '#7c3aed', color: 'white', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer', transition: 'background .15s' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '0.45rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: 8, background: 'white', color: '#475569', fontSize: '0.84rem', fontWeight: 500, cursor: 'pointer' },
  main: { maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  heroCard: { background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  roleChip: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.35rem 0.85rem', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.25rem' },
  heroTitle: { fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.6rem', letterSpacing: '-0.02em', lineHeight: 1.2 },
  heroDesc: { fontSize: '0.92rem', color: '#64748b', margin: '0 0 1.5rem', lineHeight: 1.65 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1rem', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, color: '#991b1b', fontSize: '0.9rem', marginBottom: '1.25rem' },

  // Banner Informativo
  instructionBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 10, color: '#5b21b6', fontSize: '0.85rem', marginBottom: '1.25rem' },

  filterSection: { display: 'flex', flexDirection: 'column', gap: 16, padding: '1.5rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
  filterRow: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  filterGroup: { flex: 1, minWidth: 180 },
  filterLabel: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '0.45rem' },
  filterSelect: { width: '100%', padding: '0.6rem 0.8rem', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.88rem', color: '#1e293b', background: 'white', cursor: 'pointer', transition: 'border-color .15s', boxSizing: 'border-box' },
  searchBtn: { width: '100%', padding: '0.65rem 1.5rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'background .15s' },

  // Card del estado inicial
  initialStateCard: { background: 'white', borderRadius: 16, padding: '3.5rem 2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', border: '1px dashed #cbd5e1' },
  initialStateText: { fontSize: '0.95rem', color: '#64748b', margin: 0, textAlign: 'center' },

  resultsCard: { background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  resultsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  resultsTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  statsBadges: { display: 'flex', gap: 12 },
  statBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0.6rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' },
  statValue: { fontSize: '1.25rem', color: '#7c3aed', fontWeight: 700 },
  reportMeta: { display: 'flex', flexWrap: 'wrap', gap: 12, padding: '1rem 0', color: '#334155', fontSize: '0.95rem' },
  reportMetaItem: { background: '#f8fafc', padding: '0.9rem 1rem', borderRadius: 12, border: '1px solid #e2e8f0' },
  tableWrapper: { overflowX: 'auto', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8fafc' },
  tableHeaderCell: { padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #e2e8f0', transition: 'background .15s' },
  tableCell: { padding: '0.9rem 1rem', fontSize: '0.9rem', color: '#1e293b' },
  infoStrip: { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0', marginBottom: '1rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 },
  infoLabel: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' },
  infoVal: { fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 },
  infoSep: { width: 1, height: 28, background: '#cbd5e1' },
  exportSection: { display: 'flex', gap: 12, paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.25rem', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all .15s' },
  emptyStateCard: { background: 'white', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyStateTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' },
  emptyStateDesc: { fontSize: '0.9rem', color: '#64748b' },
};