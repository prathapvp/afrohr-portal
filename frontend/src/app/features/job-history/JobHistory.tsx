import { Divider, Tabs } from "@mantine/core";
import { IconBriefcase2, IconBookmark, IconChecklist, IconProgressCheck } from "@tabler/icons-react";
import Card from "./Card";
import { useJobHistoryController } from "./useJobHistoryController";

const JobHistory = () => { 
    const { activeTab, showList, handleTabChange } = useJobHistoryController();

    const tabMeta: Record<string, { label: string; icon: JSX.Element }> = {
        APPLIED: { label: "Applied", icon: <IconChecklist size={16} /> },
        SAVED: { label: "Saved", icon: <IconBookmark size={16} /> },
        OFFERED: { label: "Shortlisted", icon: <IconBriefcase2 size={16} /> },
        INTERVIEWING: { label: "In Progress", icon: <IconProgressCheck size={16} /> },
    };

    return <div className="space-y-5 text-white">
        <div className="premium-enter flex flex-wrap items-end justify-end gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent px-4 py-4 sm:px-5">
            <div className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">
                {showList.length} item{showList.length === 1 ? "" : "s"} in {tabMeta[activeTab]?.label ?? "tab"}
            </div>
        </div>

        <div className="premium-enter [animation-delay:80ms]">
            <Tabs value={activeTab} onChange={handleTabChange} radius="xl" variant="outline">
                <Tabs.List className="mb-6 grid grid-cols-2 gap-2 border-none bg-transparent p-0 md:grid-cols-4 [&_button]:!rounded-2xl [&_button]:!border [&_button]:!border-white/12 [&_button]:!bg-white/[0.04] [&_button]:!px-3 [&_button]:!py-3 [&_button]:!text-[13px] [&_button]:!font-semibold [&_button]:!tracking-[0.01em] [&_button]:!text-slate-200 [&_button]:transition [&_button:hover]:!bg-white/[0.08] [&_button[data-active='true']]:!border-cyan-300/35 [&_button[data-active='true']]:!bg-cyan-400/15 [&_button[data-active='true']]:!text-cyan-100">
                    <Tabs.Tab value="APPLIED" leftSection={tabMeta.APPLIED.icon}>{tabMeta.APPLIED.label}</Tabs.Tab>
                    <Tabs.Tab value="SAVED" leftSection={tabMeta.SAVED.icon}>{tabMeta.SAVED.label}</Tabs.Tab>
                    <Tabs.Tab value="OFFERED" leftSection={tabMeta.OFFERED.icon}>{tabMeta.OFFERED.label}</Tabs.Tab>
                    <Tabs.Tab value="INTERVIEWING" leftSection={tabMeta.INTERVIEWING.icon}>{tabMeta.INTERVIEWING.label}</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value={activeTab} className="[&>div]:w-full">
                    <div className="flex flex-wrap gap-5">
                        {showList.length > 0
                            ? showList.map((item, index) => <Card key={item.id} cardIndex={index} {...item} {...{ [activeTab.toLowerCase()]: true }} />)
                            : (
                                <div className="premium-enter w-full rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.05] to-white/[0.02] px-6 py-12 text-center [animation-delay:120ms]">
                                    <div className="mx-auto max-w-md">
                                        <p className="text-xl font-semibold text-white">Nothing to show yet</p>
                                        <p className="mt-2 text-sm text-slate-300">
                                            Your {tabMeta[activeTab]?.label?.toLowerCase() ?? "selected"} jobs will appear here once activity starts.
                                        </p>
                                    </div>
                                </div>
                            )}
                    </div>
                </Tabs.Panel>

            </Tabs>
        </div>
    </div>
}
export default JobHistory;