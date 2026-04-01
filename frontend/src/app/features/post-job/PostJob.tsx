import {
  Button,
  NumberInput,
  TagsInput,
  Textarea,
} from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "../../store";

import { content, fields } from "../../data/PostJob";
import SelectInput from "./SelectInput";
import TextEditor from "./TextEditor";
import { getJob, postMyJob } from "../../services/job-service";
import {
  errorNotification,
  successNotification,
} from "../../services/NotificationService";
import {
  hideOverlay,
  showOverlay,
} from "../../store/slices/OverlaySlice";

const PostJob = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.user as { id?: number } | null);

  const select = fields;
  const [editorData, setEditorData] = useState(content);

  const form = useForm({
    mode: "controlled",
    validateInputOnChange: true,
    initialValues: {
      jobTitle: "",
      department: "",
      role: "",
      company: "",
      experience: "",
      currency: "INR",
      jobType: "",
      workMode: "",
      location: "",
      industry: "",
      packageOffered: undefined,
      vacancies: 1,
      skillsRequired: [],
      about: "",
      description: content,
    },
    validate: {
      jobTitle: isNotEmpty("Title cannot be empty"),
      department: isNotEmpty("Department cannot be empty"),
      role: isNotEmpty("Role cannot be empty"),
      company: isNotEmpty("Company cannot be empty"),
      experience: isNotEmpty("Experience cannot be empty"),
      jobType: isNotEmpty("Job Type cannot be empty"),
      workMode: isNotEmpty("Work Mode cannot be empty"),
      location: isNotEmpty("Location cannot be empty"),
      currency: isNotEmpty("Currency cannot be empty"),
      industry: isNotEmpty("Industry cannot be empty"),
      skillsRequired: isNotEmpty("Skills cannot be empty"),
      about: isNotEmpty("About cannot be empty"),
      description: isNotEmpty("Description cannot be empty"),
      vacancies: (v) => (v < 1 ? "At least 1 vacancy is required" : null),
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    if (Number(id) !== 0) {
      dispatch(showOverlay());
      getJob(id!)
        .then((res) => {
          form.setValues(res);
          setEditorData(res.description);
        })
        .catch(console.error)
        .finally(() => dispatch(hideOverlay()));
    } else {
      form.reset();
    }
  }, [id]);

  const submitJob = (status: "ACTIVE" | "DRAFT") => {
    form.validate();
    if (!form.isValid()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    dispatch(showOverlay());
    postMyJob({
      ...form.getValues(),
      id,
      postedBy: user.id,
      jobStatus: status,
    })
      .then((res) => {
        successNotification(
          "Success",
          status === "ACTIVE"
            ? "Job Posted Successfully"
            : "Job Saved as Draft"
        );
        navigate(`/posted-jobs/${res.id}`);
      })
      .catch((err) => {
        const message =
          (err as { response?: { data?: { errorMessage?: string } }; message?: string })?.response?.data?.errorMessage ||
          (err as { message?: string })?.message ||
          "Something went wrong";
        errorNotification("Error", message);
      })
      .finally(() => dispatch(hideOverlay()));
  };

  return (
    <div className="px-16 bs-mx:px-10 md-mx:px-5 py-5">
      <div className="text-2xl font-semibold mb-5">Post a Job</div>

      <div className="flex flex-col gap-5">
        {/* Job title & Department */}
        <div className="flex gap-10 md-mx:gap-5 sm-mx:flex-wrap [&>*]:w-1/2 sm-mx:!w-full">
          <SelectInput form={form} name="jobTitle" {...select.find(f => f.label === "Job Title")} />
          <SelectInput form={form} name="department" {...select.find(f => f.label === "Department")} />
        </div>

        {/* Role & Job Type */}
        <div className="flex gap-10 md-mx:gap-5 sm-mx:flex-wrap [&>*]:w-1/2 sm-mx:!w-full">
          <SelectInput form={form} name="role" {...select.find(f => f.label === "Role")} />
          <SelectInput form={form} name="jobType" {...select.find(f => f.label === "Employment Type")} />
        </div>

        {/* Experience & Salary & Currency */}
        <div className="flex gap-10 md-mx:gap-5 sm-mx:flex-wrap [&>*]:w-1/2 sm-mx:!w-full">
          <SelectInput form={form} name="experience" {...select.find(f => f.label === "Experience")} />

          <NumberInput
            {...form.getInputProps("packageOffered")}
            withAsterisk
            label="Salary"
            placeholder="Enter Salary"
            min={1}
            max={300}
            hideControls
          />

          {/* ✅ Updated: Currency uses SelectInput */}
          <SelectInput form={form} name="currency" {...select.find(f => f.label === "Currency")} />
        </div>


        {/* Work Mode & Location */}
        <div className="flex gap-10 md-mx:gap-5 sm-mx:flex-wrap [&>*]:w-1/2 sm-mx:!w-full">
          <SelectInput form={form} name="workMode" {...select.find(f => f.label === "Work Mode")} />
          <SelectInput form={form} name="location" {...select.find(f => f.label === "Location")} />
        </div>

        {/* Industry & Vacancies */}
        <div className="flex gap-10 md-mx:gap-5 sm-mx:flex-wrap [&>*]:w-1/2 sm-mx:!w-full">
          <SelectInput form={form} name="industry" {...select.find(f => f.label === "Industry")} />

          {/* Vacancies */}
          <div className="flex flex-col w-full">
            <label className="font-medium mb-1">
              No. of vacancies <span className="text-red-600">*</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-8 h-8 border rounded font-semibold"
                onClick={() =>
                  form.setFieldValue(
                    "vacancies",
                    Math.max(1, (form.values.vacancies || 1) - 1)
                  )
                }
              >
                −
              </button>

              <input
                type="number"
                min={1}
                className="w-20 text-center border rounded px-2 py-1"
                {...form.getInputProps("vacancies")}
              />

              <button
                type="button"
                className="w-8 h-8 border rounded font-semibold"
                onClick={() =>
                  form.setFieldValue(
                    "vacancies",
                    (form.values.vacancies || 1) + 1
                  )
                }
              >
                +
              </button>
            </div>

            {form.errors.vacancies && (
              <span className="text-red-600 text-xs mt-1">
                {form.errors.vacancies}
              </span>
            )}
          </div>
        </div>

        {/* Skills */}
        <TagsInput
          {...form.getInputProps("skillsRequired")}
          withAsterisk
          label="Skills"
          placeholder="Enter skills"
          splitChars={[",", " ", "|"]}
          clearable
        />

        {/* About */}
        <Textarea
          {...form.getInputProps("about")}
          withAsterisk
          label="About Job"
          autosize
          minRows={2}
          placeholder="Enter job overview..."
        />

        {/* Description */}
        <div className="[&_button[data-active='true']]:!text-bright-sun-400 [&_button[data-active='true']]:!bg-bright-sun-400/20">
          <div className="text-sm font-medium">
            Job Description <span className="text-red-600">*</span>
          </div>

          <div className="bg-white rounded-md p-2" style={{ minHeight: "200px" }}>
            <TextEditor
              form={form}
              data={editorData}
              className="!bg-white" // Force Mantine editor internal background to white
            />
          </div>
        </div>


        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="light" onClick={() => submitJob("ACTIVE")}>
            Publish Job
          </Button>
          <Button variant="outline" onClick={() => submitJob("DRAFT")}>
            Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
