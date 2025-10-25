import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Eye, Calendar, FileSpreadsheet, Filter } from 'lucide-react';
import { IView, ViewType } from '@/types/database';
import { IFilterConfig } from '@/types';

interface PublicViewPageProps {
  params: {
    publicLinkId: string;
  };
}

async function getPublicView(publicLinkId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/public/view/${publicLinkId}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function PublicViewPage({ params }: PublicViewPageProps) {
  const result = await getPublicView(params.publicLinkId);

  if (!result || !result.success) {
    notFound();
  }

  const { view, data, message } = result;
  const isSnapshot = view.view_type === 'snapshot';
  const filterConfig: IFilterConfig = view.filter_config;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isSnapshot ? (
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                ) : (
                  <Filter className="h-8 w-8 text-purple-600" />
                )}
                <h1 className="text-3xl font-bold text-slate-900">{view.name}</h1>
              </div>
              {view.description && (
                <p className="text-slate-600 text-lg mb-4">{view.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created {new Date(view.created_at).toLocaleDateString('it-IT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{view.access_count} {view.access_count === 1 ? 'view' : 'views'}</span>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {isSnapshot ? 'Snapshot View' : 'Filter Template'}
                </div>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isSnapshot && data ? (
          // Snapshot View - Display Data Table
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                Snapshot Data ({data.length} {data.length === 1 ? 'row' : 'rows'})
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                This is a saved snapshot of filtered data from {new Date(view.created_at).toLocaleDateString('it-IT')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      {Object.values(row).map((value: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-4 py-3 text-sm text-slate-900">
                          {value !== null && value !== undefined ? String(value) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Filter Template View
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <Filter className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-purple-900 mb-2">Filter Template</h2>
                  <p className="text-purple-800 mb-4">{message}</p>

                  {view.session_id ? (
                    <div className="space-y-3">
                      <p className="text-sm text-purple-700">
                        This view is linked to a specific data file. Click below to open the file with these filters applied.
                      </p>
                      <Link
                        href={`/app/workspace/default/session/${view.session_id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Open Session with Filters
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-purple-700">
                      This is a reusable filter template. Upload your own data file and apply these filters to it.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Configuration Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Filter Configuration</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-700">Combinator:</span>
                  <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-800 rounded text-sm font-mono">
                    {filterConfig.combinator}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-700">Filters:</span>
                  <div className="mt-2 space-y-2">
                    {filterConfig.filters.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No filters configured</p>
                    ) : (
                      filterConfig.filters.map((filter: any, idx: number) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200">
                          {filter.type === 'group' ? (
                            <div className="text-sm">
                              <span className="font-medium text-slate-700">Group:</span>
                              <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-mono">
                                {filter.combinator}
                              </span>
                              <span className="ml-2 text-slate-600">
                                ({filter.filters.length} {filter.filters.length === 1 ? 'filter' : 'filters'})
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <span className="font-medium text-slate-700">{filter.column}</span>
                              <span className="mx-2 text-slate-500">{filter.operator}</span>
                              <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border">
                                {filter.value}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-sm text-slate-500">
          <p>
            Powered by <span className="font-semibold text-slate-700">Magixcel</span> - Create your own views and share them with the world
          </p>
        </div>
      </div>
    </div>
  );
}
