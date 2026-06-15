import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { PersonalizedAnalytics } from '@/types';

const EnhancedAnalyticsComponent: React.FC = () => {
  const [analytics, setAnalytics] = useState<PersonalizedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.getPersonalizedAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number | undefined) => {
    if (hours === undefined || hours === null) return '0小时';
    if (hours === 0) return '0小时';
    if (hours < 1) return Math.round(hours * 60) + '分钟';
    return hours.toFixed(1) + '小时';
  };

  const formatNumber = (num: number | undefined, defaultValue: number = 0) => {
    return num !== undefined && num !== null ? num : defaultValue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const completionTrends = analytics?.completion_trends || analytics?.completion_rate_trends || [];
  const avgTime = analytics?.average_completion_time;
  const procrastination = analytics?.procrastination_patterns || analytics?.procrastination_analysis;
  const workingHabits = analytics?.working_habit_analysis || analytics?.working_habits;
  const recommendations = analytics?.recommendations || analytics?.summary?.insights || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">个性化数据分析</h2>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          刷新分析
        </button>
      </div>

      {analytics && (
        <>
          {/* Summary Score */}
          {analytics.summary && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">总体评分</h3>
                  <div className="text-4xl font-bold text-blue-600">
                    {Math.round(
                      analytics.summary.overall_score > 1 
                        ? analytics.summary.overall_score 
                        : analytics.summary.overall_score * 100
                    )}分
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">积极点</div>
                  <div className="text-lg font-semibold text-green-600">
                    {Array.isArray(analytics.summary.positive_points) 
                      ? analytics.summary.positive_points.length 
                      : 0}
                  </div>
                </div>
              </div>
              {analytics.summary.insights && analytics.summary.insights.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-semibold text-gray-700">洞察:</div>
                  {analytics.summary.insights.map((insight, idx) => (
                    <div key={idx} className="text-sm text-gray-600">• {insight}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">平均完成时间</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {formatHours(avgTime?.overall || avgTime?.average_completion_hours)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">最近完成率</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {completionTrends.length > 0 && completionTrends[completionTrends.length - 1]?.completion_rate !== undefined
                  ? Math.round(completionTrends[completionTrends.length - 1].completion_rate * 100) + '%'
                  : '0%'}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">拖延风险</div>
              <div className="text-2xl font-bold mt-1">
                {procrastination?.is_procrastinator ? (
                  <span className="text-red-600">较高</span>
                ) : (
                  <span className="text-green-600">正常</span>
                )}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">最佳工作时段</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {workingHabits?.best_hours && workingHabits.best_hours.length > 0
                  ? workingHabits.best_hours[0] + ':00'
                  : workingHabits?.best_hour + ':00' || '--'}
              </div>
            </div>
          </div>

          {/* Completion Trends */}
          {completionTrends.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 完成率趋势</h3>
              <div className="space-y-3">
                {completionTrends.slice(-7).map((trend, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{trend.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: Math.min((trend.completion_rate || 0) * 100, 100) + '%' }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm font-medium text-gray-900">
                      {Math.round((trend.completion_rate || 0) * 100)}% ({trend.completed}/{trend.total})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Completion Time by Priority */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⏱️ 各优先级平均耗时</h3>
              <div className="space-y-2">
                {avgTime?.by_priority || avgTime?.average_by_priority ? (
                  Object.entries(avgTime.by_priority || avgTime.average_by_priority || {}).map(([priority, hours]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className="text-gray-700">{priority}</span>
                      <span className="font-medium">{formatHours(hours)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">暂无数据</div>
                )}
              </div>
              {avgTime?.fastest_task !== undefined && avgTime?.slowest_task !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">最快: {formatHours(avgTime.fastest_task)}</span>
                    <span className="text-orange-600">最慢: {formatHours(avgTime.slowest_task)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Best Work Days */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 最佳工作日</h3>
              <div className="flex flex-wrap gap-2">
                {workingHabits?.best_days && workingHabits.best_days.length > 0 ? (
                  workingHabits.best_days.map((day, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {day}
                    </span>
                  ))
                ) : workingHabits?.best_weekday ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {workingHabits.best_weekday}
                  </span>
                ) : (
                  <div className="text-gray-500">暂无数据</div>
                )}
              </div>
              {workingHabits?.total_completed !== undefined && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    样本数: {workingHabits.total_completed} 个已完成任务
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Procrastination Analysis */}
          {procrastination && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ 拖延模式分析</h3>
              {procrastination.last_minute_rate !== undefined && procrastination.early_completion !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded shadow-sm">
                    <div className="text-sm text-gray-600">提前完成</div>
                    <div className="text-xl font-bold text-green-600">{procrastination.early_completion}</div>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <div className="text-sm text-gray-600">最后时刻</div>
                    <div className="text-xl font-bold text-orange-600">{procrastination.last_minute}</div>
                  </div>
                  <div className="bg-white p-4 rounded shadow-sm">
                    <div className="text-sm text-gray-600">拖延率</div>
                    <div className="text-xl font-bold text-red-600">
                      {Math.round((procrastination.last_minute_rate || 0) * 100)}%
                    </div>
                  </div>
                </div>
              )}
              {procrastination.average_completion_before_deadline_hours !== undefined && (
                <p className="text-sm text-yellow-800 mb-2">
                  平均在截止前 {formatHours(procrastination.average_completion_before_deadline_hours)} 完成
                </p>
              )}
              {procrastination.risk_tasks && procrastination.risk_tasks.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-yellow-800 mb-2">高风险任务:</h4>
                  <div className="space-y-1">
                    {procrastination.risk_tasks.slice(0, 3).map((task, idx) => (
                      <div key={idx} className="bg-yellow-100 p-2 rounded text-sm">
                        {task.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 个性化建议</h3>
              <ul className="space-y-2">
                {recommendations.slice(0, 5).map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="text-blue-800">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedAnalyticsComponent;
