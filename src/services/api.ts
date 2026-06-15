import { Task, Settings, Review, ScheduleItem, ApiResponse, ScheduleInsight, PersonalizedAnalytics, BackupSummary, BackupInfo } from '@/types';

// 检测是否在 Electron 环境中
const isElectron = navigator.userAgent.toLowerCase().includes('electron');

// 本地存储 API（用于 Electron 桌面应用）
const localStorageAPI = {
  getTasks: (): Task[] => {
    const tasks = localStorage.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  },

  saveTasks: (tasks: Task[]): void => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  },

  createTask: (input: string): Task => {
    const tasks = localStorageAPI.getTasks();
    const newTask: Task = {
      id: Date.now().toString(),
      content: input,
      priority: 'medium',
      scenario: 'general',
      status: 'pending',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tasks.push(newTask);
    localStorageAPI.saveTasks(tasks);
    return newTask;
  },

  updateTask: (id: string, updates: Partial<Task>): Task | null => {
    const tasks = localStorageAPI.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates, updated_at: new Date().toISOString() };
    localStorageAPI.saveTasks(tasks);
    return tasks[index];
  },

  updateTaskStatus: (id: string, status: string): Task | null => {
    const tasks = localStorageAPI.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    
    const updates: Partial<Task> = { status };
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    tasks[index] = { ...tasks[index], ...updates, updated_at: new Date().toISOString() };
    localStorageAPI.saveTasks(tasks);
    return tasks[index];
  },

  deleteTask: (id: string): boolean => {
    const tasks = localStorageAPI.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    
    localStorageAPI.saveTasks(filtered);
    return true;
  },

  splitTask: (id: string): { subtasks: any[] } => {
    const tasks = localStorageAPI.getTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return { subtasks: [] };
    
    // 简单的任务拆分逻辑
    const subtasks = [
      { id: `${id}_1`, content: `${task.content} - 步骤1`, completed: false },
      { id: `${id}_2`, content: `${task.content} - 步骤2`, completed: false },
      { id: `${id}_3`, content: `${task.content} - 步骤3`, completed: false },
    ];
    
    const index = tasks.findIndex(t => t.id === id);
    tasks[index] = { ...task, subtasks };
    localStorageAPI.saveTasks(tasks);
    
    return { subtasks };
  },

  updateSubtaskStatus: (subtaskId: string, completed: boolean): boolean => {
    const tasks = localStorageAPI.getTasks();
    for (const task of tasks) {
      if (task.subtasks) {
        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
          subtask.completed = completed;
          localStorageAPI.saveTasks(tasks);
          return true;
        }
      }
    }
    return false;
  },

  deleteSubtask: (subtaskId: string): boolean => {
    const tasks = localStorageAPI.getTasks();
    for (const task of tasks) {
      if (task.subtasks) {
        const index = task.subtasks.findIndex(s => s.id === subtaskId);
        if (index !== -1) {
          task.subtasks.splice(index, 1);
          localStorageAPI.saveTasks(tasks);
          return true;
        }
      }
    }
    return false;
  },

  getSettings: (): Settings => {
    const settings = localStorage.getItem('settings');
    return settings ? JSON.parse(settings) : {
      notifications_enabled: true,
      daily_review_enabled: true,
      weekly_review_enabled: true,
    };
  },

  saveSettings: (settings: Settings): void => {
    localStorage.setItem('settings', JSON.stringify(settings));
  },
};

// 远程 API（用于 Web 版本）
const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络请求失败'
    };
  }
}

