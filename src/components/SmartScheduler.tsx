import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { ScheduleInsight, PriorityAdjustment } from '@/types';

const SmartScheduler: React.FC = () => {
  const [insights, setInsights] = useState<ScheduleInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await api.getSmartSchedulerInsights();
      if (response.success && response.data) {
        setInsights(response.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPriority = async (adjustment: PriorityAdjustment) => {
    try {
      const response = await api.adjustPriority(adjustment.id, adjustment.suggested_priority);
      if (response.success) {
        setMessage({ type: 'success', text: '优先级已更新！' });
        fetchInsights();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: '更新失败' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 安全访问数组
  const conflicts = insights?.conflicts || [];
  const priorityAdjustments = insights?.priority_adjustments || [];
  const suggestions = insights?.suggestions || [];
  const hasAnyContent = conflicts.length > 0 || priorityAdjustments.length > 0 || suggestions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">智能任务调度</h2>
        <button
          onClick={fetchInsights}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          刷新分析
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {insights && (
        <>
          {/* Summary */}
          {insights.summary && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 调度概览</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded shadow-sm">
                  <div className="text-sm text-gray-600">待处理任务</div>
                  <div className="text-2xl font-bold text-gray-900">{insights.summary.pending_tasks || 0}</div>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <div className="text-sm text-gray-600">总冲突数</div>
                  <div className="text-2xl font-bold text-gray-900">{insights.summary.total_conflicts || 0}</div>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <div className="text-sm text-gray-600">高严重性冲突</div>
                  <div className="text-2xl font-bold text-red-600">{insights.summary.high_severity_conflicts || 0}</div>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <div className="text-sm text-gray-600">优先级建议</div>
                  <div className="text-2xl font-bold text-blue-600">{insights.summary.priority_suggestions_count || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className={`border rounded-lg p-6 ${getSeverityColor(conflicts[0]?.severity || 'low')}`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ 任务冲突提醒</h3>
              <div className="space-y-3">
                {conflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-md shadow-sm">
                    <p className="text-gray-700 font-medium">
                      <span className="px-2 py-1 rounded-full text-xs mr-2"
                        style={{ backgroundColor: conflict.severity === 'high' ? '#fee2e2' : conflict.severity === 'medium' ? '#fef3c7' : '#dbeafe' }}>
                        {conflict.severity?.toUpperCase() || 'LOW'}
                      </span>
                      {conflict.type || '任务冲突'}
                    </p>
                    {conflict.time_diff_hours != null && (
                      <p className="text-sm text-gray-600">时间差: {conflict.time_diff_hours.toFixed(1)}小时</p>
                    )}
                    <div className="mt-2 space-y-1 text-sm">
                      {conflict.tasks?.map((task, taskIdx) => (
                        <div key={taskIdx} className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority || 'medium')}`}>
                            {task.priority || 'medium'}
                          </span>
                          <span>{task.content || '未知任务'}</span>
                          {task.deadline && (
                            <span className="text-gray-500 text-xs">
                              ({new Date(task.deadline).toLocaleDateString()})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Priority Adjustments */}
          {priorityAdjustments.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">📊 优先级调整建议</h3>
              <div className="space-y-3">
                {priorityAdjustments.map((adjustment, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">任务 #{adjustment.id}</p>
                        <p className="text-sm text-gray-600 mt-1">{adjustment.reason || '需要调整优先级'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(adjustment.current_priority || 'medium')}`}>
                            当前: {adjustment.current_priority || 'medium'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(adjustment.suggested_priority || 'medium')}`}>
                            建议: {adjustment.suggested_priority || 'medium'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApplyPriority(adjustment)}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        应用
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Order */}
          {suggestions.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">💡 任务执行顺序建议</h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-md shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm">
                        {suggestion.order || idx + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{suggestion.content || '未知任务'}</p>
                        <p className="text-sm text-gray-600">{suggestion.reason || '建议先执行'}</p>
                        {suggestion.score != null && (
                          <p className="text-xs text-gray-500 mt-1">评分: {suggestion.score.toFixed(2)}</p>
                        )}
                      </div>
                      {suggestion.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasAnyContent && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">✨ 任务安排非常合理！</p>
              <p className="text-sm mt-2">没有发现冲突或需要调整的地方</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SmartScheduler;
