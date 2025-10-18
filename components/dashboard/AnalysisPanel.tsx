'use client';

import { AlertCircle, Check, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalysisPanelProps {
  totalRows: number;
  filteredRows: number;
}

export function AnalysisPanel({ totalRows, filteredRows }: AnalysisPanelProps) {
  // Placeholder - will be enhanced later
  const duplicates = 0;
  const nullPercentage = 0;
  const outliers = 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-slate-900">Quick Analysis</h3>

      {/* Stats Cards */}
      <div className="space-y-3">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Duplicates</span>
            {duplicates === 0 ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900">{duplicates}</div>
          <div className="text-xs text-slate-500 mt-1">
            {duplicates === 0 ? 'No duplicates found' : 'duplicates detected'}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Null Values</span>
            {nullPercentage === 0 ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900">{nullPercentage}%</div>
          <div className="text-xs text-slate-500 mt-1">of all values</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-600">Outliers</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{outliers}</div>
          <div className="text-xs text-slate-500 mt-1">statistical outliers</div>
        </div>
      </div>

      {/* Action Button */}
      <Button variant="outline" size="sm" className="w-full" disabled>
        <TrendingUp className="h-4 w-4 mr-2" />
        Run Full Analysis
      </Button>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Coming soon:</strong> Advanced data analysis with charts and insights.
        </p>
      </div>
    </div>
  );
}
