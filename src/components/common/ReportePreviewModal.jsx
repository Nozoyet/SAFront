import { useMemo } from 'react';

const DEFAULT_COLOR = '#7c3aed';

export default function ReportePreviewModal({ show, onClose, onConfirm, title, tipo, data, columns, infoItems, stats, color = DEFAULT_COLOR, footerExtra }) {
  const fecha = useMemo(() => {
    return new Date().toLocaleDateString('es-BO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }, []);

  if (!show) return null;

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modalOuter} onClick={(e) => e.stopPropagation()}>
        <div style={modalContent}>
          <div style={modalHeader}>
            <h5 style={modalTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={{ marginRight: 8 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Previsualización — Exportar {tipo?.toUpperCase()}
            </h5>
            <button onClick={onClose} style={closeBtn}>&times;</button>
          </div>

          <div style={bodyStyle}>
            {/* PDF-style preview */}
            <div style={previewContainer}>
              <div style={{ ...headerBar, background: color }} />

              <h1 style={previewTitle}>{title}</h1>
              <p style={previewSubtitle}>Documento generado el {fecha}</p>

              {infoItems && infoItems.length > 0 && (
                <div style={infoSection}>
                  {infoItems.map((item, idx) => (
                    <div key={idx} style={{ ...infoItem, borderLeft: `3px solid ${color}` }}>
                      <div style={infoLabel}>{item.label}</div>
                      <div style={infoValue}>{item.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {stats && stats.length > 0 && (
                <div style={statsSection}>
                  {stats.map((s, idx) => (
                    <div key={idx} style={{ ...statBox, background: s.bg, color: s.text }}>
                      <div style={statValue}>{s.value}</div>
                      <div style={statLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {columns.map((col, idx) => (
                        <th key={idx} style={{
                          ...thStyle,
                          background: color,
                          width: col.width || 'auto',
                          textAlign: col.align || 'left'
                        }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, rowIdx) => (
                      <tr key={rowIdx} style={{
                        ...trStyle,
                        background: rowIdx % 2 === 0 ? '#f8fafc' : '#ffffff'
                      }}>
                        {columns.map((col, colIdx) => (
                          <td key={colIdx} style={{
                            ...tdStyle,
                            textAlign: col.align || 'left'
                          }}>
                            {col.render ? col.render(row) : (row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={footerStyle}>
                {footerExtra && <div style={footerExtraRow}>{footerExtra}</div>}
                <p style={{ margin: 0 }}><strong>Fecha de generación:</strong> {fecha}</p>
                <p style={{ margin: '2px 0 0' }}>Este reporte fue generado automáticamente por el Sistema Académico</p>
              </div>
            </div>
          </div>

          <div style={modalFooter}>
            <button onClick={onClose} style={cancelBtn}>Cancelar</button>
            <button onClick={onConfirm} style={{ ...confirmBtn, background: color }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Confirmar Descarga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const backdrop = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', zIndex: 1050,
  overflowY: 'auto', padding: '30px 15px',
};
const modalOuter = { margin: '0 auto', maxWidth: 900 };
const modalContent = {
  border: 'none', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  overflow: 'hidden', background: '#ffffff',
};
const modalHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0',
};
const modalTitle = {
  fontWeight: 700, fontSize: '1.05rem', color: '#0f172a',
  display: 'flex', alignItems: 'center', margin: 0,
};
const closeBtn = {
  border: 'none', background: 'transparent', fontSize: 24, cursor: 'pointer',
  color: '#94a3b8', lineHeight: 1, padding: '0 4px',
};
const bodyStyle = { padding: '1.25rem' };

const previewContainer = {
  border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden',
  background: '#ffffff',
};
const headerBar = {
  height: 4,
};
const previewTitle = {
  fontSize: '1.3rem', fontWeight: 700, color: '#0f172a',
  margin: '16px 20px 2px', letterSpacing: '-0.01em',
};
const previewSubtitle = {
  fontSize: '0.78rem', color: '#64748b',
  margin: '0 20px 16px',
};
const infoSection = {
  display: 'flex', gap: 12, margin: '0 20px 16px', flexWrap: 'wrap',
};
const infoItem = {
  flex: 1, minWidth: 140, background: '#f8fafc',
  padding: '10px 14px', borderRadius: 8,
};
const infoLabel = {
  fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2,
};
const infoValue = {
  fontSize: '0.88rem', color: '#1e293b', fontWeight: 600,
};
const statsSection = {
  display: 'flex', gap: 15, margin: '0 20px 20px',
};
const statBox = {
  flex: 1, textAlign: 'center', padding: '12px', borderRadius: 8,
};
const statValue = {
  fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2,
};
const statLabel = {
  fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600,
  letterSpacing: '0.5px', marginTop: 3,
};
const footerExtraRow = {
  display: 'flex', justifyContent: 'space-between', marginBottom: 6,
};
const tableStyle = {
  width: '100%', borderCollapse: 'collapse',
  margin: '0 0 16px',
};
const thStyle = {
  padding: '10px 14px', fontSize: '0.75rem', fontWeight: 700,
  color: '#ffffff',
  textTransform: 'uppercase', letterSpacing: '0.4px',
  whiteSpace: 'nowrap',
};
const trStyle = {
  borderBottom: '1px solid #e2e8f0',
};
const tdStyle = {
  padding: '9px 14px', fontSize: '0.82rem', color: '#1e293b',
};
const footerStyle = {
  margin: '0 20px 16px', paddingTop: 12, borderTop: '1px solid #e2e8f0',
  fontSize: '0.72rem', color: '#64748b',
};
const modalFooter = {
  display: 'flex', justifyContent: 'flex-end', gap: 10,
  padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0',
};
const cancelBtn = {
  padding: '0.5rem 1.25rem', borderRadius: 10,
  border: '1px solid #cbd5e1', background: 'white',
  color: '#475569', fontWeight: 600, fontSize: '0.88rem',
  cursor: 'pointer',
};
const confirmBtn = {
  padding: '0.5rem 1.25rem', borderRadius: 10,
  border: 'none', color: '#ffffff',
  fontWeight: 600, fontSize: '0.88rem',
  display: 'flex', alignItems: 'center', cursor: 'pointer',
};
