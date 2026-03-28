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
    options: [
      'Healthcare & Life Sciences',
      'Legal & Regulatory',
      'Media Production & Entertainment',
      'Merchandising, Retail & eCommerce',
      'Procurement & Supply Chain',
      'Research & Development',
      'Risk Management & Compliance',
      'Security Services',
      'Shipping & Maritime',
      'Sports, Fitness & Personal Care',
      'Strategic & Top Management',
      'Teaching & Training'
    ]

  },
  {
    label: "Role",
    placeholder: "Enter Role Name",
    options: [
      'Acquisition Manager',
      'Area / Territory Manager',
      'Asset Operations',
      'ATM Operations Manager',
      'Back Office Executive',
      'Bank Teller / Clerk',
      'Branch Manager',
      'Branch Operations Manager',
      'Business Correspondent',
      'Card Operations Executive / Lead',
      'Cashier',
      'Personal Banker',
      'Phone Banking Officer',
      'Regional Manager',
      'Relationship Manager',
      'Sales Officer',
      'Banking Operations - Other'
    ]
  },
  {
    label: "Company",
    placeholder: "Enter Company Name",
    options: [
      'Google', 'Microsoft', 'Meta', 'Netflix', 'Adobe',
      'Facebook', 'Amazon', 'Apple', 'Spotify', 'AfroHR'
    ]
  },
  {
    label: "Experience",
    placeholder: "Enter Experience Level",
    options: [
      'Entry Level', 'Intermediate', 'Expert',
      '0-2yrs', '2-5yrs', '5-10yrs', '10-15yrs', '15+ yrs'
    ]
  },
  {
    label: "Employment Type",
    placeholder: "Select Employment Type",
    options: [
      'Full Time, Permanent',
      'Full Time, Temporary/Contractual',
      'Full Time, Freelance/Home-based',
      'Part Time, Permanent',
      'Part Time, Temporary/Contractual',
      'Part Time, Freelance/Home-based'
    ]
  },
  {
    label: "Location",
    placeholder: "Enter Job Location",
    options: [
      'West Africa', 'East Africa', 'Central Africa', 'Middle East',
      'South East Asia', 'Delhi', 'New York', 'San Francisco',
      'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto'
    ]
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
    options: [
      // BPM / IT / Technology
      'BPM',
      'Analytics / KPO / Research',
      'BPM / BPO',
      'IT Services',
      'IT Services & Consulting',
      'Technology',
      'Electronic Components / Semiconductors',
      'Electronics Manufacturing',
      'Emerging Technologies',
      'Hardware & Networking',
      'Internet',
      'Software Product',

      // BFSI
      'BFSI',
      'Banking',
      'Financial Services',
      'FinTech / Payments',
      'Insurance',
      'Investment Banking / Venture Capital / Private Equity',
      'NBFC',

      // Education
      'Education',
      'Education / Training',
      'E-Learning / EdTech',

      // Manufacturing & Production
      'Manufacturing & Production',
      'Auto Components',
      'Automobile',
      'Building Material',
      'Chemicals',
      'Defence & Aerospace',
      'Electrical Equipment',
      'Fertilizers / Pesticides / Agro chemicals',
      'Industrial Automation',
      'Industrial Equipment / Machinery',
      'Iron & Steel',
      'Metals & Mining',
      'Packaging & Containers',
      'Petrochemical / Plastics / Rubber',
      'Pulp & Paper',

      // Infrastructure & Transport
      'Infrastructure, Transport & Real Estate',
      'Aviation',
      'Courier / Logistics',
      'Engineering & Construction',
      'Oil & Gas',
      'Ports & Shipping',
      'Power',
      'Railways',
      'Real Estate',
      'Urban Transport',
      'Water Treatment / Waste Management',

      // Consumer, Retail & Hospitality
      'Consumer, Retail & Hospitality',
      'Beauty & Personal Care',
      'Beverage',
      'Consumer Electronics & Appliances',
      'Fitness & Wellness',
      'FMCG',
      'Food Processing',
      'Furniture & Furnishing',
      'Gems & Jewellery',
      'Hotels & Restaurants',
      'Leather',
      'Retail',
      'Textile & Apparel',
      'Travel & Tourism',

      // Healthcare & Life Sciences
      'Healthcare & Life Sciences',
      'Biotechnology',
      'Clinical Research / Contract Research',
      'Medical Devices & Equipment',
      'Medical Services / Hospital',
      'Pharmaceutical & Life Sciences',

      // Media, Entertainment & Telecom
      'Media, Entertainment & Telecom',
      'Advertising & Marketing',
      'Animation & VFX',
      'Events / Live Entertainment',
      'Film / Music / Entertainment',
      'Gaming',
      'Printing & Publishing',
      'Sports / Leisure & Recreation',
      'Telecom / ISP',
      'TV / Radio',

      // Professional Services
      'Professional Services',
      'Accounting / Auditing',
      'Architecture / Interior Design',
      'Content Development / Language',
      'Design',
      'Facility Management Services',
      'Law Enforcement / Security Services',
      'Legal',
      'Management Consulting',
      'Recruitment / Staffing',
      'Testing, Inspection and Certification (TIC)',

      // Miscellaneous
      'Agriculture / Forestry / Fishing',
      'Government / Public Administration',
      'Import & Export',
      'NGO / Social Services / Industry Associations',
      'Miscellaneous'
    ]
  }
  , {
    label: "Work Mode",
    placeholder: "Select Work Mode",
    options: [
      'In office',
      'Hybrid',
      'Remote'
    ]
  },
  {
    label: "Currency",
    placeholder: "Select Currency",
    options: [
      { value: 'INR', label: '₹ INR' },
      { value: 'USD', label: '$ USD' },
      { value: 'EUR', label: '€ EUR' },
      { value: 'GBP', label: '£ GBP' },
      { value: 'JPY', label: '¥ JPY' }
    ]
  },
  {
    label: "Work Mode",
    placeholder: "Select Work Mode",
    options: ['In office', 'Hybrid', 'Remote']
  }
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
