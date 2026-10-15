import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogItem, savedIds, type Career } from '@/lib/catalog';
import { PageHead } from '@/components/catalog';
import { SourcePanel } from '@/components/source-panel';
import { SaveButton } from '@/components/save-button';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = (await catalogItem('careers', slug)) as Career | null;
  if (!c) notFound();
  const saved = await savedIds();

  return (
    <>
      <Link className="back-link" href="/app/careers">
        ← All career paths
      </Link>
      <PageHead title={c.name} copy={c.field}>
        <SaveButton kind="careers" id={c.id} saved={saved.has(c.id)} />
      </PageHead>
      <div className="detail-layout">
        <section className="panel">
          <h2>Explore the path</h2>
          <p>{c.description}</p>
          <h3 style={{ marginTop: 25 }}>Core competencies to develop</h3>
          <div className="filters">
            {c.skills.map(s => (
              <span className="tag" key={s}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 24 }}>
            <Link className="btn outline" href="/app/courses">
              Explore degree pathways
            </Link>
          </div>
        </section>
        <aside>
          <SourcePanel source={c.sources} />
        </aside>
      </div>
    </>
  );
}
