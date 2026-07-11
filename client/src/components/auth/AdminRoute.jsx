import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../layout/LoadingSpinner';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Show spinner while checking auth state
    if (loading) {
        return <LoadingSpinner />;
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Redirect non-admins to their dashboard
    if (user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }

    // Render the admin content
    return children;
};

export default AdminRoute;
