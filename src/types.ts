export interface Task {
  id: string;
  content: string;
  deadline: string | null;
  estimated_hours: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  scenario: string;
  status: 'pending' | 'in_progress' | 'completed';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  task_id: string;
  content: string;
  completed: boolean;
  estimated_hours: number;
  created_at: string;
}

export interface Settings {
  work_start: string;
  work_end: string;
  reminder_advance: number[];
  notifications_enabled: boolean;
  custom_scenarios: string[];
}

export interface DailyReview {
  date: string;
  stats: {
    completed: number;
    total: number;
    by_priority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    by_scenario: Record<string, number>;
    overdue: number;
  };
  analysis: string;
  suggestions: string[];
}

export interface WeeklyReview {
  week_start: string;
  week_end: string;
  stats: {
    total_completed: number;
    completion_rate: number;
    avg_tasks_per_day: number;
    top_scenarios: Array<{ scenario: string; count: number }>;
    overdue_tasks: number;
  };
  insights: string[];
  recommendations: string[];
}

export interface Review {
  date?: string;
  week_start?: string;
  week_end?: string;
  stats: {
    completed?: number;
    total?: number;
    by_priority?: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    by_scenario?: Record<string, number>;
    overdue?: number;
    total_completed?: number;
    completion_rate?: number;
    avg_tasks_per_day?: number;
    top_scenarios?: Array<{ scenario: string; count: number }>;
    overdue_tasks?: number;
  };
  analysis?: string;
  suggestions?: string[];
  insights?: string[];
  recommendations?: string[];
}

export interface ScheduleItem {
  id: string;
  content: string;
  date: string;
  time: string;
  duration: number;
  priority: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ParsedTask {
  content: string;
  deadline: string;
  estimated_hours: number;
  scenario: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  urgency?: number;
}

export interface Conflict {
  tasks: Task[];
  type: string;
  severity: string;
  time_diff_hours?: number;
  both_high_priority?: boolean;
}

export interface PriorityAdjustment {
  id: string;
  current_priority: string;
  suggested_priority: string;
  reason: string;
}

export interface SuggestedOrder {
  id?: string;
  content: string;
  deadline?: string;
  priority?: string;
  order: number;
  reason: string;
  score: number;
}

export interface ScheduleInsight {
  conflicts: Conflict[];
  suggestions: SuggestedOrder[];
  priority_adjustments: PriorityAdjustment[];
  summary?: {
    high_severity_conflicts: number;
    pending_tasks: number;
    priority_suggestions_count: number;
    total_conflicts: number;
  };
}

export interface CompletionTrend {
  date: string;
  completed: number;
  completion_rate: number;
  total: number;
}

export interface AverageCompletionTime {
  overall: number;
  average_completion_hours?: number;
  days?: number;
  fastest_task?: number;
  slowest_task?: number;
  sample_count?: number;
  average_by_priority?: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface ProcrastinationAnalysis {
  is_procrastinator: boolean;
  patterns: any[];
  risk_tasks: Task[];
  average_completion_before_deadline_hours?: number;
  early_completion?: number;
  last_minute?: number;
  last_minute_rate?: number;
  procrastinated?: number;
  procrastination_rate?: number;
  total?: number;
}

export interface WorkingHabits {
  best_hours: number[];
  best_days: string[];
  focus_periods?: Array<{ start: number; end: number; efficiency: number }>;
  best_hour?: number;
  best_weekday?: string;
  days?: number;
  hour_distribution?: Record<string, number>;
  weekday_distribution?: Record<string, number>;
  recommendations?: string[];
  total_completed?: number;
}

export interface Summary {
  insights: string[];
  overall_score: number;
  positive_points: string[];
  warnings?: string[];
}

export interface PersonalizedAnalytics {
  completion_rate_trends?: CompletionTrend[];
  completion_trends?: CompletionTrend[];
  average_completion_time: AverageCompletionTime;
  procrastination_patterns: ProcrastinationAnalysis;
  procrastination_analysis?: ProcrastinationAnalysis;
  working_habit_analysis: WorkingHabits;
  working_habits?: WorkingHabits;
  recommendations: string[];
  summary?: Summary;
}

export interface BackupInfo {
  filename: string;
  created_at: string;
  size: number;
  size_bytes?: number;
  encrypted: boolean;
  is_encrypted?: boolean;
  file_name?: string;
  createdAt?: string;
}

export interface BackupSummary {
  backups: BackupInfo[];
  last_backup: string | null;
  latest_backup?: string | null;
  total_size: number;
  total_backups?: number;
  backup_dir?: string;
  encryption_available?: boolean;
}
