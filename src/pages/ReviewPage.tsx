import { useEffect, useState, useMemo } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReviewPage() {
  const tasks = useTaskStore(state => state.tasks);
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
  };

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const scenarioData = [
    { name: '工作', value: tasks.filter(t => t.scenario === 'work').length, color: '#3b82f6' },
    { name: '学习', value: tasks.filter(t => t.scenario === 'study').length, color: '#8b5cf6' },
    { name: '生活', value: tasks.filter(t => t.scenario === 'life').length, color: '#10b981' },
    { name: '副业', value: tasks.filter(t => t.scenario === 'side-project').length, color: '#f59e0b' },
    { name: '其他', value: tasks.filter(t => !['work', 'study', 'life', 'side-project'].includes(t.scenario)).length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: '紧急', value: tasks.filter(t => t.priority === 'urgent').length, color: '#ef4444' },
    { name: '高', value: tasks.filter(t => t.priority === 'high').length, color: '#f97316' },
    { name: '中', value: tasks.filter(t => t.priority === 'medium').length, color: '#eab308' },
    { name: '低', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">复盘报告</h1>
        <p className="text-gray-400">分析你的任务完成情况，优化时间管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">完成率</p>
              <p className="text-3xl font-bold text-white font-mono">{completionRate}%</p>
            </div>
          </div>
          <div className="h-2 bg-primary-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">完成任务</p>
              <p className="text-3xl font-bold text-white font-mono">{stats.completed}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">共 {stats.total} 个任务</p>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">待办任务</p>
              <p className="text-3xl font-bold text-white font-mono">{stats.pending}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">进行中</p>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">逾期任务</p>
              <p className="text-3xl font-bold text-white font-mono">{stats.overdue}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">需要关注</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">任务场景分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scenarioData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {scenarioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">优先级分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="#888" />
              <YAxis dataKey="name" type="category" stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          优化建议
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
            <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
            <p className="text-gray-300">建议将复杂任务拆分为多个小任务，更容易完成且有成就感</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
            <div className="w-2 h-2 rounded-full bg-purple-400 mt-2"></div>
            <p className="text-gray-300">工作类任务占比最高，建议设置专注时间段集中处理</p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2"></div>
            <p className="text-gray-300">继续保持高完成率，可以在完成任务后适当休息提高效率</p>
          </div>
          {stats.overdue > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-400 mt-2"></div>
              <p className="text-red-300">注意：有{stats.overdue}个逾期任务，建议优先处理或重新评估截止时间</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
