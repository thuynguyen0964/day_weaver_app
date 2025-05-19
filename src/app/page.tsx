
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import type { Task } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { Brain, Trash2, Search, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
          setTasks([]);
        }
      } catch (error) {
        console.error("Failed to parse tasks from localStorage", error);
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dayWeaverTasks', JSON.stringify(tasks));
  }, [tasks]);

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

  const now = useMemo(() => new Date(), []);

  // Filtered list for when search is active
  const tasksMatchingSearch = useMemo(() => {
    if (!searchTerm) return []; // Only populate if there's an active search term
    return tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  // Lists for Tab view (when searchTerm is empty)
  const doneTasks = useMemo(() => {
    if (inputValue || searchTerm) return []; // Not used when searching
    return tasks.filter(task => task.isCompleted);
  }, [tasks, inputValue, searchTerm]);

  const notDoneTasksForTabs = useMemo(() => {
    if (inputValue || searchTerm) return []; // Not used when searching
    return tasks.filter(task => !task.isCompleted);
  }, [tasks, inputValue, searchTerm]);

  const expiredTasksForTabs = useMemo(() => {
    if (inputValue || searchTerm) return []; // Not used when searching
    return notDoneTasksForTabs.filter(task => {
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate < now;
      } catch (e) {
        console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as not expired for tab filtering)`);
        return false;
      }
    });
  }, [notDoneTasksForTabs, now, inputValue, searchTerm]);

  const pendingTasksForTabs = useMemo(() => {
    if (inputValue || searchTerm) return []; // Not used when searching
    return notDoneTasksForTabs.filter(task => {
      const isExpired = expiredTasksForTabs.some(et => et.id === task.id);
      if (isExpired) return false;
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate >= now;
      } catch (e) {
        console.warn(`Invalid date format for task "${task.text}": ${task.deadline} (classifying as pending for tab filtering)`);
        return true;
      }
    });
  }, [notDoneTasksForTabs, expiredTasksForTabs, now, inputValue, searchTerm]);


  const showSearchAndDeleteControls = tasks.length > 0 || inputValue;

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
                {showSearchAndDeleteControls && (
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center">
                       <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                       <Input
                          type="search"
                          placeholder="Search tasks..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          className="h-9 pl-10 pr-3 text-sm w-40 md:w-56"
                       />
                    </div>
                    {tasks.length > 0 && ( // Delete All only if there are tasks
                        <Button onClick={handleDeleteAllTasks} variant="destructive" size="sm"> {/* Changed size to sm */}
                          <Trash2 className="mr-2 h-4 w-4" /> Delete All
                        </Button>
                    )}
                  </div>
                )}
              </div>

              {inputValue || searchTerm ? ( // If searching (either actively typing or debounced term exists)
                <>
                  <TaskInputList
                    tasks={tasksMatchingSearch}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleCompleteTaskInput}
                    onUpdateTask={handleUpdateTask}
                    isSearchResult={true}
                  />
                  {/* Show count only if there were base tasks and a search is active/typed */}
                  {tasks.length > 0 && (inputValue || searchTerm) && (
                     <p className="text-sm text-muted-foreground mt-2 text-center">
                       Found <strong className="text-foreground">{tasksMatchingSearch.length}</strong> matching your search. {/* Updated text and added strong tag */}
                     </p>
                  )}
                </>
              ) : tasks.length > 0 ? ( // If not searching AND there are tasks, show tabs
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="pending">Pending ({pendingTasksForTabs.length})</TabsTrigger>
                    <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
                    <TabsTrigger value="expired">Expired ({expiredTasksForTabs.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending">
                    <TaskInputList
                      tasks={pendingTasksForTabs}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                  </TabsContent>
                  <TabsContent value="done">
                    <TaskInputList
                      tasks={doneTasks}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                  </TabsContent>
                  <TabsContent value="expired">
                    <TaskInputList
                      tasks={expiredTasksForTabs}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                  </TabsContent>
                </Tabs>
              ) : ( // If not searching AND no tasks, show global "No Tasks Yet"
                <Card className="text-center py-8 border-dashed">
                  <CardHeader>
                    <ListChecks className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <CardTitle className="text-xl font-semibold">No Tasks Yet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Add tasks using the form to get started.</CardDescription>
                  </CardContent>
                </Card>
              )}
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

