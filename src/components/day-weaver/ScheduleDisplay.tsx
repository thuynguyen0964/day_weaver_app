"use client";

import type { FC } from 'react';
import type { ScheduledTask } from '@/types/tasks';
import { ScheduledTaskCard } from './ScheduledTaskCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarCheck, Info } from 'lucide-react';

interface ScheduleDisplayProps {
  scheduledTasks: ScheduledTask[];
  aiNotes?: string;
  onUpdateTask: (updatedTask: ScheduledTask) => void;
}

export const ScheduleDisplay: FC<ScheduleDisplayProps> = ({ scheduledTasks, aiNotes, onUpdateTask }) => {
  if (scheduledTasks.length === 0 && !aiNotes) {
    return (
      <Alert>
        <CalendarCheck className="h-4 w-4" />
        <AlertTitle>No Schedule Generated</AlertTitle>
        <AlertDescription>
          Your AI-generated schedule will appear here once you add tasks and generate it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {aiNotes && (
        <Alert variant="default" className="bg-accent/30 border-accent">
          <Info className="h-5 w-5 text-accent-foreground" />
          <AlertTitle className="text-accent-foreground font-semibold">AI Notes & Suggestions</AlertTitle>
          <AlertDescription className="text-accent-foreground/80">
            {aiNotes}
          </AlertDescription>
        </Alert>
      )}
      {scheduledTasks.length > 0 ? (
        scheduledTasks.map((task) => (
          <ScheduledTaskCard
            key={task.id}
            task={task}
            onUpdateTask={onUpdateTask}
          />
        ))
      ) : (
         <Alert>
            <CalendarCheck className="h-4 w-4" />
            <AlertTitle>Schedule Complete or No Tasks</AlertTitle>
            <AlertDescription>
            The AI couldn't generate a schedule, or all tasks might be implicitly handled. Check AI notes for details.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
