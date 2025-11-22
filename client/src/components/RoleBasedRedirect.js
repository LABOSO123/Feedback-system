import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRedirect = () => {
  const { user } = useAuth();

  if (user?.role === 'business') {
    return <Navigate to="/business/home" replace />;
  } else if (user?.role === 'data_science') {
    return <Navigate to="/datascience/home" replace />;
  } else if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;



