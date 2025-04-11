import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import AttendanceForm from "@/components/attendance-form";
import { getAttendanceStatus, getAttendanceHistory } from "@/lib/attendance";

export default async function Home() {
  const userId = requireAuth();
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>Error loading user data</div>;
  }
  
  const status = await getAttendanceStatus(user.id);
  const history = await getAttendanceHistory(user.id, 5);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user.username}</h1>
          <p className="text-gray-500">Manage your attendance records</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/history">View History</Link>
          </Button>
          {user.is_admin && (
            <Button asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid gap-8">
        <AttendanceForm 
          status={status.status} 
          attendance={status.attendance}
        />
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map((record) => {
                const checkInDate = new Date(record.check_in_time);
                const checkInDateStr = checkInDate.toLocaleDateString();
                const checkInTimeStr = checkInDate.toLocaleTimeString();
                
                let duration = '';
                if (record.check_out_time) {
                  const checkOutDate = new Date(record.check_out_time);
                  const durationMs = checkOutDate.getTime() - checkInDate.getTime();
                  const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
                  duration = `${durationHours} hours`;
                }
                
                return (
                  <div key={record.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{checkInDateStr}</div>
                        <div className="text-sm text-gray-500">
                          Check-in: {checkInTimeStr}
                        </div>
                        {record.check_out_time && (
                          <div className="text-sm text-gray-500">
                            Check-out: {new Date(record.check_out_time).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {record.check_out_time ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Completed ({duration})
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    {record.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        Notes: {record.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity found
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button asChild variant="outline">
              <Link href="/history">View All History</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
