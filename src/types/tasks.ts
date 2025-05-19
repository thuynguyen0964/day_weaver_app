
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  text: string; // Renamed from 'task' to 'text' to avoid conflict with 'task' function name
  deadline: string; // YYYY-MM-DD HH:mm
  priority: TaskPriority;
  note?: string; // Replaced durationEstimate with note
  isCompleted: boolean;
  createdAt?: string; // Timestamp of when the task was created
}
