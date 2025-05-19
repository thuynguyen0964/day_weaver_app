
"use client";

import type { FC } from 'react';
import React, { useState } from 'react'; // Import React for React.memo
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, CalendarClock, AlertTriangle, Edit3, Save, Ban, CalendarIcon, FileText, Bell, Send } from 'lucide-react';
import type { Task, TaskPriority } from '@/types/tasks';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Schema for editing a task, similar to TaskForm
const editTaskSchema = z.object({
  text: z.string().min(1, 'Task description is required.'),
  deadlineDate: z.date().refine(val => val >= new Date(new Date().setHours(0,0,0,0)), {
    message: "Deadline must be today or in the future."
  }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  priority: z.enum(['High', 'Medium', 'Low']),
  note: z.string().optional(),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

const emailSchema = z.string().email({ message: "Invalid email address." });

interface TaskInputCardProps {
  task: Task;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onUpdateTask: (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => void;
}

// Wrap TaskInputCard with React.memo
export const TaskInputCard: FC<TaskInputCardProps> = React.memo(({ task, onDeleteTask, onToggleComplete, onUpdateTask }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    // Ensure defaultValues are updated if task prop changes while editing form is not visible
    // This is implicitly handled by re-mounting or re-initializing useForm if isEditing becomes true
    // or key prop changes. For direct prop updates while form is visible, a useEffect might be needed.
    // However, for this case, defaultValues are set when edit mode begins.
    defaultValues: {
      text: task.text,
      deadlineDate: task.deadline ? parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()) : new Date(),
      deadlineTime: task.deadline ? format(parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()), 'HH:mm') : format(new Date(), "HH:mm"),
      priority: task.priority,
      note: task.note || '',
    },
  });

  const priorityBadgeVariant = {
    High: 'destructive',
    Medium: 'secondary',
    Low: 'outline',
  } as const;

  const handleEdit = () => {
    reset({ // Reset form with current task values when entering edit mode
      text: task.text,
      deadlineDate: task.deadline ? parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()) : new Date(),
      deadlineTime: task.deadline ? format(parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date()), 'HH:mm') : format(new Date(), "HH:mm"),
      priority: task.priority,
      note: task.note || '',
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
      note: data.note,
    });
    setIsEditing(false);
  };

  const handleSendReminder = async () => {
    try {
      emailSchema.parse(reminderEmail);
      setEmailError(null);

      toast({
        title: "Reminder Set (Simulated)",
        description: `Reminder for "${task.text}" will be sent to ${reminderEmail}.`,
      });

      setReminderEmail('');
      setIsReminderDialogOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      } else {
        console.error("Error processing reminder:", error);
        toast({
          title: "Error",
          description: "Could not process the reminder request.",
          variant: "destructive",
        });
      }
    }
  };

  let isTaskActuallyExpired = false;
  if (!task.isCompleted) {
    try {
      const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
      if (deadlineDate < new Date()) {
        isTaskActuallyExpired = true;
      }
    } catch (e) {
      console.warn(`Invalid date format for task "${task.text}" in TaskInputCard: ${task.deadline}`);
    }
  }

  const showBellAndEditIcons = !task.isCompleted && !isTaskActuallyExpired;


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
                <Input id={`edit-note-${task.id}`} {...register('note')} placeholder="Add a short note..." />
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
    <Card className={cn("mb-4 transition-all duration-300 ease-in-out", task.isCompleted ? "bg-muted/50 opacity-70" : "bg-card hover:shadow-md", isTaskActuallyExpired && !task.isCompleted ? "border-destructive/50 border-2" : "")}>
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
            {showBellAndEditIcons && (
              <>
                <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Set reminder" disabled={task.isCompleted}>
                      <Bell className="h-5 w-5 text-yellow-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Enter your email to get notify about this task</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 items-center gap-4">
                        <Input
                          id={`reminder-email-${task.id}`}
                          type="email"
                          value={reminderEmail}
                          onChange={(e) => {
                            setReminderEmail(e.target.value);
                            if (emailError) setEmailError(null);
                          }}
                          className="col-span-1"
                          placeholder="you@example.com"
                        />
                      </div>
                      {emailError && <p className="text-destructive text-xs col-span-1 text-right -mt-2">{emailError}</p>}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                         <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="button" onClick={handleSendReminder}>
                        <Send className="mr-2 h-4 w-4" /> Send Reminder
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit task" disabled={task.isCompleted}>
                  <Edit3 className="h-5 w-5 text-blue-600" />
                </Button>
              </>
            )}
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
            {isTaskActuallyExpired && !task.isCompleted && (
              <Badge variant="destructive" className="ml-2 text-xs">EXPIRED</Badge>
            )}
          </div>
          {task.note && (
            <div className="flex items-start pt-1">
              <FileText className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span className="whitespace-pre-wrap break-words italic">Note: {task.note}</span>
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
});
TaskInputCard.displayName = 'TaskInputCard'; // Good practice for React.memo
