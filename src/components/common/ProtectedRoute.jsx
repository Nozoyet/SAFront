import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import ImpersonationBar from './ImpersonationBar';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.rol)) {
    const fallback = { Administrador: "/admin/bienvenida", Docente: "/docente/bienvenida", Estudiante: "/estudiante/bienvenida" };
    return <Navigate to={fallback[user?.rol] || "/login"} replace />;
  }

  return (
    <>
      <ImpersonationBar />
      {children}
    </>
  );
}