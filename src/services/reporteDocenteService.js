import api from "./api";

export const previewReporteDocente = async (filtros) => {
  const response = await api.get("/docente/reportes/preview", {
    params: filtros,
  });

  return response.data;
};

export const descargarReporteDocentePdf = (filtros) => {
  const params = new URLSearchParams(filtros).toString();
  window.open(`${api.defaults.baseURL}/docente/reportes/pdf?${params}`, "_blank");
};

export const descargarReporteDocenteExcel = (filtros) => {
  const params = new URLSearchParams(filtros).toString();
  window.open(`${api.defaults.baseURL}/docente/reportes/excel?${params}`, "_blank");
};