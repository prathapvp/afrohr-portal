import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAppSelector } from "../../store";
import type { EmployerPostedJob } from "./employer-types";
import { normalizeEmployerJob } from "./employer-view.utils";
import { getAllJobs } from "../../services/job-service";

interface UseEmployerJobsResult {
  legacyJobs: EmployerPostedJob[];
  legacyJobsLoading: boolean;
  legacyJobsError: string | null;
  setLegacyJobs: Dispatch<SetStateAction<EmployerPostedJob[]>>;
  setLegacyJobsError: Dispatch<SetStateAction<string | null>>;
}

const AUTH_REQUIRED_MESSAGE = "Please sign up or log in as an employer to perform employer operations.";

export function useEmployerJobs(isEmployerAuthorized: boolean): UseEmployerJobsResult {
  const userId = useAppSelector((state: any) => state.user?.id as number | undefined);
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

        if (!userId) {
          setLegacyJobs([]);
          setLegacyJobsError(AUTH_REQUIRED_MESSAGE);
          setLegacyJobsLoading(false);
          return;
        }

      try {
        setLegacyJobsLoading(true);
        setLegacyJobsError(null);
        const data = (await getAllJobs({ postedBy: userId })) as Array<Record<string, unknown>>;
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
  }, [isEmployerAuthorized, userId]);

  return {
    legacyJobs,
    legacyJobsLoading,
    legacyJobsError,
    setLegacyJobs,
    setLegacyJobsError,
  };
}
