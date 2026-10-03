import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { Task, CreateTaskRequest, Habit, TodayStats, Category } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8080/api';

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private habitsSubject = new BehaviorSubject<Habit[]>([]);
  public habits$ = this.habitsSubject.asObservable();

  private statsSubject = new BehaviorSubject<TodayStats>({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0,
    total_focus_minutes: 0,
    overdue_count: 0,
    has_prime_task: false,
    is_prime_completed: false,
    habits_completed: 0,
    total_habits: 0
  });
  public stats$ = this.statsSubject.asObservable();

  private allCalendarTasksSubject = new BehaviorSubject<Task[]>([]);
  public allCalendarTasks$ = this.allCalendarTasksSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([
    { id: 1, name: 'การบ้าน (Homework)', color: '#8b5cf6', icon: '📚' },
    { id: 2, name: 'โครงงาน (Project)', color: '#06b6d4', icon: '📝' },
    { id: 3, name: 'เตรียมสอบ (Exam)', color: '#ef4444', icon: '🎯' },
    { id: 4, name: 'งานทั่วไป (Work)', color: '#4f46e5', icon: '💼' },
    { id: 5, name: 'ส่วนตัว (Personal)', color: '#10b981', icon: '🏠' },
    { id: 6, name: 'สุขภาพ (Health)', color: '#ec4899', icon: '❤️' },
    { id: 7, name: 'การเงิน (Finance)', color: '#f59e0b', icon: '💰' },
    { id: 8, name: 'ด่วนมาก (Urgent)', color: '#dc2626', icon: '🚨' }
  ]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshAll();
  }

  public refreshAll(filterDate?: string): void {
    this.fetchTasks(filterDate).subscribe();
    this.fetchAllCalendarTasks().subscribe();
    this.fetchHabits().subscribe();
    this.fetchTodayStats().subscribe();
    this.fetchCategories().subscribe();
  }

  public fetchAllCalendarTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`).pipe(
      tap(tasks => this.allCalendarTasksSubject.next(tasks)),
      catchError(() => of(this.allCalendarTasksSubject.value))
    );
  }

  public fetchTasks(date?: string, category?: string, priority?: string, status?: string, search?: string): Observable<Task[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    if (category && category !== 'All') params = params.set('category', category);
    if (priority && priority !== 'All') params = params.set('priority', priority);
    if (status && status !== 'all') params = params.set('status', status);
    if (search) params = params.set('search', search);

    return this.http.get<Task[]>(`${this.apiUrl}/tasks`, { params }).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(err => {
        console.warn('API fetch tasks failed:', err);
        return of(this.tasksSubject.value);
      })
    );
  }

  public createTask(taskData: CreateTaskRequest): Observable<{ id: number; message: string }> {
    return this.http.post<{ id: number; message: string }>(`${this.apiUrl}/tasks`, taskData).pipe(
      tap(() => this.refreshAll(taskData.due_date))
    );
  }

  public updateTask(id: number, taskData: Partial<Task>): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${id}`, taskData).pipe(
      tap(() => this.refreshAll(taskData.due_date))
    );
  }

  public toggleTask(id: number, currentDate?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${id}/toggle`, {}).pipe(
      tap(() => this.refreshAll(currentDate))
    );
  }

  public deleteTask(id: number, currentDate?: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${id}`).pipe(
      tap(() => this.refreshAll(currentDate))
    );
  }

  public addSubtask(taskId: number, title: string, currentDate?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks/${taskId}/subtasks`, { title }).pipe(
      tap(() => this.refreshAll(currentDate))
    );
  }

  public toggleSubtask(subtaskId: number, currentDate?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/subtasks/${subtaskId}/toggle`, {}).pipe(
      tap(() => this.refreshAll(currentDate))
    );
  }

  public deleteSubtask(subtaskId: number, currentDate?: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/subtasks/${subtaskId}`).pipe(
      tap(() => this.refreshAll(currentDate))
    );
  }

  public fetchHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(`${this.apiUrl}/habits`).pipe(
      tap(habits => this.habitsSubject.next(habits)),
      catchError(err => of(this.habitsSubject.value))
    );
  }

  public createHabit(title: string, icon: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/habits`, { title, icon }).pipe(
      tap(() => this.fetchHabits().subscribe())
    );
  }

  public toggleHabit(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/habits/${id}/toggle`, {}).pipe(
      tap(() => {
        this.fetchHabits().subscribe();
        this.fetchTodayStats().subscribe();
      })
    );
  }

  public deleteHabit(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/habits/${id}`).pipe(
      tap(() => this.fetchHabits().subscribe())
    );
  }

  public fetchTodayStats(): Observable<TodayStats> {
    return this.http.get<TodayStats>(`${this.apiUrl}/stats/today`).pipe(
      tap(stats => this.statsSubject.next(stats)),
      catchError(err => of(this.statsSubject.value))
    );
  }

  public logPomodoro(taskId: number | null, durationMinutes: number, sessionType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pomodoro`, {
      task_id: taskId,
      duration_minutes: durationMinutes,
      session_type: sessionType
    }).pipe(
      tap(() => this.fetchTodayStats().subscribe())
    );
  }

  public fetchCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`).pipe(
      tap(categories => {
        if (categories && categories.length > 0) {
          this.categoriesSubject.next(categories);
        }
      }),
      catchError(() => of(this.categoriesSubject.value))
    );
  }
}
