import axiosInstance from "../interceptor/AxiosInterceptor";

export interface EmploymentType {
    id: number;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

const getAllEmploymentTypes = async (): Promise<EmploymentType[]> => {
    return axiosInstance.get("/employment-types")
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const getEmploymentType = async (id: number): Promise<EmploymentType> => {
    return axiosInstance.get(`/employment-types/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const createEmploymentType = async (employmentType: { name: string; description: string }): Promise<any> => {
    return axiosInstance.post("/employment-types", employmentType)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const updateEmploymentType = async (id: number, employmentType: { name: string; description: string }): Promise<any> => {
    return axiosInstance.put(`/employment-types/${id}`, employmentType)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const deleteEmploymentType = async (id: number): Promise<any> => {
    return axiosInstance.delete(`/employment-types/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

export default {
    getAllEmploymentTypes,
    getEmploymentType,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType,
};
