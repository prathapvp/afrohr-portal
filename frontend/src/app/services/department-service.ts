import axiosInstance from "../interceptor/AxiosInterceptor";

export interface Department {
    id: number;
    name: string;
    description: string;
    createdAt?: string;
    updatedAt?: string;
}

const DEPARTMENTS_ENDPOINT = "/departments";

const coerceDepartmentArray = (payload: unknown): Department[] => {
    const source = Array.isArray(payload)
        ? payload
        : (payload as { departments?: unknown; data?: unknown; items?: unknown } | null)?.departments
            ?? (payload as { departments?: unknown; data?: unknown; items?: unknown } | null)?.data
            ?? (payload as { departments?: unknown; data?: unknown; items?: unknown } | null)?.items
            ?? [];

    if (!Array.isArray(source)) {
        return [];
    }

    return source
        .map((item, index) => {
            const department = item as Partial<Department> & { departmentName?: string };
            const name = String(department.name ?? department.departmentName ?? "").trim();
            if (!name) {
                return null;
            }

            return {
                id: Number(department.id ?? index + 1),
                name,
                description: String(department.description ?? ""),
                createdAt: department.createdAt,
                updatedAt: department.updatedAt,
            } satisfies Department;
        })
        .filter((department): department is Department => Boolean(department));
};

const getAllDepartments = async (): Promise<Department[]> => {
    return axiosInstance.get(DEPARTMENTS_ENDPOINT)
        .then((res) => coerceDepartmentArray(res.data))
        .catch((error) => { throw error; });
};

const getDepartment = async (id: number): Promise<Department> => {
    return axiosInstance.get(`${DEPARTMENTS_ENDPOINT}/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const createDepartment = async (dept: { name: string; description: string }): Promise<any> => {
    return axiosInstance.post(DEPARTMENTS_ENDPOINT, dept)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const updateDepartment = async (id: number, dept: { name: string; description: string }): Promise<any> => {
    return axiosInstance.put(`${DEPARTMENTS_ENDPOINT}/${id}`, dept)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

const deleteDepartment = async (id: number): Promise<any> => {
    return axiosInstance.delete(`${DEPARTMENTS_ENDPOINT}/${id}`)
        .then((res) => res.data)
        .catch((error) => { throw error; });
};

export { getAllDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
