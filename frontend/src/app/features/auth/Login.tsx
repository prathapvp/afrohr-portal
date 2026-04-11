import { Button, LoadingOverlay, PasswordInput, TextInput } from "@mantine/core";
import { IconAt, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { loginValidation } from "../../services/form-validation";
import { useDisclosure } from "@mantine/hooks";
import ResetPassword from "./ResetPassword";
import { errorNotification } from "../../services/NotificationService";
import { useAppDispatch } from "../../store";
import { setUser } from "../../store/slices/UserSlice";
import { setJwt } from "../../store/slices/JwtSlice";
import { getCurrentUser, loginUser } from "../../services/auth-service";
import { getLandingTabForAccountType } from "../../store/selectors/authSelectors";

const getReadableLoginError = (err: unknown) => {
    const responseError = err as {
        response?: { status?: number; data?: { errorMessage?: string; message?: string } };
        message?: string;
    };

    const status = responseError.response?.status;
    const backendMessage = responseError.response?.data?.errorMessage || responseError.response?.data?.message || "";
    const normalized = backendMessage.toLowerCase();

    if (status === 429 || normalized.includes("rate") || normalized.includes("too many")) {
        return "Too many login attempts. Please wait a minute and try again.";
    }

    if (status === 401 || normalized.includes("incorrect username or password") || normalized.includes("invalid credentials")) {
        return "Incorrect email or password.";
    }

    if (status === 403 || normalized.includes("locked") || normalized.includes("inactive") || normalized.includes("disabled")) {
        return "Your account is unavailable. Please contact support.";
    }

    if (status && status >= 500) {
        return "Server is temporarily unavailable. Please try again shortly.";
    }

    if (backendMessage) {
        return backendMessage;
    }

    return responseError.message || "Login failed. Please try again.";
};

const getLandingPage = (accountType: string): string => {
    switch (accountType) {
        case "EMPLOYER": return "/dashboard?tab=employers";
        case "APPLICANT": return "/dashboard?tab=candidates";
        case "STUDENT": return "/dashboard?tab=students";
        default: return "/";
    }
};

const normalizeNextTab = (value: string | null): "candidates" | "employers" | "students" | null => {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === "candidates" || normalized === "employers" || normalized === "students") {
        return normalized;
    }
    return null;
};

const Login = () => {
    const dispatch = useAppDispatch();
    const authFieldStyles = {
        label: { color: "rgba(241, 245, 249, 0.92)", fontWeight: 600, marginBottom: 6 },
        input: {
            borderRadius: 12,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderColor: "rgba(255, 255, 255, 0.16)",
            color: "#0f172a",
            transition: "all 140ms ease",
            "&:focus": {
                borderColor: "rgba(251, 191, 36, 0.85)",
                boxShadow: "0 0 0 3px rgba(251, 191, 36, 0.22)",
            },
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
    const [touched, setTouched] = useState<{ [key: string]: boolean }>({ email: false, password: false });
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [capsLockOn, setCapsLockOn] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isFormFilled = data.email.trim().length > 0 && data.password.trim().length > 0;
    const hasValidationErrors = Object.keys(data).some((key) => loginValidation(key, data[key]));
    const isSubmitDisabled = loading || !isFormFilled || hasValidationErrors;
    const visibleError = {
        email: touched.email || submitAttempted ? formError.email : "",
        password: touched.password || submitAttempted ? formError.password : "",
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormError({...formError, [event.target.name]:""});
        setData({ ...data, [event.target.name]: event.target.value });
    }
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = event.currentTarget;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setFormError((prev) => ({ ...prev, [name]: loginValidation(name, value) }));
    };
    const handlePasswordKeyEvent = (event: React.KeyboardEvent<HTMLInputElement>) => {
        setCapsLockOn(event.getModifierState("CapsLock"));
    };
    const handleSubmit = () => {
        setSubmitAttempted(true);
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
                
                dispatch(setJwt(res.jwt));
                return getCurrentUser().then((currentUser) => {
					dispatch(setUser(currentUser));
                    const accountType = String(currentUser?.accountType ?? "");
                    const landing = getLandingPage(accountType);
                    const landingTab = getLandingTabForAccountType(accountType);
                    const requestedTab = normalizeNextTab(searchParams.get("next"));
                    const destination = requestedTab && landingTab === requestedTab
                        ? `/dashboard?tab=${requestedTab}`
                        : landing;
                    navigate(destination, { replace: true });
				});
            }).catch((err) => {
                const message = getReadableLoginError(err);
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
    /><form
        className="auth-form-panel w-1/2 sm-mx:w-full px-20 bs-mx:px-10 md-mx:px-5 flex flex-col gap-3 justify-center py-10 sm-mx:py-8"
        onSubmit={(event) => {
            event.preventDefault();
            if (!isSubmitDisabled) {
                handleSubmit();
            }
        }}
    >
        <div className="auth-form-title text-2xl font-bold text-slate-50">Welcome Back</div>
        <p className="-mt-1 text-sm text-slate-300">Sign in to continue your journey</p>
        <TextInput value={data.email} error={visibleError.email} name="email" onChange={handleChange} onBlur={handleBlur} leftSection={<IconAt size={16} />} label="Email" withAsterisk placeholder="Your email" styles={authFieldStyles} autoFocus autoComplete="email" />
        <PasswordInput
            value={data.password}
            error={visibleError.password}
            name="password"
            onChange={handleChange}
            onBlur={(event) => {
                setCapsLockOn(false);
                handleBlur(event);
            }}
            leftSection={<IconLock size={16} />}
            label="Password"
            withAsterisk
            placeholder="Password"
            styles={authFieldStyles}
            autoComplete="current-password"
            onKeyUp={handlePasswordKeyEvent}
            onKeyDown={handlePasswordKeyEvent}
        />
        {capsLockOn && (
            <div className="-mt-1 text-xs font-medium text-amber-300">
                Caps Lock is on.
            </div>
        )}
        <div className="-mt-1 text-[11px] text-slate-400">Use 8+ characters for your password.</div>
        <Button
            loading={loading}
            disabled={isSubmitDisabled}
            type="submit"
            variant="gradient"
            gradient={{ from: 'orange', to: 'pink', deg: 90 }}
            size="md"
            radius="xl"
            className={`mt-2 font-semibold transition-all duration-150 ${
                isSubmitDisabled
                    ? "opacity-65 !shadow-none"
                    : "shadow-lg shadow-orange-300/45 hover:-translate-y-0.5"
            }`}
        >
            {loading ? "Signing you in..." : "Login"}
        </Button>
        <div className="-mt-1 text-center text-[11px] text-slate-400">Your data is encrypted and securely processed.</div>
        <div className="text-center text-sm text-slate-300">Don't have an account? <span className="text-orange-400 font-medium hover:text-orange-300 hover:underline cursor-pointer" onClick={()=>{navigate("/signup");setFormError(form) ;setData(form)}}>Sign Up</span> </div>
        <button type="button" className="text-orange-300/90 text-sm hover:text-orange-200 hover:underline cursor-pointer text-center font-medium transition-colors" onClick={open}>Forgot Password?</button>

    </form>
    <ResetPassword opened={opened} close={close} />
    </>
}
export default Login;
