import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { getWeekDays, getWeekStart, isToday } from '@/utils/date';
import { getPriorityColor } from '@/utils/task';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export default function SchedulePage() {
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);
  const [currentWeek, setCurrentWeek] = useState(getWeekStart());

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTasks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTasks]);

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);

  const tasksByDay = useMemo(() => {
    const grouped: Record<string, typeof tasks> = {};
    weekDays.forEach(day => {
      grouped[day] = tasks.filter(task => {
        if (!task.deadline) return false;
        return task.deadline.split('T')[0] === day;
      }).sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });
    return grouped;
  }, [tasks, weekDays]);

  const goToPrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const goToToday = () => {
    setCurrentWeek(getWeekStart());
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">日程视图</h1>
          <p className="text-gray-400">查看和规划你的日程安排</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevWeek}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            今天
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/10">
          {weekDays.map((day) => {
            const date = new Date(day);
            const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
            const isCurrentDay = isToday(day);
            const taskCount = tasksByDay[day]?.length || 0;

            return (
              <div
                key={day}
                className={`p-4 text-center border-r border-white/10 last:border-r-0 ${
                  isCurrentDay ? 'bg-accent/10' : ''
                }`}
              >
                <p className="text-xs text-gray-400 mb-1">周{dayName}</p>
                <p className={`text-2xl font-bold mb-2 ${isCurrentDay ? 'text-accent' : 'text-white'}`}>
                  {date.getDate()}
                </p>
                {taskCount > 0 && (
                  <span className="inline-block px-2 py-1 rounded-full bg-accent/20 text-accent text-xs">
                    {taskCount}个任务
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map(day => {
            const dayTasks = tasksByDay[day] || [];
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day}
                className={`p-4 border-r border-white/10 last:border-r-0 ${
                  isCurrentDay ? 'bg-accent/5' : ''
                }`}
              >
                {dayTasks.length > 0 ? (
                  <div className="space-y-3">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${getPriorityColor(task.priority)} border-current/20`}
                      >
                        <p className="text-sm font-medium mb-1">{task.content}</p>
                        {task.estimated_hours > 0 && (
                          <p className="text-xs opacity-70">{task.estimated_hours}小时</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-gray-600">无任务</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          优先级说明
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
            <span className="text-sm text-gray-400">紧急 - 立即处理</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30"></div>
            <span className="text-sm text-gray-400">高 - 今天完成</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
            <span className="text-sm text-gray-400">中 - 本周完成</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-sm text-gray-400">低 - 灵活安排</span>
          </div>
        </div>
      </div>
    </div>
  );
}
