import axiosInstance from "../interceptor/AxiosInterceptor";

export interface Department {
    id: number;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

const getAllDepartments = async (): Promise<Department[]> => {
    return axiosInstance.get("/departments")
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const getDepartment = async (id: number): Promise<Department> => {
    return axiosInstance.get(`/departments/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const createDepartment = async (dept: { name: string; description: string }): Promise<any> => {
    return axiosInstance.post("/departments", dept)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const updateDepartment = async (id: number, dept: { name: string; description: string }): Promise<any> => {
    return axiosInstance.put(`/departments/${id}`, dept)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const deleteDepartment = async (id: number): Promise<any> => {
    return axiosInstance.delete(`/departments/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

export { getAllDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
