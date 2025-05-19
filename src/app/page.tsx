
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import type { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { Brain, Trash2, Search } from 'lucide-react'; // Added Search icon
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input'; // Added Input import
import { parse } from 'date-fns';

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

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

  const handleDeleteAllTasks = () => {
    if (tasks.length === 0) return;
    setTasks([]);
    toast({
      title: "All Tasks Deleted",
      description: "All tasks have been removed from your list.",
      variant: "destructive",
    });
  };

  const now = new Date();

  // 1. Filter by search term first
  const searchedTasks = tasks.filter(task =>
    task.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Then filter searchedTasks into categories
  const doneTasks = searchedTasks.filter(task => task.isCompleted);
  
  const notDoneTasks = searchedTasks.filter(task => !task.isCompleted);

  const expiredTasks = notDoneTasks.filter(task => {
    try {
      const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
      return deadlineDate < now;
    } catch (e) {
      console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as not expired for filtering)`);
      return false; 
    }
  });

  const pendingTasks = notDoneTasks.filter(task => {
    const isExpired = expiredTasks.some(et => et.id === task.id);
    if (isExpired) return false; // If it's expired, it's not pending

    // For remaining not-done, not-expired tasks, check deadline or handle invalid date
    try {
      const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
      return deadlineDate >= now;
    } catch (e) {
      console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as pending)`);
      return true; // If date is invalid, treat as pending as per original logic
    }
  });


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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-primary">Your Task List</h3>
                {tasks.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center">
                       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                       <Input
                          type="search"
                          placeholder="Search tasks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-9 pl-10 pr-3 text-sm w-40 md:w-56" // Added width
                       />
                    </div>
                    <Button onClick={handleDeleteAllTasks} variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete All
                    </Button>
                  </div>
                )}
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                  <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
                  <TabsTrigger value="expired">Expired ({expiredTasks.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending">
                  <TaskInputList
                    tasks={pendingTasks}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleCompleteTaskInput}
                    onUpdateTask={handleUpdateTask}
                  />
                </TabsContent>
                <TabsContent value="done">
                  <TaskInputList
                    tasks={doneTasks}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleCompleteTaskInput}
                    onUpdateTask={handleUpdateTask}
                  />
                </TabsContent>
                <TabsContent value="expired">
                  <TaskInputList
                    tasks={expiredTasks}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleCompleteTaskInput}
                    onUpdateTask={handleUpdateTask}
                  />
                </TabsContent>
              </Tabs>
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
