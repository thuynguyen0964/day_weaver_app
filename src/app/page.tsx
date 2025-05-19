
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import type { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { Brain } from 'lucide-react'; 
import { Card, CardDescription, CardContent } from '@/components/ui/card'; 

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedTasks = localStorage.getItem('dayWeaverTasks');
    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dayWeaverTasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(), 
      isCompleted: false,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.text}" has been added to your list.` });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast({ title: "Task Deleted", description: "The task has been removed." });
  };

  const handleToggleCompleteTaskInput = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };
  
  const handleUpdateTask = (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTaskData, id: task.id, isCompleted: task.isCompleted } : task
      )
    );
    toast({ title: "Task Updated", description: `"${updatedTaskData.text}" has been updated.` });
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
                onUpdateTask={handleUpdateTask} 
              />
            </div>
          </div>
        </section>

      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t mt-auto">
        Day Weaver &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

    