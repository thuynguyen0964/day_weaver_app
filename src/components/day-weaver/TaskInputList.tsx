
"use client";

import type { FC } from 'react';
import type { Task } from '@/types/tasks';
import { TaskInputCard } from './TaskInputCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, SearchX } from 'lucide-react'; // Added SearchX

interface TaskInputListProps {
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => void;
  isSearchResult?: boolean; // Added prop
}

export const TaskInputList: FC<TaskInputListProps> = ({
  tasks,
  onDeleteTask,
  onToggleComplete,
  onUpdateTask,
  isSearchResult = false, // Default to false
}) => {
  if (tasks.length === 0) {
    if (isSearchResult) {
      return (
        <Card className="text-center py-8 border-dashed">
          <CardHeader>
            <SearchX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle className="text-xl font-semibold">No Tasks Found</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>No tasks match your current search criteria.</CardDescription>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="text-center py-8 border-dashed">
        <CardHeader>
          <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle className="text-xl font-semibold">No Tasks Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Add tasks using the form to get started.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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
