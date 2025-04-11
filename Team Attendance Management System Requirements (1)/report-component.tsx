"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface AttendanceReport {
  id: number;
  user_id: number;
  username: string;
  check_in_time: string;
  check_out_time: string | null;
  duration: number | null;
  location_data: string;
  location_address: string | null;
  notes: string | null;
}

export default function ReportComponent({ 
  reports,
  users,
  filters,
  onFilterChange
}: { 
  reports: AttendanceReport[];
  users: User[];
  filters: {
    startDate: string;
    endDate: string;
    userId: number | null;
  };
  onFilterChange: (filters: any) => void;
}) {
  // Function to parse location data
  const parseLocation = (locationData: string) => {
    try {
      return JSON.parse(locationData);
    } catch (error) {
      return null;
    }
  };

  // Function to handle export as CSV
  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/reports/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate CSV');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Function to handle export as PDF
  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user">User</Label>
              <Select 
                value={filters.userId?.toString() || "0"} 
                onValueChange={(value) => onFilterChange({ ...filters, userId: parseInt(value) })}
              >
                <SelectTrigger id="user">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleExportCSV}
              >
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleExportPDF}
              >
                Export PDF
              </Button>
            </div>
          </div>

          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => {
                    const checkInDate = new Date(report.check_in_time);
                    const checkInTimeStr = checkInDate.toLocaleTimeString();
                    const checkInDateStr = checkInDate.toLocaleDateString();
                    
                    let checkOutTimeStr = '';
                    if (report.check_out_time) {
                      const checkOutDate = new Date(report.check_out_time);
                      checkOutTimeStr = checkOutDate.toLocaleTimeString();
                    }
                    
                    const location = parseLocation(report.location_data);
                    const locationStr = report.location_address || 
                      (location ? `Lat: ${location.latitude}, Long: ${location.longitude}` : '-');
                    
                    return (
                      <TableRow key={report.id}>
                        <TableCell>{report.username}</TableCell>
                        <TableCell>{checkInDateStr}</TableCell>
                        <TableCell>{checkInTimeStr}</TableCell>
                        <TableCell>
                          {report.check_out_time ? (
                            checkOutTimeStr
                          ) : (
                            <Badge variant="warning">Not checked out</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {report.duration ? `${report.duration} hours` : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={locationStr}>
                          {locationStr}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={report.notes || ''}>
                          {report.notes || '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              <div className="flex">
                <div className="py-1 mr-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <p className="font-medium">No attendance records found for the selected filters.</p>
                  <p className="text-sm">Try adjusting your filter criteria to see more results.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
