import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { formatDate } from '@/app/utils/formatters';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ambassador-tabpanel-${index}`}
      aria-labelledby={`ambassador-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AmbassadorDetails({ ambassador, onApprove, onReject }) {
  const [tabValue, setTabValue] = useState(0);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({
    couponCode: '',
    discountPercent: 10,
    commissionRate: 0.1,
    notes: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenApproveDialog = () => {
    setOpenApproveDialog(true);
  };

  const handleCloseApproveDialog = () => {
    setOpenApproveDialog(false);
  };

  const handleOpenRejectDialog = () => {
    setOpenRejectDialog(true);
  };

  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
  };

  const handleApprove = () => {
    onApprove(ambassador._id, approvalData);
    setOpenApproveDialog(false);
  };

  const handleReject = () => {
    onReject(ambassador._id, rejectReason);
    setOpenRejectDialog(false);
  };

  const handleApprovalDataChange = (e) => {
    const { name, value } = e.target;
    setApprovalData({
      ...approvalData,
      [name]: name === 'discountPercent' ? parseInt(value, 10) : 
              name === 'commissionRate' ? parseFloat(value) : 
              value
    });
  };

  // Destructure ambassador data
  const {
    name,
    email,
    status,
    applicationDate,
    applicationRef,
    applicationDetails = {},
    discountPercent,
    commissionRate,
    sales = 0,
    orders = 0,
    earnings = 0,
    recentOrders = []
  } = ambassador;

  // Get application details with fallbacks
  const {
    fullName = name,
    phoneNumber = 'N/A',
    instagramHandle = 'N/A',
    tiktokHandle = 'N/A',
    otherSocialMedia = 'N/A',
    personalStyle = 'N/A',
    soldBefore = 'N/A',
    promotionPlan = 'N/A',
    investmentOption = 'N/A',
    contentComfort = 'N/A',
    instagramFollowers = 'N/A',
    tiktokFollowers = 'N/A',
    otherFollowers = 'N/A',
    targetAudience = 'N/A',
    otherAudience = 'N/A',
    motivation = 'N/A',
    hasCamera = 'N/A',
    attendEvents = 'N/A',
    additionalInfo = 'N/A',
    questions = 'N/A'
  } = applicationDetails;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">{fullName}</Typography>
          <Typography variant="subtitle1" color="text.secondary">{email}</Typography>
          <Box sx={{ mt: 1 }}>
            <Chip 
              label={status.charAt(0).toUpperCase() + status.slice(1)} 
              color={
                status === 'approved' ? 'success' :
                status === 'pending' ? 'warning' :
                status === 'rejected' ? 'error' : 'default'
              }
            />
            {applicationRef && 
              <Chip 
                label={`Ref: ${applicationRef}`} 
                variant="outlined" 
                sx={{ ml: 1 }} 
              />
            }
          </Box>
        </Box>
        {status === 'pending' && (
          <Box>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleOpenApproveDialog}
              sx={{ mr: 1 }}
            >
              Approve
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={handleOpenRejectDialog}
            >
              Reject
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ambassador tabs">
          <Tab label="Application Details" />
          <Tab label="Performance" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {/* Application Details Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                    <Typography variant="body1">{fullName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{phoneNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Application Date</Typography>
                    <Typography variant="body1">{formatDate(applicationDate)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Social Media
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Instagram</Typography>
                    <Typography variant="body1">{instagramHandle}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Instagram Followers</Typography>
                    <Typography variant="body1">{instagramFollowers}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">TikTok</Typography>
                    <Typography variant="body1">{tiktokHandle}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">TikTok Followers</Typography>
                    <Typography variant="body1">{tiktokFollowers}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Other Social Media</Typography>
                    <Typography variant="body1">{otherSocialMedia}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Other Followers</Typography>
                    <Typography variant="body1">{otherFollowers}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ambassador Preferences
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Personal Style</Typography>
                    <Typography variant="body1">{personalStyle}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Sold Before</Typography>
                    <Typography variant="body1">{soldBefore}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Investment Option</Typography>
                    <Typography variant="body1">{investmentOption}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Content Comfort</Typography>
                    <Typography variant="body1">{contentComfort}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Has Camera</Typography>
                    <Typography variant="body1">{hasCamera}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Can Attend Events</Typography>
                    <Typography variant="body1">{attendEvents}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Target Audience</Typography>
                    <Typography variant="body1">{targetAudience}</Typography>
                  </Grid>
                  {targetAudience === 'Other' && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Other Audience</Typography>
                      <Typography variant="body1">{otherAudience}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Motivations & Plans
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Promotion Plan</Typography>
                    <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>{promotionPlan}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Motivation</Typography>
                    <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>{motivation}</Typography>
                  </Grid>
                  {additionalInfo && additionalInfo !== 'N/A' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Additional Information</Typography>
                      <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>{additionalInfo}</Typography>
                    </Grid>
                  )}
                  {questions && questions !== 'N/A' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Questions</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{questions}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Sales</Typography>
                <Typography variant="h4">${sales.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Orders</Typography>
                <Typography variant="h4">{orders}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Total Earnings</Typography>
                <Typography variant="h4">${earnings.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Referral Details</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Referral Code</Typography>
                    <Typography variant="body1">{ambassador.referralCode || 'Not assigned'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Coupon Code</Typography>
                    <Typography variant="body1">{ambassador.couponCode || 'Not assigned'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Discount Percentage</Typography>
                    <Typography variant="body1">{discountPercent}%</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary">Commission Rate</Typography>
                    <Typography variant="body1">{(commissionRate * 100).toFixed(1)}%</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Orders Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Orders</Typography>
            <Divider sx={{ mb: 2 }} />
            {recentOrders.length > 0 ? (
              <Box>
                {/* Order list here */}
                {recentOrders.map((order, index) => (
                  <Box key={order.orderId || index} sx={{ mb: 2, pb: 2, borderBottom: index < recentOrders.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">Order ID</Typography>
                        <Typography variant="body1">{order.orderId}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                        <Typography variant="body1">{formatDate(order.orderDate)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                        <Typography variant="body1">${order.amount.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="text.secondary">Commission</Typography>
                        <Typography variant="body1">${order.commission.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Chip 
                          label={order.isPaid ? 'Paid' : 'Pending'} 
                          color={order.isPaid ? 'success' : 'warning'} 
                          size="small" 
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1">No orders yet.</Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={handleCloseApproveDialog}>
        <DialogTitle>Approve Ambassador Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Coupon Code"
              name="couponCode"
              fullWidth
              value={approvalData.couponCode}
              onChange={handleApprovalDataChange}
              margin="normal"
              helperText="Leave blank to auto-generate"
            />
            <TextField
              label="Discount Percentage"
              name="discountPercent"
              type="number"
              fullWidth
              value={approvalData.discountPercent}
              onChange={handleApprovalDataChange}
              margin="normal"
              InputProps={{ inputProps: { min: 5, max: 30 } }}
            />
            <TextField
              label="Commission Rate"
              name="commissionRate"
              type="number"
              fullWidth
              value={approvalData.commissionRate}
              onChange={handleApprovalDataChange}
              margin="normal"
              helperText="Enter as decimal (e.g., 0.10 for 10%)"
              InputProps={{ inputProps: { min: 0.05, max: 0.3, step: 0.01 } }}
            />
            <TextField
              label="Notes"
              name="notes"
              fullWidth
              multiline
              rows={3}
              value={approvalData.notes}
              onChange={handleApprovalDataChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseApproveDialog}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" color="success">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={handleCloseRejectDialog}>
        <DialogTitle>Reject Ambassador Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Reason for Rejection"
              fullWidth
              multiline
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRejectDialog}>Cancel</Button>
          <Button onClick={handleReject} variant="contained" color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 