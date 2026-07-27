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

export default function ReportesEstudiantes() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [carreras, setCarreras] = useState([]);
  const [carreraId, setCarreraId] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [cursos, setCursos] = useState([]);
  const [cursoId, setCursoId] = useState('');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [error, setError] = useState('');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [nombre, setNombre] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // 1. Cargar carreras al montar el componente
useEffect(() => {
  cargarCarreras();
}, []);

// 2. Efecto para reaccionar al cambio de Carrera
useEffect(() => {
  if (carreraId) {
    // RESET INMEDIATO antes de la petición asíncrona
    setPeriodos([]);
    setPeriodoId('');
    setCursos([]);
    setCursoId('');

    cargarPeriodos(carreraId);
  } else {
    // Si vuelve a "-- Seleccionar --"
    setPeriodos([]);
    setPeriodoId('');
    setCursos([]);
    setCursoId('');
  }
}, [carreraId]);

// 3. Efecto para reaccionar al cambio de Periodo
useEffect(() => {
  if (periodoId) {
    // RESET INMEDIATO
    setCursos([]);
    setCursoId('');

    cargarCursos(periodoId);
  } else {
    setCursos([]);
    setCursoId('');
  }
}, [periodoId]);

// 4. Cargar carreras sin autoseleccionar el primer valor
const cargarCarreras = async () => {
  try {
    const data = await reporteService.obtenerCarreras();
    setCarreras(data);
    // REMOVIDO: setCarreraId(data[0].id); -> Mantiene el valor inicial en ""
  } catch (err) {
    setError('Error al cargar carreras: ' + (err.response?.data?.error || err.message));
  }
};

// 5. Cargar periodos sin autoseleccionar el primer valor
const cargarPeriodos = async (id) => {
  try {
    const data = await reporteService.obtenerPeriodos(id);
    setPeriodos(data);
    // REMOVIDO: setPeriodoId(data[0].id); -> Mantiene el valor inicial en ""
  } catch (err) {
    setError('Error al cargar periodos: ' + (err.response?.data?.error || err.message));
  }
};

