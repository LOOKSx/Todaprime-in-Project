package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"todaprime-backend/database"
	"todaprime-backend/models"
)

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// GET /api/tasks
func GetTasks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	dateFilter := query.Get("date")
	categoryFilter := query.Get("category")
	priorityFilter := query.Get("priority")
	statusFilter := query.Get("status") // completed, active, all
	search := query.Get("search")

	sqlQuery := "SELECT id, title, description, due_date, due_time, priority, category, is_prime, is_completed, completed_at, estimated_minutes, actual_minutes, reminder_enabled, reminder_time, recurring, created_at, updated_at FROM tasks WHERE 1=1"
	var args []interface{}

	if dateFilter != "" {
		sqlQuery += " AND due_date = ?"
		args = append(args, dateFilter)
	}
	if categoryFilter != "" && categoryFilter != "All" {
		sqlQuery += " AND category = ?"
		args = append(args, categoryFilter)
	}
	if priorityFilter != "" && priorityFilter != "All" {
		sqlQuery += " AND priority = ?"
		args = append(args, priorityFilter)
	}
	if statusFilter == "completed" {
		sqlQuery += " AND is_completed = 1"
	} else if statusFilter == "active" {
		sqlQuery += " AND is_completed = 0"
	}
	if search != "" {
		sqlQuery += " AND (title LIKE ? OR description LIKE ?)"
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm)
	}

	sqlQuery += " ORDER BY is_completed ASC, is_prime DESC, due_time ASC, id DESC"

	rows, err := database.DB.Query(sqlQuery, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	tasks := []models.Task{}
	for rows.Next() {
		var t models.Task
		var isPrimeInt, isCompletedInt, reminderInt int
		var completedAt sql.NullString
		var dueTime, desc, reminderTime sql.NullString

		err := rows.Scan(
			&t.ID, &t.Title, &desc, &t.DueDate, &dueTime,
			&t.Priority, &t.Category, &isPrimeInt, &isCompletedInt,
			&completedAt, &t.EstimatedMinutes, &t.ActualMinutes,
			&reminderInt, &reminderTime, &t.Recurring,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			continue
		}

		t.Description = desc.String
		t.DueTime = dueTime.String
		t.ReminderTime = reminderTime.String
		t.IsPrime = isPrimeInt == 1
		t.IsCompleted = isCompletedInt == 1
		t.ReminderEnabled = reminderInt == 1
		if completedAt.Valid {
			t.CompletedAt = &completedAt.String
		}

		// Load subtasks
		subRows, err := database.DB.Query("SELECT id, task_id, title, is_completed, created_at FROM subtasks WHERE task_id = ? ORDER BY id ASC", t.ID)
		if err == nil {
			t.Subtasks = []models.Subtask{}
			for subRows.Next() {
				var st models.Subtask
				var stDone int
				_ = subRows.Scan(&st.ID, &st.TaskID, &st.Title, &stDone, &st.CreatedAt)
				st.IsCompleted = stDone == 1
				t.Subtasks = append(t.Subtasks, st)
			}
			subRows.Close()
		}

		tasks = append(tasks, t)
	}

	writeJSON(w, http.StatusOK, tasks)
}

