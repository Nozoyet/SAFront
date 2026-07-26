import api from './api';

export const getNotificaciones = () => api.get('/notificaciones');

export const getNoLeidasCount = () => api.get('/notificaciones/no-leidas');

export const marcarLeida = (id) => api.patch(`/notificaciones/${id}/leer`);

export const marcarTodasLeidas = () => api.patch('/notificaciones/leer-todas');
