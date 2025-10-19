import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Magi<span className="text-blue-600">Xcel</span>
          </Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
