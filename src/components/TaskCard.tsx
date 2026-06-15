import { Task } from '@/types';
import { CheckCircle, Clock, Calendar, Trash2, Split, Circle } from 'lucide-react';
import { getPriorityColor, getPriorityLabel, getScenarioColor, getScenarioLabel } from '@/utils/task';
import { formatDateTime, isOverdue } from '@/utils/date';
import { useTaskStore } from '@/stores/taskStore';
import { useState, useCallback } from 'react';

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
}

export default function TaskCard({ task, showActions = true }: TaskCardProps) {
  const deleteTaskFromStore = useTaskStore(state => state.deleteTask);
  const updateTaskStatusInStore = useTaskStore(state => state.updateTaskStatus);
  const splitTaskInStore = useTaskStore(state => state.splitTask);
  const updateSubtaskStatusInStore = useTaskStore(state => state.updateSubtaskStatus);

  const [expandedSubtasks, setExpandedSubtasks] = useState(false);
  const overdue = isOverdue(task.deadline) && task.status !== 'completed';

  const handleComplete = useCallback(() => {
    updateTaskStatusInStore(task.id, 'completed');
  }, [task.id, updateTaskStatusInStore]);

  const handleDelete = useCallback(() => {
    if (confirm('确定删除这个任务吗？')) {
      deleteTaskFromStore(task.id);
    }
  }, [task.id, deleteTaskFromStore]);

  const handleSplit = useCallback(() => {
    if (confirm('确定要拆解这个任务吗？')) {
      splitTaskInStore(task.id);
    }
  }, [task.id, splitTaskInStore]);

  const toggleSubtask = useCallback((subtaskId: string, currentStatus: boolean) => {
    if (task.status !== 'completed') {
      updateSubtaskStatusInStore(task.id, subtaskId, !currentStatus);
    }
  }, [task.id, task.status, updateSubtaskStatusInStore]);

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className={`glass-effect rounded-2xl p-5 border transition-all card-hover ${
      overdue ? 'border-red-500/50' : 'border-white/10'
    } ${task.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
            {task.content}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getScenarioColor(task.scenario)}`}>
              {getScenarioLabel(task.scenario)}
            </span>
            {task.estimated_hours > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                <Clock className="w-3 h-3 inline mr-1" />
                {task.estimated_hours}小时
              </span>
            )}
          </div>
        </div>

        {showActions && task.status !== 'completed' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleComplete}
              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              title="标记完成"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={handleSplit}
              className="p-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
              title="拆解任务"
            >
              <Split className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              title="删除任务"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {task.deadline && (
        <div className={`flex items-center gap-2 text-sm ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
          <Calendar className="w-4 h-4" />
          <span>{formatDateTime(task.deadline)}</span>
          {overdue && <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded">已逾期</span>}
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div
            className="flex items-center justify-between cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors select-none"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSubtasks(!expandedSubtasks);
            }}
          >
            <p className="text-xs text-gray-500">
              子任务 ({completedSubtasks}/{totalSubtasks})
              {completedSubtasks === totalSubtasks && totalSubtasks > 0 && (
                <span className="ml-2 text-green-400">✓ 已全部完成</span>
              )}
            </p>
            <span className="text-xs text-gray-500">
              {expandedSubtasks ? '收起 ↑' : '展开 ↓'}
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {(expandedSubtasks ? task.subtasks : task.subtasks.slice(0, 3)).map((subtask, index) => (
              <div
                key={subtask.id || index}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  task.status !== 'completed'
                    ? 'hover:bg-white/5 cursor-pointer'
                    : ''
                } ${subtask.completed ? 'opacity-60' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (task.status !== 'completed') {
                    toggleSubtask(subtask.id, subtask.completed);
                  }
                }}
              >
                {subtask.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${
                  subtask.completed
                    ? 'text-gray-500 line-through'
                    : 'text-gray-300'
                }`}>
                  {subtask.content}
                </span>
                {subtask.estimated_hours && (
                  <span className="text-xs text-gray-600">
                    {subtask.estimated_hours}h
                  </span>
                )}
              </div>
            ))}

            {!expandedSubtasks && task.subtasks.length > 3 && (
              <p
                className="text-xs text-gray-500 text-center py-2 cursor-pointer hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSubtasks(true);
                }}
              >
                还有 {task.subtasks.length - 3} 个子任务，点击展开查看全部
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
