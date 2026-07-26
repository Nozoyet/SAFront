import api from './api';

function descargarBlob(res, filename) {
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const reporteService = {
  obtenerCarreras: async () => {
    const res = await api.get('/reportes/carreras');
    return res.data;
  },

  obtenerMateriasPorCarrera: async (carreraId, semestre) => {
    const params = { carrera_id: carreraId };
    if (semestre) params.semestre = semestre;
    const res = await api.get('/reportes/materias', { params });
    return res.data;
  },

  obtenerGestiones: async (carreraId) => {
    const res = await api.get('/reportes/gestiones', { params: { carrera_id: carreraId } });
    return res.data;
  },

  obtenerPeriodos: async (carreraId) => {
    const res = await api.get('/reportes/periodos', { params: { carrera_id: carreraId } });
    return res.data;
  },

  obtenerCursos: async (periodoId) => {
    const res = await api.get('/reportes/cursos-por-periodo', { params: { periodo_id: periodoId } });
    return res.data;
  },

  obtenerReporteEstudiantes: async (filters) => {
    const res = await api.get('/reportes/estudiantes', { params: filters });
    return res.data;
  },

  obtenerReporteDocentes: async (filters) => {
    const res = await api.get('/reportes/docentes', { params: filters });
    return res.data;
  },

  exportarPDF: async (carreraId) => {
    const res = await api.get(`/reportes/exportar-pdf/${carreraId}`, { responseType: 'blob' });
    descargarBlob(res, `reporte-materias-${carreraId}.pdf`);
  },

  exportarExcel: async (carreraId) => {
    const res = await api.get(`/reportes/exportar-excel/${carreraId}`, { responseType: 'blob' });
    descargarBlob(res, `reporte-materias-${carreraId}.xlsx`);
  },

  exportarPDFEstudiantes: async (filters) => {
    const res = await api.get('/reportes/exportar-pdf-estudiantes', { params: filters, responseType: 'blob' });
    descargarBlob(res, 'reporte-estudiantes.pdf');
  },

  exportarExcelEstudiantes: async (filters) => {
    const res = await api.get('/reportes/exportar-excel-estudiantes', { params: filters, responseType: 'blob' });
    descargarBlob(res, 'reporte-estudiantes.xlsx');
  },

  exportarPDFDocentes: async (filters) => {
    const res = await api.get('/reportes/exportar-pdf-docentes', { params: filters, responseType: 'blob' });
    descargarBlob(res, 'reporte-docentes.pdf');
  },

  exportarExcelDocentes: async (filters) => {
    const res = await api.get('/reportes/exportar-excel-docentes', { params: filters, responseType: 'blob' });
    descargarBlob(res, 'reporte-docentes.xlsx');
  },
};
