export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  text: string; // Renamed from 'task' to 'text' to avoid conflict with 'task' function name
  deadline: string; // YYYY-MM-DD HH:mm
  priority: TaskPriority;
  durationEstimate?: string; // e.g., 1h, 30m
  isCompleted: boolean;
  // trackedTimeSeconds removed as it was part of the schedule feature
}
