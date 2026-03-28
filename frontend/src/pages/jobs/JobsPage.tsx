import { useState, useEffect } from 'react';
import type { JobPosting, Page } from '../../types';
import { jobService } from '../../services/jobService';

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: Page<JobPosting> = await jobService.list({ keyword, page });
        if (!cancelled) {
          setJobs(data.content);
          setTotalPages(data.totalPages);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [keyword, page]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Job Postings</h1>

      <input
        type="search"
        placeholder="Search jobs…"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(0);
        }}
        style={{ width: '100%', padding: 8, marginBottom: 16, fontSize: 16 }}
      />

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && jobs.length === 0 && <p>No jobs found.</p>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {jobs.map((job) => (
          <li
            key={job.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: '0 0 4px' }}>{job.title}</h2>
            <p style={{ margin: '0 0 4px', color: '#555' }}>
              {job.location} · {job.employmentType} · {job.experienceLevel}
            </p>
            {job.salaryRange && (
              <p style={{ margin: '0 0 4px', color: '#007a5e' }}>{job.salaryRange}</p>
            )}
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
              Posted by {job.employer?.name} · Deadline: {job.deadline}
            </p>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
