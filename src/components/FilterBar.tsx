import { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { Task } from '@/types';
import { getPriorityLabel, getScenarioLabel, getStatusLabel } from '@/utils/task';

interface FilterBarProps {
  filters: {
    scenario: Task['scenario'] | 'all';
    priority: Task['priority'] | 'all';
    status: Task['status'] | 'all';
  };
  onChange: (filters: FilterBarProps['filters']) => void;
}

const scenarios: (Task['scenario'] | 'all')[] = ['all', 'work', 'study', 'life', 'side-project', 'social', 'general'];
const priorities: (Task['priority'] | 'all')[] = ['all', 'urgent', 'high', 'medium', 'low'];
const statuses: string[] = ['all', 'pending', 'in_progress', 'completed', 'overdue', 'postponed'];

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.scenario !== 'all' || filters.priority !== 'all' || filters.status !== 'all';

  const clearFilters = () => {
    onChange({ scenario: 'all', priority: 'all', status: 'all' });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">任务列表</h2>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              清除筛选
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-accent"></span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="glass-effect rounded-2xl p-6 border border-white/10 space-y-6 animate-fade-in">
          <div>
            <label className="block text-sm text-gray-400 mb-3">场景标签</label>
            <div className="flex flex-wrap gap-2">
              {scenarios.map(scenario => (
                <button
                  key={scenario}
                  onClick={() => onChange({ ...filters, scenario })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.scenario === scenario
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {scenario === 'all' ? '全部' : getScenarioLabel(scenario as Task['scenario'])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">优先级</label>
            <div className="flex flex-wrap gap-2">
              {priorities.map(priority => (
                <button
                  key={priority}
                  onClick={() => onChange({ ...filters, priority })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.priority === priority
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {priority === 'all' ? '全部' : getPriorityLabel(priority as Task['priority'])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">状态</label>
            <div className="flex flex-wrap gap-2">
              {statuses.map(status => (
                <button
                  key={status}
                  onClick={() => onChange({ ...filters, status })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filters.status === status
                      ? 'bg-accent text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {status === 'all' ? '全部' : getStatusLabel(status as Task['status'])}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
