import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  icon: 'completed' | 'pending' | 'overdue' | 'rate';
  label: string;
  value: number | string;
  subValue?: string;
}

const icons = {
  completed: CheckCircle2,
  pending: Clock,
  overdue: AlertCircle,
  rate: TrendingUp,
};

const colors = {
  completed: 'from-green-500/20 to-green-600/20 border-green-500/30 text-green-400',
  pending: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400',
  overdue: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  rate: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400',
};

export default function StatsCard({ icon, label, value, subValue }: StatsCardProps) {
  const Icon = icons[icon];
  const colorClass = colors[icon];

  return (
    <div className={`glass-effect rounded-2xl p-6 border ${colorClass} card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-2">{label}</p>
          <p className="text-3xl font-bold font-mono text-white mb-1">{value}</p>
          {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
