export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string; // YYYY-MM-DD (Start Date or Due Date)
  end_date?: string; // YYYY-MM-DD (Optional End Date: วันนี้ถึงวันไหน / กำหนดช่วงเวลา)
  due_time?: string; // HH:mm
  priority: Priority;
  category: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface DayStats {
  date: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  completion_rate: number;
}

export interface MonthlyStats {
  year: number;
  month: number; // 0-11
  monthName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  activeDaysCount: number;
  perfectDaysCount: number;
  categoryBreakdown: { name: string; icon: string; total: number; completed: number; rate: number }[];
  dailyMap: { [dateStr: string]: { total: number; completed: number; rate: number } };
}
