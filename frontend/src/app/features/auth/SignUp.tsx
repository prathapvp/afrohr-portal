import { Button, LoadingOverlay, PasswordInput, PinInput, TextInput } from "@mantine/core";
import { IconAt, IconBriefcase, IconLock, IconSchool, IconUser, IconUserSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, sendOtp, verifyOtp } from "../../services/UserService";
import { signupValidation } from "../../services/form-validation";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { useInterval } from "@mantine/hooks";

const SignUp = () => {
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
    const navigate=useNavigate();
    const interval = useInterval(() => {
        if (time === 0) {
            setResendLoader(false);
            setTime(60);
            interval.stop();
        }
        else setTime((s) => s - 1);
    }, 1000);

    const handleChange = (event: any) => {
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
            setOtpStep(true);
            setOtpSending(false);
            setResendLoader(true);
            interval.start();
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
        setFormError(newFormError);
        if(valid===true){
            handleSendOtp();
        }
    }
    const accountTypes = [
        { value: "APPLICANT", label: "Applicant", icon: IconUserSearch, desc: "Find jobs" },
        { value: "EMPLOYER", label: "Employer", icon: IconBriefcase, desc: "Hire talent" },
        { value: "STUDENT", label: "Student", icon: IconSchool, desc: "Learn & grow" },
    ];

    return <><LoadingOverlay
    visible={loading}
    zIndex={1000}
    className="translate-x-1/2"
    overlayProps={{ radius: 'sm', blur: 2 }}
    loaderProps={{ color: 'orange', type: 'bars' }}
  /> <div className="w-1/2 sm-mx:py-10 sm-mx:w-full px-16 bs-mx:px-10 md-mx:px-5 flex flex-col gap-3 justify-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">Create Account</div>
        <p className="text-sm text-gray-400 -mt-1 mb-1">Start your career journey today</p>
        {!otpStep ? <>
        <TextInput value={data.name} error={formError.name} name="name" onChange={handleChange} leftSection={<IconUser size={16} stroke={1.5} />} label="Full Name" withAsterisk placeholder="Your name" size="sm" styles={{ input: { borderRadius: 12 } }} />
        <TextInput error={formError.email} value={data.email} name="email" onChange={handleChange} leftSection={<IconAt size={16} stroke={1.5} />} label="Email" withAsterisk placeholder="Your email" size="sm" styles={{ input: { borderRadius: 12 } }} />
        <div className="flex gap-3">
            <PasswordInput className="flex-1" value={data.password} error={formError.password} name="password" onChange={handleChange} leftSection={<IconLock size={16} stroke={1.5} />} label="Password" withAsterisk placeholder="Password" size="sm" styles={{ input: { borderRadius: 12 } }} />
            <PasswordInput className="flex-1" value={data.confirmPassword} error={formError.confirmPassword} name="confirmPassword" onChange={handleChange} leftSection={<IconLock size={16} stroke={1.5} />} label="Confirm Password" withAsterisk placeholder="Confirm" size="sm" styles={{ input: { borderRadius: 12 } }} />
        </div>
        <div className="mt-1">
            <div className="text-sm font-medium mb-2">I am a <span className="text-red-500">*</span></div>
            <div className="grid grid-cols-3 gap-2">
                {accountTypes.map((type) => (
                    <button
                        key={type.value}
                        type="button"
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
        <Button loading={otpSending} onClick={handleSubmit} variant="gradient" gradient={{ from: '#f97316', to: '#ec4899', deg: 135 }} size="md" radius="xl" className="mt-2 shadow-lg shadow-orange-200/50 hover:shadow-orange-300/50 transition-shadow">Sign up</Button>
        </> : <>
        <div className="flex flex-col items-center gap-3 py-4">
            <div className="rounded-full bg-gradient-to-br from-orange-100 to-pink-100 p-4">
                <IconAt size={28} className="text-orange-500" stroke={1.5} />
            </div>
            <div className="text-center">
                <div className="text-sm font-medium text-gray-700">Verify your email</div>
                <div className="text-xs text-gray-400 mt-1">Enter the 6-digit code sent to</div>
                <div className="text-sm font-semibold text-orange-500 mt-0.5">{data.email}</div>
            </div>
            <div className="my-2">
                <PinInput length={6} type="number" onComplete={handleVerifyOtp} size="md" gap="sm" />
            </div>
            <div className="flex gap-4 items-center">
                <button className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors" onClick={handleBackToForm}>Change email</button>
                <div className="h-3 w-px bg-gray-200" />
                <button className={`text-xs underline underline-offset-2 transition-colors ${resendLoader ? "text-gray-300 cursor-not-allowed" : "text-orange-500 hover:text-orange-600"}`} disabled={resendLoader} onClick={handleResendOtp}>
                    {resendLoader ? `Resend in ${time}s` : "Resend code"}
                </button>
            </div>
        </div>
        </>}
        <div className="text-center text-xs text-gray-400 mt-1">Already have an account? <span className="text-orange-500 font-semibold hover:underline cursor-pointer transition-colors" onClick={()=>{navigate("/login");setFormError(form);setData(form)}}>Sign in</span></div>

    </div></>
}
export default SignUp;
