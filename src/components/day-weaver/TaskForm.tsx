
"use client";

import type { FC } from 'react';
import React from 'react'; // Import React for React.memo
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import type { Task, TaskPriority } from '@/types/tasks';

const taskSchema = z.object({
  text: z.string().min(1, 'Task description is required.'),
  deadlineDate: z.date().refine(val => val >= new Date(new Date().setHours(0,0,0,0)), {
    message: "Deadline must be today or in the future."
  }),
  deadlineTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)."),
  priority: z.enum(['High', 'Medium', 'Low']),
  note: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onAddTask: (task: Omit<Task, 'id' | 'isCompleted'>) => void;
}

// Wrap TaskForm with React.memo
export const TaskForm: FC<TaskFormProps> = React.memo(({ onAddTask }) => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'Medium',
      deadlineDate: new Date(),
      deadlineTime: format(new Date(), "HH:mm"),
      note: '',
    }
  });

  const onSubmit = (data: TaskFormData) => {
    const deadline = `${format(data.deadlineDate, 'yyyy-MM-dd')} ${data.deadlineTime}`;
    onAddTask({
      text: data.text,
      deadline,
      priority: data.priority as TaskPriority,
      note: data.note,
    });
    reset({
        text: '',
        priority: 'Medium',
        deadlineDate: new Date(),
        deadlineTime: format(new Date(), "HH:mm"),
        note: ''
    });
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <PlusCircle className="mr-2 h-6 w-6 text-primary" />
          Add New Task
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="text" className="block text-sm font-medium mb-1">Task Description</Label>
            <Input id="text" {...register('text')} placeholder="e.g., Prepare presentation" />
            {errors.text && <p className="text-destructive text-xs mt-1">{errors.text.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadlineDate" className="block text-sm font-medium mb-1">Deadline Date</Label>
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
                <Label htmlFor="deadlineTime" className="block text-sm font-medium mb-1">Deadline Time (HH:MM)</Label>
                <Input id="deadlineTime" type="time" {...register('deadlineTime')} />
                {errors.deadlineTime && <p className="text-destructive text-xs mt-1">{errors.deadlineTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</Label>
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
              <Label htmlFor="note" className="block text-sm font-medium mb-1">Note (Optional)</Label>
              <Input id="note" {...register('note')} placeholder="Add a short note..."/>
              {errors.note && <p className="text-destructive text-xs mt-1">{errors.note.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Task
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});
TaskForm.displayName = 'TaskForm'; // Good practice for React.memo
