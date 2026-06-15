import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '@/stores/taskStore';

interface ShortcutHandler {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const fetchTasks = useTaskStore(state => state.fetchTasks);

  const shortcuts: ShortcutHandler[] = [
    {
      key: '1',
      handler: () => navigate('/'),
      description: '返回首页'
    },
    {
      key: '2',
      handler: () => navigate('/tasks'),
      description: '打开任务列表'
    },
    {
      key: '3',
      handler: () => navigate('/schedule'),
      description: '打开日程'
    },
    {
      key: '4',
      handler: () => navigate('/review'),
      description: '打开复盘'
    },
    {
      key: '5',
      handler: () => navigate('/settings'),
      description: '打开设置'
    },
    {
      key: 'n',
      ctrlKey: true,
      handler: () => {
        const input = document.querySelector('input[placeholder*="输入任务"]') as HTMLInputElement;
        if (input) input.focus();
      },
      description: '新建任务'
    },
    {
      key: 'r',
      ctrlKey: true,
      handler: () => fetchTasks(),
      description: '刷新任务'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

      if (event.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts, fetchTasks]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function ShortcutHelp() {
  const shortcuts = [
    { keys: ['1-5'], description: '切换页面' },
    { keys: ['Ctrl+N'], description: '新建任务' },
    { keys: ['Ctrl+R'], description: '刷新任务' },
  ];

  return (
    <div className="p-4 glass-effect rounded-xl">
      <h3 className="text-sm font-medium mb-3">⌨️ 快捷键</h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div className="flex gap-1">
              {shortcut.keys.map((key, i) => (
                <kbd key={i} className="px-2 py-1 bg-white/10 rounded text-gray-400">{key}</kbd>
              ))}
            </div>
            <span className="text-gray-500">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
