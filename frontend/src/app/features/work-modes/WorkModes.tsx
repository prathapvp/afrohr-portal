import { useEffect, useState } from "react";
import { TextInput, Textarea, Loader, Modal } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import { IconEdit, IconTrash, IconPlus, IconMapPin, IconSearch, IconSparkles, IconArrowRight } from "@tabler/icons-react";
import workModeService, { WorkMode } from "../../services/workmode-service";
import { successNotification, errorNotification } from "../../services/NotificationService";

interface WorkModesProps {
    opened: boolean;
    onClose: () => void;
}

const WorkModes = ({ opened, onClose }: WorkModesProps) => {
    const [workModes, setWorkModes] = useState<WorkMode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");

    const form = useForm({
        mode: "controlled",
        validateInputOnChange: true,
        initialValues: { name: "", description: "" },
        validate: {
            name: isNotEmpty("Work mode name is required"),
        },
    });

    const fetchWorkModes = () => {
        setLoading(true);
        workModeService.getAllWorkModes()
            .then(setWorkModes)
            .catch(() => errorNotification("Error", "Failed to load work modes"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (opened) fetchWorkModes();
    }, [opened]);

    const handleSave = async (values: { name: string; description: string }) => {
        setSaving(true);
        try {
            if (editingId) {
                await workModeService.updateWorkMode(editingId, values);
                successNotification("Success", "Work mode updated");
            } else {
                await workModeService.createWorkMode(values);
                successNotification("Success", "Work mode created");
            }
            fetchWorkModes();
            setShowForm(false);
            setEditingId(null);
            form.reset();
        } catch {
            errorNotification("Error", "Failed to save work mode");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (wm: WorkMode) => {
        setEditingId(wm.id!);
        form.setValues({ name: wm.name, description: wm.description });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this work mode?")) return;
        setSaving(true);
        try {
            await workModeService.deleteWorkMode(id);
            successNotification("Success", "Work mode deleted");
            fetchWorkModes();
        } catch {
            errorNotification("Error", "Failed to delete work mode");
        } finally {
            setSaving(false);
        }
    };

    const filtered = workModes.filter((wm) =>
        wm.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            withCloseButton={false}
            size="xl"
            centered
            radius="lg"
            overlayProps={{ backgroundOpacity: 0.55, blur: 8 }}
            styles={{
                content: { background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.08)' },
                body: { padding: 0 },
                header: { display: 'none' },
            }}
        >
            {/* Header */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-pink-500/5" />
                <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-orange-600 shadow-lg shadow-pink-500/25">
                            <IconMapPin className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white">Work Modes</h2>
                                <span className="flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pink-400">
                                    <IconSparkles size={10} /> Featured
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">Manage work modes for your organization</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                {/* Gradient divider */}
                <div className="mt-5 h-px bg-gradient-to-r from-transparent via-pink-500/30 to-transparent" />
            </div>

            {/* Body */}
            <div className="px-6 pb-6">
                {/* Stats Bar */}
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/50" />
                        <span className="text-xs font-medium text-slate-300">{workModes.length} Total</span>
                    </div>
                    {search && (
                        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5">
                            <span className="text-xs text-slate-400">{filtered.length} matched</span>
                        </div>
                    )}
                </div>

                {/* Toolbar */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <TextInput
                        leftSection={<IconSearch size={15} className="text-slate-500" />}
                        placeholder="Search work modes..."
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        className="w-full sm:max-w-xs"
                        styles={{
                            input: {
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#e2e8f0',
                                fontSize: '13px',
                                '&::placeholder': { color: '#64748b' },
                                '&:focus': { borderColor: 'rgba(236,72,153,0.5)' },
                            },
                        }}
                    />
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); form.reset(); }}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/30 hover:brightness-110"
                    >
                        <IconPlus size={16} /> Add Work Mode
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-pink-400" />
                            <h3 className="text-sm font-semibold text-white">
                                {editingId ? "Edit Work Mode" : "New Work Mode"}
                            </h3>
                        </div>
                        <form className="flex flex-col gap-4" onSubmit={form.onSubmit(handleSave)}>
                            <TextInput
                                {...form.getInputProps("name")}
                                label={<span className="text-xs font-medium text-slate-300">Work Mode Name</span>}
                                placeholder="e.g. Remote"
                                withAsterisk
                                styles={{
                                    input: {
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#e2e8f0',
                                        '&:focus': { borderColor: 'rgba(236,72,153,0.5)' },
                                    },
                                    label: { marginBottom: 4 },
                                }}
                            />
                            <Textarea
                                {...form.getInputProps("description")}
                                label={<span className="text-xs font-medium text-slate-300">Description</span>}
                                placeholder="Brief description of the work mode"
                                autosize
                                minRows={2}
                                styles={{
                                    input: {
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#e2e8f0',
                                        '&:focus': { borderColor: 'rgba(236,72,153,0.5)' },
                                    },
                                    label: { marginBottom: 4 },
                                }}
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                                >
                                    {saving ? <Loader size={14} color="white" /> : <IconArrowRight size={15} />}
                                    {editingId ? "Update" : "Create"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); form.reset(); }}
                                    className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Table / Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-3">
                            <Loader color="pink" size="sm" />
                            <span className="text-xs text-slate-500">Loading work modes...</span>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 py-14 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                            <IconMapPin className="h-7 w-7 text-slate-600" />
                        </div>
                        <p className="text-sm text-slate-500">
                            {search ? "No work modes match your search" : "No work modes yet. Add your first one!"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-white/8">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/8 bg-white/[0.02]">
                                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">#</th>
                                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</th>
                                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Description</th>
                                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((wm, idx) => (
                                    <tr
                                        key={wm.id}
                                        className="group border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[11px] font-bold text-slate-500">
                                                {idx + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500/10 to-orange-500/10">
                                                    <IconMapPin size={14} className="text-pink-400" />
                                                </div>
                                                <span className="font-semibold text-white">{wm.name}</span>
                                            </div>
                                        </td>
                                        <td className="max-w-[280px] truncate px-5 py-3.5 text-slate-400">
                                            {wm.description || "—"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() => handleEdit(wm)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-pink-500/10 hover:text-pink-400"
                                                    title="Edit"
                                                >
                                                    <IconEdit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(wm.id!)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
                                                    title="Delete"
                                                >
                                                    <IconTrash size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default WorkModes;
