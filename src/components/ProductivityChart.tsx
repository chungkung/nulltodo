import { useState, useEffect } from 'react';
import { productivityApi } from '@/services/tagService';

interface ProductivityChartProps {
  days?: number;
}

export default function ProductivityChart({ days = 7 }: ProductivityChartProps) {
  const [stats, setStats] = useState<{
    time_stats: { total_completed: number; total_duration: number; avg_duration: number };
    task_stats: { completed_tasks: number };
    daily_stats: { date: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await productivityApi.getStats(days);
      setStats(data);
    } catch (error) {
      console.error('Failed to load productivity stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0分钟';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}`;
    }
    return `${minutes}分钟`;
  };

  const getMaxCount = () => {
    if (!stats?.daily_stats || stats.daily_stats.length === 0) return 1;
    return Math.max(...stats.daily_stats.map(d => d.count), 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalCompleted = stats?.time_stats?.total_completed || 0;
  const taskStats = stats?.task_stats || { completed_tasks: 0 };
  const timeStats = stats?.time_stats || { total_completed: 0, total_duration: 0, avg_duration: 0 };
  const dailyStats = stats?.daily_stats || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">📊 效率分析</h3>
        <select
          value={days}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value !== days) {
              window.dispatchEvent(new CustomEvent('changeDays', { detail: value }));
            }
          }}
          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
        >
          <option value={7}>最近7天</option>
          <option value={14}>最近14天</option>
          <option value={30}>最近30天</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
          <div className="text-3xl font-bold">{taskStats.completed_tasks}</div>
          <div className="text-sm opacity-80 mt-1">完成任务数</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
          <div className="text-3xl font-bold">{formatDuration(timeStats.total_duration)}</div>
          <div className="text-sm opacity-80 mt-1">总投入时间</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white">
          <div className="text-3xl font-bold">{formatDuration(timeStats.avg_duration)}</div>
          <div className="text-sm opacity-80 mt-1">平均耗时</div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">每日完成任务数</h4>
        <div className="flex items-end gap-2 h-32">
          {dailyStats.map((day, index) => {
            const height = (day.count / getMaxCount()) * 100;
            const date = new Date(day.date);
            const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full flex flex-col items-center">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">{day.count}</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t-md transition-all duration-300"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
                <span className="text-xs text-gray-400">{weekday}</span>
              </div>
            );
          })}
          {dailyStats.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {totalCompleted > 0 && (
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">💡 效率洞察</h4>
          <div className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <p>• 你在过去{days}天内完成了{taskStats.completed_tasks}个任务</p>
            <p>• 总投入时间{formatDuration(timeStats.total_duration)}</p>
            <p>• 平均每个任务耗时{formatDuration(timeStats.avg_duration)}</p>
            {timeStats.avg_duration > 3600 && (
              <p>• 建议：单任务平均耗时较长，可考虑进一步拆分复杂任务</p>
            )}
            {dailyStats.length >= 3 && (() => {
              const recent = dailyStats.slice(-3);
              const avg = recent.reduce((a, b) => a + b.count, 0) / 3;
              const first = dailyStats.slice(0, Math.min(3, dailyStats.length));
              const prevAvg = first.reduce((a, b) => a + b.count, 0) / first.length;
              const trend = avg - prevAvg;
              if (trend > 0.5) {
                return <p key="trend-up">• 🎉 近3天效率明显提升，完成率提升{Math.round(trend)}个/天</p>;
              } else if (trend < -0.5) {
                return <p key="trend-down">• ⚠️ 近3天效率有所下降，注意保持专注</p>;
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
