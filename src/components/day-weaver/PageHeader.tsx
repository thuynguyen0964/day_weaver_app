import { CalendarDays } from 'lucide-react';

export function PageHeader() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 md:px-8 md:py-6 flex items-center">
        <CalendarDays className="h-8 w-8 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold">Day Weaver</h1>
      </div>
    </header>
  );
}
