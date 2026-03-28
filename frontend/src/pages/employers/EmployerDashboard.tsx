import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { EmployerProfile } from '../../types';
import { employerService } from '../../services/employerService';

export default function EmployerDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employerService
      .getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading profile…</p>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Employer Dashboard</h1>
        <button onClick={logout}>Sign Out</button>
      </div>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>

      {profile ? (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>{profile.companyName}</h2>
          <p>
            <strong>Industry:</strong> {profile.industry || '—'}
          </p>
          <p>
            <strong>Location:</strong> {profile.location || '—'}
          </p>
          <p>
            <strong>Website:</strong>{' '}
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noreferrer">
                {profile.website}
              </a>
            ) : (
              '—'
            )}
          </p>
          {profile.companyDescription && <p>{profile.companyDescription}</p>}
        </div>
      ) : (
        <p>No company profile yet. Fill in your company details to post jobs.</p>
      )}

      <div style={{ marginTop: 24 }}>
        <a href="/jobs">View / Manage Job Postings →</a>
      </div>
    </div>
  );
}
