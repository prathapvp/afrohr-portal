const fields = [
  {
    label: "Job Title",
    placeholder: "Enter Job Title",
    options: [
      'Plant Manager', 'Accountant', 'Finance Controller', 'Production Controller',
      'Quality Analyst', 'HR Manager', 'Designer', 'Developer',
      'Marketing Specialist', 'Data Analyst', 'Sales Executive',
      'Content Writer', 'Customer Support'
    ]
  },
  {
    label: "Department",
    placeholder: "Enter Department Name",
  },
  {
    label: "Role",
    placeholder: "Enter Role Name",
  },
  {
    label: "Company",
    placeholder: "Enter Company Name",
  },
  {
    label: "Experience",
    placeholder: "Enter Experience Level",
  },
  {
    label: "Employment Type",
    placeholder: "Select Employment Type",
  },
  {
    label: "Location",
    placeholder: "Enter Job Location",
  },
  {
    label: "Salary",
    placeholder: "Enter Salary",
    options: [
      '$10K', '$15K', '$20K', '$25K', '$30K', '$35K', '$40K',
      '$50K', '$75K', '$90K', '$100K',
      '10 LPA', '15 LPA', '20 LPA', '25 LPA', '30 LPA',
      '35 LPA', '40 LPA', '45 LPA'
    ]
  }, {
    label: "Industry",
    placeholder: "Select Industry",
  }
  , {
    label: "Work Mode",
    placeholder: "Select Work Mode",
  },
  {
    label: "Currency",
    placeholder: "Enter Currency",
  },
];

const content = `
<h4>About The Job</h4>
<p>Write description here...</p>
<h4>Responsibilities</h4>
<ul>
  <li>Add responsibilities here...</li>
</ul>
<h4>Qualifications and Skill Sets</h4>
<ul>
  <li>Add required qualification and skill set here...</li>
</ul>
`;

export { fields, content };
