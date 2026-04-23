import { Button, Modal, PasswordInput, PinInput, TextInput } from "@mantine/core"
import { IconAt, IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { resetPassword, sendOtp, verifyOtp } from "../../services/user-service";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { useInterval } from "@mantine/hooks";
import { signupValidation } from "../../services/form-validation";

interface ResetPasswordProps {
    opened: boolean;
    close: () => void;
}

const ResetPassword = (props: ResetPasswordProps) => {
    const [email, setEmail] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const [resendLoader, setResendLoader] = useState(false);
    const [time, setTime] = useState(60);
    const [verified, setVerified] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError]=useState("");
    const interval = useInterval(() => {
        if (time === 0) {
            setResendLoader(false);
            setTime(60);
            interval.stop();

        }
        else setTime((s) => s - 1);
    }, 1000);
    const handleSendOtp = () => {
        setOtpSending(true);
        sendOtp(email).then((res) => {
            successNotification("OTP Sent Successfully.", "Enter OTP to reset password.");
            setOtpSent(true);
            setOtpSending(false);
            setResendLoader(true);
            interval.start();
        }).catch((err) => {
            console.log(err);
            setOtpSending(false);
            errorNotification("OTP Sending Failed.", err.response.data.errorMessage);
        })

    }

    const changeEmail = () => {
        setOtpSent(false);
        setResendLoader(false);
        setTime(60);
        setVerified(false);
        interval.stop();
    }
    const resendOtp = () => {
        if (resendLoader) return;
        handleSendOtp();
    }
    const handleVerifyOTP = (otp: string) => {
        verifyOtp(email, otp).then((res) => {
            successNotification("OTP Verified Successfully.", "Enter new password.");
            setVerified(true);
        }).catch((err) => {
            console.log(err);
            errorNotification("OTP Verification Failed.", err.response.data.errorMessage);
        })
    }
    const handleResetPassword=()=>{
        resetPassword(email, password).then((res)=>{
            successNotification("Password Reset Successfully.", "Redirecting to login page.");
            props.close();
        }).catch((err)=>{
            console.log(err);
            errorNotification("Password Reset Failed.", err.response.data.errorMessage);
        })
    }
    return <Modal opened={props.opened} onClose={props.close} overlayProps={{ backgroundOpacity: 0.55, blur: 3, }} title="Reset Password" centered>
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <TextInput
                    className="w-full sm:flex-1"
                    disabled={otpSent}
                    readOnly={otpSent}
                    value={email}
                    size="md"
                    name="email"
                    onChange={(e) => setEmail(e.target.value)}
                    leftSection={<IconAt size={16} />}
                    label="Email"
                    withAsterisk
                    placeholder="Your email"
                />
                <Button
                    loading={otpSending && !otpSent}
                    onClick={handleSendOtp}
                    disabled={email == "" || otpSent}
                    className="w-full sm:w-auto sm:min-w-[110px]"
                    size="sm"
                    autoContrast
                >
                    Send OTP
                </Button>
            </div>
            {otpSent && <PinInput onComplete={handleVerifyOTP} className="mx-auto w-full" gap="xs" size="sm" length={6} type="number" />}
            {otpSent && !verified && <div className="flex gap-2">
                <Button loading={otpSending} onClick={resendOtp} fullWidth color="orange" variant="light">{resendLoader ? time : "Resend"}</Button>
                <Button fullWidth onClick={changeEmail} variant="gradient" gradient={{ from: 'orange', to: 'pink', deg: 90 }}>Change Email</Button>
            </div>}
            {verified &&<PasswordInput value={password} error={error} name="password" onChange={(e)=>{setPassword(e.target.value);setError(signupValidation("password", e.target.value))}} leftSection={<IconLock size={16} />} label="Password" withAsterisk placeholder="Password" />}
            {verified && <Button onClick={handleResetPassword} variant="gradient" gradient={{ from: 'orange', to: 'pink', deg: 90 }}>Reset Password</Button>}
        </div>
    </Modal>
}
export default ResetPassword;
