import { IconBriefcase,  IconMapPin } from "@tabler/icons-react";

const fields=[
    {label:"Job Title",placeholder:"Enter Job Title", options:['Plant Manager','Accountant','Finance Controller','Production Controller','Quality Analyst','HR Manager','Designer', 'Developer', 'Product Manager', 'Marketing Specialist', 'Data Analyst', 'Sales Executive', 'Content Writer', 'Customer Support'], leftSection:IconBriefcase},
    {label:"Company",placeholder:"Enter Company Name", options:['AfroLLC','Google', 'Microsoft', 'Meta', 'Netflix', 'Adobe', 'Facebook', 'Amazon', 'Apple', 'Spotify'], leftSection:IconBriefcase},
    {label:"Location",placeholder:"Enter Job Location", options:['West Africa','East Africa','Central Africa','Middle East','South East Asia','Delhi', 'New York', 'San Francisco', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto'], leftSection:IconMapPin}
]
export default fields;