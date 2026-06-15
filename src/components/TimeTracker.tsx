import { useState, useEffect } from 'react';
import { timeTrackingApi, TimeLog } from '@/services/tagService';

interface TimeTrackerProps {
  taskId: string;
  onTimeUpdate?: (duration: number) => void;
}

export default function TimeTracker({ taskId, onTimeUpdate }: TimeTrackerProps) {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [taskId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking) {
      interval = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const loadLogs = async () => {
    try {
      const data = await timeTrackingApi.getTaskLogs(taskId);
      setLogs(data);
      const activeLog = data.find(log => !log.end_time);
      if (activeLog) {
        setIsTracking(true);
        const start = new Date(activeLog.start_time).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }
    } catch (error) {
      console.error('Failed to load time logs:', error);
    }
  };

  const startTracking = async () => {
    try {
      const log = await timeTrackingApi.start(taskId);
      setLogs([log, ...logs]);
      setIsTracking(true);
      setElapsed(0);
    } catch (error) {
      console.error('Failed to start tracking:', error);
    }
  };

  const stopTracking = async () => {
    try {
      const log = await timeTrackingApi.stop(taskId);
      setLogs(logs.map(l => l.id === log.id ? log : l));
      setIsTracking(false);
      setElapsed(0);
      if (onTimeUpdate) {
        onTimeUpdate(log.duration);
      }
    } catch (error) {
      console.error('Failed to stop tracking:', error);
    }
  };

  const deleteLog = async (logId: string) => {
    try {
      await timeTrackingApi.delete(logId);
      setLogs(logs.filter(l => l.id !== logId));
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalTime = logs.reduce((acc, log) => acc + log.duration, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">⏱️</span>
          {isTracking ? (
            <span className="font-mono text-lg text-indigo-600 dark:text-indigo-400">
              {formatDuration(elapsed)}
            </span>
          ) : (
            <span className="font-mono text-sm text-gray-500">
              总计: {formatDuration(totalTime)}
            </span>
          )}
        </div>
        
        {isTracking ? (
          <button
            onClick={stopTracking}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <span className="w-2 h-2 bg-white rounded-full" />
            停止
          </button>
        ) : (
          <button
            onClick={startTracking}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            开始计时
          </button>
        )}
        
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <svg className={`w-5 h-5 text-gray-500 transition-transform ${showLogs ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showLogs && (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatTime(log.start_time)}
                </div>
                <div className="text-xs text-gray-500">
                  {log.end_time 
                    ? `${formatTime(log.start_time)} - ${formatTime(log.end_time)}`
                    : '进行中'
                  }
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                  {formatDuration(log.duration)}
                </span>
                <button
                  onClick={() => deleteLog(log.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-gray-500 py-4">暂无时间记录</p>
          )}
        </div>
      )}
    </div>
  );
}