// POST /api/tasks
func CreateTask(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title            string   `json:"title"`
		Description      string   `json:"description"`
		DueDate          string   `json:"due_date"`
		DueTime          string   `json:"due_time"`
		Priority         string   `json:"priority"`
		Category         string   `json:"category"`
		IsPrime          bool     `json:"is_prime"`
		EstimatedMinutes int      `json:"estimated_minutes"`
		ReminderEnabled  bool     `json:"reminder_enabled"`
		ReminderTime     string   `json:"reminder_time"`
		Recurring        string   `json:"recurring"`
		Subtasks         []string `json:"subtasks"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "Title is required")
		return
	}

	if input.DueDate == "" {
		input.DueDate = time.Now().Format("2006-01-02")
	}
	if input.Priority == "" {
		input.Priority = "MEDIUM"
	}
	if input.Category == "" {
		input.Category = "Work"
	}
	if input.EstimatedMinutes <= 0 {
		input.EstimatedMinutes = 25
	}
	if input.Recurring == "" {
		input.Recurring = "none"
	}

	nowStr := time.Now().Format(time.RFC3339)
	isPrimeInt := 0
	if input.IsPrime {
		isPrimeInt = 1
	}
	reminderInt := 0
	if input.ReminderEnabled {
		reminderInt = 1
	}

	res, err := database.DB.Exec(`INSERT INTO tasks 
		(title, description, due_date, due_time, priority, category, is_prime, is_completed, estimated_minutes, actual_minutes, reminder_enabled, reminder_time, recurring, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, ?, ?)`,
		input.Title, input.Description, input.DueDate, input.DueTime, input.Priority, input.Category, isPrimeInt,
		input.EstimatedMinutes, reminderInt, input.ReminderTime, input.Recurring, nowStr, nowStr,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	taskID, _ := res.LastInsertId()

	for _, stTitle := range input.Subtasks {
		if strings.TrimSpace(stTitle) != "" {
			_, _ = database.DB.Exec("INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)", taskID, stTitle, nowStr)
		}
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": taskID, "message": "Task created successfully"})
}

// PUT /api/tasks/{id}
func UpdateTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}

	var input models.Task
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}

	isPrimeInt := 0
	if input.IsPrime {
		isPrimeInt = 1
	}
	isCompletedInt := 0
	if input.IsCompleted {
		isCompletedInt = 1
	}
	reminderInt := 0
	if input.ReminderEnabled {
		reminderInt = 1
	}
	nowStr := time.Now().Format(time.RFC3339)

	_, err = database.DB.Exec(`UPDATE tasks SET 
		title = ?, description = ?, due_date = ?, due_time = ?, priority = ?, category = ?, 
		is_prime = ?, is_completed = ?, estimated_minutes = ?, actual_minutes = ?, reminder_enabled = ?, 
		reminder_time = ?, recurring = ?, updated_at = ? 
		WHERE id = ?`,
		input.Title, input.Description, input.DueDate, input.DueTime, input.Priority, input.Category,
		isPrimeInt, isCompletedInt, input.EstimatedMinutes, input.ActualMinutes, reminderInt,
		input.ReminderTime, input.Recurring, nowStr, id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Task updated"})
}

// PATCH /api/tasks/{id}/toggle
func ToggleTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid task ID")
		return
	}

	var currentCompleted int
	var recurring string
	var dueDate string
	err = database.DB.QueryRow("SELECT is_completed, recurring, due_date FROM tasks WHERE id = ?", id).Scan(&currentCompleted, &recurring, &dueDate)
	if err != nil {
		writeError(w, http.StatusNotFound, "Task not found")
		return
	}

	newStatus := 1
	var completedAt interface{} = time.Now().Format(time.RFC3339)
	if currentCompleted == 1 {
		newStatus = 0
		completedAt = nil
	}

	_, err = database.DB.Exec("UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?",
		newStatus, completedAt, time.Now().Format(time.RFC3339), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// If recurring and newly completed, schedule the next recurrence!
	if newStatus == 1 && recurring != "" && recurring != "none" {
		nextDate := calculateNextDueDate(dueDate, recurring)
		if nextDate != "" {
			var title, desc, dueTime, priority, category, reminderTime string
			var isPrime, estMin, reminderEnabled int
			_ = database.DB.QueryRow("SELECT title, description, due_time, priority, category, is_prime, estimated_minutes, reminder_enabled, reminder_time FROM tasks WHERE id = ?", id).
				Scan(&title, &desc, &dueTime, &priority, &category, &isPrime, &estMin, &reminderEnabled, &reminderTime)

			nowStr := time.Now().Format(time.RFC3339)
			_, _ = database.DB.Exec(`INSERT INTO tasks (title, description, due_date, due_time, priority, category, is_prime, is_completed, estimated_minutes, reminder_enabled, reminder_time, recurring, created_at, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
				title, desc, nextDate, dueTime, priority, category, isPrime, estMin, reminderEnabled, reminderTime, recurring, nowStr, nowStr)
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"id": id, "is_completed": newStatus == 1})
}

