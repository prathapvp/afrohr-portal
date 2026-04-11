import { Button, FileInput, LoadingOverlay, Textarea, TextInput } from "@mantine/core";
import { isEmail, isNotEmpty, matches, useForm } from "@mantine/form";
import { IconPaperclip } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getBase64 } from "../../services/utilities";
import { applyToMyJob } from "../../services/job-service";
import { errorNotification, successNotification } from "../../services/NotificationService";
import { extractErrorMessage } from "../../services/error-extractor-service";
import { useAppSelector } from "../../store";

type ApplicationFormProps = {
    jobId?: number;
    onSuccess?: () => void;
};

const ApplicationForm = ({ jobId, onSuccess }: ApplicationFormProps) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = useAppSelector((state) => state.user as { id?: number; name?: string; email?: string } | null);
    const profile = useAppSelector((state) => state.profile as { phone?: string; website?: string });
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
            const resumeBase64 = await getBase64(form.getValues().resume);
            const resumePayload = typeof resumeBase64 === "string" ? resumeBase64.split(",")[1] : undefined;

            await applyToMyJob(effectiveJobId, {
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
        } catch (err: unknown) {
            setSubmit(false);
            const message = extractErrorMessage(err) || "Failed to submit job application";
            errorNotification("Error", message);
        }

    }

    const form = useForm({
        mode: 'controlled',
        validateInputOnChange: true,
        initialValues: {
            name: user?.name || '',
            email: user?.email || '',
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

    const fieldStyles = preview
        ? {}
        : {
            input: "!bg-white/[0.04] !border-white/20 !text-slate-100 placeholder:!text-slate-400 focus:!border-bright-sun-400/70",
            label: "!text-slate-100 !font-medium",
            description: "!text-slate-400",
            error: "!text-red-300"
        };

    const values = form.getValues();
    const resumeLabel = values.resume instanceof File ? values.resume.name : "Resume attached";

    return <>
        <LoadingOverlay className="[&>span]:!fixed [&>span]:top-1/2" visible={submit} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'brightSun.4', type: 'bars', }} />
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/70">Step Flow</div>
            <div className="mt-2 text-xl font-semibold text-white">Submit Your Application</div>
            <p className="mt-2 text-sm text-slate-300">Fill in your details, attach your resume, and review the application before final submission.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <div className={`rounded-full border px-3 py-1 ${preview ? "border-white/15 bg-white/[0.03] text-slate-300" : "border-bright-sun-400/40 bg-bright-sun-400/15 text-bright-sun-200"}`}>
                    1. Details
                </div>
                <div className={`rounded-full border px-3 py-1 ${preview ? "border-cyan-300/35 bg-cyan-400/10 text-cyan-100" : "border-white/15 bg-white/[0.03] text-slate-400"}`}>
                    2. Review
                </div>
            </div>
        </div>

        <div
            className={`transition-all duration-300 ease-out ${preview ? "pointer-events-none max-h-0 -translate-y-2 overflow-hidden opacity-0" : "max-h-[6000px] translate-y-0 opacity-100"}`}
            aria-hidden={preview}
            inert={preview}
        >
            <div className="flex flex-col gap-6 pb-1">
            <div className="grid gap-5 md:grid-cols-2">
                <TextInput {...form.getInputProps("name")} name="name" readOnly={true} variant="default" classNames={fieldStyles} label="Full Name" withAsterisk placeholder="Enter name" />
                <TextInput {...form.getInputProps("email")} name="email" variant="default" readOnly={true} classNames={fieldStyles} label="Email" withAsterisk placeholder="Enter email" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
                <TextInput {...form.getInputProps("phone")} name="phone" variant="default" readOnly={preview} classNames={fieldStyles} label="Phone Number" withAsterisk placeholder="Enter phone number" description="Include country code if available (e.g. +91 9876543210)." />
                <TextInput {...form.getInputProps("website")} name="website" variant="default" readOnly={preview} classNames={fieldStyles} label="Personal Website" placeholder="https://example.com" />
            </div>

            <FileInput {...form.getInputProps("resume")} name="resume" variant="default" readOnly={preview} classNames={fieldStyles} withAsterisk leftSection={<IconPaperclip stroke={1.5} />} accept="application/pdf" label="Resume/CV" placeholder="Attach Resume/CV" description="Accepted format: PDF (recommended max size 5 MB)." leftSectionPointerEvents="none" />

            <Textarea {...form.getInputProps("coverLetter")} name="coverLetter" variant="default" readOnly={preview} classNames={fieldStyles} placeholder="Type something about yourself" label="Cover Letter" autosize minRows={5} />

            <Button onClick={handlePreview} color="brightSun.4" variant="light" className="!h-11 !font-semibold">Review & Submit</Button>
            </div>
        </div>

        <div
            className={`transition-all duration-300 ease-out ${preview ? "max-h-[6000px] translate-y-0 opacity-100" : "pointer-events-none max-h-0 translate-y-2 overflow-hidden opacity-0"}`}
            aria-hidden={!preview}
            inert={!preview}
        >
            <div className="space-y-6 pb-1">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="premium-enter rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 [animation-delay:60ms]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Applicant</div>
                    <div className="mt-3 space-y-3 text-sm">
                        <div>
                            <div className="text-slate-400">Full Name</div>
                            <div className="mt-1 font-medium text-white">{values.name}</div>
                        </div>
                        <div>
                            <div className="text-slate-400">Email</div>
                            <div className="mt-1 font-medium text-white break-all">{values.email}</div>
                        </div>
                    </div>
                </div>

                <div className="premium-enter rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 [animation-delay:120ms]">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Contact</div>
                    <div className="mt-3 space-y-3 text-sm">
                        <div>
                            <div className="text-slate-400">Phone Number</div>
                            <div className="mt-1 font-medium text-white">{values.phone}</div>
                        </div>
                        <div>
                            <div className="text-slate-400">Personal Website</div>
                            <div className="mt-1 font-medium text-cyan-100 break-all">{values.website || "Not provided"}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="premium-enter rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,38,0.8),rgba(16,24,43,0.56))] p-4 [animation-delay:180ms] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Attached Resume</div>
                        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                            <IconPaperclip size={16} className="text-cyan-200" />
                            <span className="break-all">{resumeLabel}</span>
                        </div>
                    </div>
                    <div className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                        Ready to submit
                    </div>
                </div>
            </div>

            <div className="premium-enter relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 [animation-delay:240ms] sm:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(251,191,36,0.14),transparent_48%),radial-gradient(circle_at_85%_78%,rgba(34,211,238,0.12),transparent_54%)]" />
                <div className="relative">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Cover Letter</div>
                    <p className="mt-4 max-w-3xl whitespace-pre-wrap break-words text-[15px] leading-8 tracking-[0.008em] text-slate-100/95">
                        {values.coverLetter}
                    </p>
                </div>
            </div>

            <div className="premium-enter grid gap-4 [animation-delay:340ms] sm:grid-cols-2">
                <Button fullWidth onClick={handlePreview} color="brightSun.4" variant="outline" className="!h-11 !font-semibold">Edit Details</Button>
                <Button fullWidth onClick={handleSubmit} color="brightSun.4" variant="light" disabled={submit} className="!h-11 !font-semibold">Submit Application</Button>
            </div>
            </div>
        </div>
    </>
}
export default ApplicationForm;