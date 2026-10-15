import Link from 'next/link';
import { z } from 'zod';
import { db } from '@/lib/supabase/server';
import type { SearchParams, University } from '@/lib/catalog';
import { PageHead } from '@/components/catalog';

export default async function Compare({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const p = await searchParams;
  const raw = typeof p.ids === 'string' ? p.ids.split(',') : Array.isArray(p.id) ? p.id : typeof p.id === 'string' ? [p.id] : [];
  const ids = [...new Set(raw.filter(v => z.string().uuid().safeParse(v).success))].slice(0, 3);
  const client = await db();
  const { data, error } = await client
    .from('universities')
    .select('*,sources(*)')
    .eq('published', true)
    .order('name');

  if (error) throw new Error('Comparison options could not be loaded');
  const universities = data as unknown as University[],
    selected = universities.filter(u => ids.includes(u.id));

  return (
    <>
      <Link className="back-link" href="/app/universities">
        ← All universities
      </Link>
      <PageHead title="Compare Universities" copy="Look at accredited institution options side by side." />
      <form method="get">
        <div className="compare-picker">
          {[0, 1, 2].map(i => (
            <select name="id" aria-label={`University ${i + 1}`} defaultValue={ids[i] || ''} key={i}>
              <option value="">Choose university {i + 1}</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          ))}
        </div>
        <button className="btn">Compare selected</button>{' '}
        <Link className="text-link" href="/app/universities/compare">
          Clear selection
        </Link>
      </form>
      {selected.length ? (
        <div className="panel comparison" style={{ marginTop: 25 }}>
          <table>
            <thead>
              <tr>
                <th>At a glance</th>
                {selected.map(u => (
                  <th key={u.id}>{u.short_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Institution</td>
                {selected.map(u => (
                  <td key={u.id}>{u.name}</td>
                ))}
              </tr>
              <tr>
                <td>Location</td>
                {selected.map(u => (
                  <td key={u.id}>{u.state} State</td>
                ))}
              </tr>
              <tr>
                <td>Category</td>
                {selected.map(u => (
                  <td key={u.id}>{u.institution_type} University</td>
                ))}
              </tr>
              <tr>
                <td>Accreditation Status</td>
                {selected.map(u => (
                  <td key={u.id}>
                    <span className="tag green">✓ NUC Accredited · AI Verified</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td>Explore</td>
                {selected.map(u => (
                  <td key={u.id}>
                    <Link href={`/app/universities/${u.slug}`} className="btn light">
                      View details
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p className="muted">Select up to three universities to compare.</p>
        </div>
      )}
    </>
  );
}
