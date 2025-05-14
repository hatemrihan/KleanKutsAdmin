import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Paper, 
  Chip, 
  IconButton, 
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/app/utils/formatters';

export default function AmbassadorList({ ambassadors = [] }) {
  const router = useRouter();
  const [filteredAmbassadors, setFilteredAmbassadors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({
    key: 'applicationDate',
    direction: 'desc'
  });

  useEffect(() => {
    let result = [...ambassadors];
    
    // Apply search filter
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(ambassador => 
        ambassador.name?.toLowerCase().includes(lowerCaseQuery) ||
        ambassador.email?.toLowerCase().includes(lowerCaseQuery) ||
        ambassador.applicationDetails?.fullName?.toLowerCase().includes(lowerCaseQuery) ||
        ambassador.applicationDetails?.instagramHandle?.toLowerCase().includes(lowerCaseQuery) ||
        ambassador.applicationRef?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(ambassador => ambassador.status === statusFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      // Helper to get nested properties safely
      const getValue = (obj, path) => {
        const keys = path.split('.');
        return keys.reduce((o, k) => (o || {})[k], obj) || '';
      };
      
      const aValue = getValue(a, sortConfig.key);
      const bValue = getValue(b, sortConfig.key);
      
      if (aValue === bValue) return 0;
      
      // Sorting logic for dates
      if (sortConfig.key === 'applicationDate') {
        const dateA = new Date(aValue || 0);
        const dateB = new Date(bValue || 0);
        return sortConfig.direction === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      }
      
      // Sorting logic for numbers (for follower counts)
      if (sortConfig.key.includes('Followers')) {
        const numA = parseInt(aValue, 10) || 0;
        const numB = parseInt(bValue, 10) || 0;
        return sortConfig.direction === 'asc' 
          ? numA - numB 
          : numB - numA;
      }
      
      // Default string sorting
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
    
    setFilteredAmbassadors(result);
  }, [ambassadors, searchQuery, statusFilter, sortConfig]);

  const handleRequestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewAmbassador = (id) => {
    router.push(`/ambassadors/${id}`);
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = [
      'Name', 'Email', 'Status', 'Instagram', 'Followers',
      'Application Date', 'Referral Code', 'Orders', 'Sales'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    filteredAmbassadors.forEach(ambassador => {
      const row = [
        `"${ambassador.applicationDetails?.fullName || ambassador.name || ''}"`,
        `"${ambassador.email || ''}"`,
        `"${ambassador.status || ''}"`,
        `"${ambassador.applicationDetails?.instagramHandle || ''}"`,
        `"${ambassador.applicationDetails?.instagramFollowers || ''}"`,
        `"${ambassador.applicationDate ? new Date(ambassador.applicationDate).toISOString().split('T')[0] : ''}"`,
        `"${ambassador.referralCode || ''}"`,
        `"${ambassador.orders || '0'}"`,
        `"${ambassador.sales || '0'}"`,
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ambassadors-export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />;
  };

  return (
    <Box>
      {/* Header and controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Ambassador Applications</Typography>
        <Box>
          <Tooltip title="Export to CSV">
            <IconButton onClick={handleExportData} sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status"
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Typography variant="body2" sx={{ alignSelf: 'center' }}>
          {filteredAmbassadors.length} ambassadors
        </Typography>
      </Box>
      
      {/* Ambassadors table */}
      <Card>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="ambassadors table">
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleRequestSort('applicationDate')}
                  sx={{ cursor: 'pointer' }}
                >
                  Date {sortIcon('applicationDate')}
                </TableCell>
                <TableCell 
                  onClick={() => handleRequestSort('applicationDetails.fullName')}
                  sx={{ cursor: 'pointer' }}
                >
                  Name {sortIcon('applicationDetails.fullName')}
                </TableCell>
                <TableCell 
                  onClick={() => handleRequestSort('email')}
                  sx={{ cursor: 'pointer' }}
                >
                  Email {sortIcon('email')}
                </TableCell>
                <TableCell 
                  onClick={() => handleRequestSort('applicationDetails.instagramHandle')}
                  sx={{ cursor: 'pointer' }}
                >
                  Instagram {sortIcon('applicationDetails.instagramHandle')}
                </TableCell>
                <TableCell 
                  onClick={() => handleRequestSort('applicationDetails.instagramFollowers')}
                  sx={{ cursor: 'pointer' }}
                >
                  Followers {sortIcon('applicationDetails.instagramFollowers')}
                </TableCell>
                <TableCell 
                  onClick={() => handleRequestSort('status')}
                  sx={{ cursor: 'pointer' }}
                >
                  Status {sortIcon('status')}
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAmbassadors.length > 0 ? (
                filteredAmbassadors.map((ambassador) => (
                  <TableRow
                    key={ambassador._id}
                    sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                  >
                    <TableCell>
                      {formatDate(ambassador.applicationDate, { hour: undefined, minute: undefined })}
                    </TableCell>
                    <TableCell>
                      {ambassador.applicationDetails?.fullName || ambassador.name}
                    </TableCell>
                    <TableCell>{ambassador.email}</TableCell>
                    <TableCell>
                      {ambassador.applicationDetails?.instagramHandle || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {ambassador.applicationDetails?.instagramFollowers || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)} 
                        color={getStatusColor(ambassador.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewAmbassador(ambassador._id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No ambassadors found matching your filters
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
} 