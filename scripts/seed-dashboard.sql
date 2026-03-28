INSERT INTO public.jobs (
  job_title, department, role, company, applicants, about, experience, freshers_allowed,
  job_type, location, package_offered, max_package_offered, variable_component,
  hide_salary, work_mode, willing_to_relocate, industry, vacancies, post_time,
  description, skills_required, job_status, posted_by
)
SELECT * FROM (
  VALUES
  ('Senior Backend Engineer','Engineering','Backend Engineer','AfroHR','[]'::jsonb,'Build scalable hiring services for African markets.','5-10yrs',false,'Full-Time','Lagos, Nigeria',120000,155000,15,false,'Hybrid',true,'Technology',3,NOW() - INTERVAL '12 days','Own APIs, data pipelines, and platform reliability.','["Java","Spring Boot","PostgreSQL"]'::jsonb,'ACTIVE',1),
  ('Product Designer','Product','UI/UX Designer','AfroHR','[]'::jsonb,'Design intuitive employer and candidate workflows.','2-5yrs',true,'Full-Time','Nairobi, Kenya',65000,90000,10,false,'Remote',false,'Technology',2,NOW() - INTERVAL '8 days','Lead product discovery, prototypes, and design systems.','["Figma","UX Research","Design Systems"]'::jsonb,'ACTIVE',1),
  ('Data Analyst','Data','People Analytics Analyst','AfroHR','[]'::jsonb,'Deliver workforce and hiring insights dashboards.','0-2yrs',true,'Contract','Accra, Ghana',42000,60000,5,false,'On-site',false,'Technology',1,NOW() - INTERVAL '5 days','Analyze talent funnels and recruitment conversion.','["SQL","Power BI","Python"]'::jsonb,'ACTIVE',2),
  ('HR Operations Specialist','Human Resources','HR Specialist','AfroHR','[]'::jsonb,'Run hiring ops and optimize recruitment cycles.','2-5yrs',false,'Full-Time','Kigali, Rwanda',38000,52000,8,false,'Hybrid',true,'Human Resources',2,NOW() - INTERVAL '3 days','Coordinate interviews and improve candidate experience.','["Recruitment","ATS","Communication"]'::jsonb,'ACTIVE',2)
) AS v(
  job_title, department, role, company, applicants, about, experience, freshers_allowed,
  job_type, location, package_offered, max_package_offered, variable_component,
  hide_salary, work_mode, willing_to_relocate, industry, vacancies, post_time,
  description, skills_required, job_status, posted_by
)
WHERE NOT EXISTS (SELECT 1 FROM public.jobs);

INSERT INTO public.metadata_entries(type, name, description, created_at, updated_at)
SELECT 'DEPARTMENT', d.name, d.description, COALESCE(d.created_at, NOW()), COALESCE(d.updated_at, NOW())
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 FROM public.metadata_entries me
  WHERE me.type = 'DEPARTMENT' AND lower(me.name) = lower(d.name)
);

INSERT INTO public.metadata_entries(type, name, description, created_at, updated_at)
SELECT v.type::public.metadata_type, v.name, v.description, NOW(), NOW()
FROM (VALUES
  ('INDUSTRY','Technology','Software, hardware and IT services'),
  ('INDUSTRY','Finance','Banking, insurance and investment'),
  ('INDUSTRY','Healthcare','Medical and wellness services'),
  ('EMPLOYMENT_TYPE','Full-Time','Standard full-time employment'),
  ('EMPLOYMENT_TYPE','Part-Time','Part-time employment'),
  ('EMPLOYMENT_TYPE','Contract','Fixed-term contract role'),
  ('WORK_MODE','Remote','Work from anywhere'),
  ('WORK_MODE','Hybrid','Mix of office and remote'),
  ('WORK_MODE','On-site','Work from office location')
) AS v(type, name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.metadata_entries me
  WHERE me.type::text = v.type AND lower(me.name) = lower(v.name)
);
