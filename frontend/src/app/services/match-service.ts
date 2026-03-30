export interface MatchResult {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
}

/**
 * Computes a 0-100 job match score based on the applicant's Redux profile vs a job object.
 * Pure client-side — no API call. Called once per JobCard render.
 *
 * Weights:  Skills 60%  |  Experience 25%  |  Location 15%
 */
export function computeMatchScore(job: any, profile: any): MatchResult {
    const empty: MatchResult = { score: 0, matchedSkills: [], missingSkills: [] };
    if (!job || !profile) return empty;

    const profileSkills: string[] = [
        ...(Array.isArray(profile.skills) ? profile.skills : []),
        ...(Array.isArray(profile.itSkills) ? profile.itSkills : []),
    ].map((s: string) => s.toLowerCase().trim());

    if (profileSkills.length === 0) return empty;

    const jobSkillsRaw: string[] = Array.isArray(job.skillsRequired) ? job.skillsRequired : [];
    const jobSkills = jobSkillsRaw.map((s: string) => s.toLowerCase().trim());

    // ── Skills score (60%) ─────────────────────────────────────────────────────
    const matchedRaw = jobSkills.filter((s) =>
        profileSkills.some((ps) => ps.includes(s) || s.includes(ps))
    );
    const missingRaw = jobSkills.filter((s) =>
        !profileSkills.some((ps) => ps.includes(s) || s.includes(ps))
    );
    const skillScore = jobSkills.length > 0 ? (matchedRaw.length / jobSkills.length) * 60 : 30;

    // ── Experience score (25%) ─────────────────────────────────────────────────
    const profileExp = Number(profile.totalExp) || 0;
    const expRange = (job.experience ?? "").match(/(\d+)\s*[-–to]+\s*(\d+)/i);
    let expScore = 13;
    if (expRange) {
        const minExp = Number(expRange[1]);
        const maxExp = Number(expRange[2]);
        if (profileExp >= minExp && profileExp <= maxExp) expScore = 25;
        else if (profileExp > maxExp) expScore = 20;
        else expScore = Math.max(0, 25 - (minExp - profileExp) * 5);
    } else if (
        job.freshersAllowed ||
        (job.experience ?? "").toLowerCase().includes("fresher")
    ) {
        expScore = profileExp === 0 ? 25 : 20;
    }

    // ── Location score (15%) ───────────────────────────────────────────────────
    const isRemote = (job.workMode ?? "").toLowerCase().includes("remote");
    let locationScore = 7;
    if (isRemote) {
        locationScore = 15;
    } else if (profile.location && job.location) {
        const pl = (profile.location as string).toLowerCase();
        const jl = (job.location as string).toLowerCase();
        if (pl.includes(jl) || jl.includes(pl)) locationScore = 15;
    }

    const score = Math.min(100, Math.round(skillScore + expScore + locationScore));

    // Restore original casing from job.skillsRequired
    const matchedSkills = matchedRaw.map(
        (s) => jobSkillsRaw.find((o) => o.toLowerCase().trim() === s) ?? s
    );
    const missingSkills = missingRaw.map(
        (s) => jobSkillsRaw.find((o) => o.toLowerCase().trim() === s) ?? s
    );

    return { score, matchedSkills, missingSkills };
}
