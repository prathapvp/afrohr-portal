import { Navigate } from "react-router";
import type { ReactElement } from "react";
import { useAppSelector } from "../store";
import { getLandingTabForAccountType, selectAccountType, selectIsAuthenticated } from "../store/selectors/authSelectors";

interface PublicRouteProps{
    children: ReactElement;
}

const PublicRoute :React.FC<PublicRouteProps>=({ children}) => {
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const accountType = useAppSelector(selectAccountType);

    const getLanding = () => {
        const tab = getLandingTabForAccountType(accountType);
        if (tab) return `/dashboard?tab=${tab}`;
        return "/";
    };

    if(isAuthenticated){
        return <Navigate to={getLanding()} replace />
    }
    return children;
}
export default PublicRoute;