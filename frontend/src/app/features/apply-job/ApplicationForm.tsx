import { Button, FileInput, LoadingOverlay, Textarea, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, matches, useForm } from "@mantine/form";
import { IconPaperclip } from "@tabler/icons-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { getBase64 } from "../../services/utilities";
import { applyToJob } from "../../services/job-service";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";

type ApplicationFormProps = {
    jobId?: number;
    onSuccess?: () => void;
};

const ApplicationForm = ({ jobId, onSuccess }: ApplicationFormProps) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = useSelector((state: any) => state.user);
    const profile = useSelector((state: any) => state.profile);
    const [preview, setPreview] = useState(false);
    const [submit, setSubmit] = useState(false);

    const focusFirstInvalidField = (errors: Record<string, string | null | undefined>) => {
        const fieldOrder = ["name", "email", "phone", "website", "resume", "coverLetter"];
        const firstInvalid = fieldOrder.find((field) => Boolean(errors[field]));
        if (!firstInvalid) return;

        const selector = firstInvalid === "resume"
            ? "input[type='file'][name='resume'], input[name='resume']"
            : `[name='${firstInvalid}']`;

        const input = document.querySelector(selector) as HTMLElement | null;
        if (input && typeof input.focus === "function") {
            input.focus();
            input.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    const handlePreview = () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            focusFirstInvalidField(validation.errors as Record<string, string | null | undefined>);
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setPreview(!preview);
    }

    const handleSubmit = async () => {
        const effectiveJobId = Number.isFinite(jobId)
            ? Number(jobId)
            : (id ? Number.parseInt(id, 10) : NaN);

        if (!Number.isFinite(effectiveJobId)) {
            errorNotification("Error", "Missing job id.");
            return;
        }

        const validation = form.validate();
        if (validation.hasErrors) {
            focusFirstInvalidField(validation.errors as Record<string, string | null | undefined>);
            errorNotification("Validation Error", "Please fix form errors before submitting.");
            return;
        }

        try {
            setSubmit(true);
            const resumeBase64: any = await getBase64(form.getValues().resume);
            const resumePayload = typeof resumeBase64 === "string" ? resumeBase64.split(",")[1] : undefined;

            await applyToJob(effectiveJobId, {
                applicantUserId: user?.id,
                applicantName: form.getValues().name,
                applicantEmail: form.getValues().email,
                applicantPhone: form.getValues().phone,
                website: form.getValues().website,
                resumeUrl: resumePayload,
                coverLetter: form.getValues().coverLetter,
            });

            setSubmit(false);
            successNotification("Success", "Job Applied Successfully");
            if (onSuccess) {
                onSuccess();
            } else {
                navigate("/job-history");
            }
        } catch (err: any) {
            setSubmit(false);
            const message = extractErrorMessage(err) || "Failed to submit job application";
            errorNotification("Error", message);
        }

    }

    const form = useForm({
        mode: 'controlled',
        validateInputOnChange: true,
        initialValues: {
            name: user.name,
            email: user.email,
            phone: profile?.phone || '',
            website: profile?.website || '',
            resume: null,
            coverLetter: ''
        },
        validate: {
            name: isNotEmpty('Name cannot be empty'),
            email: isEmail('Please enter a valid email'),
            phone: matches(/^[0-9+()\-\s]{7,20}$/, 'Please enter a valid phone number'),
            website: (value) => {
                if (!value?.trim()) return null;
                return /^https?:\/\/.+/i.test(value) ? null : 'Website must start with http:// or https://';
            },
            resume: isNotEmpty('Resume cannot be empty'),
            coverLetter: (value) => {
                if (!value?.trim()) return null;
                return value.trim().length >= 50 ? null : 'Cover letter should be at least 50 characters';
            },
        }
    })

    return <><LoadingOverlay className="[&>span]:!fixed [&>span]:top-1/2" visible={submit} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'brightSun.4', type: 'bars', }} /><div className="text-xl font-semibold mb-5">Submit Your Application</div>
        <div className="flex flex-col gap-5">
            <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 sm-mx:[&>*]:!w-full sm-mx:flex-wrap ">
                <TextInput {...form.getInputProps("name")} name="name" readOnly={true} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} variant={preview ? "unstyled" : "default"} label="Full Name" withAsterisk placeholder="Enter name" />
                <TextInput {...form.getInputProps("email")} name="email" variant={preview ? "unstyled" : "default"} readOnly={true} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} label="Email" withAsterisk placeholder="Enter email" />
            </div>
            <div className="flex gap-10 md-mx:gap-5 [&>*]:w-1/2 sm-mx:[&>*]:!w-full sm-mx:flex-wrap ">
                <TextInput {...form.getInputProps("phone")} name="phone" variant={preview ? "unstyled" : "default"} readOnly={preview} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} label="Phone Number" withAsterisk placeholder="Enter phone number" description={preview ? undefined : "Include country code if available (e.g. +91 9876543210)."} />
                <TextInput {...form.getInputProps("website")} name="website" variant={preview ? "unstyled" : "default"} readOnly={preview} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} label="Personal Website" placeholder="https://example.com" />
            </div>
            <FileInput {...form.getInputProps("resume")} name="resume" variant={preview ? "unstyled" : "default"} readOnly={preview} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} withAsterisk leftSection={<IconPaperclip stroke={1.5} />} accept="application/pdf" label="Resume/CV" placeholder="Attach Resume/CV" description={preview ? undefined : "Accepted format: PDF (recommended max size 5 MB)."} leftSectionPointerEvents="none" />
            <Textarea {...form.getInputProps("coverLetter")} name="coverLetter" variant={preview ? "unstyled" : "default"} readOnly={preview} className={`${preview ? "text-mine-shaft-300 font-semibold" : ""}`} placeholder="Type something about yourself" label="Cover Letter" autosize minRows={4} />
            {!preview && <Button onClick={handlePreview} color="brightSun.4" variant="light">Review & Submit</Button>}
            {preview && <div className="flex gap-10">
                <Button fullWidth onClick={handlePreview} color="brightSun.4" variant="outline">Edit</Button>
                <Button fullWidth onClick={handleSubmit} color="brightSun.4" variant="light" disabled={submit}>Submit</Button>
            </div>}
        </div></>
}
export default ApplicationForm;