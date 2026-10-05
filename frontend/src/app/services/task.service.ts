import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, catchError, tap } from 'rxjs';
import { Task, Category, DayStats, MonthlyStats, Priority } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'todaprime_tasks_v3';
  private apiUrl = 'http://localhost:8080/api';

  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([
    { id: 1, name: 'การศึกษา & วิชาการ', color: '#6366f1', icon: '📘' },
    { id: 2, name: 'โครงงาน & วิจัย', color: '#0ea5e9', icon: '📑' },
    { id: 3, name: 'การประเมิน & สอบ', color: '#e11d48', icon: '🎯' },
    { id: 4, name: 'การบริหาร & งานอาชีพ', color: '#475569', icon: '💼' },
    { id: 5, name: 'กิจการส่วนบุคคล', color: '#059669', icon: '🏛️' },
    { id: 6, name: 'สุขภาวะ & สมรรถภาพ', color: '#0284c7', icon: '🌿' },
    { id: 7, name: 'ภารกิจเร่งด่วนพิเศษ', color: '#dc2626', icon: '⚡' }
  ]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initTasks();
  }

  private initTasks(): void {
    let localTasks = this.getLocalTasks();
    if (!localTasks || localTasks.length === 0) {
      localTasks = this.generateSampleTasks();
      this.saveLocalTasks(localTasks);
    }
    this.tasksSubject.next(localTasks);
  }

  private getLocalTasks(): Task[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
      this.tasksSubject.next([...tasks]);
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }

  public getTodayDateStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  public getDateOffsetStr(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private generateSampleTasks(): Task[] {
    const today = this.getTodayDateStr();
    const tomorrow = this.getDateOffsetStr(1);
    const dayAfter = this.getDateOffsetStr(2);
    const dayPlus4 = this.getDateOffsetStr(4);
    const yesterday = this.getDateOffsetStr(-1);
    const dayMinus2 = this.getDateOffsetStr(-2);

    return [
      {
        id: 1,
        title: 'จัดทำเอกสารสรุปผลการวิจัยและทบทวนวรรณกรรม',
        description: 'รวบรวมข้อมูลเชิงทฤษฎีบทที่ 1-3 และจัดทำสรุปสาระสำคัญเชิงวิชาการ',
        due_date: today,
        due_time: '10:00',
        priority: 'HIGH',
        category: 'การศึกษา & วิชาการ',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'กิจกรรมส่งเสริมสุขภาวะและการออกกำลังกาย',
        description: 'การฝึกซ้อมเพื่อเสริมสร้างสมรรถภาพทางกาย 30-45 นาที',
        due_date: today,
        due_time: '17:30',
        priority: 'MEDIUM',
        category: 'สุขภาวะ & สมรรถภาพ',
        is_completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'จัดเตรียมเอกสารและรายงานนำเสนอโครงงาน',
        description: 'ตรวจสอบความถูกต้องของเนื้อหา สถิติ และสื่อสไลด์ประกอบการนำเสนอ',
        due_date: today,
        due_time: '14:00',
        priority: 'HIGH',
        category: 'โครงงาน & วิจัย',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        title: 'ส่งมอบรายงานการบ้านและการวิเคราะห์โจทย์ประยุกต์',
        description: 'ตรวจสอบแบบฝึกหัดชุดที่ 4 และส่งมอบตามกำหนดการ',
        due_date: tomorrow,
        due_time: '09:00',
        priority: 'HIGH',
        category: 'การศึกษา & วิชาการ',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 5,
        title: 'การประชุมวางแผนเชิงกลยุทธ์และการจัดสรรภารกิจ',
        description: 'ประสานงานออนไลน์เพื่อกำหนดเป้าหมายและกำหนดส่งมอบแต่ละระยะ',
        due_date: tomorrow,
        due_time: '13:30',
        priority: 'MEDIUM',
        category: 'การบริหาร & งานอาชีพ',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 6,
        title: 'ส่งมอบเอกสารรายงานความคืบหน้ารอบสัปดาห์',
        description: 'รวบรวมดัชนีผลงานและสรุปรายการภารกิจที่ดำเนินการแล้วเสร็จ',
        due_date: dayAfter,
        due_time: '16:00',
        priority: 'HIGH',
        category: 'โครงงาน & วิจัย',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 7,
        title: 'จัดซื้อวัสดุอุปกรณ์และทรัพยากรที่จำเป็น',
        description: 'ดำเนินการจัดหาวัสดุและอุปกรณ์สนับสนุนการดำเนินงาน',
        due_date: dayPlus4,
        due_time: '15:00',
        priority: 'LOW',
        category: 'กิจการส่วนบุคคล',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 8,
        title: 'เตรียมการทดสอบประเมินผลมาตรฐานความรู้',
        description: 'ทบทวนเกณฑ์การประเมินและฝึกทำชุดข้อสอบย้อนหลัง',
        due_date: yesterday,
        due_time: '15:00',
        priority: 'HIGH',
        category: 'การประเมิน & สอบ',
        is_completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 9,
        title: 'ส่งรายงานสรุปผลการปฏิบัติการรายสัปดาห์',
        description: 'สรุปการส่งมอบงานและการบริหารความเสี่ยง',
        due_date: dayMinus2,
        due_time: '16:30',
        priority: 'MEDIUM',
        category: 'การบริหาร & งานอาชีพ',
        is_completed: true,
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Get tasks for a specific date
  public getTasksForDate(dateStr: string, category: string = 'All', search: string = ''): Task[] {
    let list = this.getLocalTasks().filter(t => t.due_date === dateStr);
    if (category && category !== 'All') {
      list = list.filter(t => t.category === category);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)));
    }
    // Sort: uncompleted first, then by priority/due_time
    return list.sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      return (a.due_time || '').localeCompare(b.due_time || '');
    });
  }

  // Get all upcoming future tasks (days after the given date)
  public getUpcomingTasks(afterDateStr: string, limit: number = 20): Task[] {
    const list = this.getLocalTasks().filter(t => t.due_date > afterDateStr);
    return list.sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, limit);
  }

  // Create a new task (for today, tomorrow, or any future date)
  public createTask(data: Partial<Task>): Task {
    const tasks = this.getLocalTasks();
    const newTask: Task = {
      id: Date.now(),
      title: (data.title || '').trim(),
      description: (data.description || '').trim(),
      due_date: data.due_date || this.getTodayDateStr(),
      due_time: data.due_time || '',
      priority: data.priority || 'MEDIUM',
      category: data.category || 'การบ้าน & การเรียน',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tasks.push(newTask);
    this.saveLocalTasks(tasks);

    // Optional background backend sync
    this.http.post(`${this.apiUrl}/tasks`, newTask).pipe(
      catchError(() => of(null))
    ).subscribe();

    return newTask;
  }

  // Update existing task
  public updateTask(id: number, data: Partial<Task>): Task | null {
    const tasks = this.getLocalTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;

    tasks[idx] = {
      ...tasks[idx],
      ...data,
      updated_at: new Date().toISOString()
    };

    this.saveLocalTasks(tasks);

    this.http.put(`${this.apiUrl}/tasks/${id}`, tasks[idx]).pipe(
      catchError(() => of(null))
    ).subscribe();

    return tasks[idx];
  }

  // Toggle task completed status
  public toggleTask(id: number): Task | null {
    const tasks = this.getLocalTasks();
    const task = tasks.find(t => t.id === id);
    if (!task) return null;

    task.is_completed = !task.is_completed;
    task.completed_at = task.is_completed ? new Date().toISOString() : undefined;
    task.updated_at = new Date().toISOString();

    this.saveLocalTasks(tasks);

    this.http.patch(`${this.apiUrl}/tasks/${id}/toggle`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();

    return task;
  }

  // Delete task
  public deleteTask(id: number): boolean {
    let tasks = this.getLocalTasks();
    const initLen = tasks.length;
    tasks = tasks.filter(t => t.id !== id);
    if (tasks.length === initLen) return false;

    this.saveLocalTasks(tasks);

    this.http.delete(`${this.apiUrl}/tasks/${id}`).pipe(
      catchError(() => of(null))
    ).subscribe();

    return true;
  }

  // Calculate stats for a single day
  public getDayStats(dateStr: string): DayStats {
    const dayTasks = this.getLocalTasks().filter(t => t.due_date === dateStr);
    const total = dayTasks.length;
    const completed = dayTasks.filter(t => t.is_completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      date: dateStr,
      total_tasks: total,
      completed_tasks: completed,
      pending_tasks: pending,
      completion_rate: rate
    };
  }

  // Calculate comprehensive stats for any selected month (year: number, month: 0-11)
  public getMonthlyStats(year: number, month: number): MonthlyStats {
    const tasks = this.getLocalTasks();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthlyTasks = tasks.filter(t => t.due_date.startsWith(monthPrefix));

    const totalTasks = monthlyTasks.length;
    const completedTasks = monthlyTasks.filter(t => t.is_completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Daily breakdown map
    const dailyMap: { [dateStr: string]: { total: number; completed: number; rate: number } } = {};
    monthlyTasks.forEach(t => {
      if (!dailyMap[t.due_date]) {
        dailyMap[t.due_date] = { total: 0, completed: 0, rate: 0 };
      }
      dailyMap[t.due_date].total++;
      if (t.is_completed) {
        dailyMap[t.due_date].completed++;
      }
    });

    Object.keys(dailyMap).forEach(d => {
      const day = dailyMap[d];
      day.rate = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
    });

    const activeDaysCount = Object.keys(dailyMap).length;
    const perfectDaysCount = Object.keys(dailyMap).filter(d => dailyMap[d].rate === 100 && dailyMap[d].total > 0).length;

    // Categories breakdown
    const catMap: { [cat: string]: { total: number; completed: number } } = {};
    monthlyTasks.forEach(t => {
      if (!catMap[t.category]) {
        catMap[t.category] = { total: 0, completed: 0 };
      }
      catMap[t.category].total++;
      if (t.is_completed) {
        catMap[t.category].completed++;
      }
    });

    const categoryBreakdown = Object.keys(catMap).map(catName => {
      const data = catMap[catName];
      const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      const matchedCat = this.categoriesSubject.value.find(c => c.name === catName);
      return {
        name: catName,
        icon: matchedCat ? matchedCat.icon : '📌',
        total: data.total,
        completed: data.completed,
        rate
      };
    }).sort((a, b) => b.total - a.total);

    const monthNamesThai = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    return {
      year,
      month,
      monthName: `${monthNamesThai[month]} ${year + 543} (${year})`,
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      activeDaysCount,
      perfectDaysCount,
      categoryBreakdown,
      dailyMap
    };
  }
}
