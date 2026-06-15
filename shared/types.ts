export interface Task {
  id: string;
  content: string;
  deadline?: string;
  estimated_hours: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  scenario: 'work' | 'study' | 'life' | 'side-project' | 'social' | 'general';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'postponed';
  subtasks: SubTask[];
  parent_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SubTask {
  id: string;
  task_id: string;
  content: string;
  completed: boolean;
  created_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface Review {
  id: string;
  period_type: 'daily' | 'weekly';
  period_start: string;
  period_end: string;
  stats: ReviewStats;
  analysis: ReviewAnalysis;
  suggestions: string[];
  created_at: string;
}

export interface ReviewStats {
  total_tasks: number;
  completed: number;
  completion_rate: number;
  on_time_rate: number;
  avg_duration: number;
}

export interface ReviewAnalysis {
  top_delayed: string[];
  most_productive_day: string;
  peak_hours: string;
}

export interface Settings {
  work_start: string;
  work_end: string;
  reminder_advance: number[];
  notifications_enabled: boolean;
  custom_scenarios: string[];
}

export interface ParsedTask {
  content: string;
  deadline?: string;
  estimated_hours: number;
  scenario: string;
  urgency: number;
}

export interface ScheduleItem {
  id: string;
  content: string;
  date: string;
  start_time: string;
  end_time: string;
  priority: string;
  status: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
