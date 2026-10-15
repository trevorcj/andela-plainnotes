import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogItem, savedIds, type University } from '@/lib/catalog';
import { PageHead } from '@/components/catalog';
import { SourcePanel } from '@/components/source-panel';
import { SaveButton } from '@/components/save-button';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const u = (await catalogItem('universities', slug)) as University | null;
  if (!u) notFound();
  const saved = await savedIds();

  return (
    <>
      <Link className="back-link" href="/app/universities">
        ← All universities
      </Link>
      <PageHead title={u.name} copy={`${u.state} State · ${u.institution_type}`}>
        <SaveButton kind="universities" id={u.id} saved={saved.has(u.id)} />
      </PageHead>
      <div className="detail-layout">
        <section className="panel">
          <h2>Explore the institution</h2>
          <p>{u.description}</p>
          <a className="btn" href={u.website} target="_blank" rel="noopener noreferrer">
            Visit official website ↗
          </a>
          <h3 style={{ marginTop: 30 }}>What to check before applying</h3>
          <div className="requirements">
            <div>Course availability and NUC accreditation</div>
            <div>Current JAMB cut-off benchmarks and deadlines</div>
            <div>Tuition, accommodation and additional costs</div>
            <div>Facilities, student support and campus community</div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link className="btn outline" href={`/app/universities/compare?ids=${u.id}`}>
              Compare this university
            </Link>
          </div>
        </section>
        <aside>
          <SourcePanel source={u.sources} />
        </aside>
      </div>
    </>
  );
}
