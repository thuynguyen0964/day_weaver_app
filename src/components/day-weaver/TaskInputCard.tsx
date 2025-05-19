
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Trash2, CalendarClock, AlertTriangle, Edit3, Save, Ban, CalendarIcon, FileText } from 'lucide-react'; // Added FileText, removed Clock3
import type { Task, TaskPriority } from '@/types/tasks';
import { cn } from '@/lib/utils';

// Schema for editing a task, similar to TaskForm
const editTaskSchema = z.object({
  text: z.string().min(1, 'Task description is required.'),
  deadlineDate: z.date().refine(val => val >= new Date(new Date().setHours(0,0,0,0)), {
    message: "Deadline must be today or in the future."
  }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."), // Corrected regex to allow 20-23 hours
  priority: z.enum(['High', 'Medium', 'Low']),
  note: z.string().optional(), // Changed from durationEstimate to note
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

interface TaskInputCardProps {
  task: Task;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => void;
}

export const TaskInputCard: FC<TaskInputCardProps> = ({ task, onDeleteTask, onToggleComplete, onUpdateTask }) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      text: task.text,
      deadlineDate: task.deadline ? parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()) : new Date(),
      deadlineTime: task.deadline ? format(parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()), 'HH:mm') : format(new Date(), "HH:mm"),
      priority: task.priority,
      note: task.note || '', // Changed from durationEstimate to note
    },
  });

  const priorityBadgeVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  const handleEdit = () => {
    reset({ 
      text: task.text,
      deadlineDate: task.deadline ? parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()) : new Date(),
      deadlineTime: task.deadline ? format(parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()), 'HH:mm') : format(new Date(), "HH:mm"),
      priority: task.priority,
      note: task.note || '', // Changed from durationEstimate to note
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const onSubmit: SubmitHandler<EditTaskFormData> = (data) => {
    const deadline = `${format(data.deadlineDate, 'yyyy-MM-dd')} ${data.deadlineTime}`;
    onUpdateTask(task.id, {
      text: data.text,
      deadline,
      priority: data.priority as TaskPriority,
      note: data.note, // Changed from durationEstimate to note
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="mb-4 shadow-lg border-primary border-2">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Edit3 className="mr-2 h-6 w-6 text-primary" />
            Edit Task: <span className="truncate ml-2 font-normal text-base">{task.text}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor={`edit-text-${task.id}`} className="block text-sm font-medium mb-1">Task Description</Label>
              <Input id={`edit-text-${task.id}`} {...register('text')} placeholder="e.g., Prepare presentation" />
              {errors.text && <p className="text-destructive text-xs mt-1">{errors.text.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`edit-deadlineDate-${task.id}`} className="block text-sm font-medium mb-1">Deadline Date</Label>
                <Controller
                  name="deadlineDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.deadlineDate && <p className="text-destructive text-xs mt-1">{errors.deadlineDate.message}</p>}
              </div>
              <div>
                  <Label htmlFor={`edit-deadlineTime-${task.id}`} className="block text-sm font-medium mb-1">Deadline Time (HH:MM)</Label>
                  <Input id={`edit-deadlineTime-${task.id}`} type="time" {...register('deadlineTime')} />
                  {errors.deadlineTime && <p className="text-destructive text-xs mt-1">{errors.deadlineTime.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`edit-priority-${task.id}`} className="block text-sm font-medium mb-1">Priority</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && <p className="text-destructive text-xs mt-1">{errors.priority.message}</p>}
              </div>
              <div>
                <Label htmlFor={`edit-note-${task.id}`} className="block text-sm font-medium mb-1">Note (Optional)</Label>
                <Textarea id={`edit-note-${task.id}`} {...register('note')} placeholder="Add any relevant notes..." />
                {errors.note && <p className="text-destructive text-xs mt-1">{errors.note.message}</p>}
              </div>
            </div>
            <CardFooter className="pt-4 pb-0 px-0 flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                <Ban className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("mb-4 transition-all duration-300 ease-in-out", task.isCompleted ? "bg-muted/50 opacity-70" : "bg-card hover:shadow-md")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-grow min-w-0">
            <Checkbox
              id={`complete-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={() => onToggleComplete(task.id)}
              className="mr-3 flex-shrink-0"
              aria-labelledby={`task-title-${task.id}`}
            />
            <CardTitle id={`task-title-${task.id}`} className={cn("text-lg truncate", task.isCompleted && "line-through")}>{task.text}</CardTitle>
          </div>
          <div className="flex-shrink-0 space-x-1">
            <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit task" disabled={task.isCompleted}>
              <Edit3 className="h-5 w-5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)} aria-label="Delete task">
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center">
            <CalendarClock className="h-4 w-4 mr-2" />
            <span>Deadline: {task.deadline}</span>
          </div>
          {task.note && ( // Display note if it exists
            <div className="flex items-start pt-1">
              <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="whitespace-pre-wrap break-words">Note: {task.note}</span>
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
