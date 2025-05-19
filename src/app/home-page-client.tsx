
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/day-weaver/PageHeader';
import { TaskForm } from '@/components/day-weaver/TaskForm';
import { TaskInputList } from '@/components/day-weaver/TaskInputList';
import type { Task, TaskPriority } from '@/types/tasks';
import { useToast } from '@/hooks/use-toast';
import { Brain, Trash2, Search, ListChecks } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parse, isValid, parseISO, format } from 'date-fns';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';

const DEBOUNCE_DELAY = 300;
const ITEMS_PER_PAGE = 5;
const TASKS_COLLECTION = 'tasks';

export default function HomePageClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const tasksCollection = collection(db, TASKS_COLLECTION);
      const q = query(tasksCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedTasks: Task[] = querySnapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        
        let deadlineString: string;
        if (data.deadline instanceof Timestamp) {
          deadlineString = format(data.deadline.toDate(), 'yyyy-MM-dd HH:mm');
        } else if (typeof data.deadline === 'string') {
          deadlineString = data.deadline;
        } else {
          // Fallback for undefined or unexpected deadline types
          // console.warn(`Task ${docSnapshot.id} has an invalid or missing deadline. Defaulting.`);
          deadlineString = format(new Date(), 'yyyy-MM-dd HH:mm');
        }

        let createdAtString: string | undefined = undefined;
        if (data.createdAt instanceof Timestamp) {
          createdAtString = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtString = data.createdAt;
        }

        return {
          id: docSnapshot.id,
          text: data.text as string,
          deadline: deadlineString,
          priority: data.priority as TaskPriority,
          note: data.note as string | undefined,
          isCompleted: data.isCompleted as boolean,
          createdAt: createdAtString,
        };
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      toast({
        title: "Error Fetching Tasks",
        description: "Could not load tasks from the database.",
        variant: "destructive",
      })
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getPageForList = useCallback((listKey: string, totalItems: number): number => {
    if (!searchParams) return 1;
    const pageFromUrl = searchParams.get(listKey);
    let page = parseInt(pageFromUrl || '1', 10);
    if (isNaN(page) || page < 1) page = 1;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (totalPages > 0 && page > totalPages) page = totalPages;
    else if (totalPages === 0) page = 1;
    return page;
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams) return;
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
    return () => clearTimeout(handler);
  }, [inputValue, router, searchParams]);

  const handleAddTask = useCallback(async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => {
    const taskWithTimestampAndCreationDate = {
      ...newTaskData,
      isCompleted: false,
      createdAt: Timestamp.fromDate(new Date()), // Firestore Timestamp for ordering/querying
    };
    try {
      const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskWithTimestampAndCreationDate);
      const newTask: Task = {
        ...newTaskData,
        id: docRef.id,
        isCompleted: false,
        createdAt: new Date().toISOString(), // ISO string for local state and display
      };
      setTasks((prevTasks) => [newTask, ...prevTasks].sort((a, b) => {
          const dateA = a.createdAt ? parseISO(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? parseISO(b.createdAt) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        }));
      toast({ title: "Task Added", description: `"${newTask.text}" has been added.` });
    } catch (error) {
      console.error("Error adding task: ", error);
      toast({ title: "Error Adding Task", description: "Could not save the task.", variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      toast({ title: "Task Deleted", description: "The task has been removed." });
    } catch (error) {
      console.error("Error deleting task: ", error);
      toast({ title: "Error Deleting Task", description: "Could not delete the task.", variant: "destructive" });
    }
  }, [toast]);

  const handleToggleCompleteTaskInput = useCallback(async (taskId: string) => {
    const taskToUpdate = tasks.find(task => task.id === taskId);
    if (!taskToUpdate) return;
    const newCompletedStatus = !taskToUpdate.isCompleted;
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      await updateDoc(taskRef, { isCompleted: newCompletedStatus });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, isCompleted: newCompletedStatus } : task
        )
      );
    } catch (error) {
      console.error("Error updating task status: ", error);
      toast({ title: "Error Updating Task", description: "Could not update task status.", variant: "destructive" });
    }
  }, [tasks, toast]);

  const handleUpdateTask = useCallback(async (taskId: string, updatedTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => {
    try {
      const taskRef = doc(db, TASKS_COLLECTION, taskId);
      // When updating, we pass the deadline string as is, since Firestore will store it as a string.
      // createdAt is not updated here.
      await updateDoc(taskRef, updatedTaskData); 
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, ...updatedTaskData, id: task.id, isCompleted: task.isCompleted, createdAt: task.createdAt } : task
        )
      );
      toast({ title: "Task Updated", description: `"${updatedTaskData.text}" has been updated.` });
    } catch (error) {
      console.error("Error updating task: ", error);
      toast({ title: "Error Updating Task", description: "Could not update the task.", variant: "destructive" });
    }
  }, [toast]);

  const handleDeleteAllTasks = useCallback(async () => {
    if (tasks.length === 0) return;
    setIsLoading(true); 
    try {
      const tasksCollectionRef = collection(db, TASKS_COLLECTION);
      const querySnapshot = await getDocs(tasksCollectionRef);
      const batch = writeBatch(db);
      querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      setTasks([]);
      toast({
        title: "All Tasks Deleted",
        description: "All tasks have been removed from the database.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error deleting all tasks: ", error);
      toast({ title: "Error Deleting All Tasks", description: "Could not delete all tasks.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [tasks.length, toast]);

  const now = useMemo(() => new Date(), []);

  const tasksMatchingSearch = useMemo(() => {
    if (!searchTerm) return tasks; // If no search term, return all tasks
    return tasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);
  
  const doneTasks = useMemo(() => tasksMatchingSearch.filter(task => task.isCompleted), [tasksMatchingSearch]);
  const notDoneTasks = useMemo(() => tasksMatchingSearch.filter(task => !task.isCompleted), [tasksMatchingSearch]);

  const expiredTasks = useMemo(() => {
    return notDoneTasks.filter(task => {
      try {
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return isValid(deadlineDate) && deadlineDate < now;
      } catch (e) { return false; }
    });
  }, [notDoneTasks, now]);

  const pendingTasks = useMemo(() => {
    return notDoneTasks.filter(task => {
      const isExpired = expiredTasks.some(et => et.id === task.id);
      if (isExpired) return false; // Don't include if it's already in expiredTasks
      try {
        // Check if it's a valid date and not expired
        const deadlineDate = parse(task.deadline, 'yyyy-MM-dd HH:mm', new Date());
        return isValid(deadlineDate) && deadlineDate >= now;
      } catch (e) { 
        // If parsing fails or it's not a valid date for future/present, consider it pending (or handle error)
        return true; 
      }
    });
  }, [notDoneTasks, expiredTasks, now]);


  const activeSearchList = useMemo(() => {
    if (!inputValue && !searchTerm) return []; // No input, no debounced search term
    if (!searchTerm && inputValue) return []; // Input but not yet debounced (or debouncing)
    // This list is now just tasksMatchingSearch, pagination will apply to it
    return tasksMatchingSearch;
  }, [tasksMatchingSearch, searchTerm, inputValue]);


  const handlePageChange = useCallback((listKey: 'pendingPage' | 'donePage' | 'expiredPage' | 'searchPage', newPage: number) => {
    if (!searchParams) return;
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set(listKey, newPage.toString());
    router.push(`?${currentParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Pagination for Pending Tasks
  const currentPagePending = getPageForList('pendingPage', pendingTasks.length);
  const totalPendingPages = Math.ceil(pendingTasks.length / ITEMS_PER_PAGE);
  const paginatedPendingTasks = useMemo(() => {
    if (pendingTasks.length === 0) return [];
    const startIndex = (currentPagePending - 1) * ITEMS_PER_PAGE;
    return pendingTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [pendingTasks, currentPagePending]);

  // Pagination for Done Tasks
  const currentPageDone = getPageForList('donePage', doneTasks.length);
  const totalDonePages = Math.ceil(doneTasks.length / ITEMS_PER_PAGE);
  const paginatedDoneTasks = useMemo(() => {
    if (doneTasks.length === 0) return [];
    const startIndex = (currentPageDone - 1) * ITEMS_PER_PAGE;
    return doneTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [doneTasks, currentPageDone]);

  // Pagination for Expired Tasks
  const currentPageExpired = getPageForList('expiredPage', expiredTasks.length);
  const totalExpiredPages = Math.ceil(expiredTasks.length / ITEMS_PER_PAGE);
  const paginatedExpiredTasks = useMemo(() => {
    if (expiredTasks.length === 0) return [];
    const startIndex = (currentPageExpired - 1) * ITEMS_PER_PAGE;
    return expiredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [expiredTasks, currentPageExpired]);

  // Pagination for Search Results
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
        <Button onClick={() => handlePageChange(listKey, currentPage - 1)} disabled={currentPage === 1} variant="outline" size="sm">Previous</Button>
        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
        <Button onClick={() => handlePageChange(listKey, currentPage + 1)} disabled={currentPage === totalPages} variant="outline" size="sm">Next</Button>
      </div>
    );
  };
  
  const showSearchAndDeleteControls = tasks.length > 0 || inputValue;

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4 text-center">
        Loading tasks from database...
      </div>
    );
  }

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
                       <Input type="search" placeholder="Search tasks..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="h-9 pl-10 pr-3 text-sm w-40 md:w-56" />
                    </div>
                    {tasks.length > 0 && (
                        <Button onClick={handleDeleteAllTasks} variant="destructive" size="sm" disabled={isLoading}>
                          <Trash2 className="mr-1 h-4 w-4" /> Delete All
                        </Button>
                    )}
                  </div>
                )}
              </div>

              {inputValue ? ( // If user is typing in search
                <>
                  {isDebouncing ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : (
                    <>
                      <TaskInputList tasks={paginatedSearchTasks} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleCompleteTaskInput} onUpdateTask={handleUpdateTask} isSearchResult={true} />
                       {searchTerm && ( // Show count only after search term is set (debounced)
                          <p className="text-sm text-muted-foreground mt-2 text-center">
                            Found <strong className="text-foreground">{activeSearchList.length}</strong> matching your search.
                          </p>
                       )}
                      {renderPaginationControls('searchPage', currentPageSearch, totalSearchPages)}
                    </>
                  )}
                </>
              ) : tasks.length > 0 ? ( // Not searching, show tabs if tasks exist
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
                    <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
                    <TabsTrigger value="expired">Expired ({expiredTasks.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending">
                    <TaskInputList tasks={paginatedPendingTasks} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleCompleteTaskInput} onUpdateTask={handleUpdateTask} isSearchResult={false} />
                    {renderPaginationControls('pendingPage', currentPagePending, totalPendingPages)}
                  </TabsContent>
                  <TabsContent value="done">
                    <TaskInputList tasks={paginatedDoneTasks} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleCompleteTaskInput} onUpdateTask={handleUpdateTask} isSearchResult={false} />
                    {renderPaginationControls('donePage', currentPageDone, totalDonePages)}
                  </TabsContent>
                  <TabsContent value="expired">
                    <TaskInputList tasks={paginatedExpiredTasks} onDeleteTask={handleDeleteTask} onToggleComplete={handleToggleCompleteTaskInput} onUpdateTask={handleUpdateTask} isSearchResult={false}/>
                    {renderPaginationControls('expiredPage', currentPageExpired, totalExpiredPages)}
                  </TabsContent>
                </Tabs>
              ) : ( // No tasks and not searching
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

    