import { Button, Checkbox, LoadingOverlay, Modal, PasswordInput, PinInput, TextInput } from "@mantine/core";
import { IconAt, IconBriefcase, IconCircleCheck, IconLock, IconUser, IconUserSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { registerUser, sendOtp, verifyOtp } from "../../services/user-service";
import { signupValidation } from "../../services/form-validation";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { useInterval } from "@mantine/hooks";

const getPasswordChecks = (password: string) => ({
    minLength: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
});

const getPasswordStrength = (password: string) => {
    const checks = getPasswordChecks(password);
    const score = Object.values(checks).filter(Boolean).length;

    if (!password) return { score: 0, label: "Add a password", barClass: "bg-slate-500/40" };
    if (score <= 2) return { score, label: "Weak", barClass: "bg-rose-500" };
    if (score <= 4) return { score, label: "Medium", barClass: "bg-amber-500" };
    return { score, label: "Strong", barClass: "bg-emerald-500" };
};

const SignUp = () => {
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
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        accountType: "APPLICANT"
    }
    const [data, setData] = useState<{[key:string]:string}>(form);
    const [formError, setFormError] = useState<{[key:string]:string}>(form);
    const [loading, setLoading] = useState(false);
    const [otpStep, setOtpStep] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [resendLoader, setResendLoader] = useState(false);
    const [time, setTime] = useState(60);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState("");
    const [termsModalOpen, setTermsModalOpen] = useState(false);
    const [stepTransition, setStepTransition] = useState(false);
    const navigate=useNavigate();
    const passwordStrength = getPasswordStrength(data.password);
    const passwordChecks = getPasswordChecks(data.password);
    const interval = useInterval(() => {
        if (time === 0) {
            setResendLoader(false);
            setTime(60);
            interval.stop();
        }
        else setTime((s) => s - 1);
    }, 1000);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement> | string) => {
        if (typeof (event) == "string") {
            setData({ ...data, accountType: event });
            return;
        }
        let name = event.target.name, value = event.target.value;
        setData({ ...data, [name]: value });
        setFormError({ ...formError, [name]: signupValidation(name, value) });
        if (name === "password" && data.confirmPassword !== "") {
            let err="";
            if (data.confirmPassword !== value) err= "Passwords do not match." ;
            setFormError({ ...formError, [name]: signupValidation(name, value) , confirmPassword:err });
        }
        if (name === "confirmPassword") {
            if (data.password !== value) setFormError({ ...formError, [name]: "Passwords do not match." });
            else setFormError({ ...formError, confirmPassword: "" });
        }
    }

    const handleSendOtp = () => {
        setOtpSending(true);
        sendOtp(data.email).then(() => {
            successNotification("OTP Sent", "Check your email for the verification code.");
            setOtpSending(false);
            setResendLoader(true);
            interval.start();
            setStepTransition(true);
            setTimeout(() => {
                setOtpStep(true);
                setStepTransition(false);
            }, 650);
        }).catch((err) => {
            setOtpSending(false);
            errorNotification("OTP Sending Failed", err.response?.data?.errorMessage || "Could not send OTP.");
        });
    }

    const handleVerifyOtp = (otp: string) => {
        setLoading(true);
        verifyOtp(data.email, otp).then(() => {
            setOtpVerified(true);
            successNotification("Email Verified", "Completing registration...");
            registerUser(data).then(() => {
                setData(form);
                setTermsAccepted(false);
                setTermsError("");
                successNotification("Registered Successfully", "Redirecting to login page...");
                setTimeout(() => {
                    navigate("/login");
                    setLoading(false);
                }, 2000);
            }).catch((err) => {
                setLoading(false);
                let errorMessage = "Registration failed. Please try again.";
                if (err.response?.data?.errorMessage) {
                    errorMessage = err.response.data.errorMessage;
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const errors = err.response.data.errors;
                    if (typeof errors === 'object' && !Array.isArray(errors)) {
                        errorMessage = Object.values(errors).join(', ');
                    } else if (Array.isArray(errors)) {
                        errorMessage = errors.join(', ');
                    }
                } else if (err.message) {
                    errorMessage = err.message;
                }
                errorNotification("Registration Failed", errorMessage);
            });
        }).catch((err) => {
            setLoading(false);
            errorNotification("Verification Failed", err.response?.data?.errorMessage || "Invalid OTP.");
        });
    }

    const handleResendOtp = () => {
        if (resendLoader) return;
        handleSendOtp();
    }

    const handleBackToForm = () => {
        setOtpStep(false);
        setResendLoader(false);
        setTime(60);
        interval.stop();
    }

    const handleSubmit = () => {
        let valid=true, newFormError:{[key:string]:string}={};
        for(let key in data){
            if(key==="accountType")continue;
            if(key!=="confirmPassword")newFormError[key]=signupValidation(key, data[key]);
            else if(data[key]!==data["password"])newFormError[key]="Passwords do not match.";
            if(newFormError[key])valid=false;
        }
        if (!termsAccepted) {
            valid = false;
            setTermsError("Please accept Terms and Conditions to continue.");
        } else {
            setTermsError("");
        }
        setFormError(newFormError);
        if(valid===true){
            handleSendOtp();
        }
    }
    const accountTypes = [
        { value: "APPLICANT", label: "Applicant", icon: IconUserSearch, desc: "Find jobs" },
        { value: "EMPLOYER", label: "Employer", icon: IconBriefcase, desc: "Hire talent" },
    ];

        return <><LoadingOverlay
    visible={loading}
    zIndex={1000}
    className="translate-x-1/2"
    overlayProps={{ radius: 'sm', blur: 2 }}
    loaderProps={{ color: 'orange', type: 'bars' }}
    /> <div className="auth-form-panel w-full sm:w-1/2 px-5 sm:px-10 lg:px-16 flex flex-col gap-3 justify-center py-8 sm:py-10">
        <div className="mb-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${!otpStep ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-200"}`}>1</span>
                <span className={!otpStep ? "text-orange-300" : "text-slate-400"}>Account Details</span>
                <span className="mx-1 h-px flex-1 bg-white/15" />
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] ${otpStep ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-200"}`}>2</span>
                <span className={otpStep ? "text-orange-300" : "text-slate-400"}>Verify Email</span>
            </div>
        </div>
        <div className="auth-form-title text-2xl font-bold text-slate-50">Create Account</div>
        <p className="-mt-1 mb-1 text-sm text-slate-300">Start your career journey today</p>
        {stepTransition ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 p-4 shadow-md">
                <IconCircleCheck size={30} className="text-emerald-600" stroke={1.8} />
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-slate-100">Details captured</p>
                <p className="mt-1 text-xs text-slate-300">Moving to email verification...</p>
            </div>
        </div>
        ) : !otpStep ? <>
        <TextInput value={data.name} error={formError.name} name="name" onChange={handleChange} leftSection={<IconUser size={16} stroke={1.5} />} label="Full Name" withAsterisk placeholder="Your name" size="sm" styles={authFieldStyles} />
        <TextInput error={formError.email} value={data.email} name="email" onChange={handleChange} leftSection={<IconAt size={16} stroke={1.5} />} label="Email" withAsterisk placeholder="Your email" size="sm" styles={authFieldStyles} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PasswordInput className="flex-1" value={data.password} error={formError.password} name="password" onChange={handleChange} leftSection={<IconLock size={16} stroke={1.5} />} label="Password" withAsterisk placeholder="Password" size="sm" styles={authFieldStyles} />
            <PasswordInput
                className="flex-1"
                value={data.confirmPassword}
                error={formError.confirmPassword}
                name="confirmPassword"
                onChange={handleChange}
                onPaste={(event) => event.preventDefault()}
                onDrop={(event) => event.preventDefault()}
                leftSection={<IconLock size={16} stroke={1.5} />}
                label="Confirm Password"
                withAsterisk
                placeholder="Confirm"
                size="sm"
                styles={authFieldStyles}
            />
        </div>
        <div className="-mt-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-300">Password Strength</span>
                <span className={`font-semibold ${passwordStrength.score >= 5 ? "text-emerald-300" : passwordStrength.score >= 3 ? "text-amber-300" : "text-rose-300"}`}>
                    {passwordStrength.label}
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/70">
                <div className={`h-full transition-all duration-200 ${passwordStrength.barClass}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
                <span className={passwordChecks.minLength ? "text-emerald-300" : ""}>• At least 8 characters</span>
                <span className={passwordChecks.upper ? "text-emerald-300" : ""}>• One uppercase letter</span>
                <span className={passwordChecks.lower ? "text-emerald-300" : ""}>• One lowercase letter</span>
                <span className={passwordChecks.digit ? "text-emerald-300" : ""}>• One number</span>
                <span className={passwordChecks.special ? "text-emerald-300" : ""}>• One special character</span>
            </div>
        </div>
        <div className="mt-1">
            <div className="mb-2 text-sm font-medium text-slate-200">I am a <span className="text-rose-400">*</span></div>
            <div className="grid grid-cols-2 gap-2">
                {accountTypes.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        disabled={otpStep}
                        aria-disabled={otpStep}
                        onClick={() => setData({ ...data, accountType: type.value })}
                        className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all duration-200 cursor-pointer
                            ${data.accountType === type.value
                                ? "border-orange-400 bg-gradient-to-b from-orange-50 to-amber-50 shadow-sm shadow-orange-100"
                                : "border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/30"
                            }`}
                    >
                        <div className={`rounded-lg p-1.5 transition-colors ${data.accountType === type.value ? "bg-orange-100 text-orange-600" : "bg-gray-50 text-gray-400 group-hover:text-orange-400"}`}>
                            <type.icon size={20} stroke={1.5} />
                        </div>
                        <span className={`text-xs font-semibold ${data.accountType === type.value ? "text-orange-700" : "text-gray-600"}`}>{type.label}</span>
                        <span className={`text-[10px] leading-tight ${data.accountType === type.value ? "text-orange-500" : "text-gray-400"}`}>{type.desc}</span>
                        {data.accountType === type.value && <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-400 ring-2 ring-white" />}
                    </button>
                ))}
            </div>
        </div>
        <div className="mt-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="flex items-start justify-between gap-3">
                <Checkbox
                    checked={termsAccepted}
                    onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        setTermsAccepted(checked);
                        if (checked) {
                            setTermsError("");
                        }
                    }}
                    color="orange"
                    radius="sm"
                    label={<span className="text-xs text-slate-200">I agree to the Terms and Conditions</span>}
                />
                <Button
                    type="button"
                    variant="subtle"
                    size="compact-sm"
                    color="orange"
                    className="!px-1 !text-xs"
                    onClick={() => setTermsModalOpen(true)}
                >
                    View Terms
                </Button>
            </div>
            {termsError && <p className="mt-1 text-xs text-rose-300">{termsError}</p>}
        </div>
        <Button disabled={!termsAccepted || otpSending} loading={otpSending} onClick={handleSubmit} variant="gradient" gradient={{ from: '#f97316', to: '#ec4899', deg: 135 }} size="md" radius="xl" className="mt-2 shadow-lg shadow-orange-200/50 hover:shadow-orange-300/50 transition-shadow">Sign up</Button>
        </> : <>
        <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-full bg-gradient-to-br from-orange-100 to-pink-100 p-4">
                <IconAt size={28} className="text-orange-500" stroke={1.5} />
            </div>
            <div className="text-center">
                <div className="text-sm font-medium text-slate-100">Verify your email</div>
                <div className="mt-1 text-xs text-slate-300">Enter the 6-digit code sent to</div>
                <div className="mt-0.5 text-sm font-semibold text-orange-400">{data.email}</div>
                <div className="mt-1 text-[11px] text-slate-400">Account type locked: <span className="font-semibold text-slate-200">{accountTypes.find((type) => type.value === data.accountType)?.label}</span></div>
            </div>
            <div className="my-2">
                <PinInput length={6} type="number" onComplete={handleVerifyOtp} size="md" gap="sm" />
            </div>
            <div className="flex gap-4 items-center">
                <button className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors" onClick={handleBackToForm}>Change email</button>
                <div className="h-3 w-px bg-white/20" />
                <button className={`text-xs underline underline-offset-2 transition-colors ${resendLoader ? "text-slate-500 cursor-not-allowed" : "text-orange-400 hover:text-orange-300"}`} disabled={resendLoader} onClick={handleResendOtp}>
                    {resendLoader ? `Resend in ${time}s` : "Resend code"}
                </button>
            </div>
        </div>
        </>}
        <div className="mt-1 text-center text-xs text-slate-300">Already have an account? <span className="text-orange-400 font-semibold hover:text-orange-300 hover:underline cursor-pointer transition-colors" onClick={()=>{navigate("/login");setFormError(form);setData(form);setTermsAccepted(false);setTermsError("")}}>Sign in</span></div>

        <Modal
            opened={termsModalOpen}
            onClose={() => setTermsModalOpen(false)}
            title="Terms and Conditions"
            size="lg"
            centered
            overlayProps={{ backgroundOpacity: 0.75, blur: 3, color: "#020617" }}
            styles={{
                content: {
                    background: "linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
                    border: "1px solid rgba(255,255,255,0.12)",
                },
                header: {
                    background: "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                },
                title: {
                    color: "#f8fafc",
                    fontWeight: 700,
                },
                close: {
                    color: "#cbd5e1",
                },
            }}
        >
            <div className="max-h-[60vh] overflow-y-auto pr-1 text-sm leading-6 text-slate-200">
                <p>
                    By creating an AfroHR account, you agree to provide accurate information and keep your profile details current.
                    You are responsible for safeguarding your account credentials and for all activities under your account.
                </p>
                <p className="mt-3">
                    You agree not to upload unlawful, misleading, or harmful content. AfroHR may review, moderate, or remove
                    content that violates platform rules, applicable law, or user safety standards.
                </p>
                <p className="mt-3">
                    Your profile data may be used to improve job matching, recommendations, and communication features.
                    AfroHR processes your information according to platform policies and applicable privacy regulations.
                </p>
                <p className="mt-3">
                    AfroHR may update these terms from time to time. Continued use of the platform after changes means
                    you accept the revised terms.
                </p>
                <a
                    href="/terms-and-conditions.html"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-xs font-semibold text-orange-300 underline underline-offset-2 hover:text-orange-200"
                >
                    Open full Terms and Conditions page
                </a>
            </div>
        </Modal>
    </div></>
}
export default SignUp;
