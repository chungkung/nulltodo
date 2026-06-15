import React, { useState } from 'react';
import { Task } from '../types';

interface KanbanViewProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
}

type StatusColumn = 'pending' | 'in_progress' | 'completed';

interface Column {
  id: StatusColumn;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: 'pending', title: '待处理', color: 'bg-yellow-100 dark:bg-yellow-900' },
  { id: 'in_progress', title: '进行中', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'completed', title: '已完成', color: 'bg-green-100 dark:bg-green-900' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onUpdateTask }) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      onUpdateTask(draggedTask.id, { status: status as any });
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">看板视图</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className={`${column.color} rounded-lg p-4`}>
            <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-white">
              {column.title} ({getTasksByStatus(column.id).length})
            </h3>
            <div
              className="min-h-64 space-y-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className={`bg-white dark:bg-gray-700 p-4 rounded-lg shadow border-l-4 ${getPriorityColor(task.priority)} cursor-move hover:shadow-md transition-shadow`}
                >
                  <div className="font-medium text-gray-800 dark:text-white">
                    {task.content}
                  </div>
                  {task.estimated_hours && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      ⏱️ {task.estimated_hours}小时
                    </div>
                  )}
                  {task.deadline && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      📅 {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无任务
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
