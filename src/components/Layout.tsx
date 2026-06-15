import { ReactNode, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ListTodo, 
  Calendar, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Tags, 
  Repeat, 
  FileText, 
  BrainCircuit,
  Columns,
  Trash2,
  Bot,
  Clock,
  TrendingUp,
  Database
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { isToday } from '@/utils/date';
import ThemeToggle from './ThemeToggle';
import TagManager from './TagManager';
import { RecurringTasks } from './RecurringTasks';
import { TaskTemplates } from './TaskTemplates';
import { AIAnalytics } from './AIAnalytics';
import { KanbanView } from './KanbanView';
import { TaskCleanup } from './TaskCleanup';
import { AIAssistant } from './AIAssistant';
import SmartScheduler from './SmartScheduler';
import EnhancedAnalyticsComponent from './EnhancedAnalytics';
import BackupSync from './BackupSync';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/tasks', icon: ListTodo, label: '任务' },
  { path: '/schedule', icon: Calendar, label: '日程' },
  { path: '/review', icon: BarChart3, label: '复盘' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const tasks = useTaskStore(state => state.tasks);
  const [showTagManager, setShowTagManager] = useState(false);
  const [showRecurringTasks, setShowRecurringTasks] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showSmartScheduler, setShowSmartScheduler] = useState(false);
  const [showEnhancedAnalytics, setShowEnhancedAnalytics] = useState(false);
  const [showBackupSync, setShowBackupSync] = useState(false);
  const { fetchTasks, updateTask } = useTaskStore((state) => ({
    fetchTasks: state.fetchTasks,
    updateTask: state.updateTask,
  }));

  const todayStats = useMemo(() => {
    // 使用 isToday 函数进行更可靠的日期比较
    const completedToday = tasks.filter(t =>
      t.status === 'completed' && t.completed_at && isToday(t.completed_at)
    ).length;
    // 今天截止且未完成的任务
    const dueToday = tasks.filter(t =>
      t.status !== 'completed' && t.deadline && isToday(t.deadline)
    ).length;
    // 今天的总任务数
    const totalToday = completedToday + dueToday;

    return { completed: completedToday, total: totalToday };
  }, [tasks]);

  const progress = todayStats.total > 0 ? Math.round((todayStats.completed / todayStats.total) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-primary/50 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">NullTodo</h1>
              <p className="text-xs text-gray-400">智能任务管理</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-accent/20 text-accent border border-accent/30 glow-accent'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-xs text-gray-500 px-4 mb-2">更多功能</p>
            
            <button
              onClick={() => setShowKanban(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Columns className="w-5 h-5" />
              <span className="font-medium">看板视图</span>
            </button>
            
            <button
              onClick={() => setShowRecurringTasks(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Repeat className="w-5 h-5" />
              <span className="font-medium">周期性任务</span>
            </button>
            
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">任务模板</span>
            </button>
            
            <button
              onClick={() => setShowAnalytics(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <BrainCircuit className="w-5 h-5" />
              <span className="font-medium">AI 分析</span>
            </button>
            
            <button
              onClick={() => setShowTagManager(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Tags className="w-5 h-5" />
              <span className="font-medium">标签管理</span>
            </button>

            <button
              onClick={() => setShowCleanup(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">任务清理</span>
            </button>

            <button
              onClick={() => setShowAIAssistant(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Bot className="w-5 h-5" />
              <span className="font-medium">AI助手</span>
            </button>
            
            <button
              onClick={() => setShowSmartScheduler(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">智能调度</span>
            </button>
            
            <button
              onClick={() => setShowEnhancedAnalytics(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">深度分析</span>
            </button>
            
            <button
              onClick={() => setShowBackupSync(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Database className="w-5 h-5" />
              <span className="font-medium">备份同步</span>
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="glass-effect rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-2">今日完成任务</p>
            <p className="text-2xl font-bold text-white font-mono">{todayStats.completed}/{todayStats.total}</p>
            <div className="mt-2 h-1.5 bg-primary-dark rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-accent to-purple rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {showTagManager && (
        <TagManager onClose={() => setShowTagManager(false)} />
      )}
      
      {showRecurringTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">周期性任务</h2>
              <button
                onClick={() => setShowRecurringTasks(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <RecurringTasks onTaskGenerated={fetchTasks} />
          </div>
        </div>
      )}
      
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">任务模板</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <TaskTemplates onTemplateUsed={fetchTasks} />
          </div>
        </div>
      )}
      
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI 分析</h2>
              <button
                onClick={() => setShowAnalytics(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <AIAnalytics />
          </div>
        </div>
      )}
      
      {showKanban && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">看板视图</h2>
              <button
                onClick={() => setShowKanban(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <KanbanView tasks={tasks} onUpdateTask={updateTask} />
          </div>
        </div>
      )}

      {showCleanup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">任务清理</h2>
              <button
                onClick={() => setShowCleanup(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <TaskCleanup />
          </div>
        </div>
      )}

      {showAIAssistant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">AI任务助手</h2>
              <button
                onClick={() => setShowAIAssistant(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AIAssistant />
            </div>
          </div>
        </div>
      )}

      {showSmartScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">智能任务调度</h2>
              <button
                onClick={() => setShowSmartScheduler(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <SmartScheduler />
          </div>
        </div>
      )}

      {showEnhancedAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">深度数据分析</h2>
              <button
                onClick={() => setShowEnhancedAnalytics(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <EnhancedAnalyticsComponent />
          </div>
        </div>
      )}

      {showBackupSync && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">数据备份与同步</h2>
              <button
                onClick={() => setShowBackupSync(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <BackupSync />
          </div>
        </div>
      )}
    </div>
  );
}
