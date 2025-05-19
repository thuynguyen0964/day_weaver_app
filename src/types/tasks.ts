
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string; // Firestore document ID
  text: string;
  deadline: string; // YYYY-MM-DD HH:mm
  priority: TaskPriority;
  note?: string;
  isCompleted: boolean;
  createdAt?: string; // ISO string timestamp
  reactions?: { [emoji: string]: number }; // Added reactions field
}
