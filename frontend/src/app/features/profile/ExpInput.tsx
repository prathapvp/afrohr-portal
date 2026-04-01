import { useEffect, useState } from "react";
import { MonthPickerInput } from "@mantine/dates";
import { Button, Checkbox, Textarea, Alert, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useAppDispatch, useAppSelector } from "../../store";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { ExperienceSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

interface ExperienceItem {
    jobTitle?: string;
    title?: string;
    company?: string;
    location?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    working?: boolean;
}

interface ExpInputProps extends ExperienceItem {
    add?: boolean;
    index?: number;
    setEdit: (value: boolean) => void;
}

interface ProfileState {
    experiences?: ExperienceItem[];
}

const ExpInput = (props: ExpInputProps) => {
    const dispatch = useAppDispatch();
    const profile = useAppSelector((state) => state.profile as ProfileState);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const premiumInputStyles = {
        label: {
            color: "#d1d5db",
            fontWeight: 600,
            marginBottom: "6px",
        },
        input: {
            background: "rgba(15, 23, 42, 0.55)",
            color: "#f3f4f6",
            borderColor: "rgba(255, 255, 255, 0.14)",
        },
        dropdown: {
            background: "#111827",
            borderColor: "rgba(255, 255, 255, 0.12)",
        },
    };
    const form = useForm({
        mode: 'controlled',
        validateInputOnChange: true,
        initialValues: {
            jobTitle: '',
            company: '',
            location: '',
            description: '',
            startDate: new Date(),
            endDate: new Date(),
            working: false

        },
        validate:{
            jobTitle: isNotEmpty('Job Title cannot be empty'),
            company: isNotEmpty('Company cannot be empty'),
            location: isNotEmpty('Location cannot be empty'),
            description: isNotEmpty('Description cannot be empty')
        }
    });
    useEffect(() => {
        if (!props.add) form.setValues({ 
            'jobTitle': props.jobTitle || props.title, 
            'company': props.company, 
            'location': props.location, 
            'description': props.description, 
            'startDate': new Date(props.startDate), 
            'endDate': new Date(props.endDate), 
            'working': props.working 
        });
    }, []);

    const handleSave = async () => {
        form.validate();
        if(!form.isValid())return;
        
        const formValues = form.getValues();
        const expData = {
            jobTitle: formValues.jobTitle,
            company: formValues.company,
            location: formValues.location,
            description: formValues.description,
            startDate: formValues.startDate.toISOString(),
            endDate: formValues.endDate.toISOString(),
            working: formValues.working
        };
        
        // Validate with Zod
        const result = validateData(expData, ExperienceSchema);
        
        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : 'general';
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your experience details");
            return;
        }

        const exp = [...(profile.experiences || [])];
        if (props.add) {
            exp.push(expData);
        }
        else {
            exp[props.index ?? 0] = expData;
        }
        setValidationErrors({});
        props.setEdit(false);
        try {
            await dispatch(persistProfile({ experiences: exp })).unwrap();
            successNotification("Success", `Experience ${props.add?"Added":"Updated"} Successfully`);
        } catch {
            errorNotification("Error", "Failed to save experience");
        }
    }

    return <div data-aos="zoom-out" className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
        
        {Object.keys(validationErrors).length > 0 && (
            <Alert title="Validation Error" color="red" mb="md" onClose={() => setValidationErrors({})}>
                {Object.values(validationErrors).map((error, idx) => (
                    <div key={idx} className="text-sm">• {error}</div>
                ))}
            </Alert>
        )}
        
        <div className=" flex gap-10  md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3" >
            <TextInput
                withAsterisk
                label="Job Title"
                placeholder="Enter Job Title"
                {...form.getInputProps("jobTitle")}
                styles={premiumInputStyles}
            />
            <TextInput
                withAsterisk
                label="Company"
                placeholder="Enter Company Name"
                {...form.getInputProps("company")}
                styles={premiumInputStyles}
            />
        </div>
        <TextInput
            withAsterisk
            label="Location"
            placeholder="Enter Job Location"
            {...form.getInputProps("location")}
            styles={premiumInputStyles}
        />
        <Textarea {...form.getInputProps("description")} withAsterisk className="my-3" label="Summary" autosize minRows={2} placeholder="Enter Summary" styles={premiumInputStyles} />
        <div className=" flex gap-10  md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
            <MonthPickerInput {...form.getInputProps("startDate")} maxDate={form.getValues().endDate || undefined} withAsterisk label="Start Date" styles={premiumInputStyles} />
            <MonthPickerInput disabled={form.getValues().working} minDate={form.getValues().startDate || undefined} maxDate={new Date()} withAsterisk label="End Date" placeholder="Pick date" {...form.getInputProps("endDate")} styles={premiumInputStyles} />
        </div>
        <Checkbox
            color="brightSun.4"
            label="Currently working here"
            checked={form.getValues().working}
            onChange={(event) => form.setFieldValue("working", event.currentTarget.checked)}
            styles={{
                label: {
                    color: "#e5e7eb",
                    fontWeight: 600,
                },
                input: {
                    borderColor: "rgba(255, 255, 255, 0.35)",
                    background: "rgba(15, 23, 42, 0.55)",
                    '&[data-checked]': {
                        background: "#facc15",
                        borderColor: "#facc15",
                    },
                },
                icon: {
                    color: "#111827",
                },
            }}
        />
        <div className="my-3 flex gap-5">
            <Button color="green.8" onClick={handleSave} variant="light" className="rounded-full px-5">Save</Button>
            <Button color="red.8" onClick={() => props.setEdit(false)} variant="light" className="rounded-full px-5">Cancel</Button>
        </div>
    </div>
}
export default ExpInput;