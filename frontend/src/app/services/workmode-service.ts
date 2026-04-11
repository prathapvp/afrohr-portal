import axiosInstance from "../interceptor/AxiosInterceptor";

export interface WorkMode {
    id?: number;
    name: string;
    description?: string;
}

const API_URL = "/api/ahrm/v3/work-modes";

const getAllWorkModes = async (): Promise<WorkMode[]> => {
    const res = await axiosInstance.get("/work-modes");
    return res.data;
};

const createWorkMode = async (data: Omit<WorkMode, "id">) => {
    const res = await axiosInstance.post("/work-modes", data);
    return res.data;
};

const updateWorkMode = async (id: number, data: Omit<WorkMode, "id">) => {
    const res = await axiosInstance.put(`/work-modes/${id}`, data);
    return res.data;
};

const deleteWorkMode = async (id: number) => {
    const res = await axiosInstance.delete(`/work-modes/${id}`);
    return res.data;
};

export default {
    getAllWorkModes,
    createWorkMode,
    updateWorkMode,
    deleteWorkMode,
};
