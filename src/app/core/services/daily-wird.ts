import { Injectable, computed, signal } from '@angular/core';

import { WirdProgress, WirdTask, WirdTaskView } from '../models/wird.model';

@Injectable({ providedIn: 'root' })
export class DailyWirdService {
  private readonly progressStoragePrefix = 'qurb_daily_wird_progress_';

  private readonly defaultTasks: WirdTask[] = [
    {
      id: 'tasbeeh',
      title: 'التسبيح',
      description: 'سبحان الله',
      type: 'counter',
      target: 100,
      unit: 'مرة',
      order: 1,
    },
    {
      id: 'tahmeed',
      title: 'التحميد',
      description: 'الحمد لله',
      type: 'counter',
      target: 100,
      unit: 'مرة',
      order: 2,
    },
    {
      id: 'takbeer',
      title: 'التكبير',
      description: 'الله أكبر',
      type: 'counter',
      target: 100,
      unit: 'مرة',
      order: 3,
    },
    {
      id: 'istighfar',
      title: 'الاستغفار',
      description: 'أستغفر الله',
      type: 'counter',
      target: 100,
      unit: 'مرة',
      order: 4,
    },
    {
      id: 'salawat',
      title: 'الصلاة على النبي',
      description: 'اللهم صل وسلم على نبينا محمد',
      type: 'counter',
      target: 100,
      unit: 'مرة',
      order: 5,
    },
    {
      id: 'quran-reading',
      title: 'قراءة القرآن',
      description: 'ورد قراءة يومي',
      type: 'counter',
      target: 1,
      unit: 'صفحة',
      order: 6,
    },
    {
      id: 'morning-azkar',
      title: 'أذكار الصباح',
      description: 'إتمام أذكار الصباح',
      type: 'check',
      target: 1,
      unit: 'ورد',
      order: 7,
    },
    {
      id: 'evening-azkar',
      title: 'أذكار المساء',
      description: 'إتمام أذكار المساء',
      type: 'check',
      target: 1,
      unit: 'ورد',
      order: 8,
    },
  ];

  private readonly todayKey = this.getTodayKey();
  private readonly progress = signal<WirdProgress[]>(this.loadTodayProgress());

  readonly tasks = signal<WirdTask[]>(this.defaultTasks);

  readonly taskViews = computed<WirdTaskView[]>(() => {
    return this.tasks()
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((task) => {
        const value = this.getTaskValue(task.id);
        const safeTarget = Math.max(task.target, 1);
        const progressPercentage = Math.min(Math.round((value / safeTarget) * 100), 100);

        return {
          ...task,
          value,
          extraValue: Math.max(value - task.target, 0),
          progressPercentage,
          isCompleted: value >= task.target,
        };
      });
  });

  readonly completedTasksCount = computed(() => {
    return this.taskViews().filter((task) => task.isCompleted).length;
  });

  readonly totalTasksCount = computed(() => {
    return this.tasks().length;
  });

  readonly overallProgressPercentage = computed(() => {
    const totalTasks = this.totalTasksCount();

    if (!totalTasks) {
      return 0;
    }

    const totalProgress = this.taskViews().reduce((sum, task) => {
      return sum + task.progressPercentage;
    }, 0);

    return Math.round(totalProgress / totalTasks);
  });

  readonly hasProgress = computed(() => {
    return this.progress().some((item) => item.value > 0);
  });

  increment(taskId: string, amount = 1): void {
    const task = this.getTaskById(taskId);

    if (!task) {
      return;
    }

    if (task.type === 'check') {
      this.setTaskValue(taskId, task.target);
      return;
    }

    const currentValue = this.getTaskValue(taskId);
    this.setTaskValue(taskId, currentValue + amount);
  }

  decrement(taskId: string, amount = 1): void {
    const task = this.getTaskById(taskId);

    if (!task || task.type === 'check') {
      return;
    }

    const currentValue = this.getTaskValue(taskId);
    this.setTaskValue(taskId, Math.max(currentValue - amount, 0));
  }

  toggleCheck(taskId: string): void {
    const task = this.getTaskById(taskId);

    if (!task || task.type !== 'check') {
      return;
    }

    const currentValue = this.getTaskValue(taskId);
    this.setTaskValue(taskId, currentValue >= task.target ? 0 : task.target);
  }

  resetTask(taskId: string): void {
    this.setTaskValue(taskId, 0);
  }

  resetToday(): void {
    this.progress.set([]);
    this.saveTodayProgress();
  }

  private setTaskValue(taskId: string, value: number): void {
    const safeValue = Math.max(value, 0);
    const currentProgress = this.progress();
    const existingItem = currentProgress.find((item) => item.taskId === taskId);

    let nextProgress: WirdProgress[];

    if (existingItem) {
      nextProgress = currentProgress.map((item) => {
        if (item.taskId !== taskId) {
          return item;
        }

        return {
          ...item,
          value: safeValue,
          updatedAt: new Date().toISOString(),
        };
      });
    } else {
      nextProgress = [
        ...currentProgress,
        {
          taskId,
          value: safeValue,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    this.progress.set(nextProgress);
    this.saveTodayProgress();
  }

  private getTaskValue(taskId: string): number {
    return this.progress().find((item) => item.taskId === taskId)?.value ?? 0;
  }

  private getTaskById(taskId: string): WirdTask | undefined {
    return this.tasks().find((task) => task.id === taskId);
  }

  private loadTodayProgress(): WirdProgress[] {
    try {
      const storedProgress = localStorage.getItem(`${this.progressStoragePrefix}${this.todayKey}`);

      if (!storedProgress) {
        return [];
      }

      const parsedProgress = JSON.parse(storedProgress) as WirdProgress[];

      if (!Array.isArray(parsedProgress)) {
        return [];
      }

      return parsedProgress;
    } catch {
      return [];
    }
  }

  private saveTodayProgress(): void {
    try {
      localStorage.setItem(
        `${this.progressStoragePrefix}${this.todayKey}`,
        JSON.stringify(this.progress()),
      );
    } catch {
      return;
    }
  }

  private getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
