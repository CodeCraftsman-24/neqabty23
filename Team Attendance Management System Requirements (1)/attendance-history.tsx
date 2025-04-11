"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface AttendanceRecord {
  id: number;
  check_in_time: string;
  check_out_time: string | null;
  duration: number | null;
  location_data: string;
  location_address: string | null;
  notes: string | null;
}

export default function AttendanceHistory({ 
  records 
}: { 
  records: AttendanceRecord[] 
}) {
  // Function to parse location data
  const parseLocation = (locationData: string) => {
    try {
      return JSON.parse(locationData);
    } catch (error) {
      return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const checkInDate = new Date(record.check_in_time);
                  const checkInTimeStr = checkInDate.toLocaleTimeString();
                  const checkInDateStr = checkInDate.toLocaleDateString();
                  
                  let checkOutTimeStr = '';
                  if (record.check_out_time) {
                    const checkOutDate = new Date(record.check_out_time);
                    checkOutTimeStr = checkOutDate.toLocaleTimeString();
                  }
                  
                  const location = parseLocation(record.location_data);
                  const locationStr = record.location_address || 
                    (location ? `Lat: ${location.latitude}, Long: ${location.longitude}` : '-');
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{checkInDateStr}</TableCell>
                      <TableCell>{checkInTimeStr}</TableCell>
                      <TableCell>
                        {record.check_out_time ? (
                          checkOutTimeStr
                        ) : (
                          <Badge variant="warning">Not checked out</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.duration ? `${record.duration} hours` : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={locationStr}>
                        {locationStr}
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={record.notes || ''}>
                        {record.notes || '-'}
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
                <p className="font-medium">No attendance records found.</p>
                <p className="text-sm">Your attendance history will appear here once you start checking in.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
