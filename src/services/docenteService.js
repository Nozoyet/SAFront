import api from './api';

export const docenteService = {
  obtenerFiltrosReportes: async () => {
    const res = await api.get('/docente/reportes/filtros');
    return res.data.data;
  },

  obtenerCursos: async () => {
    const res = await api.get('/docente/cursos');
    return res.data;
  },

  obtenerEstudiantes: async (cursoId) => {
    const res = await api.get(`/docente/cursos/${cursoId}/estudiantes`);
    return res.data;
  },

  guardarCalificaciones: async (cursoId, calificaciones) => {
    const res = await api.put(`/docente/cursos/${cursoId}/calificaciones`, { calificaciones });
    return res.data;
  },

  obtenerReporteCurso: async (cursoId) => {
    const res = await api.get(`/docente/reportes/curso/${cursoId}`);
    return res.data;
  },

  reportePreview: async (tipo, filtros = {}) => {
    const res = await api.get(`/docente/reportes/${tipo}/preview`, { params: filtros });
    return res.data;
  },

  exportarPreviewPdf: async (tipo, filtros = {}) => {
    const res = await api.get(`/docente/reportes/${tipo}/pdf`, { params: filtros, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-${tipo}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportarPreviewExcel: async (tipo, filtros = {}) => {
    const res = await api.get(`/docente/reportes/${tipo}/excel`, { params: filtros, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte-${tipo}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
