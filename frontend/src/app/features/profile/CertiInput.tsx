import { useEffect, useState } from "react";
import SelectInput from "./SelectInput";
import fields from "../../data/Profile";
import { MonthPickerInput } from "@mantine/dates";
import { Button, TextInput, Alert } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useDispatch, useSelector } from "react-redux";
import { successNotification, errorNotification } from "../../services/NotificationService";
import { persistProfile } from "../../store/slices/ProfileSlice";
import { useMediaQuery } from "@mantine/hooks";
import { CertificationSchema } from "../../validators/ValidationSchemas";
import { validateData } from "../../validators/ValidationUtils";

const CertiInput = (props: any) => {
    const select = fields;
    const matches = useMediaQuery('(max-width: 475px)');
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

    const dispatch = useDispatch<any>();
    const profile = useSelector((state: any) => state.profile);
    const form = useForm({
        mode: 'controlled',
        validateInputOnChange: true,
        initialValues: {
            name:'',
            issuer:'',
            issueDate:new Date(),
            certificateId:''
        },
        validate:{
            name: isNotEmpty('Title cannot be empty'),
            issuer: isNotEmpty('Issuer cannot be empty'),
            issueDate: isNotEmpty('Issue Date cannot be empty'),
            certificateId: isNotEmpty('Certificate ID cannot be empty')
        }
    });
    const handleSave = async () => {
        form.validate();
        if(!form.isValid())return;
        
        const formValues = form.getValues();
        const certiData = {
            name: formValues.name,
            issuer: formValues.issuer,
            issueDate: formValues.issueDate.toISOString(),
            certificateId: formValues.certificateId
        };
        
        // Validate with Zod
        const result = validateData(certiData, CertificationSchema);
        
        if (!result.success) {
            setValidationErrors(
                result.errors?.reduce((acc: Record<string, string>, err: string) => {
                    const fieldMatch = err.match(/(\w+)/);
                    const field = fieldMatch ? fieldMatch[0] : 'general';
                    acc[field] = err;
                    return acc;
                }, {}) || {}
            );
            errorNotification("Validation Error", result.message || "Please check your certification details");
            return;
        }

        let certis = [...profile.certifications];
        if (props.add) {
            certis.push(certiData);
        }
        else {
            certis[props.index] = certiData;
        }
        
        setValidationErrors({});
        props.setEdit(false);
        try {
            await dispatch(persistProfile({ certifications: certis })).unwrap();
            successNotification("Success", `Certificate ${props.add ? "Added" : "Updated"} Successfully`);
        } catch {
            errorNotification("Error", "Failed to save certification");
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
            <TextInput withAsterisk {...form.getInputProps('name')} label="Title" placeholder="Enter title" styles={premiumInputStyles} />
            <SelectInput form={form} name="issuer" styles={premiumInputStyles} {...select[1]} />
        </div>
        <div className=" flex gap-10  md-mx:gap-5 [&>*]:w-1/2 xs-mx:[&>*]:w-full xs-mx:flex-wrap my-3">
            <MonthPickerInput  {...form.getInputProps('issueDate')} maxDate={new Date()} withAsterisk label="Issue Date" placeholder="Pick date" styles={premiumInputStyles} />
            <TextInput  {...form.getInputProps('certificateId')} withAsterisk label="Certificate ID" placeholder="Enter ID" styles={premiumInputStyles} />
        </div>
        <div className="my-3 flex gap-5">
            <Button color="green.8" onClick={handleSave} variant="light" className="rounded-full px-5">Save</Button>
            <Button color="red.8" onClick={()=>props.setEdit(false)} variant="light" className="rounded-full px-5">Cancel</Button>
        </div>
    </div>
}
export default CertiInput;