'use client';

import { Sparkles, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AITab() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 p-8">
      <div className="max-w-2xl text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-6 shadow-lg">
          <Sparkles className="h-10 w-10 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-slate-900 mb-3">
          AI Insights
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            BETA
          </span>
        </h2>

        {/* Description */}
        <p className="text-lg text-slate-600 mb-8">
          Unlock the power of AI to automatically analyze your data, generate insights, and suggest visualizations.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-3">
              <Lightbulb className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Auto Insights</h3>
            <p className="text-sm text-slate-600">
              Automatically discover patterns and anomalies in your data
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Smart Charts</h3>
            <p className="text-sm text-slate-600">
              Get AI-powered chart recommendations based on your data
            </p>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-3">
              <AlertCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">Natural Language</h3>
            <p className="text-sm text-slate-600">
              Ask questions about your data in plain English
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">
            <strong>🚧 Coming Soon:</strong> AI Insights is currently in development. We're building amazing features to help you understand your data better.
          </p>
          <Button variant="outline" size="sm" disabled>
            <Sparkles className="h-4 w-4 mr-2" />
            Join Waitlist
          </Button>
        </div>
      </div>
    </div>
  );
}
