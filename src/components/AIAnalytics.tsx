import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/tagService';
import { TrendChart } from './TrendChart';

export const AIAnalytics: React.FC = () => {
  const [procrastination, setProcrastination] = useState<any[]>([]);
  const [timeAccuracy, setTimeAccuracy] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [procrastinationData, timeAccuracyData, insightsData] = await Promise.all([
        analyticsApi.getProcrastination(),
        analyticsApi.getTimeAccuracy(30),
        analyticsApi.getInsights(30),
      ]);
      setProcrastination(procrastinationData);
      setTimeAccuracy(timeAccuracyData);
      setInsights(insightsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">AI 分析与洞察</h2>

      {insights?.recommendations && (
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">💡 智能建议</h3>
          <ul className="space-y-2">
            {insights.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            📊 拖延检测
          </h3>
          {procrastination.length > 0 ? (
            <div className="space-y-3">
              {procrastination.map((task, index) => {
                const getSeverityStyle = (severity: string) => {
                  switch (severity) {
                    case 'critical':
                      return 'border-red-700 bg-red-50 dark:bg-red-900/30';
                    case 'severe':
                      return 'border-red-500 bg-red-50 dark:bg-red-900/20';
                    case 'moderate':
                      return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
                    case 'mild':
                      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
                    default:
                      return 'border-gray-400 bg-gray-50 dark:bg-gray-900/20';
                  }
                };
                
                const getSeverityLabel = (severity: string) => {
                  switch (severity) {
                    case 'critical': return '严重';
                    case 'severe': return '紧急';
                    case 'moderate': return '中等';
                    case 'mild': return '轻微';
                    default: return '正常';
                  }
                };
                
                const getPriorityColor = (priority: string) => {
                  switch (priority) {
                    case 'urgent': return 'text-red-600 dark:text-red-400';
                    case 'high': return 'text-orange-600 dark:text-orange-400';
                    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
                    default: return 'text-gray-600 dark:text-gray-400';
                  }
                };
                
                return (
                  <div key={index} className={`border-l-4 pl-3 py-2 rounded-r ${getSeverityStyle(task.severity)}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-gray-800 dark:text-white">
                        {task.content}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        task.severity === 'critical' ? 'bg-red-600 text-white' :
                        task.severity === 'severe' ? 'bg-red-500 text-white' :
                        task.severity === 'moderate' ? 'bg-orange-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {getSeverityLabel(task.severity)}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        📅 拖延: {task.delay_days} 天
                      </span>
                      {task.priority && (
                        <span className={getPriorityColor(task.priority)}>
                          优先级: {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <div className="text-4xl mb-2">✨</div>
              <div>暂无拖延！情况非常良好！</div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            ⏰ 时间预估准确度
          </h3>
          {timeAccuracy?.tasks?.length > 0 ? (
            <div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-blue-500">
                  {((1 - timeAccuracy.avg_error_rate) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  平均时间预估准确度
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {timeAccuracy.tasks.slice(0, 5).map((task: any, index: number) => (
                  <div key={index} className="border-b pb-2">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {task.content}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      预估: {task.estimated}h / 实际: {task.actual.toFixed(1)}h
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              暂无足够数据
            </div>
          )}
        </div>
      </div>

      {insights?.insights && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            📈 效率洞察
          </h3>
          {insights.insights.best_day && (
            <div className="text-gray-700 dark:text-gray-300 mb-2">
              最佳效率日: <span className="font-medium">
                {insights.insights.best_day}
              </span>
              {insights.insights.max_daily_completed && (
                <span className="text-green-500 ml-2">
                  (最多完成 {insights.insights.max_daily_completed} 个任务)
                </span>
              )}
            </div>
          )}
          {insights.insights.by_priority && (
            <div className="mt-4">
              <div className="font-medium text-gray-800 dark:text-white mb-2">
                按优先级完成情况:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(insights.insights.by_priority).map(([key, value]) => (
                  <div key={key} className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <div className="font-bold">{key}</div>
                    <div className="text-sm">{value as number}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6">
        <TrendChart />
      </div>
    </div>
  );
};
