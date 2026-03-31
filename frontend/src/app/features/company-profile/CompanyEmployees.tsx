import TalentCard from "../find-talent/TalentCard";

interface CompanyEmployeesProps {
    employees: any[];
    loading?: boolean;
}

const CompanyEmployees=({ employees, loading }: CompanyEmployeesProps)=>{
    const topEmployees = employees.slice(0, 6);

    return  <div className="mt-3">
    <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/75">Talent Network</div>
        <div className="text-base font-semibold text-white sm:text-lg">People connected with this company ({employees.length})</div>
    </div>

    {loading && <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-mine-shaft-300">Loading employees...</div>}

    {!loading && topEmployees.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-mine-shaft-300">
            No employee profiles are currently associated with this company.
        </div>
    )}

    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
    {
        topEmployees.map((talent, index) => <TalentCard key={index} {...talent}  />)
    }
</div>
 </div>
}
export default CompanyEmployees;