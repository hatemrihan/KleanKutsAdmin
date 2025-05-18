'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    fetchWaitlistEntries();
  }, [statusFilter]);
  
  useEffect(() => {
    // Add click-outside handler for the export dropdown
    function handleClickOutside(event: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setExportDropdownOpen(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const fetchWaitlistEntries = async () => {
    setIsLoading(true);
    try {
      const queryParams = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      // Add cache-busting timestamp to prevent caching
      const timestamp = new Date().getTime();
      const cacheParam = `${queryParams ? '&' : '?'}t=${timestamp}`;
      const response = await axios.get(`/api/waitlist${queryParams}${cacheParam}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('Fetched waitlist data:', response.data);
      setWaitlistEntries(response.data.waitlistEntries || []);
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
      <main className="flex-1 p-4 lg:p-8 bg-gray-50 dark:bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Waitlist Management</h1>
            <div className="relative w-full sm:w-auto" ref={exportDropdownRef}>
              <Button 
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="w-full sm:w-auto dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10"
              >
                Export Options
                <svg className={`ml-2 w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black shadow-lg rounded-md border dark:border-white dark:border-opacity-20 z-10">
                  <button 
                    onClick={() => {
                      exportToTxt();
                      setExportDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10"
                  >
                    Export Emails (.txt)
                  </button>
                  <button 
                    onClick={() => {
                      exportToCSV();
                      setExportDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white dark:hover:bg-opacity-10"
                  >
                    Export to CSV
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <Card className="mb-6 dark:bg-black dark:border-white dark:border-opacity-20">
            <CardHeader className="pb-2">
              <CardTitle className="dark:text-white">Waitlist Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Search by Email
                  </label>
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:placeholder-white dark:placeholder-opacity-50"
                  />
                </div>
                
                <div className="w-full md:w-48">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Status Filter
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-black dark:border-white dark:border-opacity-20">
                      <SelectItem value="all" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">All Statuses</SelectItem>
                      <SelectItem value="pending" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Pending</SelectItem>
                      <SelectItem value="contacted" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Contacted</SelectItem>
                      <SelectItem value="subscribed" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Subscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={fetchWaitlistEntries} 
                  className="w-full md:w-auto dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10"
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-black dark:border-white dark:border-opacity-20">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 dark:border-white"></div>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-white dark:opacity-70">
                  No waitlist entries found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-white dark:border-opacity-20">
                        <TableHead className="dark:text-white">Email</TableHead>
                        <TableHead className="dark:text-white hidden md:table-cell">Date Added</TableHead>
                        <TableHead className="dark:text-white">Status</TableHead>
                        <TableHead className="dark:text-white hidden sm:table-cell">Source</TableHead>
                        <TableHead className="dark:text-white hidden lg:table-cell">Notes</TableHead>
                        <TableHead className="text-right dark:text-white">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry._id} className="dark:border-white dark:border-opacity-20 dark:hover:bg-white dark:hover:bg-opacity-5">
                          <TableCell className="font-medium dark:text-white truncate max-w-[150px] md:max-w-none">
                            <div className="md:hidden text-xs text-gray-500 dark:text-white dark:opacity-70 mb-1">Email:</div>
                            {entry.email}
                          </TableCell>
                          <TableCell className="dark:text-white dark:opacity-70 hidden md:table-cell">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                          <TableCell className="dark:text-white">
                            <div className="md:hidden text-xs text-gray-500 dark:text-white dark:opacity-70 mb-1">Status:</div>
                            <Select 
                              value={entry.status} 
                              onValueChange={(value) => updateEntryStatus(entry._id, value)}
                            >
                              <SelectTrigger className="w-full sm:w-32 dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-black dark:border-white dark:border-opacity-20">
                                <SelectItem value="pending" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Pending</SelectItem>
                                <SelectItem value="contacted" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Contacted</SelectItem>
                                <SelectItem value="subscribed" className="dark:text-white dark:focus:bg-white dark:focus:bg-opacity-10">Subscribed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="dark:text-white dark:opacity-70 hidden sm:table-cell">
                            {entry.source}
                          </TableCell>
                          <TableCell className="dark:text-white dark:opacity-70 hidden lg:table-cell">
                            <div className="max-w-xs truncate">
                              {entry.notes || 'No notes'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(entry)}
                                className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10"
                              >
                                Edit Notes
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" className="dark:bg-red-900 dark:hover:bg-red-800 dark:text-white">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="dark:text-white">Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="dark:text-white dark:opacity-70 break-words">
                                      This action cannot be undone. This will permanently delete the
                                      waitlist entry for {entry.email}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <AlertDialogCancel className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteEntry(entry._id)}
                                      className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800 w-full sm:w-auto"
                                    >
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
        <DialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Notes</DialogTitle>
            <DialogDescription className="dark:text-white dark:opacity-70">
              {editEntry && `Add notes for ${editEntry.email}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add notes about this waitlist subscriber..."
              className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:placeholder-white dark:placeholder-opacity-50"
            />
          </div>
          
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveNotes}
              className="dark:bg-black dark:border-white dark:border-opacity-20 dark:text-white dark:hover:bg-white dark:hover:bg-opacity-10 w-full sm:w-auto"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 