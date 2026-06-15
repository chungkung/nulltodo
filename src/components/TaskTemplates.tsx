import React, { useState, useEffect } from 'react';
import { templateApi, TaskTemplate } from '../services/tagService';

interface TaskTemplatesProps {
  onTemplateUsed?: () => void;
}

export const TaskTemplates: React.FC<TaskTemplatesProps> = ({ onTemplateUsed }) => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    priority: 'medium',
    estimated_hours: 1,
    icon: '',
  });
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      const data = await templateApi.getAll();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await templateApi.update(editing.id, formData);
      } else {
        await templateApi.create(formData);
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        content: '',
        priority: 'medium',
        estimated_hours: 1,
        icon: '',
      });
      fetchTemplates();
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: TaskTemplate) => {
    setEditing(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      priority: template.priority,
      estimated_hours: template.estimated_hours || 1,
      icon: template.icon || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    try {
      await templateApi.delete(id);
      fetchTemplates();
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const handleUse = async (template: TaskTemplate) => {
    try {
      await templateApi.use(template.id);
      if (onTemplateUsed) onTemplateUsed();
      alert('任务创建成功！');
    } catch (err) {
      console.error('Failed to use template:', err);
    }
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">任务模板</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + 新建模板
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            {template.icon && (
              <div className="text-2xl mb-2">{template.icon}</div>
            )}
            <h3 className="font-medium text-gray-800 dark:text-white">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {template.description}
              </p>
            )}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {template.content}
            </p>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className={getPriorityColor(template.priority)}>
                  {template.priority}
                </span>
                <span className="text-gray-500 ml-2">
                  {template.estimated_hours}小时
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleUse(template)}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  使用
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无任务模板
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              {editing ? '编辑' : '新建'}模板
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">模板名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">图标（可选）</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="例如: 📝"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">描述（可选）</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  rows={2}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 text-gray-800 dark:text-white">任务内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
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
                <div>
                  <label className="block mb-2 text-gray-800 dark:text-white">预估工时</label>
                  <input
                    type="number"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) })}
                    min={0.5}
                    step={0.5}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
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