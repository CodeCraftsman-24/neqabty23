"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface Location {
  latitude: number;
  longitude: number;
}

interface Attendance {
  id: number;
  user_id: number;
  check_in_time: string;
  check_out_time: string | null;
  location_data: string;
  location_address: string | null;
  notes: string | null;
}

export default function AttendanceForm({ 
  status, 
  attendance 
}: { 
  status: 'checked_in' | 'checked_out';
  attendance?: Attendance | null;
}) {
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current location when component mounts
  useEffect(() => {
    if (status === 'checked_out') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            setLocationError(null);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Unable to get your location. Please enable location services.');
          }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser.');
      }
    }
  }, [status]);
  
  const handleCheckIn = async () => {
    if (!location) {
      setLocationError('Location is required for check-in.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          notes: notes.trim() || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in');
      }
      
      // Reload the page to update status
      window.location.reload();
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCheckOut = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out');
      }
      
      // Reload the page to update status
      window.location.reload();
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {status === 'checked_out' ? (
            <>
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="py-1 mr-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">You are currently not checked in.</p>
                    <p className="text-sm">Use the form below to check in for today.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {locationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {locationError}
                  </div>
                )}
                
                {location && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    <p className="font-medium">Location detected</p>
                    <p className="text-sm">
                      Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
                    </p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about your check-in..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button 
                  onClick={handleCheckIn} 
                  disabled={!location || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Checking in...' : 'Check In'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                <div className="flex">
                  <div className="py-1 mr-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">You are currently checked in.</p>
                    <p className="text-sm">
                      Checked in at: {attendance ? new Date(attendance.check_in_time).toLocaleString() : 'Unknown'}
                    </p>
                    {attendance?.notes && (
                      <p className="text-sm mt-2">
                        Notes: {attendance.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleCheckOut} 
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? 'Checking out...' : 'Check Out'}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
