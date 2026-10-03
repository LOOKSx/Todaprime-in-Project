import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from './services/task.service';
import { SoundService } from './services/sound.service';
import { Task, Subtask, Habit, TodayStats, Priority, RecurringType } from './models/task.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // Current Date & View
  public selectedDate: string = this.getTodayDateString();
  public displayDateText: string = '';
  public currentTimeStr: string = '';
  public activeTab: 'tasks' | 'calendar' | 'timeline' | 'habits' = 'tasks';
  public isDarkMode: boolean = true;

  // Interactive Calendar & Planner
  public calendarYear: number = new Date().getFullYear();
  public calendarMonth: number = new Date().getMonth(); // 0-11
  public calendarMonthName: string = '';
  public calendarDays: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }> = [];

  // Filters & Search
  public searchQuery: string = '';
  public selectedCategory: string = 'All';
  public selectedPriority: string = 'All';
  public selectedStatus: 'all' | 'active' | 'completed' = 'all';

  // Quick Add Task Form
  public quickTitle: string = '';
  public quickDueTime: string = '09:00';
  public quickPriority: Priority = 'MEDIUM';
  public quickCategory: string = 'การบ้าน (Homework)';
  public quickIsPrime: boolean = false;

  // Task Edit Modal
  public showModal: boolean = false;
  public modalTask: Partial<Task> = this.getBlankTask();
  public modalSubtasks: string[] = [];
  public newSubtaskInput: string = '';

  // Pomodoro Focus Timer
  public pomodoroMinutes: number = 25;
  public pomodoroSeconds: number = 0;
  public pomodoroTotalDuration: number = 25;
  public pomodoroRunning: boolean = false;
  public pomodoroMode: 'focus' | 'short_break' | 'long_break' = 'focus';
  public pomodoroLinkedTask: Task | null = null;
  private pomodoroTimerInterval: any = null;

  // Smart Reminder & Alarms
  public activeAlarmTask: Task | null = null;
  private notifiedTaskIds = new Set<string>();
  private reminderCheckerInterval: any = null;
  private clockInterval: any = null;

  // Daily Review / Celebration
  public showReviewModal: boolean = false;

  // New Habit Modal
  public showHabitModal: boolean = false;
  public newHabitTitle: string = '';
  public newHabitIcon: string = '⭐';

  // Hours for timeline view (08:00 - 22:00)
  public timelineHours = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  constructor(
    public taskService: TaskService,
    public soundService: SoundService
  ) {}

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.startReminderChecker();
    this.generateCalendar();
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
    if (this.reminderCheckerInterval) clearInterval(this.reminderCheckerInterval);
    if (this.pomodoroTimerInterval) clearInterval(this.pomodoroTimerInterval);
  }

  public getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public getTomorrowDateString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public updateClock(): void {
    const now = new Date();
    this.currentTimeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.updateDisplayDateText();
  }

  private updateDisplayDateText(): void {
    const today = this.getTodayDateString();
    const tomorrow = this.getTomorrowDateString();
    if (this.selectedDate === today) {
      this.displayDateText = 'วันนี้ (Today)';
    } else if (this.selectedDate === tomorrow) {
      this.displayDateText = 'พรุ่งนี้ (Tomorrow)';
    } else {
      const d = new Date(this.selectedDate + 'T00:00:00');
      this.displayDateText = d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  public setDateOffset(offsetDays: number): void {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;
    this.generateCalendar();
    this.loadData();
  }

  public resetToToday(): void {
    this.selectedDate = this.getTodayDateString();
    this.generateCalendar();
    this.loadData();
  }

  public jumpToTomorrow(): void {
    this.selectedDate = this.getTomorrowDateString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.calendarYear = tomorrow.getFullYear();
    this.calendarMonth = tomorrow.getMonth();
    this.generateCalendar();
    this.loadData();
  }

  // Generate 7x5 or 7x6 calendar grid for the month
  public generateCalendar(): void {
    const firstDayOfMonth = new Date(this.calendarYear, this.calendarMonth, 1);
    const lastDayOfMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDays = lastDayOfMonth.getDate();

    const todayStr = this.getTodayDateString();
    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(this.calendarYear, this.calendarMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = this.calendarMonth === 0 ? 12 : this.calendarMonth;
      const prevY = this.calendarMonth === 0 ? this.calendarYear - 1 : this.calendarYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(this.calendarMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${this.calendarYear}-${monthStr}-${dayStr}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate
      });
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = this.calendarMonth === 11 ? 1 : this.calendarMonth + 2;
      const nextY = this.calendarMonth === 11 ? this.calendarYear + 1 : this.calendarYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === this.selectedDate
      });
    }

    this.calendarDays = days;
    const monthDate = new Date(this.calendarYear, this.calendarMonth, 1);
    this.calendarMonthName = monthDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  }

  public prevCalendarMonth(): void {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else {
      this.calendarMonth--;
    }
    this.generateCalendar();
  }

  public nextCalendarMonth(): void {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth++;
    }
    this.generateCalendar();
  }

  public todayCalendarMonth(): void {
    const now = new Date();
    this.calendarYear = now.getFullYear();
    this.calendarMonth = now.getMonth();
    this.selectedDate = this.getTodayDateString();
    this.generateCalendar();
    this.loadData();
  }

  public selectCalendarDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.generateCalendar();
    this.loadData();
  }

  public getTasksForCalendarDay(tasks: Task[], dateStr: string): Task[] {
    if (!tasks) return [];
    return tasks.filter(t => t.due_date === dateStr);
  }

  public getDeadlineStatus(dueDateStr: string): { text: string; cssClass: string } {
    if (!dueDateStr) return { text: '', cssClass: '' };
    const today = this.getTodayDateString();
    if (dueDateStr === today) {
      return { text: '⚡ ส่งวันนี้!', cssClass: 'deadline-today' };
    }
    const d1 = new Date(today + 'T00:00:00');
    const d2 = new Date(dueDateStr + 'T00:00:00');
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return { text: '🚨 ส่งพรุ่งนี้!', cssClass: 'deadline-tomorrow' };
    } else if (diffDays > 1) {
      return { text: `📅 อีก ${diffDays} วัน`, cssClass: 'deadline-upcoming' };
    } else {
      return { text: `⚠️ เลย ${Math.abs(diffDays)} วัน`, cssClass: 'deadline-overdue' };
    }
  }

  public loadData(): void {
    this.updateDisplayDateText();
    this.taskService.fetchTasks(
      this.selectedDate,
      this.selectedCategory,
      this.selectedPriority,
      this.selectedStatus,
      this.searchQuery
    ).subscribe();
    this.taskService.fetchTodayStats().subscribe();
    this.taskService.fetchHabits().subscribe();
  }

  // Filter handlers
  public onFilterChange(): void {
    this.loadData();
  }

  // Toggle Dark/Light Mode
  public toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
  }

  // Quick Add
  public submitQuickAdd(): void {
    if (!this.quickTitle.trim()) return;

    this.taskService.createTask({
      title: this.quickTitle.trim(),
      description: '',
      due_date: this.selectedDate,
      due_time: this.quickDueTime || '09:00',
      priority: this.quickPriority,
      category: this.quickCategory,
      is_prime: this.quickIsPrime,
      estimated_minutes: 25,
      reminder_enabled: true,
      recurring: 'none'
    }).subscribe(() => {
      this.soundService.playTaskComplete();
      this.quickTitle = '';
      this.quickIsPrime = false;
      this.loadData();
    });
  }

  // Toggle task complete
  public toggleTask(task: Task): void {
    this.taskService.toggleTask(task.id, this.selectedDate).subscribe(() => {
      if (!task.is_completed) {
        this.soundService.playTaskComplete();
      }
      this.loadData();
    });
  }

  // Delete task
  public deleteTask(id: number): void {
    if (confirm('คุณต้องการลบงานนี้ใช่หรือไม่?')) {
      this.taskService.deleteTask(id, this.selectedDate).subscribe(() => {
        this.loadData();
      });
    }
  }

  // Toggle Prime Star
  public togglePrime(task: Task, event: Event): void {
    event.stopPropagation();
    const updated = !task.is_prime;
    this.taskService.updateTask(task.id, { ...task, is_prime: updated }).subscribe(() => {
      this.loadData();
    });
  }

  // Subtasks
  public addSubtaskToTask(task: Task, inputEl: HTMLInputElement): void {
    const title = inputEl.value.trim();
    if (!title) return;
    this.taskService.addSubtask(task.id, title, this.selectedDate).subscribe(() => {
      inputEl.value = '';
      this.loadData();
    });
  }

  public toggleSubtask(st: Subtask): void {
    this.taskService.toggleSubtask(st.id, this.selectedDate).subscribe(() => {
      this.soundService.playTaskComplete();
      this.loadData();
    });
  }

  public deleteSubtask(st: Subtask): void {
    this.taskService.deleteSubtask(st.id, this.selectedDate).subscribe(() => {
      this.loadData();
    });
  }

  // Habits
  public toggleHabit(habit: Habit): void {
    this.taskService.toggleHabit(habit.id).subscribe(() => {
      this.soundService.playTaskComplete();
    });
  }

  public createHabit(): void {
    if (!this.newHabitTitle.trim()) return;
    this.taskService.createHabit(this.newHabitTitle.trim(), this.newHabitIcon || '⭐').subscribe(() => {
      this.newHabitTitle = '';
      this.showHabitModal = false;
      this.taskService.fetchHabits().subscribe();
    });
  }

  public deleteHabit(id: number): void {
    if (confirm('ต้องการลบนิสัยนี้หรือไม่?')) {
      this.taskService.deleteHabit(id).subscribe();
    }
  }

  // Smart Reminder Engine
  private startReminderChecker(): void {
    this.reminderCheckerInterval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeFormatted = `${currentHours}:${currentMinutes}`;
      const today = this.getTodayDateString();

      this.taskService.tasks$.subscribe(tasks => {
        tasks.forEach(t => {
          if (!t.is_completed && t.reminder_enabled && t.due_date === today && t.due_time) {
            const reminderKey = `${t.id}-${today}-${t.due_time}`;
            if (t.due_time === currentTimeFormatted && !this.notifiedTaskIds.has(reminderKey)) {
              this.notifiedTaskIds.add(reminderKey);
              this.activeAlarmTask = t;
              this.soundService.showDesktopNotification(
                `⏰ ถึงเวลาทำ: ${t.title}`,
                `กำหนดเวลา ${t.due_time} | ระดับความสำคัญ: ${t.priority}`
              );
            }
          }
        });
      }).unsubscribe();
    }, 10000);
  }

  public dismissAlarm(): void {
    this.activeAlarmTask = null;
  }

  public testReminderSound(): void {
    this.soundService.playReminderAlert();
  }

  // Pomodoro Focus Timer
  public startPomodoroForTask(task: Task): void {
    this.pomodoroLinkedTask = task;
    this.setPomodoroMode('focus');
    this.startPomodoro();
  }

  public setPomodoroMode(mode: 'focus' | 'short_break' | 'long_break'): void {
    this.pausePomodoro();
    this.pomodoroMode = mode;
    if (mode === 'focus') {
      this.pomodoroTotalDuration = 25;
    } else if (mode === 'short_break') {
      this.pomodoroTotalDuration = 5;
    } else {
      this.pomodoroTotalDuration = 15;
    }
    this.pomodoroMinutes = this.pomodoroTotalDuration;
    this.pomodoroSeconds = 0;
  }

  public startPomodoro(): void {
    if (this.pomodoroRunning) return;
    this.pomodoroRunning = true;
    this.pomodoroTimerInterval = setInterval(() => {
      if (this.pomodoroSeconds === 0) {
        if (this.pomodoroMinutes === 0) {
          // Finished!
          this.finishPomodoro();
        } else {
          this.pomodoroMinutes--;
          this.pomodoroSeconds = 59;
        }
      } else {
        this.pomodoroSeconds--;
      }
    }, 1000);
  }

  public pausePomodoro(): void {
    this.pomodoroRunning = false;
    if (this.pomodoroTimerInterval) {
      clearInterval(this.pomodoroTimerInterval);
      this.pomodoroTimerInterval = null;
    }
  }

  public resetPomodoro(): void {
    this.pausePomodoro();
    this.pomodoroMinutes = this.pomodoroTotalDuration;
    this.pomodoroSeconds = 0;
  }

  private finishPomodoro(): void {
    this.pausePomodoro();
    this.soundService.playPomodoroDone();
    const duration = this.pomodoroTotalDuration;
    const taskId = this.pomodoroLinkedTask ? this.pomodoroLinkedTask.id : null;
    this.taskService.logPomodoro(taskId, duration, this.pomodoroMode).subscribe(() => {
      alert(`🎉 เสร็จสิ้นช่วงเวลา ${this.pomodoroMode === 'focus' ? 'โฟกัส 25 นาที' : 'พักเบรก'} เรียบร้อยแล้ว!`);
      this.resetPomodoro();
    });
  }

  // Full Task Modal
  public openCreateModal(): void {
    this.modalTask = this.getBlankTask();
    this.modalSubtasks = [];
    this.newSubtaskInput = '';
    this.showModal = true;
  }

  public openEditModal(task: Task): void {
    this.modalTask = { ...task };
    this.modalSubtasks = task.subtasks ? task.subtasks.map(s => s.title) : [];
    this.newSubtaskInput = '';
    this.showModal = true;
  }

  public closeModal(): void {
    this.showModal = false;
  }

  public addModalSubtask(): void {
    if (!this.newSubtaskInput.trim()) return;
    this.modalSubtasks.push(this.newSubtaskInput.trim());
    this.newSubtaskInput = '';
  }

  public removeModalSubtask(index: number): void {
    this.modalSubtasks.splice(index, 1);
  }

  public saveModalTask(): void {
    if (!this.modalTask.title || !this.modalTask.title.trim()) {
      alert('กรุณากรอกชื่องาน');
      return;
    }

    if (this.modalTask.id) {
      // Update existing
      this.taskService.updateTask(this.modalTask.id, this.modalTask).subscribe(() => {
        this.closeModal();
        this.loadData();
      });
    } else {
      // Create new
      this.taskService.createTask({
        ...this.modalTask,
        subtasks: this.modalSubtasks
      }).subscribe(() => {
        this.closeModal();
        this.soundService.playTaskComplete();
        this.loadData();
      });
    }
  }

  private getBlankTask(): Partial<Task> {
    return {
      title: '',
      description: '',
      due_date: this.selectedDate,
      due_time: '09:00',
      priority: 'MEDIUM',
      category: 'Work',
      is_prime: false,
      estimated_minutes: 25,
      reminder_enabled: true,
      recurring: 'none'
    };
  }

  // Helpers
  public getCompletedSubtasksCount(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(s => s.is_completed).length;
  }

  public getSubtasksProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    return (this.getCompletedSubtasksCount(task) / task.subtasks.length) * 100;
  }

  public openReviewModal(): void {
    this.showReviewModal = true;
  }

  public closeReviewModal(): void {
    this.showReviewModal = false;
  }

  public getPrimeTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => t.is_prime && !t.is_completed);
  }

  public getRegularTasks(tasks: Task[]): Task[] {
    return tasks.filter(t => !t.is_prime);
  }

  public getTasksForHour(tasks: Task[], hourStr: string): Task[] {
    const hourPrefix = hourStr.substring(0, 2);
    return tasks.filter(t => t.due_time && t.due_time.startsWith(hourPrefix));
  }
}
