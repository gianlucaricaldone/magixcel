import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Magi<span className="text-blue-600">Xcel</span>
          </Link>
          <div className="flex gap-4">
            <Link
              href="/app"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              My Files
            </Link>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
