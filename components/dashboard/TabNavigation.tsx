'use client';

import { Search, Layers, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type TabType = 'explorer' | 'views' | 'ai';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description: string;
  beta?: boolean;
}

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  viewCount?: number;
}

export function TabNavigation({ activeTab, onTabChange, viewCount }: TabNavigationProps) {
  const tabs: Tab[] = [
    {
      id: 'explorer',
      label: 'Explorer',
      icon: Search,
      description: 'Quick data exploration with live filters',
    },
    {
      id: 'views',
      label: 'Views',
      icon: Layers,
      badge: viewCount,
      description: 'Manage saved dashboard views',
    },
    {
      id: 'ai',
      label: 'AI Insights',
      icon: Sparkles,
      description: 'AI-powered data analysis',
      beta: true,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="px-6">
        <nav className="flex gap-1" aria-label="View tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3
                  text-sm font-medium transition-all duration-200
                  border-b-2 -mb-px
                  ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }
                `}
                title={tab.description}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.beta && (
                  <Badge
                    variant="outline"
                    className="ml-1.5 h-5 px-1.5 text-[10px] border-purple-300 text-purple-700 bg-purple-50"
                  >
                    BETA
                  </Badge>
                )}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge
                    variant={isActive ? 'default' : 'secondary'}
                    className="ml-1 h-5 px-1.5 text-xs"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
