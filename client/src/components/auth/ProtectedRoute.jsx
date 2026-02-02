import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../layout/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Show spinner while checking auth state (prevents flicker)
    if (loading) {
        return <LoadingSpinner />;
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Render the protected content
    return children;
};

export default ProtectedRoute;
