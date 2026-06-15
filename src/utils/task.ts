import { Task } from '@/types';

export function getPriorityColor(priority: Task['priority']): string {
  const colors = {
    urgent: 'text-red-500 bg-red-500/10 border-red-500/30',
    high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    low: 'text-green-500 bg-green-500/10 border-green-500/30',
  };
  return colors[priority];
}

export function getPriorityLabel(priority: Task['priority']): string {
  const labels = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority];
}

export function getScenarioColor(scenario: Task['scenario']): string {
  const colors: Record<string, string> = {
    work: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    study: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    life: 'bg-green-500/20 text-green-400 border-green-500/30',
    'side-project': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return colors[scenario] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getScenarioLabel(scenario: Task['scenario']): string {
  const labels: Record<string, string> = {
    work: '工作',
    study: '学习',
    life: '生活',
    'side-project': '副业',
    social: '社交',
    general: '通用',
  };
  return labels[scenario] || scenario;
}

export function getStatusColor(status: Task['status']): string {
  const colors: Record<string, string> = {
    pending: 'text-gray-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    overdue: 'text-red-400',
    postponed: 'text-yellow-400',
  };
  return colors[status] || 'text-gray-400';
}

export function getStatusLabel(status: Task['status']): string {
  const labels: Record<string, string> = {
    pending: '待办',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已逾期',
    postponed: '已延期',
  };
  return labels[status] || status;
}
