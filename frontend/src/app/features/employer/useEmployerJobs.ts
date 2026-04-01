import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { EmployerPostedJob } from "./employer-types";
import { normalizeEmployerJob } from "./employer-view.utils";

interface UseEmployerJobsResult {
  legacyJobs: EmployerPostedJob[];
  legacyJobsLoading: boolean;
  legacyJobsError: string | null;
  setLegacyJobs: Dispatch<SetStateAction<EmployerPostedJob[]>>;
  setLegacyJobsError: Dispatch<SetStateAction<string | null>>;
}

const AUTH_REQUIRED_MESSAGE = "Please sign up or log in as an employer to perform employer operations.";

export function useEmployerJobs(isEmployerAuthorized: boolean): UseEmployerJobsResult {
  const [legacyJobs, setLegacyJobs] = useState<EmployerPostedJob[]>([]);
  const [legacyJobsLoading, setLegacyJobsLoading] = useState(false);
  const [legacyJobsError, setLegacyJobsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployerJobs() {
      if (!isEmployerAuthorized) {
        setLegacyJobs([]);
        setLegacyJobsLoading(false);
        setLegacyJobsError(AUTH_REQUIRED_MESSAGE);
        return;
      }

      try {
        setLegacyJobsLoading(true);
        setLegacyJobsError(null);
        const response = await fetch("/api/ahrm/v3/jobs/getAll");
        if (!response.ok) {
          throw new Error("Failed to load employer jobs");
        }

        const data = (await response.json()) as Array<Record<string, unknown>>;
        if (cancelled) {
          return;
        }

        const normalized = data.map((item) => normalizeEmployerJob(item));
        setLegacyJobs(normalized.filter((job) => Number.isFinite(job.id) && job.id > 0));
      } catch (error) {
        if (!cancelled) {
          setLegacyJobsError(error instanceof Error ? error.message : "Unable to load jobs");
        }
      } finally {
        if (!cancelled) {
          setLegacyJobsLoading(false);
        }
      }
    }

    void loadEmployerJobs();

    return () => {
      cancelled = true;
    };
  }, [isEmployerAuthorized]);

  return {
    legacyJobs,
    legacyJobsLoading,
    legacyJobsError,
    setLegacyJobs,
    setLegacyJobsError,
  };
}