func calculateNextDueDate(currentDateStr, recurring string) string {
	t, err := time.Parse("2006-01-02", currentDateStr)
	if err != nil {
		t = time.Now()
	}

	switch recurring {
	case "daily":
		return t.AddDate(0, 0, 1).Format("2006-01-02")
	case "weekdays":
		next := t.AddDate(0, 0, 1)
		for next.Weekday() == time.Saturday || next.Weekday() == time.Sunday {
			next = next.AddDate(0, 0, 1)
		}
		return next.Format("2006-01-02")
	case "weekly":
		return t.AddDate(0, 0, 7).Format("2006-01-02")
	case "monthly":
		return t.AddDate(0, 1, 0).Format("2006-01-02")
	default:
		return ""
	}
}

// DELETE /api/tasks/{id}
func DeleteTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	_, _ = database.DB.Exec("DELETE FROM subtasks WHERE task_id = ?", id)
	_, err = database.DB.Exec("DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Task deleted"})
}

// POST /api/tasks/{id}/subtasks
func AddSubtask(w http.ResponseWriter, r *http.Request) {
	taskIDStr := r.PathValue("id")
	taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var input struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "Title required")
		return
	}

	nowStr := time.Now().Format(time.RFC3339)
	res, err := database.DB.Exec("INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)", taskID, input.Title, nowStr)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	newID, _ := res.LastInsertId()
	writeJSON(w, http.StatusCreated, models.Subtask{
		ID:          newID,
		TaskID:      taskID,
		Title:       input.Title,
		IsCompleted: false,
		CreatedAt:   nowStr,
	})
}

// PATCH /api/subtasks/{id}/toggle
func ToggleSubtask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid ID")
		return
	}

	var currentCompleted int
	err = database.DB.QueryRow("SELECT is_completed FROM subtasks WHERE id = ?", id).Scan(&currentCompleted)
	if err != nil {
		writeError(w, http.StatusNotFound, "Subtask not found")
		return
	}

	newStatus := 1
	if currentCompleted == 1 {
		newStatus = 0
	}

	_, _ = database.DB.Exec("UPDATE subtasks SET is_completed = ? WHERE id = ?", newStatus, id)
	writeJSON(w, http.StatusOK, map[string]interface{}{"id": id, "is_completed": newStatus == 1})
}

