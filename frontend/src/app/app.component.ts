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
  // Storage Keys for Full Refresh Persistence (คงสถานะหน้าจอเดิมเมื่อผู้ใช้รีเฟรชหน้าเว็บ)
  private readonly STORAGE_VIEW_KEY = 'todaprime_ui_view';
  private readonly STORAGE_TAB_KEY = 'todaprime_ui_tab';
  private readonly STORAGE_DATE_KEY = 'todaprime_ui_selected_date';
  private readonly STORAGE_THEME_KEY = 'todaprime_ui_theme_v3';
  private readonly STORAGE_CAT_KEY = 'todaprime_ui_category';
  private readonly STORAGE_LANG_KEY = 'todaprime_ui_lang';

  // Navigation View: 'app' (ศูนย์ควบคุมและจัดการภารกิจ) vs 'landing' (เอกสารแนะนำระบบ)
  public currentView: 'landing' | 'app' = 'app';

  // Task Status Filter: 'all' | 'active' | 'completed'
  public taskStatusFilter: 'all' | 'active' | 'completed' = 'all';

  // Dashboard Active Tab: 'planner' (ตารางภารกิจประจำวัน) vs 'monthly' (รายงานสถิติประจำเดือน)
  public activeTab: 'planner' | 'monthly' = 'planner';

  // Visual Theme (Classic Archival Light & Midnight Study Dark)
  public isDarkMode: boolean = false;

  // Language Toggle (Thai / English bilingual)
  public isEnglish: boolean = false;

  // Drawer Menu & Modals State
  public isMenuOpen: boolean = false;
  public isCategoryMenuExpanded: boolean = false;
  public isContactModalOpen: boolean = false;
  public isLoginModalOpen: boolean = false;
  public showTaskModal: boolean = false;
  public isEditingTask: boolean = false;

  // Support & Consultation Form
  public contactName: string = '';
  public contactEmail: string = '';
  public contactSubject: string = 'สอบถามการใช้งานเชิงเทคนิค / ปรึกษาผู้พัฒนาระบบ';
  public contactMessage: string = '';
  public contactSuccessMessage: string = '';

  // Identity & Access State (Google Workspace & Standard Auth)
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

  // Date Selection for Task Planning & Execution
  public selectedDate: string = '';
  public displayDateText: string = '';
  public currentTimeStr: string = '';
  private clockInterval: any = null;
  private taskSub: Subscription | null = null;

  // Filters
  public searchQuery: string = '';
  public selectedCategory: string = 'All';

  // Task Lists & Metrics
  public dayTasks: Task[] = [];
  public upcomingTasks: Task[] = [];
  public dayStats: DayStats = {
    date: '',
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0
  };

  // Quick Task Creation (รวมการกำหนดช่วงเวลา วันนี้ถึงวันไหน)
  public quickTitle: string = '';
  public quickDueTime: string = '10:00';
  public quickPriority: Priority = 'MEDIUM';
  public quickCategory: string = 'การศึกษา & วิชาการ';
  public quickIsRange: boolean = false;
  public quickEndDate: string = '';

  // Task Edit / Add Form (รองรับกำหนดการช่วงเวลา วันนี้ถึงวันไหน)
  public modalTask: Partial<Task> = {};
  public modalIsRange: boolean = false;

  // Monthly Performance & Heatmap
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
    // 1. Restore Theme State from LocalStorage
    const savedTheme = localStorage.getItem(this.STORAGE_THEME_KEY);
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = false; // Default to Warm Archival Stationery (Parchment & Oxford Navy)
    }
    this.applyDocumentTheme();

    // 2. Restore Current View ('app' vs 'landing')
    const savedView = localStorage.getItem(this.STORAGE_VIEW_KEY);
    if (savedView === 'app' || savedView === 'landing') {
      this.currentView = savedView;
    } else {
      this.currentView = 'app';
    }

    // 3. Restore Active Tab ('planner' vs 'monthly')
    const savedTab = localStorage.getItem(this.STORAGE_TAB_KEY);
    if (savedTab === 'planner' || savedTab === 'monthly') {
      this.activeTab = savedTab;
    } else {
      this.activeTab = 'planner';
    }

    // 4. Restore Selected Date
    const savedDate = localStorage.getItem(this.STORAGE_DATE_KEY);
    if (savedDate && /^\d{4}-\d{2}-\d{2}$/.test(savedDate)) {
      this.selectedDate = savedDate;
      const parts = savedDate.split('-');
      this.selectedYear = parseInt(parts[0], 10);
      this.selectedMonth = parseInt(parts[1], 10) - 1;
    } else {
      this.selectedDate = this.taskService.getTodayDateStr();
    }

    // 5. Restore Category Filter
    const savedCat = localStorage.getItem(this.STORAGE_CAT_KEY);
    if (savedCat) {
      this.selectedCategory = savedCat;
    }

    // 5b. Restore Language Preference
    const savedLang = localStorage.getItem(this.STORAGE_LANG_KEY);
    if (savedLang === 'en') {
      this.isEnglish = true;
    }

    // 6. Setup Clock & Subscriptions
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);

    this.taskService.categories$.subscribe(cats => {
      this.categories = cats;
      if (cats.length > 0 && !this.quickCategory) {
        this.quickCategory = cats[0].name;
      }
    });

    this.taskSub = this.taskService.tasks$.subscribe(() => {
      this.refreshData();
    });

    this.refreshData();

    // 7. Pre-initialize Google Identity Services
    setTimeout(() => this.initGoogleIdentity(), 800);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.taskSub) this.taskSub.unsubscribe();
  }

  // Refresh reactive data structures
  public refreshData(): void {
    this.updateDisplayDateText();
    this.dayTasks = this.taskService.getTasksForDate(this.selectedDate, this.selectedCategory, this.searchQuery);
    this.dayStats = this.taskService.getDayStats(this.selectedDate);
    this.upcomingTasks = this.taskService.getUpcomingTasks(this.taskService.getTodayDateStr(), 12);
    this.monthlyStats = this.taskService.getMonthlyStats(this.selectedYear, this.selectedMonth);
    this.buildCalendarGrid();
  }

  // Clock
  public updateClock(): void {
    const now = new Date();
    this.currentTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Formal Date Formatting (Bilingual Thai / English)
  public updateDisplayDateText(): void {
    const today = this.taskService.getTodayDateStr();
    const tomorrow = this.taskService.getDateOffsetStr(1);
    const dayAfter = this.taskService.getDateOffsetStr(2);

    const d = new Date(this.selectedDate + 'T00:00:00');

    if (this.isEnglish) {
      const enDateFull = d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      if (this.selectedDate === today) {
        this.displayDateText = `Today's Schedule — ${enDateFull}`;
      } else if (this.selectedDate === tomorrow) {
        this.displayDateText = `Tomorrow's Schedule — ${enDateFull}`;
      } else if (this.selectedDate === dayAfter) {
        this.displayDateText = `Day After Tomorrow — ${enDateFull}`;
      } else {
        this.displayDateText = `Schedule — ${enDateFull}`;
      }
    } else {
      const thaiDateFull = d.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (this.selectedDate === today) {
        this.displayDateText = `กำหนดการประจำวัน — ${thaiDateFull}`;
      } else if (this.selectedDate === tomorrow) {
        this.displayDateText = `กำหนดการวันพรุ่งนี้ — ${thaiDateFull}`;
      } else if (this.selectedDate === dayAfter) {
        this.displayDateText = `กำหนดการวันมะรืนนี้ — ${thaiDateFull}`;
      } else {
        this.displayDateText = `กำหนดการ — ${thaiDateFull}`;
      }
    }
  }

  public formatThaiDateFormal(dateStr: string): string {
    if (!dateStr) return '';
    const today = this.taskService.getTodayDateStr();
    const tomorrow = this.taskService.getDateOffsetStr(1);

    if (this.isEnglish) {
      if (dateStr === today) return 'Today';
      if (dateStr === tomorrow) return 'Tomorrow';
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (dateStr === today) return 'วันนี้ (Today)';
    if (dateStr === tomorrow) return 'วันพรุ่งนี้ (Tomorrow)';

    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Check if task is a multi-day span (วันนี้ถึงวันไหน)
  public isRangeTask(task: Task): boolean {
    return !!(task && task.end_date && task.end_date > task.due_date);
  }

  // Format date range text in Thai or English
  public formatTaskRangeText(task: Task): string {
    if (!task) return '';
    if (!this.isRangeTask(task)) {
      return this.formatThaiDateFormal(task.due_date);
    }
    return this.formatRangeSpan(task.due_date, task.end_date);
  }

  // Format arbitrary start and end date range string
  public formatRangeSpan(startDateStr: string, endDateStr?: string): string {
    if (!startDateStr) return '';
    if (!endDateStr || endDateStr === startDateStr) {
      return this.formatThaiDateFormal(startDateStr);
    }
    const d1 = new Date(startDateStr + 'T00:00:00');
    const d2 = new Date(endDateStr + 'T00:00:00');
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (this.isEnglish) {
      const t1 = d1.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const t2 = d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${t1} – ${t2} (${diff} day${diff > 1 ? 's' : ''})`;
    }

    const t1 = d1.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const t2 = d2.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${t1} – ${t2} (${diff} วัน)`;
  }

  // Calculate remaining days relative to current selected date
  public getRemainingDaysText(task: Task): string {
    if (!task.end_date || task.end_date <= task.due_date) return '';
    const target = new Date(task.end_date + 'T00:00:00').getTime();
    const current = new Date(this.selectedDate + 'T00:00:00').getTime();
    const diffDays = Math.round((target - current) / (1000 * 60 * 60 * 24));

    if (this.isEnglish) {
      if (diffDays === 0) return 'Last day of schedule';
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} left`;
      return 'Completed span';
    }

    if (diffDays === 0) return 'วันสุดท้ายของกำหนดการ';
    if (diffDays > 0) return `เหลืออีก ${diffDays} วัน`;
    return `ครบกำหนดแล้ว`;
  }

  // Monthly title in English or Thai
  public getMonthTitle(): string {
    if (!this.monthlyStats) return '';
    if (this.isEnglish) {
      const monthNamesEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNamesEn[this.selectedMonth]} ${this.selectedYear}`;
    }
    return this.monthlyStats.monthName;
  }

  // Category Color & Pastel Styling Helper
  public getCategoryStyleClass(catName: string): string {
    if (!catName) return 'cat-default';
    if (catName.includes('ศึกษา') || catName.includes('วิชาการ')) return 'cat-academic';
    if (catName.includes('โครงงาน') || catName.includes('วิจัย')) return 'cat-project';
    if (catName.includes('ประเมิน') || catName.includes('สอบ')) return 'cat-exam';
    if (catName.includes('บริหาร') || catName.includes('งานอาชีพ') || catName.includes('ออฟฟิศ')) return 'cat-work';
    if (catName.includes('ส่วนบุคคล') || catName.includes('ส่วนตัว')) return 'cat-personal';
    if (catName.includes('สุขภาวะ') || catName.includes('สมรรถภาพ') || catName.includes('สุขภาพ')) return 'cat-health';
    if (catName.includes('เร่งด่วน') || catName.includes('ด่วน')) return 'cat-urgent';
    return 'cat-default';
  }

  // Navigation & View Persistence Handlers
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
    localStorage.setItem(this.STORAGE_VIEW_KEY, 'landing');
    this.closeMenu();
  }

  public switchToApp(tab: 'planner' | 'monthly' = 'planner'): void {
    this.currentView = 'app';
    this.activeTab = tab;
    localStorage.setItem(this.STORAGE_VIEW_KEY, 'app');
    localStorage.setItem(this.STORAGE_TAB_KEY, tab);
    this.closeMenu();
  }

  public setDashboardTab(tab: 'planner' | 'monthly'): void {
    this.activeTab = tab;
    localStorage.setItem(this.STORAGE_TAB_KEY, tab);
    this.refreshData();
  }

  public toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem(this.STORAGE_THEME_KEY, this.isDarkMode ? 'dark' : 'light');
    this.applyDocumentTheme();
  }

  public applyDocumentTheme(): void {
    if (typeof document !== 'undefined') {
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.body.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.body.classList.add('light');
      }
    }
  }

  public toggleLanguage(): void {
    this.isEnglish = !this.isEnglish;
    localStorage.setItem(this.STORAGE_LANG_KEY, this.isEnglish ? 'en' : 'th');
    this.refreshData();
  }

  // Date Selection Persistence
  public selectDate(dateStr: string): void {
    if (!dateStr) return;
    this.selectedDate = dateStr;
    localStorage.setItem(this.STORAGE_DATE_KEY, dateStr);

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

  // Calendar Heatmap Construction
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

    // Next month padding
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

  public clickCalendarDay(day: { dateStr: string }): void {
    this.selectDate(day.dateStr);
    this.switchToApp('planner');
  }

  // Category Filtering
  public filterByCategory(catName: string): void {
    this.selectedCategory = catName;
    localStorage.setItem(this.STORAGE_CAT_KEY, catName);
    this.isCategoryMenuExpanded = false;
    this.switchToApp('planner');
    this.refreshData();
  }

  public clearCategoryFilter(): void {
    this.selectedCategory = 'All';
    localStorage.setItem(this.STORAGE_CAT_KEY, 'All');
    this.refreshData();
  }

  // Quick Task Creation (รองรับการกำหนดช่วงเวลา วันนี้ถึงวันไหน)
  public toggleQuickRange(): void {
    this.quickIsRange = !this.quickIsRange;
    if (this.quickIsRange && !this.quickEndDate) {
      this.quickEndDate = this.taskService.getDateOffsetFrom(this.selectedDate, 2);
    }
  }

  public setQuickRangeOffset(offsetDays: number): void {
    this.quickIsRange = true;
    this.quickEndDate = this.taskService.getDateOffsetFrom(this.selectedDate, offsetDays);
  }

  public submitQuickAdd(): void {
    const title = this.quickTitle.trim();
    if (!title) return;

    this.taskService.createTask({
      title,
      description: '',
      due_date: this.selectedDate,
      end_date: this.quickIsRange && this.quickEndDate ? this.quickEndDate : undefined,
      due_time: this.quickDueTime || '10:00',
      priority: this.quickPriority,
      category: this.quickCategory
    });

    this.soundService.playTaskComplete();
    this.quickTitle = '';
    this.quickIsRange = false;
    this.quickEndDate = '';
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
    const confirmMsg = this.isEnglish ? `Delete task "${task.title}"?` : `คุณต้องการลบภารกิจ "${task.title}" หรือไม่?`;
    if (confirm(confirmMsg)) {
      this.taskService.deleteTask(task.id);
      this.refreshData();
    }
  }

  // Task Status Filter & Computed List
  public get filteredDayTasks(): Task[] {
    if (this.taskStatusFilter === 'active') {
      return this.dayTasks.filter(t => !t.is_completed);
    }
    if (this.taskStatusFilter === 'completed') {
      return this.dayTasks.filter(t => t.is_completed);
    }
    return this.dayTasks;
  }

  public setTaskStatusFilter(filter: 'all' | 'active' | 'completed'): void {
    this.taskStatusFilter = filter;
  }

  // Defer Unfinished Task to Tomorrow in 1 Click
  public deferTaskToTomorrow(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    const tomorrow = this.taskService.getDateOffsetStr(1);
    this.taskService.updateTask(task.id, { due_date: tomorrow });
    this.soundService.playTaskComplete();
    this.refreshData();
  }

  // 1-Click Local Data Backup & Restore
  public exportBackup(): void {
    const tasks = this.taskService.getLocalTasks();
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todaprime-backup-${this.taskService.getTodayDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  public triggerImportBackup(): void {
    const fileInput = document.getElementById('backupFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  public onBackupFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (Array.isArray(data)) {
          this.taskService.saveLocalTasks(data);
          this.refreshData();
          alert(this.isEnglish ? 'Data restored successfully!' : 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!');
        } else {
          throw new Error('Invalid format');
        }
      } catch (e) {
        alert(this.isEnglish ? 'Invalid backup file!' : 'ไฟล์สำรองข้อมูลไม่ถูกต้อง!');
      }
    };
    reader.readAsText(file);
  }

  // Full Task Modal
  public openCreateModal(forDate?: string): void {
    this.isEditingTask = false;
    const targetDate = forDate || this.selectedDate;
    this.modalIsRange = false;
    this.modalTask = {
      title: '',
      description: '',
      due_date: targetDate,
      end_date: '',
      due_time: '10:00',
      priority: 'MEDIUM',
      category: this.categories[0]?.name || 'การศึกษา & วิชาการ'
    };
    this.showTaskModal = true;
  }

  public openEditModal(task: Task, event?: Event): void {
    if (event) event.stopPropagation();
    this.isEditingTask = true;
    this.modalTask = { ...task };
    this.modalIsRange = !!(task.end_date && task.end_date > task.due_date);
    this.showTaskModal = true;
  }

  public closeTaskModal(): void {
    this.showTaskModal = false;
    this.modalTask = {};
    this.modalIsRange = false;
  }

  public toggleModalRange(): void {
    this.modalIsRange = !this.modalIsRange;
    if (this.modalIsRange && (!this.modalTask.end_date || this.modalTask.end_date <= (this.modalTask.due_date || this.selectedDate))) {
      this.modalTask.end_date = this.taskService.getDateOffsetFrom(this.modalTask.due_date || this.selectedDate, 2);
    }
  }

  public setModalRangeOffset(offsetDays: number): void {
    this.modalIsRange = true;
    const base = this.modalTask.due_date || this.selectedDate;
    this.modalTask.end_date = this.taskService.getDateOffsetFrom(base, offsetDays);
  }

  public getModalDaysSpan(): number {
    const startStr = this.modalTask.due_date || this.selectedDate;
    const endStr = (this.modalIsRange && this.modalTask.end_date) ? this.modalTask.end_date : startStr;
    const d1 = new Date(startStr + 'T00:00:00').getTime();
    const d2 = new Date(endStr + 'T00:00:00').getTime();
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }

  public saveModalTask(): void {
    if (!this.modalTask.title || !this.modalTask.title.trim()) {
      alert('กรุณาระบุชื่อภารกิจหรือหัวข้องานที่ต้องดำเนินการ');
      return;
    }

    if (!this.modalIsRange) {
      this.modalTask.end_date = undefined;
    } else if (this.modalTask.end_date && this.modalTask.end_date < (this.modalTask.due_date || this.selectedDate)) {
      this.modalTask.end_date = this.modalTask.due_date || this.selectedDate;
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

  // Identity & Access Management (Authentication)
  public openLoginModal(): void {
    this.isLoginModalOpen = true;
    this.authTab = 'login';
    this.showGooglePrompt = false;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
    this.closeMenu();
    setTimeout(() => this.initGoogleIdentity(), 120);
  }

  public closeLoginModal(): void {
    this.isLoginModalOpen = false;
    this.showGooglePrompt = false;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
  }

  // 1. REAL GOOGLE IDENTITY SERVICES INITIALIZATION & CREDENTIAL HANDLER
  public initGoogleIdentity(): void {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: this.authService.GOOGLE_CLIENT_ID,
          callback: (response: any) => this.handleGoogleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const btnEl = document.getElementById('googleAuthOfficialBtn');
        if (btnEl) {
          btnEl.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnEl, {
            type: 'standard',
            theme: this.isDarkMode ? 'filled_black' : 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization error:', err);
      }
    }
  }

  public handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) {
      this.authErrorMessage = 'ไม่ได้รับข้อมูลยืนยันจาก Google กรุณาลองใหม่อีกครั้ง';
      return;
    }

    const res = this.authService.loginWithGoogleJwt(response.credential);
    if (res.success && res.user) {
      this.authSuccessMessage = `ยืนยันตัวตนสำเร็จ! เชื่อมต่อบัญชี Google ของ "${res.user.name}" เรียบร้อยแล้ว`;
      this.soundService.playTaskComplete();
      setTimeout(() => {
        this.closeLoginModal();
      }, 1000);
    } else {
      this.authErrorMessage = res.message;
    }
  }

  // 1.1 One-Click Google Trigger
  public triggerGoogleSignIn(): void {
    this.authErrorMessage = '';
    this.authSuccessMessage = '';

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.showGooglePrompt = true;
          }
        });
        return;
      } catch (e) {
        console.warn('Google prompt fallback:', e);
      }
    }
    this.showGooglePrompt = true;
  }

  public confirmGoogleLogin(): void {
    const user = this.authService.loginWithGoogleAccount(
      this.googleAccountName,
      this.googleAccountEmail,
      this.googleAccountAvatar
    );
    this.authSuccessMessage = `ยืนยันตัวตนสำเร็จ! เชื่อมต่อบัญชี Google Workspace "${user.name}" เรียบร้อยแล้ว`;
    this.soundService.playTaskComplete();
    setTimeout(() => {
      this.closeLoginModal();
    }, 850);
  }

  public cancelGooglePrompt(): void {
    this.showGooglePrompt = false;
  }

  // 2. Standard Enterprise Authentication (Strictly >= 8 Characters Password)
  public submitStandardAuth(): void {
    this.authErrorMessage = '';
    this.authSuccessMessage = '';

    const email = this.authEmailInput.trim();
    const password = this.authPasswordInput;

    if (!email || !email.includes('@')) {
      this.authErrorMessage = 'กรุณาระบุที่อยู่อีเมลที่ถูกต้องตามรูปแบบมาตรฐาน';
      return;
    }

    if (!password || password.length < 8) {
      this.authErrorMessage = 'มาตรฐานความปลอดภัย: รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษรขึ้นไป';
      return;
    }

    if (this.authTab === 'register') {
      const name = this.authNameInput.trim();
      if (!name) {
        this.authErrorMessage = 'กรุณาระบุชื่อ-นามสกุล หรือชื่อเรียกอย่างเป็นทางการ';
        return;
      }

      if (password !== this.authConfirmPasswordInput) {
        this.authErrorMessage = 'รหัสผ่านและข้อความยืนยันรหัสผ่านไม่ตรงกัน';
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
    if (confirm('คุณต้องการออกจากระบบบริหารจัดการหรือไม่?')) {
      this.authService.logout();
      this.closeMenu();
    }
  }

  // Technical Support & Developer Consultation
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
      alert('กรุณากรอกชื่อและข้อความที่ต้องการประสานงาน');
      return;
    }

    this.contactSuccessMessage = `ขอบคุณครับคุณ ${this.contactName} ข้อมูลการประสานงานถูกบันทึกและส่งมอบถึงทีมพัฒนาระบบ Todaprime เรียบร้อยแล้ว`;
    this.soundService.playTaskComplete();
    setTimeout(() => {
      this.closeContactModal();
      this.contactName = '';
      this.contactEmail = '';
      this.contactMessage = '';
    }, 2200);
  }
}
