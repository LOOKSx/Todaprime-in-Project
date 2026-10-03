package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "modernc.org/sqlite"
)

var DB *sql.DB
var IsMySQL bool

// Default TiDB Cloud connection string with utf8mb4 support
const DefaultTiDBURL = "2o1wZjiu6vMHwZ4.root:FxuqpP33Qy6nOJkZ@tcp(gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000)/todaprime?tls=true&charset=utf8mb4&parseTime=True"

// InitDB initializes database connection (TiDB Cloud by default with SQLite fallback)
func InitDB() (*sql.DB, error) {
	var db *sql.DB
	var err error

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = DefaultTiDBURL
	}

	// 1. Try TiDB Cloud / MySQL first
	log.Println("☁️ Connecting to TiDB Cloud Database (AWS Singapore)...")
	db, err = sql.Open("mysql", dbURL)
	if err == nil {
		err = db.Ping()
	}

	if err == nil {
		log.Println("✅ Connected to TiDB Cloud Serverless successfully!")
		DB = db
		IsMySQL = true
		_, _ = DB.Exec("SET NAMES utf8mb4;")
	} else {
		// 2. Fallback to local SQLite if offline
		log.Printf("⚠️ TiDB Cloud connection failed (%v). Falling back to local SQLite...", err)
		dbPath := "./todaprime.db"
		db, err = sql.Open("sqlite", dbPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open SQLite: %w", err)
		}
		if err := db.Ping(); err != nil {
			return nil, fmt.Errorf("failed to ping SQLite: %w", err)
		}
		DB = db
		IsMySQL = false
		log.Printf("📂 Using local SQLite database at %s", dbPath)
	}

	if err := migrate(); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	seedDefaults()
	return DB, nil
}

