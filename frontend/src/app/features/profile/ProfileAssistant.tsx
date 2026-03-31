import { Button, Loader, Textarea } from "@mantine/core";
import { IconSparkles, IconSend } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { chatWithProfileAssistant } from "../../services/ProfileService";
import { extractErrorMessage } from "../../services/error-extractor-service";

type ChatMessage = {
    role: "assistant" | "user";
    content: string;
};

const buildProfileContext = (profile: any, accountType: string) => {
    const sections = [
        ["Name", profile?.name],
        ["Account Type", accountType],
        ["Job Title", profile?.jobTitle],
        ["Company", profile?.company],
        ["Location", profile?.location],
        ["About", profile?.about],
        ["Profile Summary", profile?.profileSummary],
        ["Skills", Array.isArray(profile?.skills) ? profile.skills.join(", ") : ""],
        ["Experience", profile?.totalExp ? `${profile.totalExp} years` : ""],
        ["Industry", profile?.industryType],
        ["Company Type", profile?.companyType],
        ["Contact Person", profile?.contactPerson],
        ["Contact Designation", profile?.contactDesignation],
    ];

    return sections
        .filter(([, value]) => String(value || "").trim().length > 0)
        .map(([label, value]) => `${label}: ${value}`)
        .join("\n");
};

const getWelcomeMessage = (accountType: string) => {
    if (accountType === "EMPLOYER") {
        return "Ask for help improving your employer profile, company summary, hiring pitch, or recruiter-facing profile copy.";
    }
    return "Ask for help improving your profile summary, skills section, job-fit positioning, or CV wording.";
};

const ProfileAssistant = () => {
    const profile = useSelector((state: any) => state.profile);
    const user = useSelector((state: any) => state.user);
    const accountType = user?.accountType || "";
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content: getWelcomeMessage(accountType),
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, sending]);

    const handleSend = async () => {
        const trimmedMessage = message.trim();
        if (!trimmedMessage || sending) {
            return;
        }

        const nextUserMessage: ChatMessage = { role: "user", content: trimmedMessage };
        setMessages((current) => [...current, nextUserMessage]);
        setMessage("");
        setSending(true);

        try {
            const reply = await chatWithProfileAssistant(
                trimmedMessage,
                accountType,
                buildProfileContext(profile, accountType)
            );

            setMessages((current) => [
                ...current,
                { role: "assistant", content: reply },
            ]);
        } catch (error: any) {
            const errorMessage = extractErrorMessage(error) || "The assistant is unavailable right now.";
            setMessages((current) => [
                ...current,
                { role: "assistant", content: errorMessage },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="rounded-3xl border border-white/12 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.14),transparent_34%),linear-gradient(180deg,rgba(13,20,37,0.96),rgba(3,7,16,0.96))] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.34)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                        <IconSparkles size={14} />
                        AI Profile Copilot
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">Make this profile sharper in seconds</h3>
                    <p className="mt-1 text-sm text-slate-300">
                        Get profile-specific suggestions using the information already filled on this page.
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/12 bg-black/25 p-3">
                <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                    {messages.map((entry, index) => (
                        <div
                            key={`${entry.role}-${index}`}
                            className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${entry.role === "user"
                                    ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white"
                                    : "border border-white/10 bg-slate-900/85 text-slate-100"
                                }`}
                            >
                                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70">
                                    {entry.role === "user" ? "You" : "AfroHR AI"}
                                </div>
                                <div className="whitespace-pre-wrap">{entry.content}</div>
                            </div>
                        </div>
                    ))}
                    {sending && (
                        <div className="flex justify-start">
                            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-slate-900/85 px-4 py-3 text-sm text-slate-200">
                                <Loader size={16} color="blue" />
                                Thinking...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <Textarea
                    value={message}
                    onChange={(event) => setMessage(event.currentTarget.value)}
                    autosize
                    minRows={3}
                    maxRows={6}
                    placeholder="Ask for a stronger profile summary, better skills wording, hiring pitch ideas, or section improvements"
                />

                <div className="flex justify-end">
                    <Button
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        leftSection={sending ? <Loader size={16} /> : <IconSend size={16} />}
                        color="blue"
                    >
                        {sending ? "Sending..." : "Send to GPT"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfileAssistant;