const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data?: any) => fetchApi<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: <T>(endpoint: string, data?: any) => fetchApi<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, {
    method: 'DELETE',
  }),

  getTasks: (): Promise<ApiResponse<Task[]>> => {
    if (isElectron) {
      return Promise.resolve({
        success: true,
        data: localStorageAPI.getTasks(),
      });
    }
    return fetchApi<Task[]>('/tasks');
  },

  createTask: (input: string): Promise<ApiResponse<Task>> => {
    if (isElectron) {
      const task = localStorageAPI.createTask(input);
      return Promise.resolve({
        success: true,
        data: task,
      });
    }
    return fetchApi<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  },

  updateTask: (id: string, updates: Partial<Task>): Promise<ApiResponse<Task>> => {
    if (isElectron) {
      const task = localStorageAPI.updateTask(id, updates);
      if (task) {
        return Promise.resolve({
          success: true,
          data: task,
        });
      }
      return Promise.resolve({
        success: false,
        error: '任务不存在',
      });
    }
    return fetchApi<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  updateTaskStatus: (id: string, status: string): Promise<ApiResponse<Task>> => {
    if (isElectron) {
      const task = localStorageAPI.updateTaskStatus(id, status);
      if (task) {
        return Promise.resolve({
          success: true,
          data: task,
        });
      }
      return Promise.resolve({
        success: false,
        error: '任务不存在',
      });
    }
    return fetchApi<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteTask: (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    if (isElectron) {
      const success = localStorageAPI.deleteTask(id);
      return Promise.resolve({
        success,
        data: { success },
      });
    }
    return fetchApi<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  splitTask: (id: string): Promise<ApiResponse<{ subtasks: any[] }>> => {
    if (isElectron) {
      const result = localStorageAPI.splitTask(id);
      return Promise.resolve({
        success: true,
        data: result,
      });
    }
    return fetchApi<{ subtasks: any[] }>(`/tasks/${id}/split`, {
      method: 'POST',
    });
  },

  updateSubtaskStatus: (subtaskId: string, completed: boolean): Promise<ApiResponse<any>> => {
    if (isElectron) {
      const success = localStorageAPI.updateSubtaskStatus(subtaskId, completed);
      return Promise.resolve({
        success,
        data: { success },
      });
    }
    return fetchApi<any>(`/subtasks/${subtaskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
  },

  deleteSubtask: (subtaskId: string): Promise<ApiResponse<{ success: boolean }>> => {
    if (isElectron) {
      const success = localStorageAPI.deleteSubtask(subtaskId);
      return Promise.resolve({
        success,
        data: { success },
      });
    }
    return fetchApi<{ success: boolean }>(`/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  },

  getSchedule: (start: string, end: string) => fetchApi<{
    schedule: ScheduleItem[];
    conflicts: string[];
    suggestions: string[];
  }>(`/schedule?start=${start}&end=${end}`),

  optimizeSchedule: () => fetchApi<{ success: boolean }>('/schedule/optimize', {
    method: 'POST',
  }),

  getDailyReview: () => fetchApi<Review>('/review/daily'),

  getWeeklyReview: () => fetchApi<Review>('/review/weekly'),

  getSettings: (): Promise<ApiResponse<Settings>> => {
    if (isElectron) {
      return Promise.resolve({
        success: true,
        data: localStorageAPI.getSettings(),
      });
    }
    return fetchApi<Settings>('/settings');
  },

  updateSettings: (settings: Partial<Settings>): Promise<ApiResponse<Settings>> => {
    if (isElectron) {
      const currentSettings = localStorageAPI.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorageAPI.saveSettings(newSettings);
      return Promise.resolve({
        success: true,
        data: newSettings,
      });
    }
    return fetchApi<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  getSmartSchedulerInsights: () => fetchApi<ScheduleInsight>('/smart-scheduler/insights'),

  adjustPriority: (taskId: string, priority: string) => fetchApi<{ success: boolean }>('/smart-scheduler/adjust-priority', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId, priority }),
  }),

  getPersonalizedAnalytics: () => fetchApi<PersonalizedAnalytics>('/enhanced-analytics/personalized'),

  createBackup: (encrypt?: boolean) => fetchApi<BackupInfo>('/backup-sync/create', {
    method: 'POST',
    body: JSON.stringify({ encrypt }),
  }),

  listBackups: () => fetchApi<BackupSummary>('/backup-sync/list'),

  restoreBackup: (filename: string) => fetchApi<{ success: boolean; message?: string }>('/backup-sync/restore', {
    method: 'POST',
    body: JSON.stringify({ filename }),
  }),

  deleteBackup: (filename: string) => fetchApi<{ success: boolean }>('/backup/delete', {
    method: 'POST',
    body: JSON.stringify({ filename }),
  }),
};

export default api;
