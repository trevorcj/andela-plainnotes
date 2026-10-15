import Link from 'next/link';
export default function Forbidden(){return <main className="onboarding"><h1>Access restricted</h1><p>This area requires an administrator account.</p><Link className="btn" href="/app">Return to your workspace</Link></main>}
