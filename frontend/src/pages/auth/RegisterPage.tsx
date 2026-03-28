import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'EMPLOYER'>('CANDIDATE');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ name, email, password, role });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Create Account</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 8, fontSize: 16 }}
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ padding: 8, fontSize: 16 }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'CANDIDATE' | 'EMPLOYER')}
          style={{ padding: 8, fontSize: 16 }}
        >
          <option value="CANDIDATE">Candidate (Job Seeker)</option>
          <option value="EMPLOYER">Employer (Company)</option>
        </select>
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: 10, fontSize: 16 }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}
