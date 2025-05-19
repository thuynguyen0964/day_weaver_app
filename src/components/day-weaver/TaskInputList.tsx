
"use client";

import type { FC } from 'react';
import type { Task } from '@/types/tasks';
import { TaskInputCard } from './TaskInputCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

interface TaskInputListProps {
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => void;
}

export const TaskInputList: FC<TaskInputListProps> = ({ tasks, onDeleteTask, onToggleComplete, onUpdateTask }) => {
  if (tasks.length === 0) {
    return (
      <Card className="text-center py-8 border-dashed">
        <CardHeader>
          <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle className="text-xl font-semibold">No Tasks Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Add tasks using the form above to get started.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2 text-primary">Your Task List</h3>
      {tasks.map((task) => (
        <TaskInputCard
          key={task.id}
          task={task}
          onDeleteTask={onDeleteTask}
          onToggleComplete={onToggleComplete}
          onUpdateTask={onUpdateTask}
        />
      ))}
    </div>
  );
};

    