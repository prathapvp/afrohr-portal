import { useEffect, useState } from "react";
import SelectInput from "./SelectInput";
import fields from "../../data/Profile";
import { MonthPickerInput } from "@mantine/dates";
import { Button, Checkbox, Textarea, Alert } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { ExperienceSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const ExpInput = (props: any) => {
    const dispatch = useDispatch<any>();
    const profile = useSelector((state: any) => state.profile);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const select = fields;
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

        let exp = [...(profile.experiences || [])];
        if (props.add) {
            exp.push(expData);
        }
        else {
            exp[props.index] = expData;
        }
        let updatedProfile = { ...profile, experiences: exp };
        
        setValidationErrors({});
        props.setEdit(false);
        try {
            await dispatch(persistProfile(updatedProfile)).unwrap();
            successNotification("Success", `Experience ${props.add?"Added":"Updated"} Successfully`);
        } catch {
            errorNotification("Error", "Failed to save experience");
        }
    }

    return <div data-aos="zoom-out">
        <div className="text-lg font-semibold">{props.add ? "Add" : "Edit"} Experience</div>
        
        {Object.keys(validationErrors).length > 0 && (
            <Alert title="Validation Error" color="red" mb="md" onClose={() => setValidationErrors({})}>
                {Object.values(validationErrors).map((error, idx) => (
                    <div key={idx} className="text-sm">• {error}</div>
                ))}
            </Alert>
        )}
        
        <div className=" flex gap-10  md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3" >
            <SelectInput form={form} name="jobTitle"  {...select[0]} />
            <SelectInput form={form} name="company" {...select[1]} />
        </div>
        <SelectInput form={form} name="location"   {...select[2]} />
        <Textarea {...form.getInputProps("description")} withAsterisk className="my-3" label="Summary" autosize minRows={2} placeholder="Enter Summary" />
        <div className=" flex gap-10  md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
            <MonthPickerInput {...form.getInputProps("startDate")} maxDate={form.getValues().endDate || undefined} withAsterisk label="Start Date" />
            <MonthPickerInput disabled={form.getValues().working} minDate={form.getValues().startDate || undefined} maxDate={new Date()} withAsterisk label="End Date" placeholder="Pick date" {...form.getInputProps("endDate")} />
        </div>
        <Checkbox autoContrast label="Currently working here" checked={form.getValues().working} onChange={(event) => form.setFieldValue("working", event.currentTarget.checked)}
        />
        <div className="my-3 flex gap-5">
            <Button color="green.8" onClick={handleSave} variant="light">Save</Button>
            <Button color="red.8" onClick={() => props.setEdit(false)} variant="light">Cancel</Button>
        </div>
    </div>
}
export default ExpInput;