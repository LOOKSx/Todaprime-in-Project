export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  created_at?: string;
}

export type Priority = 'PRIME' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RecurringType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  due_time: string;
  priority: Priority;
  category: string;
  is_prime: boolean;
  is_completed: boolean;
  completed_at?: string;
  estimated_minutes: number;
  actual_minutes: number;
  reminder_enabled: boolean;
  reminder_time?: string;
  recurring: RecurringType;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export type CreateTaskRequest = Omit<Partial<Task>, 'subtasks'> & {
  subtasks?: string[];
};

export interface Habit {
  id: number;
  title: string;
  icon: string;
  target_frequency: string;
  streak: number;
  completed_today: boolean;
  last_completed_date?: string;
  created_at: string;
}

export interface TodayStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
  total_focus_minutes: number;
  overdue_count: number;
  has_prime_task: boolean;
  is_prime_completed: boolean;
  habits_completed: number;
  total_habits: number;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}
