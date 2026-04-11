import { Button } from "@mantine/core";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import PostJob from "../features/post-job/PostJob";

const PostJobPage=()=>{
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        setAnimateIn(true);
    }, []);

    return <div className="relative min-h-[90vh] bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.14),transparent_32%),radial-gradient(circle_at_90%_10%,rgba(56,189,248,0.18),transparent_34%),linear-gradient(180deg,#040811_0%,#091328_60%,#050810_100%)] font-['poppins']">
        <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-400/14 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-cyan-400/14 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1400px] px-3 pb-10 pt-5 sm:px-4">
            <div className={`mb-5 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-r from-emerald-900/35 via-cyan-900/25 to-slate-900/35 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition-all duration-500 ${animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                            <Sparkles className="h-3.5 w-3.5" />
                            Hiring Workflow
                        </div>
                        <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">Create a High-Converting Job Posting</h1>
                        <p className="mt-2 text-sm text-slate-300">Craft a premium listing with clear role details, compensation, and skills to attract top talent faster.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="light"
                            color="gray"
                            className="!h-10 !bg-white/10 !px-4 !text-sm !font-semibold !text-slate-100 !transition-all !duration-200 hover:!-translate-y-0.5 hover:!bg-white/20"
                            leftSection={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => {
                                window.location.assign("/dashboard?tab=employers&section=viewall");
                            }}
                        >
                            Back to Posted Jobs
                        </Button>
                    </div>
                </div>
            </div>

            <div className={`mt-2 rounded-3xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3 shadow-[0_16px_44px_rgba(0,0,0,0.32)] backdrop-blur-sm transition-all duration-500 ${animateIn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                <PostJob/>
            </div>
        </div>
    </div>
}
export default PostJobPage;