import Link from 'next/link';
import { Feather } from 'lucide-react';

export function Brand() {
  return (
    <Link href="/app" className="brand">
      <span className="brand-mark">
        <Feather size={16} />
      </span>
      <span>PlainNotes</span>
    </Link>
  );
}
