
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import type { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { Brain, Trash2, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { parse } from 'date-fns';

const DEBOUNCE_DELAY = 300; // 300ms delay for search debounce

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [inputValue, setInputValue] = useState(''); // Raw input value from the search field
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search term

  useEffect(() => {
    const storedTasks = localStorage.getItem('dayWeaverTasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        if (Array.isArray(parsedTasks)) {
          setTasks(parsedTasks);
        } else {
          setTasks([]); // Reset if stored data is not an array
        }
      } catch (error) {
        console.error("Failed to parse tasks from localStorage", error);
        setTasks([]); // Reset on error
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dayWeaverTasks', JSON.stringify(tasks));
  }, [tasks]);

  // Debounce effect for search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue]);

  const handleAddTask = useCallback((newTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now().toString(),
      isCompleted: false,
    };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.text}" has been added to your list.` });
  }, [toast]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    toast({ title: "Task Deleted", description: "The task has been removed." });
  }, [toast]);

  const handleToggleCompleteTaskInput = useCallback((taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  }, []);

  const handleUpdateTask = useCallback((taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updatedTaskData, id: task.id, isCompleted: task.isCompleted } : task
      )
    );
    toast({ title: "Task Updated", description: `"${updatedTaskData.text}" has been updated.` });
  }, [toast]);

  const handleDeleteAllTasks = useCallback(() => {
    if (tasks.length === 0) return;
    setTasks([]);
    toast({
      title: "All Tasks Deleted",
      description: "All tasks have been removed from your list.",
      variant: "destructive",
    });
  }, [tasks.length, toast]);

  const now = useMemo(() => new Date(), []); // Memoize 'now' if it's only needed once per render cycle related to tasks/search

  const searchedTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const doneTasks = useMemo(() => {
    return searchedTasks.filter(task => task.isCompleted);
  }, [searchedTasks]);
  
  const notDoneTasks = useMemo(() => {
    return searchedTasks.filter(task => !task.isCompleted);
  }, [searchedTasks]);

  const expiredTasks = useMemo(() => {
    return notDoneTasks.filter(task => {
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate < now;
      } catch (e) {
        console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as not expired for filtering)`);
        return false; 
      }
    });
  }, [notDoneTasks, now]);

  const pendingTasks = useMemo(() => {
    return notDoneTasks.filter(task => {
      const isExpired = expiredTasks.some(et => et.id === task.id);
      if (isExpired) return false;

      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate >= now;
      } catch (e) {
        console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as pending)`);
        return true;
      }
    });
  }, [notDoneTasks, expiredTasks, now]);


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
                {(tasks.length > 0 || inputValue) && ( // Show controls if there are tasks OR if user is typing in search
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center">
                       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                       <Input
                          type="search"
                          placeholder="Search tasks..."
                          value={inputValue} // Use inputValue for direct input binding
                          onChange={(e) => setInputValue(e.target.value)} // Update inputValue
                          className="h-9 pl-10 pr-3 text-sm w-40 md:w-56"
                       />
                    </div>
                    {tasks.length > 0 && (
                        <Button onClick={handleDeleteAllTasks} variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete All
                        </Button>
                    )}
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
