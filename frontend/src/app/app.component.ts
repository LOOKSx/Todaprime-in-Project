import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { SoundService } from './services/sound.service';
import { AuthService, UserProfile } from './services/auth.service';
import { Task, Category, DayStats, MonthlyStats, Priority } from './models/task.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // Navigation View: 'landing' (หน้าแนะนำเว็บไซ) vs 'app' (กระดานวางแผนงาน) - Default to Landing
  public currentView: 'landing' | 'app' = 'landing';

  // Dashboard Active Tab: 'planner' (วางแผนรายวัน & เช็กลิสต์) vs 'monthly' (สถิติประจำเดือน)
  public activeTab: 'planner' | 'monthly' = 'planner';

  // Dark / Light Theme
  public isDarkMode: boolean = true;

  // Drawer Menu & Modals State
  public isMenuOpen: boolean = false;
  public isCategoryMenuExpanded: boolean = false;
  public isContactModalOpen: boolean = false;
  public isLoginModalOpen: boolean = false;
  public showTaskModal: boolean = false;
  public isEditingTask: boolean = false;

  // Contact Provider Modal
  public contactName: string = '';
  public contactEmail: string = '';
  public contactSubject: string = 'สอบถามข้อมูลการใช้งาน / ปรึกษาผู้ให้บริการ';
  public contactMessage: string = '';
  public contactSuccessMessage: string = '';

  // Auth State (Google One-Click & Standard 8-char Auth)
  public authTab: 'login' | 'register' = 'login';
  public showGooglePrompt: boolean = false;
  public googleAccountName: string = 'LOOKSx (Google Account)';
  public googleAccountEmail: string = 'looks.official@gmail.com';
  public googleAccountAvatar: string = 'https://api.dicebear.com/7.x/bottts/svg?seed=LOOKSx';

  public authNameInput: string = '';
  public authEmailInput: string = '';
  public authPasswordInput: string = '';
  public authConfirmPasswordInput: string = '';
  public authErrorMessage: string = '';
  public authSuccessMessage: string = '';

  // Date Selection for Day Planning & Checklist
  public selectedDate: string = '';
  public displayDateText: string = '';
  public currentTimeStr: string = '';
  private clockInterval: any = null;
  private taskSub: Subscription | null = null;

  // Filters
  public searchQuery: string = '';
  public selectedCategory: string = 'All';

  // Task Lists & Stats
  public dayTasks: Task[] = [];
  public upcomingTasks: Task[] = [];
  public dayStats: DayStats = {
    date: '',
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0
  };

  // Quick Task Creation Form
  public quickTitle: string = '';
  public quickDueTime: string = '10:00';
  public quickPriority: Priority = 'MEDIUM';
  public quickCategory: string = 'การบ้าน & การเรียน';

  // Task Edit / Add Modal Form
  public modalTask: Partial<Task> = {};

  // Monthly Analytics & Calendar
  public selectedYear: number = new Date().getFullYear();
  public selectedMonth: number = new Date().getMonth(); // 0-11
  public monthlyStats: MonthlyStats | null = null;
  public calendarDays: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    taskCount: number;
    completedCount: number;
    isAllCompleted: boolean;
  }> = [];

  // Available Categories
  public categories: Category[] = [];

  constructor(
    public taskService: TaskService,
    public soundService: SoundService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.selectedDate = this.taskService.getTodayDateStr();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    // Subscribe to categories
    this.taskService.categories$.subscribe(cats => {
      this.categories = cats;
    });

    // Subscribe to task updates
    this.taskSub = this.taskService.tasks$.subscribe(() => {
      this.refreshData();
    });

    this.refreshData();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.taskSub) this.taskSub.unsubscribe();
  }

  // Refresh all reactive states
  public refreshData(): void {
    this.updateDisplayDateText();
    this.dayTasks = this.taskService.getTasksForDate(this.selectedDate, this.selectedCategory, this.searchQuery);
    this.dayStats = this.taskService.getDayStats(this.selectedDate);
    this.upcomingTasks = this.taskService.getUpcomingTasks(this.taskService.getTodayDateStr(), 12);
    this.monthlyStats = this.taskService.getMonthlyStats(this.selectedYear, this.selectedMonth);
    this.buildCalendarGrid();
  }

  // Clock & Date Formatting
  public updateClock(): void {
    const now = new Date();
    this.currentTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  public updateDisplayDateText(): void {
    const today = this.taskService.getTodayDateStr();
    const tomorrow = this.taskService.getDateOffsetStr(1);
    const dayAfter = this.taskService.getDateOffsetStr(2);

    if (this.selectedDate === today) {
      this.displayDateText = 'วันนี้ (Today)';
    } else if (this.selectedDate === tomorrow) {
      this.displayDateText = 'พรุ่งนี้ (Tomorrow)';
    } else if (this.selectedDate === dayAfter) {
      this.displayDateText = 'มะรืนนี้ (Day After)';
    } else {
      const d = new Date(this.selectedDate + 'T00:00:00');
      this.displayDateText = d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
  }

  public formatThaiDateShort(dateStr: string): string {
    if (!dateStr) return '';
    const today = this.taskService.getTodayDateStr();
    const tomorrow = this.taskService.getDateOffsetStr(1);

    if (dateStr === today) return 'วันนี้';
    if (dateStr === tomorrow) return 'พรุ่งนี้';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  // Navigation & Drawer
  public toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  public closeMenu(): void {
    this.isMenuOpen = false;
    this.isCategoryMenuExpanded = false;
  }

  public toggleCategoryMenu(): void {
    this.isCategoryMenuExpanded = !this.isCategoryMenuExpanded;
  }

  public switchToLanding(): void {
    this.currentView = 'landing';
    this.closeMenu();
  }

  public switchToApp(tab: 'planner' | 'monthly' = 'planner'): void {
    this.currentView = 'app';
    this.activeTab = tab;
    this.closeMenu();
  }

  public toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  // Date Switching in Day Planner
  public selectDate(dateStr: string): void {
    if (!dateStr) return;
    this.selectedDate = dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      this.selectedYear = parseInt(parts[0], 10);
      this.selectedMonth = parseInt(parts[1], 10) - 1;
    }
    this.refreshData();
  }

  public setToday(): void {
    this.selectDate(this.taskService.getTodayDateStr());
  }

  public setTomorrow(): void {
    this.selectDate(this.taskService.getDateOffsetStr(1));
  }

  public setDayAfter(): void {
    this.selectDate(this.taskService.getDateOffsetStr(2));
  }

  public offsetSelectedDate(days: number): void {
    const cur = new Date(this.selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + days);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    this.selectDate(`${y}-${m}-${d}`);
  }

  // Monthly Navigation
  public prevMonth(): void {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.refreshData();
  }

  public nextMonth(): void {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.refreshData();
  }

  public jumpToCurrentMonth(): void {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth();
    this.refreshData();
  }

  // Calendar Heatmap Grid
  private buildCalendarGrid(): void {
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sun
    const totalDays = lastDay.getDate();

    const todayStr = this.taskService.getTodayDateStr();
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      taskCount: number;
      completedCount: number;
      isAllCompleted: boolean;
    }> = [];

    const dailyMap = this.monthlyStats ? this.monthlyStats.dailyMap : {};

    // Previous month padding
    const prevMonthLastDay = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = this.selectedMonth === 0 ? 12 : this.selectedMonth;
      const prevY = this.selectedMonth === 0 ? this.selectedYear - 1 : this.selectedYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayStat = dailyMap[dateStr] || { total: 0, completed: 0 };
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        taskCount: dayStat.total,
        completedCount: dayStat.completed,
        isAllCompleted: dayStat.total > 0 && dayStat.completed === dayStat.total
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(this.selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${this.selectedYear}-${monthStr}-${dayStr}`;
      const dayStat = dailyMap[dateStr] || { total: 0, completed: 0 };
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        taskCount: dayStat.total,
        completedCount: dayStat.completed,
        isAllCompleted: dayStat.total > 0 && dayStat.completed === dayStat.total
      });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = this.selectedMonth === 11 ? 1 : this.selectedMonth + 2;
      const nextY = this.selectedMonth === 11 ? this.selectedYear + 1 : this.selectedYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayStat = dailyMap[dateStr] || { total: 0, completed: 0 };
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate,
        taskCount: dayStat.total,
        completedCount: dayStat.completed,
        isAllCompleted: dayStat.total > 0 && dayStat.completed === dayStat.total
      });
    }

    this.calendarDays = days;
  }

  // Click on a calendar day in monthly view jumps directly to day planner for that day
  public clickCalendarDay(day: { dateStr: string }): void {
    this.selectDate(day.dateStr);
    this.switchToApp('planner');
  }

  // Category Filtering
  public filterByCategory(catName: string): void {
    this.selectedCategory = catName;
    this.isCategoryMenuExpanded = false;
    this.switchToApp('planner');
    this.refreshData();
  }

  public clearCategoryFilter(): void {
    this.selectedCategory = 'All';
    this.refreshData();
  }

  // Quick Task Add for selectedDate
  public submitQuickAdd(): void {
    const title = this.quickTitle.trim();
    if (!title) return;

    this.taskService.createTask({
      title,
      description: '',
      due_date: this.selectedDate,
      due_time: this.quickDueTime || '10:00',
      priority: this.quickPriority,
      category: this.quickCategory
    });

    this.soundService.playTaskComplete();
    this.quickTitle = '';
    this.refreshData();
  }

  // Task Actions
  public toggleTask(task: Task): void {
    const wasCompleted = task.is_completed;
    this.taskService.toggleTask(task.id);
    if (!wasCompleted) {
      this.soundService.playTaskComplete();
    }
    this.refreshData();
  }

  public deleteTask(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    if (confirm(`คุณต้องการลบงาน "${task.title}" ใช่หรือไม่?`)) {
      this.taskService.deleteTask(task.id);
      this.refreshData();
    }
  }

  // Task Modal (Create & Edit)
  public openCreateModal(forDate?: string): void {
    this.isEditingTask = false;
    this.modalTask = {
      title: '',
      description: '',
      due_date: forDate || this.selectedDate,
      due_time: '10:00',
      priority: 'MEDIUM',
      category: this.categories[0]?.name || 'การบ้าน & การเรียน'
    };
    this.showTaskModal = true;
  }

  public openEditModal(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.isEditingTask = true;
    this.modalTask = { ...task };
    this.showTaskModal = true;
  }

  public closeTaskModal(): void {
    this.showTaskModal = false;
    this.modalTask = {};
  }

  public saveModalTask(): void {
    if (!this.modalTask.title || !this.modalTask.title.trim()) {
      alert('กรุณากรอกชื่องานหรือการบ้านที่ต้องทำ');
      return;
    }

    if (this.isEditingTask && this.modalTask.id) {
      this.taskService.updateTask(this.modalTask.id, this.modalTask);
    } else {
      this.taskService.createTask(this.modalTask);
      this.soundService.playTaskComplete();
    }

    this.closeTaskModal();
    this.refreshData();
  }

  // Authentication Handlers
  public openLoginModal(): void {
    this.isLoginModalOpen = true;
    this.authTab = 'login';
    this.showGooglePrompt = false;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
    this.closeMenu();
  }

  public closeLoginModal(): void {
    this.isLoginModalOpen = false;
    this.showGooglePrompt = false;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
  }

  // 1. Google OAuth Flow: Direct account confirmation, pulls Google name & avatar immediately (No OTP)
  public triggerGoogleSignIn(): void {
    this.showGooglePrompt = true;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
  }

  public confirmGoogleLogin(): void {
    const user = this.authService.loginWithGoogleAccount(
      this.googleAccountName,
      this.googleAccountEmail,
      this.googleAccountAvatar
    );
    this.authSuccessMessage = `เข้าสู่ระบบสำเร็จ! ดึงข้อมูลบัญชี Google "${user.name}" เรียบร้อยแล้ว`;
    this.soundService.playTaskComplete();
    setTimeout(() => {
      this.closeLoginModal();
    }, 900);
  }

  public cancelGooglePrompt(): void {
    this.showGooglePrompt = false;
  }

  // 2. Standard Email & Password Registration & Login (Minimum 8 chars password)
  public submitStandardAuth(): void {
    this.authErrorMessage = '';
    this.authSuccessMessage = '';

    const email = this.authEmailInput.trim();
    const password = this.authPasswordInput;

    if (!email || !email.includes('@')) {
      this.authErrorMessage = 'กรุณากรอกอีเมลให้ถูกต้อง';
      return;
    }

    if (!password || password.length < 8) {
      this.authErrorMessage = 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป';
      return;
    }

    if (this.authTab === 'register') {
      const name = this.authNameInput.trim();
      if (!name) {
        this.authErrorMessage = 'กรุณาระบุชื่อของคุณ';
        return;
      }

      if (password !== this.authConfirmPasswordInput) {
        this.authErrorMessage = 'รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน';
        return;
      }

      const res = this.authService.registerStandard(name, email, password);
      if (res.success) {
        this.authSuccessMessage = res.message;
        this.soundService.playTaskComplete();
        setTimeout(() => {
          this.closeLoginModal();
          this.authPasswordInput = '';
          this.authConfirmPasswordInput = '';
        }, 1000);
      } else {
        this.authErrorMessage = res.message;
      }
    } else {
      // Login
      const res = this.authService.loginStandard(email, password);
      if (res.success) {
        this.authSuccessMessage = res.message;
        this.soundService.playTaskComplete();
        setTimeout(() => {
          this.closeLoginModal();
          this.authPasswordInput = '';
        }, 1000);
      } else {
        this.authErrorMessage = res.message;
      }
    }
  }

  public logout(): void {
    if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      this.authService.logout();
      this.closeMenu();
    }
  }

  // Contact Provider Modal Handlers
  public openContactModal(): void {
    this.isContactModalOpen = true;
    this.contactSuccessMessage = '';
    this.closeMenu();
  }

  public closeContactModal(): void {
    this.isContactModalOpen = false;
    this.contactSuccessMessage = '';
  }

  public submitContact(): void {
    if (!this.contactName.trim() || !this.contactMessage.trim()) {
      alert('กรุณากรอกชื่อและข้อความที่ต้องการติดต่อ');
      return;
    }

    this.contactSuccessMessage = `ขอบคุณครับคุณ ${this.contactName}! ข้อความของคุณถูกส่งไปยังทีมงานผู้ให้บริการ Todaprime เรียบร้อยแล้ว`;
    this.soundService.playTaskComplete();
    setTimeout(() => {
      this.closeContactModal();
      this.contactName = '';
      this.contactEmail = '';
      this.contactMessage = '';
    }, 2200);
  }
}
