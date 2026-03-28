import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { CandidateProfile } from '../../types';
import { candidateService } from '../../services/candidateService';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    candidateService
      .getMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setUploading(true);
    setMessage(null);
    try {
      const updated = await candidateService.uploadResume(resumeFile);
      setProfile(updated);
      setMessage('Resume uploaded successfully!');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading profile…</p>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Candidate Dashboard</h1>
        <button onClick={logout}>Sign Out</button>
      </div>
      <p>
        <strong>Email:</strong> {user?.email}
      </p>

      {profile ? (
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
          <h2>My Profile</h2>
          <p>
            <strong>Bio:</strong> {profile.bio || '—'}
          </p>
          <p>
            <strong>Location:</strong> {profile.location || '—'}
          </p>
          <p>
            <strong>Skills:</strong> {profile.skills || '—'}
          </p>
          {profile.resumeOriginalFilename && (
            <p>
              <strong>Resume:</strong> {profile.resumeOriginalFilename}
            </p>
          )}
        </div>
      ) : (
        <p>No profile yet. Create one to start applying!</p>
      )}

      <div style={{ marginTop: 24 }}>
        <h2>Upload / Replace Resume</h2>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={handleResumeUpload}
          disabled={!resumeFile || uploading}
          style={{ marginLeft: 8 }}
        >
          {uploading ? 'Uploading…' : 'Upload Resume'}
        </button>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
