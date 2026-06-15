import api from './api';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at?: string;
}

export interface TimeLog {
  id: string;
  task_id: string;
  start_time: string;
  end_time?: string;
  duration: number;
  created_at?: string;
}

export interface RecurringTask {
  id: string;
  content: string;
  priority: string;
  recurrence_rule: string;
  start_date: string;
  end_date?: string;
  last_generated?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  content: string;
  priority: string;
  estimated_hours: number;
  tags?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export const tagApi = {
  getAll: async (): Promise<Tag[]> => {
    const response = await api.get<Tag[]>('/tags');
    return response.data || [];
  },

  create: async (data: { name: string; color?: string }): Promise<Tag> => {
    const response = await api.post<Tag>('/tags', data);
    if (!response.data) throw new Error('Failed to create tag');
    return response.data;
  },

  update: async (id: string, data: Partial<Tag>): Promise<Tag> => {
    const response = await api.put<Tag>(`/tags/${id}`, data);
    if (!response.data) throw new Error('Failed to update tag');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tags/${id}`);
  },

  getTaskTags: async (taskId: string): Promise<Tag[]> => {
    const response = await api.get<Tag[]>(`/tasks/${taskId}/tags`);
    return response.data || [];
  },

  addTaskTag: async (taskId: string, tagId: string): Promise<void> => {
    await api.post(`/tasks/${taskId}/tags`, { tag_id: tagId });
  },

  removeTaskTag: async (taskId: string, tagId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/tags/${tagId}`);
  },
};

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data || [];
  },

  create: async (data: { name: string; icon?: string; color?: string }): Promise<Category> => {
    const response = await api.post<Category>('/categories', data);
    if (!response.data) throw new Error('Failed to create category');
    return response.data;
  },

  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, data);
    if (!response.data) throw new Error('Failed to update category');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};

export const timeTrackingApi = {
  getTaskLogs: async (taskId: string): Promise<TimeLog[]> => {
    const response = await api.get<TimeLog[]>(`/tasks/${taskId}/time-logs`);
    return response.data || [];
  },

  start: async (taskId: string): Promise<TimeLog> => {
    const response = await api.post<TimeLog>(`/tasks/${taskId}/time-start`);
    if (!response.data) throw new Error('Failed to start time tracking');
    return response.data;
  },

  stop: async (taskId: string): Promise<TimeLog> => {
    const response = await api.post<TimeLog>(`/tasks/${taskId}/time-stop`);
    if (!response.data) throw new Error('Failed to stop time tracking');
    return response.data;
  },

  delete: async (logId: string): Promise<void> => {
    await api.delete(`/time-logs/${logId}`);
  },
};

export const productivityApi = {
  getStats: async (days: number = 7) => {
    const response = await api.get<any>(`/statistics/productivity?days=${days}`);
    return response.data;
  },
};

export const recurringTaskApi = {
  getAll: async (): Promise<RecurringTask[]> => {
    const response = await api.get<RecurringTask[]>('/recurring-tasks');
    return response.data || [];
  },

  create: async (data: Partial<RecurringTask>): Promise<RecurringTask> => {
    const response = await api.post<RecurringTask>('/recurring-tasks', data);
    if (!response.data) throw new Error('Failed to create recurring task');
    return response.data;
  },

  update: async (id: string, data: Partial<RecurringTask>): Promise<RecurringTask> => {
    const response = await api.put<RecurringTask>(`/recurring-tasks/${id}`, data);
    if (!response.data) throw new Error('Failed to update recurring task');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/recurring-tasks/${id}`);
  },

  generate: async (): Promise<any[]> => {
    const response = await api.post<any[]>('/recurring-tasks/generate');
    return response.data || [];
  },
};

export const templateApi = {
  getAll: async (): Promise<TaskTemplate[]> => {
    const response = await api.get<TaskTemplate[]>('/templates');
    return response.data || [];
  },

  create: async (data: Partial<TaskTemplate>): Promise<TaskTemplate> => {
    const response = await api.post<TaskTemplate>('/templates', data);
    if (!response.data) throw new Error('Failed to create template');
    return response.data;
  },

  update: async (id: string, data: Partial<TaskTemplate>): Promise<TaskTemplate> => {
    const response = await api.put<TaskTemplate>(`/templates/${id}`, data);
    if (!response.data) throw new Error('Failed to update template');
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  use: async (id: string, scheduled_at?: string): Promise<any> => {
    const response = await api.post<any>(`/templates/${id}/use`, { scheduled_at });
    return response.data;
  },
};

export const analyticsApi = {
  getProcrastination: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/analytics/procrastination');
    return response.data || [];
  },

  getTimeAccuracy: async (days: number = 30): Promise<any> => {
    const response = await api.get<any>(`/analytics/time-accuracy?days=${days}`);
    return response.data;
  },

  getInsights: async (days: number = 30): Promise<any> => {
    const response = await api.get<any>(`/analytics/insights?days=${days}`);
    return response.data;
  },

  getOldTasks: async (days: number = 90) => {
    const response = await api.get<any[]>(`/analytics/old-tasks?days=${days}`);
    return response.data || [];
  },
  
  getTrends: async (days: number = 30) => {
    const response = await api.get<any[]>(`/analytics/trends?days=${days}`);
    return response.data || [];
  },
};

export const taskCleanupApi = {
  batchReschedule: async (taskIds: string[], deadline: string) => {
    const response = await api.post<any[]>('/tasks/batch-reschedule', {
      task_ids: taskIds,
      deadline,
    });
    return response.data || [];
  },
};

export const batchApi = {
  update: async (taskIds: string[], updates: any): Promise<void> => {
    await api.put('/tasks/batch', { task_ids: taskIds, updates });
  },

  delete: async (taskIds: string[]): Promise<void> => {
    await api.post('/tasks/batch', { task_ids: taskIds });
  },
};

export const exportApi = {
  exportCsv: async (): Promise<void> => {
    window.open('/api/export/csv', '_blank');
  },
};

export const backupApi = {
  list: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/backups');
    return response.data || [];
  },

  create: async (name?: string): Promise<any> => {
    const response = await api.post<any>('/backups', { name });
    return response.data;
  },

  restore: async (id: string): Promise<void> => {
    await api.post(`/backups/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/backups/${id}`);
  },
};

export const chatApi = {
  getConversations: async (): Promise<any[]> => {
    const response = await api.get<any>('/chat/conversations');
    if (response.success && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getConversation: async (conversationId: string): Promise<any> => {
    const response = await api.get<any>(`/chat/conversations/${conversationId}`);
    if (response.success) {
      return response.data;
    }
    return null;
  },

  createConversation: async (title?: string): Promise<any> => {
    const response = await api.post<any>('/chat/conversations', { title });
    if (response.success) {
      return response.data;
    }
    return null;
  },

  deleteConversation: async (conversationId: string): Promise<boolean> => {
    await api.delete(`/chat/conversations/${conversationId}`);
    return true;
  },

  sendMessage: async (conversationId: string, message: string): Promise<any> => {
    const response = await api.post<any>(`/chat/conversations/${conversationId}/messages`, { message });
    if (response.success) {
      return response.data;
    }
    return null;
  },

  quickCreateTask: async (prompt: string): Promise<any> => {
    const response = await api.post<any>('/chat/quick-task', { prompt });
    if (response.success) {
      return response.data;
    }
    return null;
  },
};
