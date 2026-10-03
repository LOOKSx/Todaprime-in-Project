package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"todaprime-backend/database"
	"todaprime-backend/handlers"
)

// corsMiddleware enables Cross-Origin Resource Sharing for Angular frontend
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	log.Println("⚡ Starting Todaprime Backend (Go)...")

	// Initialize Database (SQLite by default, or MySQL/TiDB if DATABASE_URL is set)
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("❌ Failed to connect database: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()

	// Health Check
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"online","app":"Todaprime","version":"1.0.0"}`))
	})

	// Tasks Endpoints
	mux.HandleFunc("GET /api/tasks", handlers.GetTasks)
	mux.HandleFunc("POST /api/tasks", handlers.CreateTask)
	mux.HandleFunc("PUT /api/tasks/{id}", handlers.UpdateTask)
	mux.HandleFunc("PATCH /api/tasks/{id}/toggle", handlers.ToggleTask)
	mux.HandleFunc("DELETE /api/tasks/{id}", handlers.DeleteTask)

	// Subtasks Endpoints
	mux.HandleFunc("POST /api/tasks/{id}/subtasks", handlers.AddSubtask)
	mux.HandleFunc("PATCH /api/subtasks/{id}/toggle", handlers.ToggleSubtask)
	mux.HandleFunc("DELETE /api/subtasks/{id}", handlers.DeleteSubtask)

	// Habits Endpoints
	mux.HandleFunc("GET /api/habits", handlers.GetHabits)
	mux.HandleFunc("POST /api/habits", handlers.CreateHabit)
	mux.HandleFunc("PATCH /api/habits/{id}/toggle", handlers.ToggleHabit)
	mux.HandleFunc("DELETE /api/habits/{id}", handlers.DeleteHabit)

	// Pomodoro Sessions
	mux.HandleFunc("POST /api/pomodoro", handlers.LogPomodoro)

	// Analytics & Statistics
	mux.HandleFunc("GET /api/stats/today", handlers.GetTodayStats)

	// Categories
	mux.HandleFunc("GET /api/categories", handlers.GetCategories)

	// Static Frontend Serving (Single Page Application fallback)
	frontendDist := "../frontend/dist/frontend/browser"
	if _, err := os.Stat(frontendDist); err == nil {
		fs := http.FileServer(http.Dir(frontendDist))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") {
				http.NotFound(w, r)
				return
			}
			fpath := filepath.Join(frontendDist, filepath.Clean(r.URL.Path))
			if info, err := os.Stat(fpath); err == nil && !info.IsDir() {
				fs.ServeHTTP(w, r)
				return
			}
			http.ServeFile(w, r, filepath.Join(frontendDist, "index.html"))
		})
		log.Printf("📦 Serving Angular frontend from %s", frontendDist)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	serverAddr := fmt.Sprintf(":%s", port)
	log.Printf("🚀 Todaprime API Server running at http://localhost:%s", port)
	log.Printf("📡 Ready to serve Angular frontend requests")

	if err := http.ListenAndServe(serverAddr, corsMiddleware(mux)); err != nil {
		log.Fatalf("Server stopped with error: %v", err)
	}
}
