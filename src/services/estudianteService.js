import api from './api';

export const estudianteService = {
  obtenerReporte: async () => {
    const res = await api.get('/estudiante/reportes');
    return res.data;
  },

  exportarPDF: async () => {
    const res = await api.get('/estudiante/reportes/exportar-pdf', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte-academico.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportarExcel: async () => {
    const res = await api.get('/estudiante/reportes/exportar-excel', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reporte-academico.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
