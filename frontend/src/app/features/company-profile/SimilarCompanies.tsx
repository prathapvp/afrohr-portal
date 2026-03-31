
import { similar } from "../../data/Company";
import CompanyCard from "./CompanyCard";

const SimilarCompanies = () => {
    return <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
        <div className="mb-5 text-xl font-semibold text-white">Similar Companies</div>
        <div className="flex flex-col gap-4">
        {
            similar.map((company, index) => <CompanyCard key={index} {...company} />
        )}
    </div>
    </div>
}
export default SimilarCompanies;