// 6. Cargar cursos
const cargarCursos = async (id) => {
  try {
    const data = await reporteService.obtenerCursos(id);
    setCursos(data);
  } catch (err) {
    setError('Error al cargar cursos: ' + (err.response?.data?.error || err.message));
  }
};
  const buscar = async (sobreescribir = {}) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      const cId = sobreescribir.carreraId ?? carreraId;
      const pId = sobreescribir.periodoId ?? periodoId;
      const cuId = sobreescribir.cursoId ?? cursoId;
      if (cId) params.carrera_id = cId;
      if (pId) params.periodo_id = pId;
      if (cuId) params.curso_id = cuId;
      if (sobreescribir.fechaInicio ?? fechaInicio) params.fecha_inicio = sobreescribir.fechaInicio ?? fechaInicio;
      if (sobreescribir.fechaFin ?? fechaFin) params.fecha_fin = sobreescribir.fechaFin ?? fechaFin;
      if (sobreescribir.nombre ?? nombre) params.nombre = sobreescribir.nombre ?? nombre;
      if (sobreescribir.nombreUsuario ?? nombreUsuario) params.nombreUsuario = sobreescribir.nombreUsuario ?? nombreUsuario;
      const result = await reporteService.obtenerReporteEstudiantes(params);
      setData(result);
      setGenerado(true);
    } catch (err) {
      setError('Error al generar reporte: ' + (err.response?.data?.error || err.message));
      setGenerado(false);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (type) => {
    if (data.length === 0) return;
    setModalType(type);
    setShowModal(true);
  };

  const confirmarDescarga = async () => {
    setShowModal(false);
    try {
      const exportParams = {
        carrera_id: carreraId || undefined,
        periodo_id: periodoId || undefined,
        curso_id: cursoId || undefined,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        nombre: nombre || undefined,
        nombreUsuario: nombreUsuario || undefined,
      };
      if (modalType === 'pdf') {
        await reporteService.exportarPDFEstudiantes(exportParams);
      } else {
        await reporteService.exportarExcelEstudiantes(exportParams);
      }
    } catch (err) {
      setError('Error al descargar: ' + (err.response?.data?.error || err.message));
    }
  };

  const previewColumns = useMemo(() => [
    { key: 'matricula', label: 'Matrícula', width: '14%' },
    { key: 'estudiante', label: 'Estudiante', width: '24%' },
    { key: 'carrera', label: 'Carrera', width: '18%' },
    { key: 'curso', label: 'Curso', width: '18%' },
    { key: 'notaFinal', label: 'Nota', width: '10%', align: 'center', render: (r) => r.notaFinal ?? '—' },
    { key: 'estado', label: 'Estado', width: '12%', align: 'center', render: (r) => (
      <span style={{
        background: r.estado === 'Activa' ? '#dcfce7' : r.estado === 'Completada' ? '#dbeafe' : '#fef3c7',
        color: r.estado === 'Activa' ? '#166534' : r.estado === 'Completada' ? '#1e40af' : '#92400e',
        borderRadius: 999, padding: '2px 12px', fontSize: 11, fontWeight: 600,
      }}>{r.estado}</span>
    )},
  ], []);

  const previewInfoItems = useMemo(() => [
    { label: 'Total registros', value: data.length },
  ], [data]);

  const previewStats = useMemo(() => [
    { label: 'Total Estudiantes', value: data.length, bg: '#ede9fe', text: '#7c3aed' },
  ], [data]);

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
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            Reporte de Estudiantes
          </div>

          <h1 style={styles.heroTitle}>
            Reportes de <span style={{ color: ADMIN_CONFIG.color }}>Estudiantes</span>
          </h1>
          <p style={styles.heroDesc}>
            Consulta estudiantes inscritos, notas y avance académico por carrera, gestión y curso.
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

          {/* LEYENDA INFORMATIVA */}
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
                <select value={carreraId} onChange={(e) => setCarreraId(e.target.value)} style={styles.filterSelect}>
                  <option value="">-- Seleccionar --</option>
                  {carreras.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Gestión / Periodo</label>
                <select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)} style={styles.filterSelect} disabled={!carreraId}>
                  <option value="">-- Seleccionar --</option>
                  {periodos.map((p) => (
                    <option key={p.id} value={p.id}>{p.codigo}</option>
                  ))}
                </select>
              </div>

              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Curso</label>
                <select value={cursoId} onChange={(e) => setCursoId(e.target.value)} style={styles.filterSelect} disabled={!periodoId}>
                  <option value="">Todos los cursos</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Nombre del Estudiante</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Buscar por nombre..." style={styles.filterSelect} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Nombre de Usuario</label>
                <input type="text" value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} placeholder="Buscar por usuario..." style={styles.filterSelect} />
              </div>
            </div>

            <div style={styles.filterRow}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Fecha inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={styles.filterSelect} />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>Fecha fin</label>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={styles.filterSelect} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={() => buscar()}
                disabled={loading}
                style={{
                  ...styles.searchBtn,
                  opacity: loading ? 0.7 : 1,
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

        {/* ESTADO INICIAL (Antes de presionar Generar Reporte) */}
        {!generado && !loading && (
          <div style={styles.initialStateCard}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p style={styles.initialStateText}>
              Selecciona los filtros requeridos y haz clic en <strong>Generar Reporte</strong> para visualizar los estudiantes
            </p>
          </div>
        )}

        {/* RESULTADOS */}
        {generado && data.length > 0 && (
          <div style={styles.resultsCard}>
            <div style={styles.resultsHeader}>
              <h2 style={styles.resultsTitle}>Resultados de estudiantes</h2>
              <div style={styles.statsBadges}>
                <div style={styles.statBadge}>
                  <span style={styles.statLabel}>Total</span>
                  <span style={styles.statValue}>{data.length}</span>
                </div>
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th style={styles.tableHeaderCell}>Matrícula</th>
                    <th style={styles.tableHeaderCell}>Estudiante</th>
                    <th style={styles.tableHeaderCell}>Carrera</th>
                    <th style={styles.tableHeaderCell}>Curso</th>
                    <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Nota</th>
                    <th style={{ ...styles.tableHeaderCell, textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row.id} style={{ ...styles.tableRow, background: idx % 2 === 0 ? '#f8fafc' : 'white' }}>
                      <td style={styles.tableCell}>{row.matricula}</td>
                      <td style={styles.tableCell}>{row.estudiante}</td>
                      <td style={styles.tableCell}>{row.carrera}</td>
                      <td style={styles.tableCell}>{row.curso}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>{row.notaFinal ?? '—'}</td>
                      <td style={{ ...styles.tableCell, textAlign: 'center' }}>
                        <span style={{
                          ...styles.statusBadge,
                          background: row.estado === 'Activa' ? '#dcfce7' : row.estado === 'Completada' ? '#dbeafe' : '#fef3c7',
                          color: row.estado === 'Activa' ? '#166534' : row.estado === 'Completada' ? '#1e40af' : '#92400e',
                        }}>
                          {row.estado}
                        </span>
                      </td>
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

        {/* SIN RESULTADOS */}
        {generado && data.length === 0 && (
          <div style={styles.emptyStateCard}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
            <h3 style={styles.emptyStateTitle}>Sin resultados</h3>
            <p style={styles.emptyStateDesc}>No se encontraron estudiantes para los filtros seleccionados.</p>
          </div>
        )}
      </main>

      <ReportePreviewModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmarDescarga}
        title="Reporte de Estudiantes"
        tipo={modalType}
        data={data}
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
  
  // Card del estado inicial (Lupa / Vacío inicial)
  initialStateCard: { background: 'white', borderRadius: 16, padding: '3.5rem 2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', border: '1px dashed #cbd5e1' },
  initialStateText: { fontSize: '0.95rem', color: '#64748b', margin: 0, textAlign: 'center' },

  resultsCard: { background: 'white', borderRadius: 16, padding: '2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  resultsHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' },
  resultsTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' },
  statsBadges: { display: 'flex', gap: 12 },
  statBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '0.6rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' },
  statLabel: { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' },
  statValue: { fontSize: '1.25rem', color: '#7c3aed', fontWeight: 700 },
  tableWrapper: { overflowX: 'auto', marginBottom: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8fafc' },
  tableHeaderCell: { padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: '#475569', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' },
  tableRow: { borderBottom: '1px solid #e2e8f0', transition: 'background .15s' },
  tableCell: { padding: '0.9rem 1rem', fontSize: '0.9rem', color: '#1e293b' },
  statusBadge: { display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 },
  exportSection: { display: 'flex', gap: 12, paddingTop: '1rem', borderTop: '1px solid #e2e8f0' },
  infoStrip: { display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 0', marginBottom: '1rem', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 },
  infoLabel: { fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' },
  infoVal: { fontSize: '0.95rem', color: '#0f172a', fontWeight: 600 },
  infoSep: { width: 1, height: 28, background: '#cbd5e1' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1.25rem', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all .15s' },
  emptyStateCard: { background: 'white', borderRadius: 16, padding: '3rem 2rem', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  emptyStateTitle: { fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' },
  emptyStateDesc: { fontSize: '0.9rem', color: '#64748b' },
};