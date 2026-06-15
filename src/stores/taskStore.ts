import { create } from 'zustand';
import { Task, Settings } from '@/types';
import api from '@/services/api';

interface TaskStore {
  tasks: Task[];
  settings: Settings;
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  createTask: (input: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  splitTask: (id: string) => Promise<void>;
  updateSubtaskStatus: (taskId: string, subtaskId: string, completed: boolean) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  settings: {
    work_start: '09:00',
    work_end: '18:00',
    reminder_advance: [30, 60],
    notifications_enabled: true,
    custom_scenarios: ['work', 'study', 'life', 'side-project', 'social']
  },
  loading: false,
  error: null,

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTasks();
      console.log('fetchTasks response:', response);
      if (response.success && response.data) {
        set({ tasks: response.data, loading: false });
      } else {
        set({ error: response.error || '获取任务失败', loading: false });
      }
    } catch (error) {
      console.error('fetchTasks error:', error);
      set({ error: '网络错误', loading: false });
    }
  },

  createTask: async (input: string) => {
    set({ loading: true, error: null });
    try {
      console.log('Creating task with input:', input);
      const response = await api.createTask(input);
      console.log('createTask response:', response);
      
      if (response.success && response.data) {
        const newTask = response.data;
        console.log('New task to add:', newTask);
        
        set(state => {
          const updatedTasks = [...state.tasks, newTask];
          console.log('Updated tasks:', updatedTasks);
          return {
            tasks: updatedTasks,
            loading: false
          };
        });
      } else {
        console.error('Create task failed:', response.error);
        set({ error: response.error || '创建任务失败', loading: false });
      }
    } catch (error) {
      console.error('createTask error:', error);
      set({ error: '网络错误', loading: false });
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      const response = await api.updateTask(id, updates);
      if (response.success) {
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
          )
        }));
      }
    } catch (error) {
      console.error('更新任务失败', error);
    }
  },

  updateTaskStatus: async (id: string, status: Task['status']) => {
    try {
      const response = await api.updateTaskStatus(id, status);
      if (response.success) {
        const updates: Partial<Task> = { status };
        if (status === 'completed') {
          updates.completed_at = new Date().toISOString();
        }
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
          )
        }));
      }
    } catch (error) {
      console.error('更新状态失败', error);
    }
  },

  deleteTask: async (id: string) => {
    try {
      const response = await api.deleteTask(id);
      if (response.success) {
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id)
        }));
      }
    } catch (error) {
      console.error('删除任务失败', error);
    }
  },

  splitTask: async (id: string) => {
    try {
      const response = await api.splitTask(id);
      if (response.success && response.data) {
        const parentTask = get().tasks.find(t => t.id === id);
        if (parentTask) {
          const subtasks = response.data.subtasks.map((sub: any) => ({
            id: sub.id || crypto.randomUUID(),
            task_id: id,
            content: sub.content,
            completed: false,
            estimated_hours: sub.estimated_hours || 0.5,
            created_at: new Date().toISOString()
          }));
          set(state => ({
            tasks: state.tasks.map(task =>
              task.id === id ? { ...task, subtasks } : task
            )
          }));
        }
      }
    } catch (error) {
      console.error('拆解任务失败', error);
    }
  },

  updateSubtaskStatus: async (taskId: string, subtaskId: string, completed: boolean) => {
    try {
      const response = await api.updateSubtaskStatus(subtaskId, completed);
      if (response.success) {
        set(state => ({
          tasks: state.tasks.map(task => {
            if (task.id === taskId && task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.map(sub =>
                  sub.id === subtaskId ? { ...sub, completed } : sub
                )
              };
            }
            return task;
          })
        }));
      }
    } catch (error) {
      console.error('更新子任务状态失败', error);
    }
  },

  deleteSubtask: async (taskId: string, subtaskId: string) => {
    try {
      const response = await api.deleteSubtask(subtaskId);
      if (response.success) {
        set(state => ({
          tasks: state.tasks.map(task => {
            if (task.id === taskId && task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.filter(sub => sub.id !== subtaskId)
              };
            }
            return task;
          })
        }));
      }
    } catch (error) {
      console.error('删除子任务失败', error);
    }
  },

  fetchSettings: async () => {
    try {
      const response = await api.getSettings();
      if (response.success && response.data) {
        set({ settings: response.data });
      }
    } catch (error) {
      console.error('获取设置失败', error);
    }
  },

  updateSettings: async (updates: Partial<Settings>) => {
    try {
      const response = await api.updateSettings(updates);
      if (response.success) {
        set(state => ({
          settings: { ...state.settings, ...updates }
        }));
      }
    } catch (error) {
      console.error('更新设置失败', error);
    }
  }
}));
