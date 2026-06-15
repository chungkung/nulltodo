import { useEffect, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Link } from 'react-router-dom';
import StatsCard from '@/components/StatsCard';
import TaskInput from '@/components/TaskInput';
import TaskCard from '@/components/TaskCard';
import { isToday } from '@/utils/date';
import { Calendar, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function HomePage() {
  const tasks = useTaskStore(state => state.tasks);
  const loading = useTaskStore(state => state.loading);
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      // 只显示有今日截止日期且未完成的任务
      if (!task.deadline) return false;
      return isToday(task.deadline) && task.status !== 'completed';
    });
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    // 逾期任务：已过截止日期但未完成的任务
    const overdue = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.deadline) return false;
      return new Date(t.deadline) < new Date();
    }).length;
    // 待办任务：未完成的任务（排除已完成和逾期）
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      pending,
      rate
    };
  }, [tasks]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">欢迎回来 👋</h1>
          <p className="text-gray-400">今天{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon="completed"
          label="已完成任务"
          value={stats.completed}
          subValue={`共 ${stats.total} 个任务`}
        />
        <StatsCard
          icon="pending"
          label="待办任务"
          value={stats.pending}
          subValue="进行中"
        />
        <StatsCard
          icon="overdue"
          label="逾期任务"
          value={stats.overdue}
          subValue="需要关注"
        />
        <StatsCard
          icon="rate"
          label="完成率"
          value={`${stats.rate}%`}
          subValue="本周表现"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              快速添加任务
            </h2>
            <TaskInput />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              今日任务
              <span className="text-sm font-normal text-gray-400">({todayTasks.length}个)</span>
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-effect rounded-2xl p-5 animate-pulse">
                    <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-white/10 rounded-full w-16"></div>
                      <div className="h-6 bg-white/10 rounded-full w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayTasks.length > 0 ? (
              <div className="space-y-4">
                {todayTasks.slice(0, 5).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {todayTasks.length > 5 && (
                  <Link
                    to="/tasks"
                    className="block text-center py-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    查看全部 {todayTasks.length} 个任务 →
                  </Link>
                )}
              </div>
            ) : (
              <div className="glass-effect rounded-2xl p-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-lg text-white mb-2">太棒了！</p>
                <p className="text-gray-400">今天没有待办任务，添加一个新任务开始吧</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-effect rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              本周概览
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">任务完成进度</span>
                  <span className="text-white font-mono">{stats.rate}%</span>
                </div>
                <div className="h-2 bg-primary-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-purple rounded-full transition-all"
                    style={{ width: `${stats.rate}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">总任务数</span>
                  <span className="text-white font-mono">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已完成</span>
                  <span className="text-green-400 font-mono">{stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">待处理</span>
                  <span className="text-blue-400 font-mono">{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">已逾期</span>
                  <span className="text-red-400 font-mono">{stats.overdue}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">💡 智能提示</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>• 试试输入：「明天下午3点完成项目报告，大约2小时」</p>
              <p>• 高优先级任务会自动排在前面</p>
              <p>• 复杂任务会自动拆分为小任务</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
