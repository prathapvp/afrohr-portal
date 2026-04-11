import {
  Button,
  NumberInput,
  TagsInput,
  TextInput,
  Transition,
  Textarea,
} from "@mantine/core";
import {
  IconAdjustments,
  IconAlignLeft,
  IconBolt,
  IconBriefcase,
  IconBuilding,
  IconChevronDown,
  IconChevronUp,
  IconCoin,
  IconDeviceFloppy,
  IconFileText,
  IconMapPin,
  IconSend,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import { isNotEmpty, useForm } from "@mantine/form";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAppDispatch, useAppSelector } from "../../store";

import { content, fields } from "../../data/PostJob";
import Departments from "../departments/Departments";
import EmploymentTypes from "../employment-types/EmploymentTypes";
import Industries from "../industries/Industries";
import WorkModes from "../work-modes/WorkModes";
import SelectInput from "./SelectInput";
import TextEditor from "./TextEditor";
import { getJob, postMyJob } from "../../services/job-service";
import { getAllDepartments } from "../../services/department-service";
import { getAllIndustries } from "../../services/industry-service";
import employmentTypeService from "../../services/employment-type-service";
import { getMyProfile } from "../../services/profile-service";
import workModeService from "../../services/workmode-service";
import {
  errorNotification,
  successNotification,
} from "../../services/NotificationService";
import {
  hideOverlay,
  showOverlay,
} from "../../store/slices/OverlaySlice";
import { setProfile } from "../../store/slices/ProfileSlice";

type MotionSectionProps = {
  mounted: boolean;
  delay: number;
  className: string;
  children: ReactNode;
};

type EmployerProfileState = {
  company?: string;
  name?: string;
  fullName?: string;
} | null;

const getEmployerCompanyName = (profileData?: EmployerProfileState | Record<string, unknown>) => {
  const candidateValues = [
    profileData?.company,
    profileData?.name,
    profileData?.fullName,
  ];

  return candidateValues.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0
  )?.trim() ?? "";
};

const parseExperienceRange = (value?: string) => {
  const text = String(value ?? "").trim();
  if (!text) {
    return { min: "", max: "" };
  }

  const matches = text.match(/(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length === 0) {
    return { min: "", max: "" };
  }

  if (matches.length === 1) {
    return { min: matches[0], max: matches[0] };
  }

  return { min: matches[0], max: matches[1] };
};

const toExperienceInputValue = (value: string | number) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value ?? "").trim();
};

const FALLBACK_CURRENCY_CODES = [
  "USD", "EUR", "GBP", "INR", "JPY", "CNY", "AUD", "CAD", "CHF", "SEK", "NOK", "DKK",
  "NZD", "SGD", "HKD", "AED", "SAR", "ZAR", "NGN", "KES", "EGP", "MAD", "BRL", "MXN",
  "ARS", "CLP", "COP", "PEN", "KRW", "THB", "MYR", "IDR", "PHP", "PKR", "BDT", "LKR",
  "VND", "TRY", "RUB", "PLN", "CZK", "HUF", "RON", "UAH", "ILS", "QAR", "KWD", "OMR",
  "BHD", "JOD", "ETB", "GHS", "TZS", "UGX", "RWF", "XOF", "XAF", "BWP", "MUR", "ZMW",
];

const COUNTRY_NAMES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Cote d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait",
  "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico",
  "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru",
  "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

const MotionSection = ({ mounted, delay, className, children }: MotionSectionProps) => (
  <Transition mounted={mounted} transition="slide-up" duration={420} timingFunction="ease" enterDelay={delay}>
    {(styles) => (
      <div style={styles} className={className}>
        {children}
      </div>
    )}
  </Transition>
);

const PostJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user as { id?: number } | null);
  const profile = useAppSelector((state) => state.profile as EmployerProfileState);

  const select = fields;
  const departmentField = useMemo(
    () => select.find((field) => field.label === "Department"),
    [select]
  );
  const roleField = useMemo(
    () => select.find((field) => field.label === "Role"),
    [select]
  );
  const employmentTypeField = useMemo(
    () => select.find((field) => field.label === "Employment Type"),
    [select]
  );
  const experienceField = useMemo(
    () => select.find((field) => field.label === "Experience"),
    [select]
  );
  const locationField = useMemo(
    () => select.find((field) => field.label === "Location"),
    [select]
  );
  const currencyField = useMemo(
    () => select.find((field) => field.label === "Currency"),
    [select]
  );
  const fallbackDepartmentOptions = useMemo(
    () =>
      Array.isArray(departmentField?.options)
        ? departmentField.options.filter((option): option is string => typeof option === "string")
        : [],
    [departmentField]
  );
  const fallbackEmploymentTypeOptions = useMemo(
    () =>
      Array.isArray(employmentTypeField?.options)
        ? employmentTypeField.options.filter((option): option is string => typeof option === "string")
        : [],
    [employmentTypeField]
  );
  const industryField = useMemo(
    () => select.find((field) => field.label === "Industry"),
    [select]
  );
  const workModeField = useMemo(
    () => select.find((field) => field.label === "Work Mode"),
    [select]
  );
  const fallbackIndustryOptions = useMemo(
    () =>
      Array.isArray(industryField?.options)
        ? industryField.options.filter((option): option is string => typeof option === "string")
        : [],
    [industryField]
  );
  const fallbackWorkModeOptions = useMemo(
    () =>
      Array.isArray(workModeField?.options)
        ? workModeField.options.filter((option): option is string => typeof option === "string")
        : [],
    [workModeField]
  );
  const countryOptions = useMemo(
    () => Array.from(new Set(COUNTRY_NAMES)).sort((a, b) => a.localeCompare(b)),
    []
  );
  const currencyOptions = useMemo(() => {
    try {
      const maybeIntl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
      const codes = typeof maybeIntl.supportedValuesOf === "function"
        ? maybeIntl.supportedValuesOf("currency")
        : FALLBACK_CURRENCY_CODES;

      return Array.from(new Set(codes.map((code) => String(code).toUpperCase().trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    } catch {
      return FALLBACK_CURRENCY_CODES;
    }
  }, []);

  const [departmentOptions, setDepartmentOptions] = useState<string[]>(fallbackDepartmentOptions);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<string[]>(fallbackEmploymentTypeOptions);
  const [industryOptions, setIndustryOptions] = useState<string[]>(fallbackIndustryOptions);
  const [workModeOptions, setWorkModeOptions] = useState<string[]>(fallbackWorkModeOptions);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [employmentTypeModalOpen, setEmploymentTypeModalOpen] = useState(false);
  const [industryModalOpen, setIndustryModalOpen] = useState(false);
  const [workModeModalOpen, setWorkModeModalOpen] = useState(false);
  const [editorData, setEditorData] = useState(content);
  const [animateIn, setAnimateIn] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [experienceMin, setExperienceMin] = useState("");
  const [experienceMax, setExperienceMax] = useState("");
  const [experienceRangeError, setExperienceRangeError] = useState<string | null>(null);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryRangeError, setSalaryRangeError] = useState<string | null>(null);
  const [fallbackProfileCompany, setFallbackProfileCompany] = useState("");
  const isEditMode = Number(id) > 0;
  const profileCompanyName = getEmployerCompanyName(profile) || fallbackProfileCompany;

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
      country: "",
      industry: "",
      packageOffered: undefined,
      maxPackageOffered: undefined,
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
          const backendCountry = typeof res.country === "string" ? res.country.trim() : "";
          const rawLocation = String(res.location ?? "").trim();
          const locationSegments = rawLocation.split(",").map((segment) => segment.trim()).filter(Boolean);
          if (backendCountry) {
            form.setFieldValue("country", backendCountry);
          } else if (locationSegments.length > 1) {
            const maybeCountry = locationSegments[locationSegments.length - 1];
            if (countryOptions.includes(maybeCountry)) {
              form.setFieldValue("country", maybeCountry);
              form.setFieldValue("location", locationSegments.slice(0, -1).join(", "));
            }
          }
          const range = parseExperienceRange(res.experience);
          setExperienceMin(range.min);
          setExperienceMax(range.max);
          setExperienceRangeError(null);
          const minSalary = typeof res.packageOffered === "number" ? String(res.packageOffered) : "";
          const maxSalary = typeof res.maxPackageOffered === "number"
            ? String(res.maxPackageOffered)
            : minSalary;
          setSalaryMin(minSalary);
          setSalaryMax(maxSalary);
          setSalaryRangeError(null);
        })
        .catch(console.error)
        .finally(() => dispatch(hideOverlay()));
    } else {
      form.reset();
      setEditorData(content);
      form.setFieldValue("country", "");
      setExperienceMin("");
      setExperienceMax("");
      setExperienceRangeError(null);
      setSalaryMin("");
      setSalaryMax("");
      setSalaryRangeError(null);
    }
  }, [countryOptions, id]);

  useEffect(() => {
    if (profileCompanyName) {
      form.setFieldValue("company", profileCompanyName);
    }
  }, [form, profileCompanyName]);

  useEffect(() => {
    if (profileCompanyName) {
      return;
    }

    let cancelled = false;

    getMyProfile()
      .then((res) => {
        if (cancelled) {
          return;
        }

        dispatch(setProfile(res));

        const companyFromProfile = getEmployerCompanyName(res as Record<string, unknown>);
        if (!companyFromProfile) {
          return;
        }

        setFallbackProfileCompany(companyFromProfile);

        const currentCompany = String(form.values.company ?? "").trim();
        if (!currentCompany) {
          form.setFieldValue("company", companyFromProfile);
        }
      })
      .catch(() => {
        // Keep manual input available if profile fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [form, id, profileCompanyName]);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const loadDepartmentOptions = useCallback(() => {
    getAllDepartments()
      .then((departments) => {
        const fetchedOptions = Array.from(
          new Set(
            departments
              .map((department) => department.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );

        setDepartmentOptions(
          fetchedOptions.length > 0 ? fetchedOptions : fallbackDepartmentOptions
        );
      })
      .catch(() => {
        setDepartmentOptions(fallbackDepartmentOptions);
      });
  }, [fallbackDepartmentOptions]);

  useEffect(() => {
    loadDepartmentOptions();
  }, [loadDepartmentOptions]);

  const loadIndustryOptions = useCallback(() => {
    getAllIndustries()
      .then((industries) => {
        const fetchedOptions = Array.from(
          new Set(
            industries
              .map((industry) => industry.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );

        setIndustryOptions(
          fetchedOptions.length > 0 ? fetchedOptions : fallbackIndustryOptions
        );
      })
      .catch(() => {
        setIndustryOptions(fallbackIndustryOptions);
      });
  }, [fallbackIndustryOptions]);

  const loadWorkModeOptions = useCallback(() => {
    workModeService
      .getAllWorkModes()
      .then((workModes) => {
        const fetchedOptions = Array.from(
          new Set(
            workModes
              .map((workMode) => workMode.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );

        setWorkModeOptions(
          fetchedOptions.length > 0 ? fetchedOptions : fallbackWorkModeOptions
        );
      })
      .catch(() => {
        setWorkModeOptions(fallbackWorkModeOptions);
      });
  }, [fallbackWorkModeOptions]);

  const loadEmploymentTypeOptions = useCallback(() => {
    employmentTypeService
      .getAllEmploymentTypes()
      .then((employmentTypes) => {
        const fetchedOptions = Array.from(
          new Set(
            employmentTypes
              .map((employmentType) => employmentType.name?.trim())
              .filter((name): name is string => Boolean(name))
          )
        );

        setEmploymentTypeOptions(
          fetchedOptions.length > 0 ? fetchedOptions : fallbackEmploymentTypeOptions
        );
      })
      .catch(() => {
        setEmploymentTypeOptions(fallbackEmploymentTypeOptions);
      });
  }, [fallbackEmploymentTypeOptions]);

  useEffect(() => {
    loadEmploymentTypeOptions();
  }, [loadEmploymentTypeOptions]);

  useEffect(() => {
    loadIndustryOptions();
  }, [loadIndustryOptions]);

  useEffect(() => {
    loadWorkModeOptions();
  }, [loadWorkModeOptions]);

  const closeDepartmentModal = useCallback(() => {
    setDepartmentModalOpen(false);
    loadDepartmentOptions();
  }, [loadDepartmentOptions]);

  const closeEmploymentTypeModal = useCallback(() => {
    setEmploymentTypeModalOpen(false);
    loadEmploymentTypeOptions();
  }, [loadEmploymentTypeOptions]);

  const closeIndustryModal = useCallback(() => {
    setIndustryModalOpen(false);
    loadIndustryOptions();
  }, [loadIndustryOptions]);

  const closeWorkModeModal = useCallback(() => {
    setWorkModeModalOpen(false);
    loadWorkModeOptions();
  }, [loadWorkModeOptions]);

  const submitJob = (status: "ACTIVE" | "DRAFT") => {
    form.validate();

    const parsedMin = Number(experienceMin);
    const parsedMax = Number(experienceMax);
    const hasMin = experienceMin.trim().length > 0;
    const hasMax = experienceMax.trim().length > 0;
    const parsedSalaryMin = Number(salaryMin);
    const parsedSalaryMax = Number(salaryMax);
    const hasSalaryMin = salaryMin.trim().length > 0;
    const hasSalaryMax = salaryMax.trim().length > 0;

    if (!hasMin || !hasMax) {
      setExperienceRangeError("Both minimum and maximum experience are required");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (Number.isNaN(parsedMin) || Number.isNaN(parsedMax) || parsedMin < 0 || parsedMax < 0) {
      setExperienceRangeError("Experience values must be valid positive numbers");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (parsedMin > parsedMax) {
      setExperienceRangeError("Minimum experience cannot be greater than maximum experience");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setExperienceRangeError(null);

    if (!hasSalaryMin || !hasSalaryMax) {
      setSalaryRangeError("Both minimum and maximum salary are required");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (Number.isNaN(parsedSalaryMin) || Number.isNaN(parsedSalaryMax) || parsedSalaryMin < 0 || parsedSalaryMax < 0) {
      setSalaryRangeError("Salary values must be valid positive numbers");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (parsedSalaryMin > parsedSalaryMax) {
      setSalaryRangeError("Minimum salary cannot be greater than maximum salary");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSalaryRangeError(null);

    if (!form.isValid()) {
      setShowMoreDetails(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const parsedId = Number(id);
    const payloadId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;

    dispatch(showOverlay());
    postMyJob({
      ...form.getValues(),
      experience: `${parsedMin}-${parsedMax} years`,
      packageOffered: parsedSalaryMin,
      maxPackageOffered: parsedSalaryMax,
      id: payloadId,
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
        if (status === "ACTIVE") {
          window.location.assign("/dashboard?tab=employers&section=viewall");
          return;
        }

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

  const premiumInputStyles = {
    label: {
      color: "#94a3b8",
      fontWeight: 600,
      fontSize: "13px",
      marginBottom: "6px",
    },
    input: {
      minHeight: "40px",
      background: "rgba(15, 23, 42, 0.65)",
      color: "#f1f5f9",
      borderColor: "rgba(255,255,255,0.12)",
      borderRadius: "12px",
      fontSize: "13px",
    },
  };

  const premiumTextareaStyles = {
    label: premiumInputStyles.label,
    input: {
      background: "rgba(15, 23, 42, 0.65)",
      color: "#f1f5f9",
      borderColor: "rgba(255,255,255,0.12)",
      borderRadius: "12px",
      fontSize: "13px",
    },
  };

  const shortcutButtonClassName =
    "rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)] transition-all hover:border-cyan-400/50 hover:bg-cyan-900/50 hover:shadow-[0_0_18px_rgba(34,211,238,0.22)]";

  return (
    <div className="relative min-h-screen px-3 py-4 pb-28 sm:px-4 md:pb-6 lg:px-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 left-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/[0.04] blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 h-[380px] w-[380px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />
      </div>

      {/* Page header */}
      <div className="relative mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/60 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-400 ring-1 ring-cyan-400/25">
            <IconSparkles size={10} />
            {isEditMode ? "Edit Listing" : "New Listing"}
          </span>
        </div>
        <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">
          {isEditMode ? "Update Job Posting" : "Post a New Job"}
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          {isEditMode ? "Modify the details below to update your listing." : "Complete the details below to publish your job opening."}
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-cyan-500/20 via-violet-500/10 to-transparent" />
      </div>

      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Job title & Department */}
        <MotionSection mounted={animateIn} delay={40} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-400/20">
                <IconBriefcase size={13} className="text-cyan-400" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-cyan-400/80">Role basics</span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setDepartmentModalOpen(true);
              }}
              className={shortcutButtonClassName}
            >
              Add Dept
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextInput
              {...form.getInputProps("jobTitle")}
              withAsterisk
              label="Job Title"
              placeholder="Enter job title"
              styles={premiumInputStyles}
            />
            <SelectInput
              form={form}
              name="department"
              withAsterisk={false}
              label={<span className="flex items-center">{departmentField?.label ?? "Department"}<span className="ml-0.5 text-rose-400">*</span></span>}
              placeholder={departmentField?.placeholder ?? "Enter Department Name"}
              options={departmentOptions}
            />
          </div>
        </MotionSection>

        {/* Company */}
        <MotionSection mounted={animateIn} delay={80} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/45 to-transparent" />
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-400/20">
              <IconBuilding size={13} className="text-violet-400" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-violet-400/80">Employer info</span>
          </div>
          <div className="rounded-xl border border-violet-400/15 bg-violet-950/20 p-3">
            <div className="mb-1.5 text-[13px] font-semibold text-slate-300">
              Company <span className="text-rose-400">*</span>
            </div>
            <div className="flex min-h-[40px] items-center rounded-lg border border-violet-300/15 bg-violet-950/10 px-3 py-2 text-[13px] text-slate-100 select-none">
              {profileCompanyName || <span className="italic text-slate-500">Loading…</span>}
            </div>
          </div>
        </MotionSection>

        {/* Role + Compensation */}
        <MotionSection mounted={animateIn} delay={120} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/45 to-transparent" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-400/20">
                <IconCoin size={13} className="text-emerald-400" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-400/80">Role & compensation</span>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEmploymentTypeModalOpen(true);
              }}
              className={shortcutButtonClassName}
            >
              Add Type
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <TextInput
              {...form.getInputProps("role")}
              withAsterisk
              label={roleField?.label ?? "Role"}
              placeholder={roleField?.placeholder ?? "Enter Role Name"}
              styles={premiumInputStyles}
            />
            <SelectInput
              form={form}
              name="jobType"
              withAsterisk={false}
              label={<span className="flex items-center">{employmentTypeField?.label ?? "Employment Type"}<span className="ml-0.5 text-rose-400">*</span></span>}
              placeholder={employmentTypeField?.placeholder ?? "Select Employment Type"}
              options={employmentTypeOptions}
            />
            <SelectInput
              form={form}
              name="currency"
              withAsterisk={false}
              label={currencyField?.label ?? "Currency"}
              placeholder={currencyField?.placeholder ?? "Search Currency"}
              options={currencyOptions}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-300">
                {experienceField?.label ?? "Experience"} <span className="text-rose-400">*</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  value={experienceMin}
                  onChange={(value) => {
                    setExperienceMin(toExperienceInputValue(value));
                    if (experienceRangeError) {
                      setExperienceRangeError(null);
                    }
                  }}
                  placeholder="Min years"
                  min={0}
                  max={60}
                  hideControls
                  styles={premiumInputStyles}
                />
                <NumberInput
                  value={experienceMax}
                  onChange={(value) => {
                    setExperienceMax(toExperienceInputValue(value));
                    if (experienceRangeError) {
                      setExperienceRangeError(null);
                    }
                  }}
                  placeholder="Max years"
                  min={0}
                  max={60}
                  hideControls
                  styles={premiumInputStyles}
                />
              </div>
              {experienceRangeError ? <div className="mt-1 text-xs text-rose-400">{experienceRangeError}</div> : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-300">
                Salary Range (Yearly) <span className="text-rose-400">*</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  value={salaryMin}
                  onChange={(value) => {
                    setSalaryMin(toExperienceInputValue(value));
                    if (salaryRangeError) {
                      setSalaryRangeError(null);
                    }
                  }}
                  placeholder="Min yearly salary"
                  min={0}
                  max={999999999}
                  hideControls
                  styles={premiumInputStyles}
                />
                <NumberInput
                  value={salaryMax}
                  onChange={(value) => {
                    setSalaryMax(toExperienceInputValue(value));
                    if (salaryRangeError) {
                      setSalaryRangeError(null);
                    }
                  }}
                  placeholder="Max yearly salary"
                  min={0}
                  max={999999999}
                  hideControls
                  styles={premiumInputStyles}
                />
              </div>
              {salaryRangeError ? <div className="mt-1 text-xs text-rose-400">{salaryRangeError}</div> : null}
            </div>
          </div>
        </MotionSection>

        {/* Advanced fields toggle */}
        <MotionSection mounted={animateIn} delay={140} className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/80 to-slate-800/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] lg:col-span-12">
          <button
            type="button"
            aria-expanded={showMoreDetails}
            onClick={() => setShowMoreDetails((prev) => !prev)}
            className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-400/20">
                <IconAdjustments size={14} className="text-amber-400" />
              </span>
              <div>
                <div className="text-sm font-bold text-slate-200">Advanced fields</div>
                <div className="text-[11px] text-slate-500">Work mode, location, industry, vacancies, skills & summary</div>
              </div>
            </div>
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
              showMoreDetails
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                : "bg-white/[0.04] text-slate-400 ring-1 ring-white/10"
            }`}>
              {showMoreDetails ? <><IconChevronUp size={11} /> Hide</> : <><IconChevronDown size={11} /> Expand</>}
            </span>
          </button>
        </MotionSection>

        {showMoreDetails && (
          <>
            {/* Work setup */}
            <MotionSection mounted={animateIn} delay={160} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-400/20">
                    <IconMapPin size={13} className="text-sky-400" />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-sky-400/80">Work setup</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setWorkModeModalOpen(true);
                  }}
                  className={shortcutButtonClassName}
                >
                  Add Mode
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SelectInput
                  form={form}
                  name="workMode"
                  withAsterisk={false}
                  label={<span className="flex items-center">{workModeField?.label ?? "Work Mode"}<span className="ml-0.5 text-rose-400">*</span></span>}
                  placeholder={workModeField?.placeholder ?? "Select Work Mode"}
                  options={workModeOptions}
                />
                <TextInput
                  {...form.getInputProps("location")}
                  withAsterisk
                  label={locationField?.label ?? "Location"}
                  placeholder={locationField?.placeholder ?? "Enter City / Region"}
                  styles={premiumInputStyles}
                />
                <SelectInput
                  form={form}
                  name="country"
                  withAsterisk={false}
                  label="Country"
                  placeholder="Search Country"
                  options={countryOptions}
                />
              </div>
            </MotionSection>

            {/* Capacity */}
            <MotionSection mounted={animateIn} delay={200} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/45 to-transparent" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-pink-500/10 ring-1 ring-pink-400/20">
                    <IconUsers size={13} className="text-pink-400" />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-pink-400/80">Capacity</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIndustryModalOpen(true);
                  }}
                  className={shortcutButtonClassName}
                >
                  Add Industry
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectInput
                  form={form}
                  name="industry"
                  withAsterisk={false}
                  label={<span className="flex items-center">{industryField?.label ?? "Industry"}<span className="ml-0.5 text-rose-400">*</span></span>}
                  placeholder={industryField?.placeholder ?? "Select Industry"}
                  options={industryOptions}
                />
                <div className="flex flex-col">
                  <label className="mb-1.5 text-[13px] font-semibold text-slate-300">
                    No. of vacancies <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="h-10 w-full rounded-xl border border-white/[0.12] bg-slate-900/65 px-3 text-[13px] text-slate-100 outline-none transition focus:border-pink-400/40 focus:ring-1 focus:ring-pink-400/20"
                    {...form.getInputProps("vacancies")}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      form.setFieldValue("vacancies", Number.isFinite(parsed) ? Math.max(1, parsed) : 1);
                    }}
                  />
                  {form.errors.vacancies && (
                    <span className="mt-1 text-xs text-rose-400">{form.errors.vacancies}</span>
                  )}
                </div>
              </div>
            </MotionSection>

            {/* Skills */}
            <MotionSection mounted={animateIn} delay={240} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/45 to-transparent" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-400/20">
                  <IconBolt size={13} className="text-amber-400" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-amber-400/80">Skills</span>
              </div>
              <TagsInput
                {...form.getInputProps("skillsRequired")}
                withAsterisk
                label="Skills Required"
                placeholder="Enter skills"
                splitChars={[","]}
                clearable
                styles={premiumInputStyles}
              />
            </MotionSection>

            {/* Summary */}
            <MotionSection mounted={animateIn} delay={280} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm lg:col-span-6">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/45 to-transparent" />
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-400/20">
                  <IconFileText size={13} className="text-indigo-400" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-indigo-400/80">Summary</span>
              </div>
              <Textarea
                {...form.getInputProps("about")}
                withAsterisk
                label="Summary"
                autosize
                minRows={2}
                placeholder="Enter job overview..."
                styles={premiumTextareaStyles}
              />
            </MotionSection>
          </>
        )}

        {/* Description */}
        <MotionSection mounted={animateIn} delay={320} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] [&_button[data-active='true']]:!bg-bright-sun-400/20 [&_button[data-active='true']]:!text-bright-sun-400 backdrop-blur-sm lg:col-span-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-fuchsia-500/10 ring-1 ring-fuchsia-400/20">
              <IconAlignLeft size={13} className="text-fuchsia-400" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-fuchsia-400/80">Description</span>
          </div>
          <div className="text-[13px] font-semibold text-slate-300">
            Job Description <span className="text-rose-400">*</span>
          </div>
          <div className="mt-2 min-h-[200px] rounded-xl bg-slate-900/60 p-2 ring-1 ring-white/[0.05]">
            <TextEditor form={form} data={editorData} />
          </div>
        </MotionSection>

        {/* Actions – desktop */}
        <MotionSection mounted={animateIn} delay={360} className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-r from-slate-900/80 to-slate-800/40 p-5 shadow-[0_4px_32px_rgba(0,0,0,0.4)] lg:col-span-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent" />
          <div className="hidden items-center gap-3 sm:flex">
            <Button
              leftSection={<IconSend size={15} />}
              className="!h-11 !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-sm !font-bold !text-white !shadow-[0_8px_20px_rgba(16,185,129,0.25)] !transition-all !duration-200 hover:!-translate-y-0.5 hover:!from-emerald-400 hover:!to-teal-400 hover:!shadow-[0_12px_32px_rgba(16,185,129,0.4)]"
              onClick={() => submitJob("ACTIVE")}
            >
              Publish Job
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={15} />}
              variant="outline"
              className="!h-11 !border-cyan-300/30 !bg-cyan-500/[0.08] !text-sm !font-bold !text-cyan-200 !transition-all !duration-200 hover:!-translate-y-0.5 hover:!bg-cyan-500/15 hover:!shadow-[0_8px_24px_rgba(34,211,238,0.2)]"
              onClick={() => submitJob("DRAFT")}
            >
              Save as Draft
            </Button>
            <span className="ml-auto text-[11px] text-slate-600">All required fields must be filled before publishing.</span>
          </div>
        </MotionSection>

        {/* Actions – mobile sticky */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.07] bg-slate-950/90 px-3 py-2.5 backdrop-blur-xl sm:hidden">
          <div className="mx-auto flex max-w-[1400px] gap-2">
            <Button
              leftSection={<IconSend size={14} />}
              className="!h-10 !flex-1 !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-sm !font-bold !text-white"
              onClick={() => submitJob("ACTIVE")}
            >
              Publish
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={14} />}
              variant="outline"
              className="!h-10 !flex-1 !border-cyan-300/30 !bg-cyan-500/10 !text-sm !font-bold !text-cyan-200"
              onClick={() => submitJob("DRAFT")}
            >
              Draft
            </Button>
          </div>
        </div>
      </div>

      <Departments opened={departmentModalOpen} onClose={closeDepartmentModal} />
      <EmploymentTypes opened={employmentTypeModalOpen} onClose={closeEmploymentTypeModal} />
      <Industries opened={industryModalOpen} onClose={closeIndustryModal} />
      <WorkModes opened={workModeModalOpen} onClose={closeWorkModeModal} />
    </div>
  );
};

export default PostJob;
