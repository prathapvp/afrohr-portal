import axiosInstance from "../interceptor/AxiosInterceptor";

export interface Industry {
    id: number;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

const getAllIndustries = async (): Promise<Industry[]> => {
    return axiosInstance.get("/industries")
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const getIndustry = async (id: number): Promise<Industry> => {
    return axiosInstance.get(`/industries/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const createIndustry = async (industry: { name: string; description: string }): Promise<any> => {
    return axiosInstance.post("/industries", industry)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const updateIndustry = async (id: number, industry: { name: string; description: string }): Promise<any> => {
    return axiosInstance.put(`/industries/${id}`, industry)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const deleteIndustry = async (id: number): Promise<any> => {
    return axiosInstance.delete(`/industries/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

export { getAllIndustries, getIndustry, createIndustry, updateIndustry, deleteIndustry };
