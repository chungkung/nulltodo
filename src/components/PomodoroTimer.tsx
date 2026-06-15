import React, { useState, useEffect, useRef } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export const PomodoroTimer: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getDuration = (m: TimerMode): number => {
    switch (m) {
      case 'work': return settings.workMinutes * 60;
      case 'shortBreak': return settings.shortBreakMinutes * 60;
      case 'longBreak': return settings.longBreakMinutes * 60;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startTimer = () => {
    if (timerRef.current) return;
    setIsRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(getDuration(mode));
  };

  const switchMode = (newMode: TimerMode) => {
    pauseTimer();
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  const completeSession = () => {
    pauseTimer();
    if (mode === 'work') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      if (newCount % settings.sessionsBeforeLongBreak === 0) {
        setMode('longBreak');
        setTimeLeft(getDuration('longBreak'));
      } else {
        setMode('shortBreak');
        setTimeLeft(getDuration('shortBreak'));
      }
    } else {
      setMode('work');
      setTimeLeft(getDuration('work'));
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(mode === 'work' ? '休息时间到！' : '工作时间！');
    }
  };

  const saveSettings = () => {
    // Ensure all values are within valid ranges
    const validSettings = {
      ...settings,
      workMinutes: Math.min(Math.max(settings.workMinutes, 1), 1440),
      shortBreakMinutes: Math.min(Math.max(settings.shortBreakMinutes, 1), 1440),
      longBreakMinutes: Math.min(Math.max(settings.longBreakMinutes, 1), 1440),
      sessionsBeforeLongBreak: Math.min(Math.max(settings.sessionsBeforeLongBreak, 1), 20),
    };
    setSettings(validSettings);
    // Update current timer if necessary
    setTimeLeft(getDuration(mode));
    setShowSettings(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
          {mode === 'work' ? '工作时间' : mode === 'shortBreak' ? '短休息' : '长休息'}
        </h3>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          ⚙️ 设置
        </button>
      </div>
      
      <div className="text-6xl font-mono font-bold mb-6 text-gray-800 dark:text-white">
        {formatTime(timeLeft)}
      </div>
      
      <div className="flex gap-3 mb-4">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            开始
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            暂停
          </button>
        )}
        <button
          onClick={resetTimer}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          重置
        </button>
      </div>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchMode('work')}
          className={`px-4 py-1 rounded ${mode === 'work' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}
        >
          工作
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`px-4 py-1 rounded ${mode === 'shortBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}
        >
          短休息
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-4 py-1 rounded ${mode === 'longBreak' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}
        >
          长休息
        </button>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        已完成: {sessionCount} 个工作时段
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              番茄时钟设置
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-800 dark:text-white">
                  工作时长 (分钟, 最大24小时 = 1440分钟)
                </label>
                <input
                  type="number"
                  value={settings.workMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    workMinutes: parseInt(e.target.value) || 25
                  }))}
                  min="1"
                  max="1440"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-800 dark:text-white">
                  短休息时长 (分钟)
                </label>
                <input
                  type="number"
                  value={settings.shortBreakMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    shortBreakMinutes: parseInt(e.target.value) || 5
                  }))}
                  min="1"
                  max="1440"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-800 dark:text-white">
                  长休息时长 (分钟)
                </label>
                <input
                  type="number"
                  value={settings.longBreakMinutes}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    longBreakMinutes: parseInt(e.target.value) || 15
                  }))}
                  min="1"
                  max="1440"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-800 dark:text-white">
                  长休息前的工作时段数
                </label>
                <input
                  type="number"
                  value={settings.sessionsBeforeLongBreak}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    sessionsBeforeLongBreak: parseInt(e.target.value) || 4
                  }))}
                  min="1"
                  max="20"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
