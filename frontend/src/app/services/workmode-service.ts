import axios from "axios";

export interface WorkMode {
    id?: number;
    name: string;
    description?: string;
}

const API_URL = "/api/ahrm/v3/work-modes";

const getAllWorkModes = async (): Promise<WorkMode[]> => {
    const res = await axios.get(API_URL);
    return res.data;
};

const createWorkMode = async (data: Omit<WorkMode, "id">) => {
    const res = await axios.post(API_URL, data);
    return res.data;
};

const updateWorkMode = async (id: number, data: Omit<WorkMode, "id">) => {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
};

const deleteWorkMode = async (id: number) => {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
};

export default {
    getAllWorkModes,
    createWorkMode,
    updateWorkMode,
    deleteWorkMode,
};
