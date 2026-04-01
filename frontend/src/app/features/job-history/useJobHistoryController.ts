import { useCallback, useEffect, useState } from "react";
import { getAllJobs, getMyJobHistory } from "../../services/job-service";
import { useAppDispatch, useAppSelector } from "../../store";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import type { HistoryJobItem, HistoryTab, JobHistoryEnvelope } from "./types";

function normalizeHistoryPayload(items: unknown[]): HistoryJobItem[] {
  return items.map((item) => {
    const envelope = item as JobHistoryEnvelope;
    if (envelope?.job && typeof envelope.job === "object") {
      return {
        ...envelope.job,
        applicants: envelope.job.applicants || envelope.applicants,
      };
    }
    return item as HistoryJobItem;
  });
}

function hasApplicantStatus(job: HistoryJobItem, userId: number | undefined, status: HistoryTab) {
  if (!userId) {
    return false;
  }
  return (job.applicants ?? []).some(
    (applicant) => applicant?.applicantId === userId && String(applicant?.applicationStatus ?? "").toUpperCase() === status,
  );
}

export function useJobHistoryController() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user as { id?: number } | null);
  const profile = useAppSelector((state) => state.profile as { savedJobs?: number[] });

  const [activeTab, setActiveTab] = useState<HistoryTab>("APPLIED");
  const [jobList, setJobList] = useState<HistoryJobItem[]>([]);
  const [showList, setShowList] = useState<HistoryJobItem[]>([]);

  const loadTabData = useCallback(
    async (tab: HistoryTab) => {
      if (!user?.id) {
        setShowList([]);
        return;
      }

      if (tab === "SAVED") {
        const allJobs = (await getAllJobs()) as HistoryJobItem[];
        const savedSet = new Set<number>(profile?.savedJobs || []);
        setJobList(allJobs || []);
        setShowList((allJobs || []).filter((job) => savedSet.has(job.id)));
        return;
      }

      const historyItems = (await getMyJobHistory(tab)) as unknown[];
      setShowList(normalizeHistoryPayload(historyItems));
    },
    [user?.id, profile?.savedJobs],
  );

  useEffect(() => {
    dispatch(showOverlay());
    loadTabData("APPLIED")
      .catch(async () => {
        const jobs = (await getAllJobs()) as HistoryJobItem[];
        setJobList(jobs || []);
        setShowList((jobs || []).filter((job) => hasApplicantStatus(job, user?.id, "APPLIED")));
      })
      .finally(() => dispatch(hideOverlay()));
  }, [dispatch, loadTabData, user?.id, profile?.savedJobs]);

  const handleTabChange = (value: string | null) => {
    if (!value) {
      return;
    }

    const tab = value as HistoryTab;
    setActiveTab(tab);
    dispatch(showOverlay());

    loadTabData(tab)
      .catch(() => {
        if (tab === "SAVED") {
          setShowList(jobList.filter((job) => (profile?.savedJobs || []).includes(job.id)));
          return;
        }

        setShowList(jobList.filter((job) => hasApplicantStatus(job, user?.id, tab)));
      })
      .finally(() => dispatch(hideOverlay()));
  };

  return {
    activeTab,
    showList,
    handleTabChange,
  };
}
