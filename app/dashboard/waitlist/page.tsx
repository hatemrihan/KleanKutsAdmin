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

type WaitlistStatus = 'pending' | 'contacted' | 'subscribed';

interface WaitlistEntry {
  _id: string;
  email: string;
  createdAt: string;
  status: WaitlistStatus;
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
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
      const apiUrl = `/api/waitlist${queryParams}${cacheParam}`;
      
      console.log('Fetching waitlist entries from:', apiUrl);
      const response = await axios.get(apiUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // The API returns the array directly, not wrapped in a waitlistEntries property
      const entries = Array.isArray(response.data) ? response.data : [];
      console.log(`Found ${entries.length} waitlist entries`);
      setWaitlistEntries(entries);
    } catch (error: any) {
      console.error('Error fetching waitlist entries:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      toast.error('Failed to load waitlist entries');
      setWaitlistEntries([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateEntryStatus = async (id: string, newStatus: WaitlistStatus) => {
    try {
      const response = await axios.put('/api/waitlist', {
        id,
        status: newStatus
      });
      
      if (response.data.success) {
      setWaitlistEntries(entries => 
        entries.map(entry => 
            entry._id === id ? { ...entry, status: newStatus } : entry
        )
      );
        toast.success(`Status updated to ${newStatus}`);
      } else {
        throw new Error(response.data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  
  const getStatusStyles = (status: WaitlistStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'contacted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'subscribed':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return '';
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
      const response = await axios.delete('/api/waitlist', {
        data: { id }
      });
      
      if (response.data.success) {
      setWaitlistEntries(entries => entries.filter(entry => entry._id !== id));
      toast.success('Entry deleted successfully');
      } else {
        throw new Error(response.data.error || 'Failed to delete entry');
      }
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

  // Add select all functionality
  const toggleSelectAll = () => {
    if (selectedEntries.length === filteredEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filteredEntries.map(entry => entry._id));
    }
  };

  // Toggle individual selection
  const toggleEntrySelection = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) 
        ? prev.filter(entryId => entryId !== id)
        : [...prev, id]
    );
  };

  // Delete multiple entries
  const deleteSelectedEntries = async () => {
    try {
      await Promise.all(
        selectedEntries.map(id => 
          axios.delete(`/api/waitlist`, {
            data: { id }
          })
        )
      );
      
      setWaitlistEntries(prev => 
        prev.filter(entry => !selectedEntries.includes(entry._id))
      );
      setSelectedEntries([]);
      toast.success(`Successfully deleted ${selectedEntries.length} entries`);
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error('Failed to delete some entries');
    }
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <div className="flex min-h-screen">
      <Nav />
      <main className="flex-1 p-0 sm:p-4 lg:p-6 bg-gray-50 dark:bg-black overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-black p-4 sm:p-0 mb-4">
            {/* Enhanced Page title with Dashboard-style font */}
            <div className="mb-6 sm:mb-8">
              <h1 
                className="font-montserrat text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight font-bold text-center sm:text-left text-gray-900 dark:text-white"
                style={{ fontFamily: 'var(--font-montserrat)' }}
              >
                Waitlist
              </h1>
              <div className="h-1 w-16 sm:w-24 md:w-32 lg:w-40 bg-black dark:bg-white mt-2 mx-auto sm:mx-0"></div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="block sm:hidden space-y-2">
              <Button 
                onClick={fetchWaitlistEntries} 
                className="w-full h-10 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
              
              {selectedEntries.length > 0 && (
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="w-full h-10 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Selected ({selectedEntries.length})
                </Button>
              )}
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedEntries.length > 0 && (
                  <Button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="h-9 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete Selected ({selectedEntries.length})
                  </Button>
                )}
                </div>
              
              <Button 
                onClick={fetchWaitlistEntries} 
                className="h-9 bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
          
          {/* Search & Filter Card */}
          <div className="px-4 sm:px-0">
            <Card className="mb-4 dark:bg-black dark:border-white dark:border-opacity-20">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Search by Email
                  </label>
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                  />
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Status Filter
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full bg-white dark:bg-black">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="subscribed">Subscribed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
          
          {/* Table Section */}
          <div className="px-4 sm:px-0">
          <Card className="dark:bg-black dark:border-white dark:border-opacity-20">
            <CardContent className="p-0">
              {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
                </div>
              ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                  No waitlist entries found
                </div>
              ) : (
                  <div className="overflow-x-hidden">
                    <div className="min-w-full">
                      {filteredEntries.map((entry) => (
                        <div 
                          key={entry._id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-[24px] pt-1">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedEntries.includes(entry._id)}
                                onChange={() => toggleEntrySelection(entry._id)}
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white break-all">
                            {entry.email}
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                            {formatDate(entry.createdAt)}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <Select 
                              value={entry.status} 
                                    onValueChange={(value: WaitlistStatus) => updateEntryStatus(entry._id, value)}
                            >
                                    <SelectTrigger className={`h-8 w-full sm:w-[130px] ${getStatusStyles(entry.status)}`}>
                                <SelectValue />
                              </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        <div className="flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-yellow-400"></span>
                                          Pending
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="contacted">
                                        <div className="flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                                          Contacted
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="subscribed">
                                        <div className="flex items-center gap-2">
                                          <span className="h-2 w-2 rounded-full bg-green-400"></span>
                                          Subscribed
                                        </div>
                                      </SelectItem>
                              </SelectContent>
                            </Select>
                                  
                                  <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditClick(entry)}
                                      className="h-8 px-2 min-w-[32px] flex-1 sm:flex-none"
                              >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      <span className="ml-2 sm:hidden">Edit Notes</span>
                              </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteEntry(entry._id)}
                                      className="h-8 px-2 min-w-[32px] flex-1 sm:flex-none bg-red-50 text-red-600 hover:bg-red-100"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span className="ml-2 sm:hidden">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {entry.notes && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      </main>
      
      {/* Bulk Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Multiple Entries</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-white dark:opacity-70">
              Are you sure you want to delete {selectedEntries.length} selected entries? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto px-4 py-2 bg-white border-2 border-black text-black hover:bg-gray-100 dark:bg-black dark:border-white dark:text-white dark:hover:bg-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteSelectedEntries}
              className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-red-600 hover:border-red-700 dark:bg-red-800 dark:hover:bg-red-900 dark:border-red-800 dark:hover:border-red-900"
            >
              Delete Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-black dark:border-white dark:border-opacity-20 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Notes
            </DialogTitle>
            <DialogDescription className="dark:text-white dark:opacity-70 mt-2">
              {editEntry && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{editEntry.email}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add notes about this waitlist subscriber..."
              className="w-full px-3 py-2 bg-transparent border-2 border-gray-200 dark:border-gray-800 rounded-lg focus:border-black dark:focus:border-white transition-colors duration-200 dark:text-white dark:placeholder-gray-400 resize-none"
            />
          </div>
          
          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="w-full sm:w-auto px-4 py-2 bg-white border-2 border-black text-black hover:bg-gray-100 dark:bg-black dark:border-white dark:text-white dark:hover:bg-gray-900 transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveNotes}
              className="w-full sm:w-auto px-4 py-2 bg-black border-2 border-black text-white hover:bg-gray-800 dark:bg-white dark:border-white dark:text-black dark:hover:bg-gray-200 transition-colors duration-200"
            >
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 