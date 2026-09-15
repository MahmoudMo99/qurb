export type WirdTaskType = 'counter' | 'check';

export interface WirdTask {
  id: string;
  title: string;
  description: string;
  type: WirdTaskType;
  target: number;
  unit: string;
  order: number;
}

export interface WirdProgress {
  taskId: string;
  value: number;
  updatedAt: string;
}

export interface WirdTaskView extends WirdTask {
  value: number;
  extraValue: number;
  isCompleted: boolean;
  progressPercentage: number;
}
