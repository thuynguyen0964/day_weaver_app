"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trash2, CalendarClock, AlertTriangle, Clock3 } from 'lucide-react';
import type { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface TaskInputCardProps {
  task: Task;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
}

export const TaskInputCard: FC<TaskInputCardProps> = ({ task, onDeleteTask, onToggleComplete }) => {
  const priorityBadgeVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  return (
    <Card className={cn("mb-4 transition-all duration-300 ease-in-out", task.isCompleted ? "bg-muted/50 opacity-70" : "bg-card hover:shadow-md")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox
              id={`complete-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              className="mr-3"
              aria-labelledby={`task-title-${task.id}`}
            />
            <CardTitle id={`task-title-${task.id}`} className={cn("text-lg", task.isCompleted && "line-through")}>{task.text}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)} aria-label="Delete task">
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center">
            <CalendarClock className="h-4 w-4 mr-2" />
            <span>Deadline: {task.deadline}</span>
          </div>
          {task.durationEstimate && (
            <div className="flex items-center">
              <Clock3 className="h-4 w-4 mr-2" />
              <span>Est. Duration: {task.durationEstimate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-3">
        <Badge variant={priorityBadgeVariant[task.priority]} className="flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {task.priority} Priority
        </Badge>
      </CardFooter>
    </Card>
  );
};
