import { Button, LoadingOverlay, PasswordInput, TextInput } from "@mantine/core";
import { IconAt, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { loginValidation } from "../../services/form-validation";
import { useDisclosure } from "@mantine/hooks";
import ResetPassword from "./ResetPassword";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { useDispatch } from "react-redux";
import { setUser } from "../../store/slices/UserSlice";
import { setJwt } from "../../store/slices/JwtSlice";
import { loginUser } from "../../services/AuthService";
import { jwtDecode } from "jwt-decode";

const getLandingPage = (accountType: string): string => {
    switch (accountType) {
        case "EMPLOYER": return "/dashboard?tab=employers";
        case "APPLICANT": return "/dashboard?tab=candidates";
        case "STUDENT": return "/dashboard?tab=students";
        default: return "/";
    }
};

const Login = () => {
    const dispatch = useDispatch();
    const authFieldStyles = {
        label: { color: "rgba(241, 245, 249, 0.92)", fontWeight: 600, marginBottom: 6 },
        input: {
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(255, 255, 255, 0.16)",
            color: "#0f172a"
        },
        section: { color: "#94a3b8" },
        error: { color: "#fda4af", marginTop: 4 }
    };
    const form = {
        email: "",
        password: "",
    }
    const [opened, { open, close }] = useDisclosure(false);
    const [data, setData] = useState<{ [key: string]: string }>(form);
    const [formError, setFormError] = useState<{ [key: string]: string }>(form);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleChange = (event: any) => {
        setFormError({...formError, [event.target.name]:""});
        setData({ ...data, [event.target.name]: event.target.value });
    }
    const handleSubmit = () => {
        let valid = true, newFormError: { [key: string]: string } = {};
        for (let key in data) {
            newFormError[key] = loginValidation(key, data[key]);
            if (newFormError[key]) valid = false;
        }
        setFormError(newFormError);
        if (valid) {
            setLoading(true);
            loginUser(data).then((res) => {
                if (!res.jwt) {
                    throw new Error('No JWT token in login response');
                }
                
                successNotification("Login Successful", "Redirecting to your dashboard...");
                dispatch(setJwt(res.jwt));
                const decoded: any = jwtDecode(res.jwt);
                dispatch(setUser({...decoded, email:decoded.sub}));
                const landing = getLandingPage(decoded.accountType);
                setTimeout(() => {
                    navigate(landing);
                }, 4000)
            }).catch((err) => {
                let message = "Login failed. Please try again.";
                
                if (err.response?.data?.errorMessage) {
                    message = err.response.data.errorMessage;
                } else if (err.response?.data?.message) {
                    message = err.response.data.message;
                } else if (err.message) {
                    message = err.message;
                }
                
                errorNotification("Login Failed", message);
                setLoading(false);
            });

        }
    }
    return <>   <LoadingOverlay
    visible={loading}
    zIndex={1000}
    overlayProps={{ radius: 'sm', blur: 2 }}
    loaderProps={{ color: 'orange', type: 'bars' }}
    /><div className="auth-form-panel w-1/2 sm-mx:w-full px-20 bs-mx:px-10 md-mx:px-5 flex flex-col gap-3 justify-center py-10 sm-mx:py-8">
        <div className="auth-form-title text-2xl font-bold text-slate-50">Welcome Back</div>
        <p className="-mt-1 text-sm text-slate-300">Sign in to continue your journey</p>
        <TextInput value={data.email} error={formError.email} name="email" onChange={handleChange} leftSection={<IconAt size={16} />} label="Email" withAsterisk placeholder="Your email" styles={authFieldStyles} />
        <PasswordInput value={data.password} error={formError.password} name="password" onChange={handleChange} leftSection={<IconLock size={16} />} label="Password" withAsterisk placeholder="Password" styles={authFieldStyles} />
        <Button loading={loading} onClick={handleSubmit} variant="gradient" gradient={{ from: 'orange', to: 'pink', deg: 90 }} size="md" radius="xl" className="mt-1 shadow-lg shadow-orange-200">Login</Button>
        <div className="text-center text-sm text-slate-300">Don't have an account? <span className="text-orange-400 font-medium hover:text-orange-300 hover:underline cursor-pointer" onClick={()=>{navigate("/signup");setFormError(form) ;setData(form)}}>Sign Up</span> </div>
        <div className="text-orange-400 text-sm hover:text-orange-300 hover:underline cursor-pointer text-center font-medium" onClick={open}>Forgot Password?</div>

    </div>
    <ResetPassword opened={opened} close={close} />
    </>
}
export default Login;
