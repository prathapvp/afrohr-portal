import { Button, Modal, type ModalProps } from "@mantine/core";
import type { ReactNode } from "react";

export const premiumProfileInputStyles = {
    label: {
        color: "#d1d5db",
        fontWeight: 600,
        marginBottom: "6px",
    },
    input: {
        background: "rgba(15, 23, 42, 0.55)",
        color: "#f3f4f6",
        borderColor: "rgba(255, 255, 255, 0.14)",
    },
};

export type ProfileEditorModalProps = {
    opened: boolean;
    onClose: () => void;
    onSave: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    size?: ModalProps["size"];
    saveLabel?: string;
};

export default function ProfileEditorModal({
    opened,
    onClose,
    onSave,
    title,
    description,
    children,
    size = "lg",
    saveLabel = "Save",
}: ProfileEditorModalProps) {
    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={title}
            centered
            size={size}
            radius="xl"
            transitionProps={{ transition: "fade", duration: 180 }}
            overlayProps={{ backgroundOpacity: 0.78, blur: 4, color: "#020617" }}
            styles={{
                content: {
                    background:
                        "radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, rgba(10,15,30,0.98), rgba(2,6,23,0.98))",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
                },
                header: {
                    background: "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.10)",
                    paddingBottom: "12px",
                },
                title: {
                    color: "#f8fafc",
                    fontWeight: 800,
                    letterSpacing: "0.01em",
                },
                close: {
                    color: "#cbd5e1",
                },
                body: {
                    paddingTop: "16px",
                },
            }}
        >
            {description && <p className="mb-4 text-sm text-slate-300">{description}</p>}
            {children}
            <div className="mt-5 flex justify-end gap-3">
                <Button variant="light" color="gray" onClick={onClose} className="rounded-full px-5">
                    Cancel
                </Button>
                <Button color="brightSun.4" onClick={onSave} className="rounded-full px-5 font-semibold text-mine-shaft-950">
                    {saveLabel}
                </Button>
            </div>
        </Modal>
    );
}