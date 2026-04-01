import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { resetFilter } from "../../store/slices/FilterSlice";
import { hideOverlay, showOverlay } from "../../store/slices/OverlaySlice";
import { resetSort } from "../../store/slices/SortSlice";
import { getAllJobs } from "../../services/job-service";
import type { FindJobsFilters, JobListItem, SortOption } from "./types";

function matchesAny(value: string | undefined, terms?: string[]) {
  if (!terms || terms.length === 0) {
    return true;
  }
  const normalized = (value ?? "").toLowerCase();
  return terms.some((term) => normalized.includes(String(term).toLowerCase()));
}

function bySort(sort: SortOption | undefined) {
  if (sort === "Most Recent") {
    return (a: JobListItem, b: JobListItem) => new Date(b.postTime ?? "").getTime() - new Date(a.postTime ?? "").getTime();
  }
  if (sort === "Salary: Low to High") {
    return (a: JobListItem, b: JobListItem) => (a.packageOffered ?? 0) - (b.packageOffered ?? 0);
  }
  if (sort === "Salary: High to Low") {
    return (a: JobListItem, b: JobListItem) => (b.packageOffered ?? 0) - (a.packageOffered ?? 0);
  }
  return undefined;
}

export function useJobsController() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector((state) => (state.filter ?? {}) as FindJobsFilters);
  const sort = useAppSelector((state) => state.sort as SortOption | undefined);
  const [jobList, setJobList] = useState<JobListItem[]>([]);

  useEffect(() => {
    let active = true;

    dispatch(resetSort());
    dispatch(showOverlay());

    getAllJobs()
      .then((res) => {
        if (!active) {
          return;
        }
        const jobs = Array.isArray(res) ? (res as JobListItem[]) : [];
        setJobList(jobs.filter((job) => String(job.jobStatus ?? "").toUpperCase() === "ACTIVE"));
      })
      .catch(() => {
        if (active) {
          setJobList([]);
        }
      })
      .finally(() => {
        if (active) {
          dispatch(hideOverlay());
        }
      });

    return () => {
      active = false;
      if (!filter.page) {
        dispatch(resetFilter());
      }
    };
  }, [dispatch]);

  const sortedJobs = useMemo(() => {
    const comparator = bySort(sort);
    if (!comparator) {
      return jobList;
    }
    return [...jobList].sort(comparator);
  }, [jobList, sort]);

  const filteredJobs = useMemo(() => {
    return sortedJobs.filter((job) => {
      const salaryRange = filter.salary;
      const salary = job.packageOffered ?? 0;

      const salaryOk = !salaryRange || salaryRange.length < 2 || (salaryRange[0] <= salary && salary <= salaryRange[1]);

      return (
        matchesAny(job.jobTitle, filter["Job Title"]) &&
        matchesAny(job.location, filter.Location) &&
        matchesAny(job.experience, filter.Experience) &&
        matchesAny(job.jobType, filter["Job Type"]) &&
        salaryOk
      );
    });
  }, [sortedJobs, filter]);

  return {
    dispatch,
    filter,
    filteredJobs,
  };
}
