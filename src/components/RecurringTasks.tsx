import React, { useState, useEffect } from 'react';
import { recurringTaskApi, RecurringTask } from '../services/tagService';

interface RecurringTasksProps {
  onTaskGenerated?: () => void;
}

export const RecurringTasks: React.FC<RecurringTasksProps> = ({ onTaskGenerated }) => {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTask | null>(null);
  const [formData, setFormData] = useState({
    content: '',
    priority: 'medium',
    recurrence_rule: 'daily 1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await recurringTaskApi.getAll();
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch recurring tasks:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await recurringTaskApi.update(editing.id, formData);
      } else {
        await recurringTaskApi.create(formData);
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormData({
        content: '',
        priority: 'medium',
        recurrence_rule: 'daily 1',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
      });
      fetchTasks();
    } catch (err) {
      console.error('Failed to save recurring task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: RecurringTask) => {
    setEditing(task);
    setFormData({
      content: task.content,
      priority: task.priority,
      recurrence_rule: task.recurrence_rule,
      start_date: task.start_date.split('T')[0],
      end_date: task.end_date ? task.end_date.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个周期性任务吗？')) return;
    try {
      await recurringTaskApi.delete(id);
      fetchTasks();
    } catch (err) {
      console.error('Failed to delete recurring task:', err);
    }
  };

  const handleGenerate = async () => {
    try {
      await recurringTaskApi.generate();
      if (onTaskGenerated) onTaskGenerated();
      alert('任务生成成功！');
      fetchTasks();
    } catch (err) {
      console.error('Failed to generate tasks:', err);
    }
  };

  const getRecurrenceDisplay = (rule: string) => {
    if (rule.includes('daily')) return '每天';
    if (rule.includes('weekly')) return '每周';
    if (rule.includes('monthly')) return '每月';
    if (rule.includes('yearly')) return '每年';
    return rule;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">周期性任务</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            生成任务
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            + 新建
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800 dark:text-white">{task.content}</h3>
                <p className={`text-sm ${getPriorityColor(task.priority)}`}>
                  优先级: {task.priority}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  重复: {getRecurrenceDisplay(task.recurrence_rule)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  开始: {task.start_date.split('T')[0]}
                  {task.end_date && ` 结束: ${task.end_date.split('T')[0]}`}
                </p>
                {task.last_generated && (
                  <p className="text-sm text-gray-500">
                    上次生成: {new Date(task.last_generated).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            暂无周期性任务
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {editing ? '编辑' : '新建'}周期性任务
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">任务内容</label>
                <input
                  type="text"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">重复规则</label>
                <select
                  value={formData.recurrence_rule}
                  onChange={(e) => setFormData({ ...formData, recurrence_rule: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="daily 1">每天</option>
                  <option value="weekly 1">每周</option>
                  <option value="monthly 1">每月</option>
                  <option value="yearly 1">每年</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">开始日期</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">结束日期（可选）</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditing(null);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};