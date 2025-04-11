"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export default function UserManagement({ 
  users 
}: { 
  users: User[] 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form action="/api/admin/add-user" method="POST" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  name="is_admin"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="is_admin" className="text-sm font-normal">Admin privileges</Label>
              </div>
              <Button type="submit" className="w-full">Add User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.is_admin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">User</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <form action="/api/admin/toggle-admin" method="POST" className="inline">
                        <input type="hidden" name="userId" value={user.id} />
                        <Button 
                          type="submit" 
                          variant="outline" 
                          size="sm"
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
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
                <p className="font-medium">No users found.</p>
                <p className="text-sm">Add users to get started.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
