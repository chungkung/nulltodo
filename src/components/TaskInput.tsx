import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { Sparkles } from 'lucide-react';

export default function TaskInput() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const createTask = useTaskStore(state => state.createTask);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    await createTask(input.trim());
    setInput('');
    setLoading(false);
  }, [input, loading, createTask]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
        <div className="relative glass-effect rounded-2xl p-2 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-purple/20">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入任务，我会自动解析时间和优先级..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-accent to-purple text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500 flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-white/5 text-gray-400">Enter</span>
        发送
        <span className="px-2 py-1 rounded bg-white/5 text-gray-400 ml-2">Shift + Enter</span>
        换行
      </p>
    </form>
  );
}