func migrate() error {
	var queries []string

	if IsMySQL {
		queries = []string{
			`CREATE TABLE IF NOT EXISTS tasks (
				id BIGINT PRIMARY KEY AUTO_INCREMENT,
				title VARCHAR(500) NOT NULL,
				description TEXT,
				due_date VARCHAR(50),
				due_time VARCHAR(50),
				priority VARCHAR(50) DEFAULT 'MEDIUM',
				category VARCHAR(100) DEFAULT 'Work',
				is_prime TINYINT DEFAULT 0,
				is_completed TINYINT DEFAULT 0,
				completed_at VARCHAR(50),
				estimated_minutes INT DEFAULT 25,
				actual_minutes INT DEFAULT 0,
				reminder_enabled TINYINT DEFAULT 1,
				reminder_time VARCHAR(50),
				recurring VARCHAR(50) DEFAULT 'none',
				created_at VARCHAR(50),
				updated_at VARCHAR(50)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			`CREATE TABLE IF NOT EXISTS subtasks (
				id BIGINT PRIMARY KEY AUTO_INCREMENT,
				task_id BIGINT NOT NULL,
				title VARCHAR(500) NOT NULL,
				is_completed TINYINT DEFAULT 0,
				created_at VARCHAR(50)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			`CREATE TABLE IF NOT EXISTS habits (
				id BIGINT PRIMARY KEY AUTO_INCREMENT,
				title VARCHAR(500) NOT NULL,
				icon VARCHAR(50) DEFAULT '⭐',
				target_frequency VARCHAR(50) DEFAULT 'daily',
				streak INT DEFAULT 0,
				completed_today TINYINT DEFAULT 0,
				last_completed_date VARCHAR(50),
				created_at VARCHAR(50)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
				id BIGINT PRIMARY KEY AUTO_INCREMENT,
				task_id BIGINT,
				duration_minutes INT DEFAULT 25,
				session_type VARCHAR(50) DEFAULT 'focus',
				completed_at VARCHAR(50)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
			`CREATE TABLE IF NOT EXISTS categories (
				id BIGINT PRIMARY KEY AUTO_INCREMENT,
				name VARCHAR(100) UNIQUE NOT NULL,
				color VARCHAR(50) DEFAULT '#4f46e5',
				icon VARCHAR(50) DEFAULT '📌'
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
		}
	} else {
		queries = []string{
			`CREATE TABLE IF NOT EXISTS tasks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title TEXT NOT NULL,
				description TEXT,
				due_date TEXT,
				due_time TEXT,
				priority TEXT DEFAULT 'MEDIUM',
				category TEXT DEFAULT 'Work',
				is_prime INTEGER DEFAULT 0,
				is_completed INTEGER DEFAULT 0,
				completed_at TEXT,
				estimated_minutes INTEGER DEFAULT 25,
				actual_minutes INTEGER DEFAULT 0,
				reminder_enabled INTEGER DEFAULT 1,
				reminder_time TEXT,
				recurring TEXT DEFAULT 'none',
				created_at TEXT,
				updated_at TEXT
			);`,
			`CREATE TABLE IF NOT EXISTS subtasks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				task_id INTEGER NOT NULL,
				title TEXT NOT NULL,
				is_completed INTEGER DEFAULT 0,
				created_at TEXT
			);`,
			`CREATE TABLE IF NOT EXISTS habits (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title TEXT NOT NULL,
				icon TEXT DEFAULT '⭐',
				target_frequency TEXT DEFAULT 'daily',
				streak INTEGER DEFAULT 0,
				completed_today INTEGER DEFAULT 0,
				last_completed_date TEXT,
				created_at TEXT
			);`,
			`CREATE TABLE IF NOT EXISTS pomodoro_sessions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				task_id INTEGER,
				duration_minutes INTEGER DEFAULT 25,
				session_type TEXT DEFAULT 'focus',
				completed_at TEXT
			);`,
			`CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT UNIQUE NOT NULL,
				color TEXT DEFAULT '#4f46e5',
				icon TEXT DEFAULT '📌'
			);`,
		}
	}

	for _, q := range queries {
		if _, err := DB.Exec(q); err != nil {
			return fmt.Errorf("query error (%s): %w", q, err)
		}
	}
	return nil
}

func seedDefaults() {
	var count int
	_ = DB.QueryRow("SELECT COUNT(*) FROM tasks").Scan(&count)
	today := time.Now().Format("2006-01-02")
	nowStr := time.Now().Format(time.RFC3339)

	// If table had question mark corrupted characters, clear it out for a clean seed
	var sampleTitle string
	_ = DB.QueryRow("SELECT title FROM tasks LIMIT 1").Scan(&sampleTitle)
	if len(sampleTitle) > 0 && sampleTitle[0] == '?' {
		_, _ = DB.Exec("DELETE FROM subtasks;")
		_, _ = DB.Exec("DELETE FROM tasks;")
		_, _ = DB.Exec("DELETE FROM habits;")
		count = 0
	}

	if count == 0 {
		log.Println("Seeding initial Todaprime demo tasks into TiDB Cloud...")

		// Task 1: Prime Task (Eat The Frog)
		res, err := DB.Exec(`INSERT INTO tasks 
			(title, description, due_date, due_time, priority, category, is_prime, is_completed, estimated_minutes, reminder_enabled, recurring, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			"🔥 ภารกิจหลักอันดับ 1: วางแผนเป้าหมายประจำวัน (Todaprime Focus)",
			"โฟกัสงานนี้ก่อนเป็นสิ่งแรกตามกฎ Eat The Frog หรือ Prime Task เพื่อผลลัพธ์ที่ดีที่สุดของวัน",
			today, "09:00", "PRIME", "Work", 1, 0, 45, 1, "daily", nowStr, nowStr,
		)
		if err == nil {
			id, _ := res.LastInsertId()
			_, _ = DB.Exec(`INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)`, id, "เขียนรายการสิ่งที่ต้องทำ 3 อย่าง", nowStr)
			_, _ = DB.Exec(`INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)`, id, "ตั้งเวลา Pomodoro 25 นาที", nowStr)
			_, _ = DB.Exec(`INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)`, id, "เช็กอีเมลสำคัญที่ค้างอยู่", nowStr)
		}

		// Task 2
		res2, _ := DB.Exec(`INSERT INTO tasks 
			(title, description, due_date, due_time, priority, category, is_prime, is_completed, estimated_minutes, reminder_enabled, recurring, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			"☁️ ทดสอบการทำงานกับ TiDB Cloud 5 GB (Connected!)",
			"ระบบเชื่อมต่อกับ TiDB Cloud เรียบร้อย ข้อมูลทั้งหมดจะถูกซิงก์ขึ้นคลาวด์ตลอด 24 ชม.",
			today, "14:00", "HIGH", "Study", 0, 0, 30, 1, "none", nowStr, nowStr,
		)
		if res2 != nil {
			id2, _ := res2.LastInsertId()
			_, _ = DB.Exec(`INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)`, id2, "ทดสอบเพิ่มงานใหม่", nowStr)
			_, _ = DB.Exec(`INSERT INTO subtasks (task_id, title, is_completed, created_at) VALUES (?, ?, 0, ?)`, id2, "เปิดตัวจับเวลา Pomodoro", nowStr)
		}

		// Task 3
		_, _ = DB.Exec(`INSERT INTO tasks 
			(title, description, due_date, due_time, priority, category, is_prime, is_completed, estimated_minutes, reminder_enabled, recurring, created_at, updated_at) 
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			"🏃‍♂️ ออกกำลังกายยืดเส้นยืดสาย 30 นาที",
			"พักสายตาจากการทำงาน ดื่มน้ำเยอะ ๆ และออกกำลังกายเบา ๆ",
			today, "17:30", "MEDIUM", "Health", 0, 0, 30, 1, "daily", nowStr, nowStr,
		)
	}

	// Seed Habits
	var habitCount int
	_ = DB.QueryRow("SELECT COUNT(*) FROM habits").Scan(&habitCount)
	if habitCount == 0 {
		_, _ = DB.Exec(`INSERT INTO habits (title, icon, target_frequency, streak, completed_today, created_at) VALUES 
			('ดื่มน้ำสะอาด 2 ลิตร', '💧', 'daily', 5, 1, ?),
			('อ่านหนังสือ/ศึกษาความรู้ใหม่ 20 นาที', '📖', 'daily', 3, 0, ?),
			('นั่งสมาธิหรือผ่อนคลาย 10 นาที', '🧘', 'daily', 7, 0, ?),
			('ออกกำลังกาย 30 นาที', '🏃‍♂️', 'daily', 2, 0, ?)`,
			nowStr, nowStr, nowStr, nowStr)
	}

	// Seed Categories
	var catCount int
	_ = DB.QueryRow("SELECT COUNT(*) FROM categories").Scan(&catCount)
	if catCount == 0 {
		if IsMySQL {
			_, _ = DB.Exec(`INSERT IGNORE INTO categories (name, color, icon) VALUES 
				('Work', '#4f46e5', '💼'),
				('Personal', '#06b6d4', '🏠'),
				('Health', '#10b981', '❤️'),
				('Study', '#8b5cf6', '📚'),
				('Finance', '#f59e0b', '💰'),
				('Urgent', '#ef4444', '🚨')`)
		} else {
			_, _ = DB.Exec(`INSERT OR IGNORE INTO categories (name, color, icon) VALUES 
				('Work', '#4f46e5', '💼'),
				('Personal', '#06b6d4', '🏠'),
				('Health', '#10b981', '❤️'),
				('Study', '#8b5cf6', '📚'),
				('Finance', '#f59e0b', '💰'),
				('Urgent', '#ef4444', '🚨')`)
		}
	}
}
