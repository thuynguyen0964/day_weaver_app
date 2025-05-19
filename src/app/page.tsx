"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import { ScheduleDisplay } from '@/components/day-weaver/ScheduleDisplay';
import type { Task, ScheduledTask } from '@/types/tasks';
import { generateDailySchedule, type GenerateDailyScheduleInput, type GenerateDailyScheduleOutput } from '@/ai/flows/generate-daily-schedule';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Brain } from 'lucide-react';
import { Card, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduledTask[] | null>(null);
  const [aiNotes, setAiNotes] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load tasks from localStorage on initial mount
  useEffect(() => {
    const storedTasks = localStorage.getItem('dayWeaverTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
    const storedSchedule = localStorage.getItem('dayWeaverSchedule');
    if (storedSchedule) {
      setGeneratedSchedule(JSON.parse(storedSchedule));
    }
    const storedAiNotes = localStorage.getItem('dayWeaverAiNotes');
    if (storedAiNotes) {
      setAiNotes(storedAiNotes);
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dayWeaverTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (generatedSchedule) {
      localStorage.setItem('dayWeaverSchedule', JSON.stringify(generatedSchedule));
    } else {
      localStorage.removeItem('dayWeaverSchedule');
    }
  }, [generatedSchedule]);
  
  useEffect(() => {
    if (aiNotes) {
      localStorage.setItem('dayWeaverAiNotes', aiNotes);
    } else {
      localStorage.removeItem('dayWeaverAiNotes');
    }
  }, [aiNotes]);


  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'trackedTimeSeconds'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(), // Simple ID generation
      isCompleted: false,
      trackedTimeSeconds: 0,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.text}" has been added to your list.` });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    // Also remove from generated schedule if present
    if (generatedSchedule) {
        setGeneratedSchedule(prevSchedule => prevSchedule?.filter(st => st.id !== taskId) || null);
    }
    toast({ title: "Task Deleted", description: "The task has been removed." });
  };

  const handleToggleCompleteTaskInput = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };
  
  const handleUpdateTaskInSchedule = (updatedTask: ScheduledTask) => {
    setGeneratedSchedule((prevSchedule) =>
      prevSchedule 
        ? prevSchedule.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        : null
    );
    // Also update in the source tasks list for consistency if needed
    setTasks(prevTasks => 
        prevTasks.map(task => 
            task.id === updatedTask.id ? { ...task, isCompleted: updatedTask.isCompleted, trackedTimeSeconds: updatedTask.trackedTimeSeconds } : task
        )
    );
  };


  const handleGenerateSchedule = async () => {
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Please add some tasks before generating a schedule.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setGeneratedSchedule(null); // Clear previous schedule
    setAiNotes(undefined);

    const aiInputTasks: GenerateDailyScheduleInput['tasks'] = tasks
      .filter(task => !task.isCompleted) // Only send uncompleted tasks to AI
      .map((task) => ({
        task: task.text,
        deadline: task.deadline,
        priority: task.priority,
        ...(task.durationEstimate && { durationEstimate: task.durationEstimate }),
      }));

    if (aiInputTasks.length === 0) {
        toast({ title: "All Tasks Completed!", description: "There are no pending tasks to schedule.", variant: "default" });
        setIsLoading(false);
        setGeneratedSchedule([]); // Set to empty array to show "no tasks" message in ScheduleDisplay
        return;
    }

    try {
      const result: GenerateDailyScheduleOutput = await generateDailySchedule({ tasks: aiInputTasks });
      
      const newScheduledTasks: ScheduledTask[] = result.schedule.map((aiScheduledTask) => {
        // Find the original task to preserve its ID and other properties
        // This assumes task text is unique enough for matching, or use a more robust ID mapping if AI could return IDs
        const originalTask = tasks.find(t => t.text === aiScheduledTask.task && t.priority === aiScheduledTask.priority && t.deadline === aiScheduledTask.deadline);
        return {
          id: originalTask ? originalTask.id : Date.now().toString() + Math.random(), // Fallback ID
          text: aiScheduledTask.task,
          deadline: aiScheduledTask.deadline,
          priority: aiScheduledTask.priority,
          durationEstimate: aiScheduledTask.durationEstimate,
          startTime: aiScheduledTask.startTime,
          endTime: aiScheduledTask.endTime,
          isCompleted: originalTask ? originalTask.isCompleted : false, // Preserve completion status
          trackedTimeSeconds: originalTask ? originalTask.trackedTimeSeconds : 0, // Preserve tracked time
        };
      });

      setGeneratedSchedule(newScheduledTasks);
      setAiNotes(result.notes);
      toast({ title: "Schedule Generated!", description: "Your AI-powered schedule is ready." });
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({ title: "Generation Failed", description: "Could not generate schedule. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        <section id="task-management" aria-labelledby="task-management-heading">
          <h2 id="task-management-heading" className="text-2xl font-semibold mb-4 text-center md:text-left flex items-center justify-center md:justify-start">
            <Brain className="mr-2 h-7 w-7 text-primary"/> Plan Your Day
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <TaskForm onAddTask={handleAddTask} />
            </div>
            <div>
              <TaskInputList
                tasks={tasks}
                onDeleteTask={handleDeleteTask}
                onToggleComplete={handleToggleCompleteTaskInput}
              />
            </div>
          </div>
        </section>

        <Separator />
        
        <div className="text-center">
          <Button onClick={handleGenerateSchedule} disabled={isLoading || tasks.length === 0} size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-5 w-5" />
            )}
            Generate My Schedule
          </Button>
        </div>

        {(generatedSchedule || isLoading) && (
          <section id="generated-schedule-section" aria-labelledby="generated-schedule-heading">
            <h2 id="generated-schedule-heading" className="text-2xl font-semibold my-6 text-center md:text-left">
              AI-Powered Schedule
            </h2>
            {isLoading && !generatedSchedule && (
                 <Card className="p-6 text-center">
                    <CardContent className="flex flex-col items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <CardDescription>Generating your optimal schedule...</CardDescription>
                    </CardContent>
                </Card>
            )}
            {generatedSchedule && (
              <ScheduleDisplay
                scheduledTasks={generatedSchedule}
                aiNotes={aiNotes}
                onUpdateTask={handleUpdateTaskInSchedule}
              />
            )}
          </section>
        )}
        {!generatedSchedule && !isLoading && tasks.length > 0 && (
           <Card className="p-6 text-center mt-8 border-dashed">
             <CardContent>
                <CardDescription>Your optimized schedule will appear here once generated.</CardDescription>
             </CardContent>
           </Card>
        )}
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        Day Weaver &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
