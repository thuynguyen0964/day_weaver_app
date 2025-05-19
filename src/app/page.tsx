
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
const ITEMS_PER_PAGE = 5;

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [inputValue, setInputValue] = useState(''); // Raw input value from the search field
  const [searchTerm, setSearchTerm] = useState(''); // Debounced search term
  const [isDebouncing, setIsDebouncing] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const getPageForList = useCallback((listKey: string, totalItems: number): number => {
    if (!searchParams) { // Guard against null searchParams
      return 1; // Default to page 1 if searchParams not ready
    }
    const pageFromUrl = searchParams.get(listKey);
    let page = parseInt(pageFromUrl || '1', 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages > 0 && page > totalPages) {
      page = totalPages;
    } else if (totalPages === 0) {
      page = 1; // Default to page 1 if no items
    }
    return page;
  }, [searchParams]);

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
    if (!searchParams) { // Guard: wait for searchParams to be available
      return;
    }

    if (!inputValue) {
      setSearchTerm("");
      setIsDebouncing(false); // Reset debouncing state
      const currentParams = new URLSearchParams(searchParams.toString());
      if (currentParams.has('searchPage') && currentParams.get('searchPage') !== '1') {
          currentParams.set('searchPage', '1');
          router.replace(`?${currentParams.toString()}`, { scroll: false });
      }
      return;
    }

    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setSearchTerm(inputValue);
      setIsDebouncing(false);

      const currentParams = new URLSearchParams(searchParams.toString());
      if (currentParams.get('searchPage') !== '1') {
        currentParams.set('searchPage', '1');
        router.replace(`?${currentParams.toString()}`, { scroll: false });
      }
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, router, searchParams]);


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

  const tasksMatchingSearch = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);
  
  const doneTasks = useMemo(() => {
    return tasks.filter(task => task.isCompleted);
  }, [tasks]);

  const notDoneTasksForTabs = useMemo(() => {
    return tasks.filter(task => !task.isCompleted);
  }, [tasks]);

  const expiredTasksForTabs = useMemo(() => {
    return notDoneTasksForTabs.filter(task => {
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate < now;
      } catch (e) {
        return false;
      }
    });
  }, [notDoneTasksForTabs, now]);

  const pendingTasksForTabs = useMemo(() => {
    return notDoneTasksForTabs.filter(task => {
      const isExpired = expiredTasksForTabs.some(et => et.id === task.id);
      if (isExpired) return false;
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return deadlineDate >= now;
      } catch (e) {
        return true;
      }
    });
  }, [notDoneTasksForTabs, expiredTasksForTabs, now]);


  const activeSearchList = useMemo(() => {
    if (!inputValue && !searchTerm) return [];
    if (!searchTerm && inputValue) return []; 
    return tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm, inputValue]);


  const handlePageChange = useCallback((listKey: 'pendingPage' | 'donePage' | 'expiredPage' | 'searchPage', newPage: number) => {
    if (!searchParams) { // Guard against null searchParams
      return;
    }
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set(listKey, newPage.toString());
    router.push(`?${currentParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const currentPagePending = getPageForList('pendingPage', pendingTasksForTabs.length);
  const totalPendingPages = Math.ceil(pendingTasksForTabs.length / ITEMS_PER_PAGE);
  const paginatedPendingTasks = useMemo(() => {
    if (pendingTasksForTabs.length === 0) return [];
    const startIndex = (currentPagePending - 1) * ITEMS_PER_PAGE;
    return pendingTasksForTabs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [pendingTasksForTabs, currentPagePending]);

  const currentPageDone = getPageForList('donePage', doneTasks.length);
  const totalDonePages = Math.ceil(doneTasks.length / ITEMS_PER_PAGE);
  const paginatedDoneTasks = useMemo(() => {
    if (doneTasks.length === 0) return [];
    const startIndex = (currentPageDone - 1) * ITEMS_PER_PAGE;
    return doneTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [doneTasks, currentPageDone]);

  const currentPageExpired = getPageForList('expiredPage', expiredTasksForTabs.length);
  const totalExpiredPages = Math.ceil(expiredTasksForTabs.length / ITEMS_PER_PAGE);
  const paginatedExpiredTasks = useMemo(() => {
    if (expiredTasksForTabs.length === 0) return [];
    const startIndex = (currentPageExpired - 1) * ITEMS_PER_PAGE;
    return expiredTasksForTabs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [expiredTasksForTabs, currentPageExpired]);
  
  const currentPageSearch = getPageForList('searchPage', activeSearchList.length);
  const totalSearchPages = Math.ceil(activeSearchList.length / ITEMS_PER_PAGE);
  const paginatedSearchTasks = useMemo(() => {
    if (activeSearchList.length === 0) return [];
    const startIndex = (currentPageSearch - 1) * ITEMS_PER_PAGE;
    return activeSearchList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeSearchList, currentPageSearch]);

  const renderPaginationControls = (
    listKey: 'pendingPage' | 'donePage' | 'expiredPage' | 'searchPage',
    currentPage: number,
    totalPages: number
  ) => {
    if (totalPages <= 1) return null;
    return (
      <div className="mt-4 flex items-center justify-center space-x-2">
        <Button
          onClick={() => handlePageChange(listKey, currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          onClick={() => handlePageChange(listKey, currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
        >
          Next
        </Button>
      </div>
    );
  };

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
                    {tasks.length > 0 && (
                        <Button onClick={handleDeleteAllTasks} variant="destructive" size="sm">
                          <Trash2 className="mr-1 h-4 w-4" /> Delete All
                        </Button>
                    )}
                  </div>
                )}
              </div>

              {inputValue ? (
                <>
                  {isDebouncing ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : (
                    <>
                      <TaskInputList
                        tasks={paginatedSearchTasks}
                        onDeleteTask={handleDeleteTask}
                        onToggleComplete={handleToggleCompleteTaskInput}
                        onUpdateTask={handleUpdateTask}
                        isSearchResult={true}
                      />
                       {searchTerm && (
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            Found <strong className="text-foreground">{activeSearchList.length}</strong> matching your search.
                          </p>
                       )}
                      {renderPaginationControls('searchPage', currentPageSearch, totalSearchPages)}
                    </>
                  )}
                </>
              ) : tasks.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="pending">Pending ({pendingTasksForTabs.length})</TabsTrigger>
                    <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
                    <TabsTrigger value="expired">Expired ({expiredTasksForTabs.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending">
                    <TaskInputList
                      tasks={paginatedPendingTasks}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                    {renderPaginationControls('pendingPage', currentPagePending, totalPendingPages)}
                  </TabsContent>
                  <TabsContent value="done">
                    <TaskInputList
                      tasks={paginatedDoneTasks}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                    {renderPaginationControls('donePage', currentPageDone, totalDonePages)}
                  </TabsContent>
                  <TabsContent value="expired">
                    <TaskInputList
                      tasks={paginatedExpiredTasks}
                      onDeleteTask={handleDeleteTask}
                      onToggleComplete={handleToggleCompleteTaskInput}
                      onUpdateTask={handleUpdateTask}
                      isSearchResult={false}
                    />
                    {renderPaginationControls('expiredPage', currentPageExpired, totalExpiredPages)}
                  </TabsContent>
                </Tabs>
              ) : (
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

