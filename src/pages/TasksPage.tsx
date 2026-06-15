import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import TaskCard from '@/components/TaskCard';
import FilterBar from '@/components/FilterBar';
import { Task } from '@/types';
import { Search } from 'lucide-react';
import TaskInput from '@/components/TaskInput';

export default function TasksPage() {
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    scenario: 'all' as Task['scenario'] | 'all',
    priority: 'all' as Task['priority'] | 'all',
    status: 'all' as Task['status'] | 'all'
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchTerm && !task.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.scenario !== 'all' && task.scenario !== filters.scenario) {
        return false;
      }
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, searchTerm, filters]);

  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      in_progress: [],
      pending: [],
      completed: []
    };

    filteredTasks.forEach(task => {
      if (task.status === 'completed') {
        groups.completed.push(task);
      } else if (task.status === 'in_progress') {
        groups.in_progress.push(task);
      } else if (task.deadline && new Date(task.deadline) < new Date()) {
        groups.overdue.push(task);
      } else {
        groups.pending.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">任务管理</h1>
          <p className="text-gray-400">管理和查看所有任务</p>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <TaskInput />
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索任务..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 transition-colors"
        />
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="space-y-8">
        {groupedTasks.overdue.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
              ⚠️ 逾期任务 ({groupedTasks.overdue.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.overdue.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {groupedTasks.in_progress.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
              🔄 进行中 ({groupedTasks.in_progress.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.in_progress.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {groupedTasks.pending.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📋 待办任务 ({groupedTasks.pending.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.pending.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {groupedTasks.completed.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
              ✅ 已完成 ({groupedTasks.completed.length})
            </h2>
            <div className="space-y-4">
              {groupedTasks.completed.map(task => (
                <TaskCard key={task.id} task={task} showActions={false} />
              ))}
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="glass-effect rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">没有找到任务</p>
            <p className="text-gray-500">尝试调整筛选条件或添加新任务</p>
          </div>
        )}
      </div>
    </div>
  );
}
