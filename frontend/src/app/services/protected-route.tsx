import { Navigate } from "react-router";
import type { ReactElement } from "react";
import { useAppSelector } from "../store";
import { selectAccountType, selectIsAuthenticated } from "../store/selectors/authSelectors";

interface ProtectedRouteProps {
    children: ReactElement;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const accountType = useAppSelector(selectAccountType);
    if (!isAuthenticated) {
        return <Navigate to="/login" />
    }
    if (allowedRoles && !allowedRoles.includes(accountType)) return <Navigate to="/unauthorized" />;

    return children;
}
export default ProtectedRoute;