// DELETE /api/subtasks/{id}
func DeleteSubtask(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	_, _ = database.DB.Exec("DELETE FROM subtasks WHERE id = ?", id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Subtask deleted"})
}

// GET /api/habits
func GetHabits(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query("SELECT id, title, icon, target_frequency, streak, completed_today, last_completed_date, created_at FROM habits ORDER BY id ASC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	habits := []models.Habit{}
	for rows.Next() {
		var h models.Habit
		var compToday int
		var lastDate sql.NullString
		_ = rows.Scan(&h.ID, &h.Title, &h.Icon, &h.TargetFrequency, &h.Streak, &compToday, &lastDate, &h.CreatedAt)
		h.CompletedToday = compToday == 1
		if lastDate.Valid {
			h.LastCompletedDate = lastDate.String
		}
		habits = append(habits, h)
	}
	writeJSON(w, http.StatusOK, habits)
}

// POST /api/habits
func CreateHabit(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Title string `json:"title"`
		Icon  string `json:"icon"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil || strings.TrimSpace(input.Title) == "" {
		writeError(w, http.StatusBadRequest, "Title is required")
		return
	}
	if input.Icon == "" {
		input.Icon = "⭐"
	}

	nowStr := time.Now().Format(time.RFC3339)
	res, err := database.DB.Exec("INSERT INTO habits (title, icon, target_frequency, streak, completed_today, created_at) VALUES (?, ?, 'daily', 0, 0, ?)",
		input.Title, input.Icon, nowStr)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, _ := res.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "title": input.Title, "icon": input.Icon})
}

// PATCH /api/habits/{id}/toggle
func ToggleHabit(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)

	var currentCompleted, streak int
	err := database.DB.QueryRow("SELECT completed_today, streak FROM habits WHERE id = ?", id).Scan(&currentCompleted, &streak)
	if err != nil {
		writeError(w, http.StatusNotFound, "Habit not found")
		return
	}

	newStatus := 1
	today := time.Now().Format("2006-01-02")
	if currentCompleted == 1 {
		newStatus = 0
		streak--
		if streak < 0 {
			streak = 0
		}
	} else {
		streak++
	}

	_, _ = database.DB.Exec("UPDATE habits SET completed_today = ?, streak = ?, last_completed_date = ? WHERE id = ?",
		newStatus, streak, today, id)

	writeJSON(w, http.StatusOK, map[string]interface{}{"id": id, "completed_today": newStatus == 1, "streak": streak})
}

// DELETE /api/habits/{id}
func DeleteHabit(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, _ := strconv.ParseInt(idStr, 10, 64)
	_, _ = database.DB.Exec("DELETE FROM habits WHERE id = ?", id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "Habit deleted"})
}

// POST /api/pomodoro
func LogPomodoro(w http.ResponseWriter, r *http.Request) {
	var input struct {
		TaskID          *int64 `json:"task_id"`
		DurationMinutes int    `json:"duration_minutes"`
		SessionType     string `json:"session_type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if input.DurationMinutes <= 0 {
		input.DurationMinutes = 25
	}
	if input.SessionType == "" {
		input.SessionType = "focus"
	}

	nowStr := time.Now().Format(time.RFC3339)
	_, err := database.DB.Exec("INSERT INTO pomodoro_sessions (task_id, duration_minutes, session_type, completed_at) VALUES (?, ?, ?, ?)",
		input.TaskID, input.DurationMinutes, input.SessionType, nowStr)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// If linked to a task, update actual_minutes
	if input.TaskID != nil && input.SessionType == "focus" {
		_, _ = database.DB.Exec("UPDATE tasks SET actual_minutes = actual_minutes + ? WHERE id = ?", input.DurationMinutes, *input.TaskID)
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "Pomodoro logged"})
}

// GET /api/stats/today
func GetTodayStats(w http.ResponseWriter, r *http.Request) {
	today := time.Now().Format("2006-01-02")
	var stats models.TodayStats

	_ = database.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE due_date = ?", today).Scan(&stats.TotalTasks)
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE due_date = ? AND is_completed = 1", today).Scan(&stats.CompletedTasks)
	stats.PendingTasks = stats.TotalTasks - stats.CompletedTasks

	if stats.TotalTasks > 0 {
		stats.CompletionRate = float64(stats.CompletedTasks) / float64(stats.TotalTasks) * 100
	}

	// Overdue tasks
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE due_date < ? AND is_completed = 0", today).Scan(&stats.OverdueCount)

	// Prime task status
	var primeCount, primeDoneCount int
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE due_date = ? AND is_prime = 1", today).Scan(&primeCount)
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE due_date = ? AND is_prime = 1 AND is_completed = 1", today).Scan(&primeDoneCount)
	stats.HasPrimeTask = primeCount > 0
	stats.IsPrimeCompleted = primeDoneCount > 0

	// Focus minutes logged today
	var totalFocus sql.NullInt64
	_ = database.DB.QueryRow("SELECT SUM(duration_minutes) FROM pomodoro_sessions WHERE session_type = 'focus' AND substr(completed_at, 1, 10) = ?", today).Scan(&totalFocus)
	if totalFocus.Valid {
		stats.TotalFocusMinutes = int(totalFocus.Int64)
	}

	// Habits
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM habits").Scan(&stats.TotalHabits)
	_ = database.DB.QueryRow("SELECT COUNT(*) FROM habits WHERE completed_today = 1").Scan(&stats.HabitsCompleted)

	writeJSON(w, http.StatusOK, stats)
}

// GET /api/categories
func GetCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query("SELECT id, name, color, icon FROM categories ORDER BY id ASC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	cats := []models.Category{}
	for rows.Next() {
		var c models.Category
		_ = rows.Scan(&c.ID, &c.Name, &c.Color, &c.Icon)
		cats = append(cats, c)
	}
	writeJSON(w, http.StatusOK, cats)
}
