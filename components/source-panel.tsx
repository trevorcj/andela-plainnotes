import { CheckCircle2, Sparkles } from 'lucide-react';
import type { Source } from '@/lib/catalog';

export function SourcePanel({
  source,
  compact = false
}: {
  source?: Source | null;
  compact?: boolean;
}) {
  return (
    <div
      className="panel"
      style={{
        padding: compact ? '10px 14px' : '16px 20px',
        borderRadius: 8,
        background: '#fafafa',
        border: '1px solid #e4e4e7'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: compact ? 2 : 6 }}>
        <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#09090b' }}>
          AI Verified Curriculum · 2026/2027
        </span>
      </div>
      {!compact && (
        <p style={{ margin: 0, fontSize: 12, color: '#71717a', lineHeight: 1.5 }}>
          Curriculum benchmarks, JAMB combinations, and career demand validated continuously by Pathwise AI against accredited Nigerian tertiary standards.
        </p>
      )}
    </div>
  );
}
