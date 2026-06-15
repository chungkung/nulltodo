import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  RefreshCw, 
  Trash2, 
  FileText, 
  Shield, 
  Moon, 
  Sun, 
  Info, 
  Smartphone, 
  AlertCircle
} from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';

interface UpdateInfo {
  version: string;
  updateDate: string;
  features: string[];
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { fetchSettings } = useTaskStore();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showClearCacheConfirm, setShowClearCacheConfirm] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{type: 'success' | 'info' | 'error', text: string} | null>(null);

  // 模拟应用版本信息
  const currentVersion = '1.0.0';
  const latestVersion = '1.0.0';

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // 检查更新
  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMessage(null);
    
    try {
      // 模拟检查更新
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (currentVersion < latestVersion) {
        setUpdateMessage({
          type: 'success',
          text: `发现新版本 v${latestVersion}，点击前往下载！`
        });
      } else {
        setUpdateMessage({
          type: 'info',
          text: '当前已是最新版本！'
        });
      }
    } catch (error) {
      setUpdateMessage({
        type: 'error',
        text: '检查更新失败，请稍后重试'
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  // 清除缓存
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // 模拟清除缓存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 清除本地存储
      localStorage.clear();
      sessionStorage.clear();
      
      setShowClearCacheConfirm(false);
      alert('缓存清除成功！');
      window.location.reload();
    } catch (error) {
      alert('清除缓存失败');
    } finally {
      setClearingCache(false);
    }
  };

  // 设置项
  const settingsItems = [
    {
      id: 'update',
      title: '检查更新',
      icon: RefreshCw,
      description: `当前版本 v${currentVersion}`,
      action: handleCheckUpdate
    },
    {
      id: 'cache',
      title: '清除缓存',
      icon: Trash2,
      description: '清除应用缓存数据',
      action: () => setShowClearCacheConfirm(true)
    }
  ];

  // 协议项
  const agreementItems = [
    {
      id: 'user',
      title: '用户协议',
      icon: FileText,
      path: '/agreement/user'
    },
    {
      id: 'privacy',
      title: '隐私政策',
      icon: Shield,
      path: '/agreement/privacy'
    }
  ];

  // 其他信息项
  const otherItems = [
    {
      id: 'about',
      title: '关于我们',
      icon: Info,
      description: '了解NullTodo'
    },
    {
      id: 'mobile',
      title: '下载移动端',
      icon: Smartphone,
      description: 'iOS & Android 版本'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">设置</h1>
        <p className="text-gray-400">个性化您的使用体验</p>
      </div>

      {/* 更新提示 */}
      {updateMessage && (
        <div className={`p-4 rounded-xl ${
          updateMessage.type === 'success' ? 'bg-green-500/20 text-green-300' :
          updateMessage.type === 'error' ? 'bg-red-500/20 text-red-300' :
          'bg-blue-500/20 text-blue-300'
        }`}>
          {updateMessage.text}
          {updateMessage.type === 'success' && (
            <button className="ml-4 bg-green-500 text-white px-4 py-1 rounded-lg text-sm">
              立即更新
            </button>
          )}
        </div>
      )}

      {/* 主题设置 */}
      <div className="glass-effect rounded-2xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold text-white mb-4">外观设置</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDarkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            <span className="text-white">深色模式</span>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-14 h-7 rounded-full transition-colors ${
              isDarkMode ? 'bg-purple-500' : 'bg-gray-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
              isDarkMode ? 'translate-x-8' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* 设置选项 */}
      <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-semibold text-white mb-2">应用设置</h2>
        <div className="divide-y divide-white/10">
          {settingsItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              {item.id === 'update' && checkingUpdate ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 协议 */}
      <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-semibold text-white mb-2">服务协议</h2>
        <div className="divide-y divide-white/10">
          {agreementItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white font-medium">{item.title}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* 其他信息 */}
      <div className="glass-effect rounded-2xl border border-white/10 overflow-hidden">
        <h2 className="px-6 pt-6 text-lg font-semibold text-white mb-2">更多</h2>
        <div className="divide-y divide-white/10">
          {otherItems.map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* 清除缓存确认弹窗 */}
      {showClearCacheConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">确认清除缓存</h3>
              <p className="text-gray-400">清除缓存将删除所有本地存储数据，包括任务列表和设置。</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearCacheConfirm(false)}
                disabled={clearingCache}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {clearingCache ? '清除中...' : '确认清除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 版本信息 */}
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">NullTodo v{currentVersion}</p>
        <p className="text-gray-600 text-xs mt-1">© 2026 版权所有</p>
      </div>
    </div>
  );
}
