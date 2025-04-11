import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getDefaultDateRange() {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  return {
    startDate: oneMonthAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
}

export function generateCSV(data: any[], headers: string[]): string {
  // Create header row
  let csvContent = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle strings with commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      
      return value;
    });
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}
