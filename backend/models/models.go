package models

type Subtask struct {
	ID          int64  `json:"id"`
	TaskID      int64  `json:"task_id"`
	Title       string `json:"title"`
	IsCompleted bool   `json:"is_completed"`
	CreatedAt   string `json:"created_at"`
}

type Task struct {
	ID               int64     `json:"id"`
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	DueDate          string    `json:"due_date"`
	DueTime          string    `json:"due_time"`
	Priority         string    `json:"priority"` // PRIME, HIGH, MEDIUM, LOW
	Category         string    `json:"category"`
	IsPrime          bool      `json:"is_prime"`
	IsCompleted      bool      `json:"is_completed"`
	CompletedAt      *string   `json:"completed_at,omitempty"`
	EstimatedMinutes int       `json:"estimated_minutes"`
	ActualMinutes    int       `json:"actual_minutes"`
	ReminderEnabled  bool      `json:"reminder_enabled"`
	ReminderTime     string    `json:"reminder_time,omitempty"`
	Recurring        string    `json:"recurring"` // none, daily, weekdays, weekly, monthly
	CreatedAt        string    `json:"created_at"`
	UpdatedAt        string    `json:"updated_at"`
	Subtasks         []Subtask `json:"subtasks"`
}

type Habit struct {
	ID                int64  `json:"id"`
	Title             string `json:"title"`
	Icon              string `json:"icon"`
	TargetFrequency   string `json:"target_frequency"`
	Streak            int    `json:"streak"`
	CompletedToday    bool   `json:"completed_today"`
	LastCompletedDate string `json:"last_completed_date,omitempty"`
	CreatedAt         string `json:"created_at"`
}

type PomodoroSession struct {
	ID              int64  `json:"id"`
	TaskID          *int64 `json:"task_id,omitempty"`
	DurationMinutes int    `json:"duration_minutes"`
	SessionType     string `json:"session_type"` // focus, short_break, long_break
	CompletedAt     string `json:"completed_at"`
}

type Category struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

type TodayStats struct {
	TotalTasks        int     `json:"total_tasks"`
	CompletedTasks    int     `json:"completed_tasks"`
	PendingTasks      int     `json:"pending_tasks"`
	CompletionRate    float64 `json:"completion_rate"`
	TotalFocusMinutes int     `json:"total_focus_minutes"`
	OverdueCount      int     `json:"overdue_count"`
	HasPrimeTask      bool    `json:"has_prime_task"`
	IsPrimeCompleted  bool    `json:"is_prime_completed"`
	HabitsCompleted   int     `json:"habits_completed"`
	TotalHabits       int     `json:"total_habits"`
}
