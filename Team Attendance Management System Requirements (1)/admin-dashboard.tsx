"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/lib/auth";
import { Attendance } from "@/lib/attendance";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  user: User;
  recentAttendance: Attendance[];
  userCount: number;
  attendanceCount: number;
}

export default function AdminDashboard({ 
  user, 
  recentAttendance, 
  userCount, 
  attendanceCount 
}: DashboardProps) {
  // Function to parse location data
  const parseLocation = (locationData: string) => {
    try {
      return JSON.parse(locationData);
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Logged in as <span className="font-medium">{user.username}</span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceCount}</div>
            <p className="text-xs text-muted-foreground">
              Total attendance records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentAttendance.filter(a => {
                const today = new Date().toISOString().split('T')[0];
                return new Date(a.check_in_time).toISOString().split('T')[0] === today;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Users who checked in today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentAttendance.filter(a => !a.check_out_time).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Users currently checked in
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentAttendance.slice(0, 5).map((record) => {
                  const checkInDate = new Date(record.check_in_time);
                  const timeAgo = getTimeAgo(checkInDate);
                  
                  const location = parseLocation(record.location_data);
                  const locationStr = record.location_address || 
                    (location ? `Lat: ${location.latitude}, Long: ${location.longitude}` : 'Unknown location');
                  
                  return (
                    <div className="flex items-center" key={record.id}>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          User #{record.user_id} checked in
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {timeAgo} at {locationStr}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {record.check_out_time ? (
                          <Badge variant="outline">Completed</Badge>
                        ) : (
                          <Badge>Active</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {recentAttendance.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent attendance records
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <a href="/admin/users">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 mb-2"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Manage Users</span>
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                  <a href="/admin/reports">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-6 w-6 mb-2"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    <span>View Reports</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffMins > 0) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}
