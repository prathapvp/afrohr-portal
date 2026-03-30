import { useSelector } from "react-redux";
import { Navigate } from "react-router";

interface PublicRouteProps{
    children: JSX.Element;
}

const PublicRoute :React.FC<PublicRouteProps>=({ children}) => {
    const token=useSelector((state:any)=>state.jwt);
    const accountType = (localStorage.getItem("accountType") || "").toUpperCase();

    const getLanding = () => {
        if (accountType === "EMPLOYER") return "/dashboard?tab=employers";
        if (accountType === "APPLICANT") return "/dashboard?tab=candidates";
        if (accountType === "STUDENT") return "/dashboard?tab=students";
        return "/";
    };

    if(token){
        return <Navigate to={getLanding()} replace />
    }
    return children;
}
export default PublicRoute;