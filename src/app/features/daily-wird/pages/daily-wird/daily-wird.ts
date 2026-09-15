import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  LucideCheck,
  LucideMinus,
  LucidePlus,
  LucideRotateCcw,
  LucideSparkles,
} from '@lucide/angular';
import { HotToastService } from '@ngxpert/hot-toast';

import { DailyWirdService } from '../../../../core/services/daily-wird';

@Component({
  selector: 'app-daily-wird',
  imports: [LucideCheck, LucideMinus, LucidePlus, LucideRotateCcw, LucideSparkles],
  templateUrl: './daily-wird.html',
  styleUrl: './daily-wird.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyWird {
  private readonly dailyWirdService = inject(DailyWirdService);
  private readonly toastService = inject(HotToastService);

  readonly tasks = this.dailyWirdService.taskViews;
  readonly completedTasksCount = this.dailyWirdService.completedTasksCount;
  readonly totalTasksCount = this.dailyWirdService.totalTasksCount;
  readonly overallProgressPercentage = this.dailyWirdService.overallProgressPercentage;
  readonly hasProgress = this.dailyWirdService.hasProgress;

  readonly todayLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  increment(taskId: string, amount = 1): void {
    this.dailyWirdService.increment(taskId, amount);
  }

  decrement(taskId: string): void {
    this.dailyWirdService.decrement(taskId);
  }

  toggleCheck(taskId: string): void {
    this.dailyWirdService.toggleCheck(taskId);
  }

  resetTask(taskId: string): void {
    this.dailyWirdService.resetTask(taskId);
  }

  resetToday(): void {
    this.dailyWirdService.resetToday();
    this.toastService.info('تم تصفير ورد اليوم');
  }
}
