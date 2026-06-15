import React, { useState, useEffect } from 'react';
import { analyticsApi, taskCleanupApi, batchApi } from '../services/tagService';

export const TaskCleanup: React.FC = () => {
  const [oldTasks, setOldTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [daysThreshold, setDaysThreshold] = useState(90);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const fetchOldTasks = async () => {
    try {
      setLoading(true);
      const tasks = await analyticsApi.getOldTasks(daysThreshold);
      setOldTasks(tasks);
    } catch (err) {
      console.error('Failed to fetch old tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOldTasks();
  }, [daysThreshold]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAll = () => {
    if (selectedTaskIds.length === oldTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(oldTasks.map(task => task.id));
    }
  };

  const deleteSelected = async () => {
    if (!confirm(`确定要删除选中的 ${selectedTaskIds.length} 个任务吗？`)) {
      return;
    }
    try {
      await batchApi.delete(selectedTaskIds);
      setActionMessage('删除成功！');
      setTimeout(() => setActionMessage(''), 3000);
      await fetchOldTasks();
      setSelectedTaskIds([]);
    } catch (err) {
      console.error('Failed to delete tasks:', err);
      setActionMessage('删除失败');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const rescheduleSelected = async () => {
    if (!newDeadline) {
      alert('请选择新的截止日期');
      return;
    }
    try {
      await taskCleanupApi.batchReschedule(selectedTaskIds, newDeadline);
      setActionMessage('重新安排成功！');
      setTimeout(() => setActionMessage(''), 3000);
      await fetchOldTasks();
      setSelectedTaskIds([]);
      setShowRescheduleModal(false);
      setNewDeadline('');
    } catch (err) {
      console.error('Failed to reschedule tasks:', err);
      setActionMessage('重新安排失败');
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          🧹 任务清理
        </h2>
        <div className="flex items-center gap-4">
          <label className="text-gray-600 dark:text-gray-300">
            显示超过
          </label>
          <select
            value={daysThreshold}
            onChange={(e) => setDaysThreshold(Number(e.target.value))}
            className="p-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={180}>180</option>
            <option value={365}>365</option>
          </select>
          <label className="text-gray-600 dark:text-gray-300">
            天的任务
          </label>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-green-100 text-green-800 rounded dark:bg-green-900 dark:text-green-200">
          {actionMessage}
        </div>
      )}

      {oldTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">✨</div>
          <div className="text-gray-600 dark:text-gray-400">
            太棒了！没有超过 {daysThreshold} 天的旧任务
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTaskIds.length === oldTasks.length && oldTasks.length > 0}
                onChange={selectAll}
                className="w-4 h-4"
              />
              <span className="text-gray-700 dark:text-gray-300">
                全选
              </span>
            </label>
            <span className="text-gray-600 dark:text-gray-400">
              {selectedTaskIds.length}/{oldTasks.length}
            </span>
            {selectedTaskIds.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  重新安排
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    任务
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    创建天数
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    状态
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {oldTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {task.content}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {task.age_days} 天
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        task.status === 'overdue' 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }>
                        {task.status === 'overdue' ? '逾期' : '进行中'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
              重新安排任务
            </h3>
            <div className="mb-4">
              <label className="block mb-2 text-gray-700 dark:text-gray-300">
                新的截止日期
              </label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRescheduleModal(false);
                  setNewDeadline('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={rescheduleSelected}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
