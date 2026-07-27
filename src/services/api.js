import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api-sistema-academico.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token expira → redirigir al login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/logout');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Obtener todos los usuarios
export const getUsuarios = () => api.get('/usuarios');

// Crear un nuevo usuario
export const crearUsuario = (data) => api.post('/usuarios', data);

// Eliminar un usuario (soft delete)
export const eliminarUsuario = (id) => api.delete(`/usuarios/${id}`);

export default api;

export const obtenerCarreras = () => api.get("/carrera");
//Impersonar
export const impersonarUsuario = (id) => api.post(`/usuarios/${id}/impersonar`);
export const detenerImpersonacion = () => api.post('/impersonar/detener');