import Link from 'next/link';
import { ArrowRight, Landmark, Briefcase } from 'lucide-react';
import { SourcePanel } from './source-panel';
import { SaveButton } from './save-button';
import type { Course, University, Career, SearchParams } from '@/lib/catalog';
import { fields, listParams } from '@/lib/catalog';

export function PageHead({
  title,
  copy,
  children
}: {
  title: string;
  copy: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h1>
        <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
          {copy}
        </p>
      </div>
      {children}
    </div>
  );
}

export function Filters({
  kind,
  params
}: {
  kind: 'courses' | 'universities' | 'careers';
  params: SearchParams;
}) {
  const p = listParams(params);
  return (
    <form className="filter-form" method="get">
      <input
        type="search"
        name="q"
        aria-label={`Search ${kind}`}
        placeholder={`Search ${kind} by name or keywords…`}
        defaultValue={p.q}
        maxLength={100}
      />
      {kind === 'universities' ? (
        <>
          <select name="type" aria-label="Institution type" defaultValue={p.type}>
            <option value="">All institution types</option>
            {['Federal', 'State', 'Private'].map(t => (
              <option key={t} value={t}>
                {t} University
              </option>
            ))}
          </select>
          <select name="state" aria-label="State location" defaultValue={p.state}>
            <option value="">All Nigerian States</option>
            {[
              'Delta',
              'Edo',
              'Ekiti',
              'Enugu',
              'Imo',
              'Kaduna',
              'Kano',
              'Kwara',
              'Lagos',
              'Niger',
              'Ogun',
              'Ondo',
              'Osun',
              'Oyo',
              'Plateau',
              'Rivers'
            ].map(s => (
              <option key={s} value={s}>
                {s} State
              </option>
            ))}
          </select>
        </>
      ) : (
        <select name="field" aria-label="Field" defaultValue={p.field}>
          <option value="">All academic fields</option>
          {fields.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      )}
      <button className="btn">Find options</button>
      <Link className="text-link" href={`/app/${kind}`} style={{ fontSize: 13 }}>
        Reset
      </Link>
    </form>
  );
}

export function Pagination({
  kind,
  params,
  page,
  count
}: {
  kind: string;
  params: SearchParams;
  page: number;
  count: number;
}) {
  const PAGE_SIZE = 24;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function url(p: number) {
    const q = new URLSearchParams();
    for (const k of ['q', 'field', 'type', 'state']) {
      if (typeof params[k] === 'string') q.set(k, params[k] as string);
    }
    q.set('page', String(p));
    return `/app/${kind}?${q}`;
  }

  if (totalPages <= 1) {
    return (
      <div className="pagination" style={{ justifyContent: 'center', marginTop: 32 }}>
        <span className="muted">
          Showing {count} {kind}
        </span>
      </div>
    );
  }

  return (
    <div className="pagination" style={{ marginTop: 32 }}>
      {page > 1 ? (
        <Link href={url(page - 1)} className="text-link">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="muted">
        Page {page} of {totalPages} ({count} total)
      </span>
      {page < totalPages ? (
        <Link href={url(page + 1)} className="text-link">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

export function CourseCard({ course: c, saved }: { course: Course; saved: boolean }) {
  return (
    <article className="course-card">
      {c.image_url && (
        <Link href={`/app/courses/${c.slug}`}>
          <img src={c.image_url} alt={c.name} loading="lazy" />
        </Link>
      )}
      <div className="course-body">
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '2px 0 16px' }}>
          {c.field}
        </p>
        <div className="row">
          <Link className="btn outline sm" href={`/app/courses/${c.slug}`}>
            View details <ArrowRight size={14} />
          </Link>
          <SaveButton kind="courses" id={c.id} saved={saved} />
        </div>
      </div>
    </article>
  );
}

export function UniversityCard({
  university: u,
  saved
}: {
  university: University;
  saved: boolean;
}) {
  return (
    <article className="university-card">
      <span className="university-logo">
        <Landmark size={20} />
      </span>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>
          {u.name} ({u.short_name})
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '2px 0 6px' }}>
          {u.state} State · {u.institution_type} University
        </p>
      </div>
      <div className="actions">
        <SaveButton kind="universities" id={u.id} saved={saved} />
        <Link className="btn outline sm" href={`/app/universities/${u.slug}`}>
          View details <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}

export function CareerCard({ career: c, saved }: { career: Career; saved: boolean }) {
  return (
    <article className="panel">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: 'var(--secondary)',
          border: '1px solid var(--border)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--foreground)'
        }}
      >
        <Briefcase size={18} />
      </div>
      <h2 style={{ fontSize: 16, fontWeight: 600, margin: '14px 0 6px' }}>{c.name}</h2>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
        {c.description}
      </p>
      <div className="row">
        <Link href={`/app/careers/${c.slug}`} className="btn outline sm">
          Explore path <ArrowRight size={14} />
        </Link>
        <SaveButton kind="careers" id={c.id} saved={saved} />
      </div>
    </article>
  );
}

export function EmptyResults() {
  return (
    <div className="panel empty-state">
      <h2 style={{ fontSize: 16, fontWeight: 600 }}>No matching options found</h2>
      <p className="muted" style={{ maxWidth: 400, margin: '6px auto 0', fontSize: 13 }}>
        Try searching with different keywords, selecting 'All fields', or clearing your active filters.
      </p>
    </div>
  );
}
