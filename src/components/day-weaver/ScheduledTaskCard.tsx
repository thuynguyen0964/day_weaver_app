"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause, RotateCcw, AlertTriangle, CalendarClock, Clock3 } from 'lucide-react';
import type { ScheduledTask } from '@/types/tasks';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { formatSecondsToHMS } from '@/lib/formatTime';
import { cn } from '@/lib/utils';

interface ScheduledTaskCardProps {
  task: ScheduledTask;
  onUpdateTask: (updatedTask: ScheduledTask) => void;
}

export const ScheduledTaskCard: FC<ScheduledTaskCardProps> = ({ task, onUpdateTask }) => {
  const { isRunning, elapsedSeconds, start, stop, reset } = useTimeTracker(task.trackedTimeSeconds);

  const priorityBadgeVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  const handleToggleComplete = () => {
    if (isRunning) stop();
    onUpdateTask({ ...task, isCompleted: !task.isCompleted, trackedTimeSeconds: elapsedSeconds });
  };

  const handleTimeTrackerAction = () => {
    if (isRunning) {
      stop();
      onUpdateTask({ ...task, trackedTimeSeconds: elapsedSeconds }); // Persist time when paused
    } else {
      start();
    }
  };
  
  const handleResetTimer = () => {
    reset();
    onUpdateTask({ ...task, trackedTimeSeconds: 0 });
  }

  // Sync elapsedSeconds to task when it changes
  // This is important if the component unmounts while timer is running, for example.
  // However, this could lead to frequent updates. For now, update on stop/toggleComplete.
  // useEffect(() => {
  //   if (isRunning) { // Only update if actively running and time changes
  //     const timerId = setTimeout(() => { // Debounce or throttle if needed
  //        onUpdateTask({ ...task, trackedTimeSeconds: elapsedSeconds });
  //     }, 1000); // Example: update task state every second timer is running
  //     return () => clearTimeout(timerId);
  //   }
  // }, [elapsedSeconds, isRunning, task, onUpdateTask]);


  return (
    <Card className={cn("mb-4 transition-all duration-300 ease-in-out group", task.isCompleted ? "bg-muted/50 opacity-70" : "bg-card hover:shadow-lg")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
           <div className="flex items-center">
            <Checkbox
              id={`scheduled-complete-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={handleToggleComplete}
              className="mr-3"
              aria-labelledby={`scheduled-task-title-${task.id}`}
            />
            <CardTitle id={`scheduled-task-title-${task.id}`} className={cn("text-lg", task.isCompleted && "line-through")}>{task.text}</CardTitle>
          </div>
          <Badge variant={priorityBadgeVariant[task.priority]} className="flex items-center ml-auto mr-2">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0 space-y-2">
        <div className="flex items-center text-sm font-semibold text-primary">
          <Clock className="h-4 w-4 mr-2" />
          <span>{task.startTime} - {task.endTime}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center">
                <CalendarClock className="h-3 w-3 mr-2" />
                <span>Deadline: {task.deadline}</span>
            </div>
            {task.durationEstimate && (
                <div className="flex items-center">
                <Clock3 className="h-3 w-3 mr-2" />
                <span>Est. Duration: {task.durationEstimate}</span>
                </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Button
            variant={isRunning ? "outline" : "default"}
            size="sm"
            onClick={handleTimeTrackerAction}
            disabled={task.isCompleted}
            className="w-28"
          >
            {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isRunning ? 'Pause' : 'Start'} Timer
          </Button>
           <Button variant="ghost" size="icon" onClick={handleResetTimer} disabled={task.isCompleted || isRunning || elapsedSeconds === 0} aria-label="Reset timer">
             <RotateCcw className="h-4 w-4" />
           </Button>
        </div>
        <div className="text-sm font-mono tabular-nums text-foreground bg-muted px-2 py-1 rounded-md">
          {formatSecondsToHMS(elapsedSeconds)}
        </div>
      </CardFooter>
    </Card>
  );
};
