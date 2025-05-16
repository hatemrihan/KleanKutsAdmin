'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Textarea } from "@/components/ui/textarea" ;
import { toast } from 'react-hot-toast';
import axios from 'axios';
import Nav from "../../sections/nav";

interface WaitlistEntry {
  _id: string;
  email: string;
  createdAt: string;
  status: 'pending' | 'contacted' | 'subscribed';
  notes: string;
  source: string;
}

export default function WaitlistPage() {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editEntry, setEditEntry] = useState<WaitlistEntry | null>(null);
  const [notes, setNotes] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchWaitlistEntries();
  }, [statusFilter]);
  
  const fetchWaitlistEntries = async () => {
    setIsLoading(true);
    try {
      const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await axios.get(`/api/waitlist${queryParams}`);
      setWaitlistEntries(response.data.waitlistEntries);
    } catch (error) {
      console.error('Error fetching waitlist entries:', error);
      toast.error('Failed to load waitlist entries');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateEntryStatus = async (id: string, status: string) => {
    try {
      await axios.put('/api/waitlist', {
        id,
        status
      });
      
      setWaitlistEntries(entries => 
        entries.map(entry => 
          entry._id === id ? { ...entry, status: status as any } : entry
        )
      );
      
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  
  const saveNotes = async () => {
    if (!editEntry) return;
    
    try {
      await axios.put('/api/waitlist', {
        id: editEntry._id,
        notes
      });
      
      setWaitlistEntries(entries => 
        entries.map(entry => 
          entry._id === editEntry._id ? { ...entry, notes } : entry
        )
      );
      
      toast.success('Notes saved successfully');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };
  
  const deleteEntry = async (id: string) => {
    try {
      await axios.delete(`/api/waitlist?id=${id}`);
      setWaitlistEntries(entries => entries.filter(entry => entry._id !== id));
      toast.success('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };
  
  const handleEditClick = (entry: WaitlistEntry) => {
    setEditEntry(entry);
    setNotes(entry.notes);
    setIsEditDialogOpen(true);
  };
  
  const exportToCSV = () => {
    // Create CSV string
    const headers = ['Email', 'Date Added', 'Status', 'Notes', 'Source'];
    const csvRows = [headers];
    
    for (const entry of waitlistEntries) {
      csvRows.push([
        entry.email,
        new Date(entry.createdAt).toLocaleDateString(),
        entry.status,
        entry.notes.replace(/,/g, ' '), // Remove commas from notes to prevent CSV parsing issues
        entry.source
      ]);
    }
    
    const csvString = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToTxt = () => {
    // Create a string with just the emails, one per line
    const emailsString = waitlistEntries.map(entry => entry.email).join('\n');
    
    // Create and download file
    const blob = new Blob([emailsString], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waitlist-emails-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const filteredEntries = waitlistEntries.filter(entry => {
    return entry.email.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Waitlist Management</h1>
            <div className="flex space-x-2">
              <Button onClick={exportToTxt} variant="outline">Export Emails (.txt)</Button>
              <Button onClick={exportToCSV}>Export to CSV</Button>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Waitlist Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search by Email
                  </label>
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Filter
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="subscribed">Subscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={fetchWaitlistEntries} className="w-full md:w-auto">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  No waitlist entries found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Date Added</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry._id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>{formatDate(entry.createdAt)}</TableCell>
                          <TableCell>
                            <Select 
                              value={entry.status} 
                              onValueChange={(value) => updateEntryStatus(entry._id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="subscribed">Subscribed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{entry.source}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {entry.notes || 'No notes'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(entry)}
                              >
                                Edit Notes
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the
                                      waitlist entry for {entry.email}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteEntry(entry._id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
            <DialogDescription>
              {editEntry && `Add notes for ${editEntry.email}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add notes about this waitlist subscriber..."
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 