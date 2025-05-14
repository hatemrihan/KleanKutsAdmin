# Ambassador Data Model Updates

## Overview

The ambassador data model needs to be updated to include the new `applicationDetails` field that contains the complete form data from the customer-facing site.

## Updated Ambassador Schema

Update your `Ambassador` model in the admin site to include the expanded application data:

```javascript
import mongoose from 'mongoose';

const AmbassadorSchema = new mongoose.Schema({
  // Basic info
  name: String,
  email: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected'], 
    default: 'none' 
  },
  
  // New expanded application details field
  applicationDetails: {
    fullName: String,
    phoneNumber: String,
    email: String,
    instagramHandle: String,
    tiktokHandle: String,
    otherSocialMedia: String,
    personalStyle: String,    // One of 4 predefined options
    soldBefore: String,       // 'Yes' or 'No'
    promotionPlan: String,    // Open text field
    investmentOption: String, // One of 3 predefined options
    contentComfort: String,   // One of 3 predefined options
    instagramFollowers: String,
    tiktokFollowers: String,
    otherFollowers: String,
    targetAudience: String,   // One of 4 predefined options
    otherAudience: String,    // Only filled if targetAudience is 'Other'
    motivation: String,       // Open text field
    hasCamera: String,        // 'Yes' or 'No'
    attendEvents: String,     // 'Yes', 'No' or 'Depends'
    agreeToTerms: String,     // 'Yes, I agree' or 'No, I need more information'
    additionalInfo: String,   // Open text field
    questions: String         // Open text field
  },
  
  // Application tracking
  applicationDate: Date,
  applicationRef: String,
  reviewDate: Date,
  reviewedBy: String,
  reviewNotes: String,
  
  // Referral tracking
  referralCode: String,
  couponCode: String,
  discountPercent: { type: Number, default: 10 },
  
  // Performance metrics
  sales: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 0.1 },
  
  // Payment tracking
  paymentsPending: { type: Number, default: 0 },
  paymentsPaid: { type: Number, default: 0 },
  
  // Recent orders
  recentOrders: [{
    orderId: String,
    orderDate: Date,
    amount: Number,
    commission: Number,
    isPaid: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// Preserve existing hooks and methods...

export const Ambassador = mongoose.models.Ambassador || mongoose.model('Ambassador', AmbassadorSchema);
```

## Handling Legacy Data

To handle existing ambassador records that don't have the `applicationDetails` field:

```javascript
// Migration script for existing data (run once)
async function migrateAmbassadorData() {
  const ambassadors = await Ambassador.find({});
  
  for (const ambassador of ambassadors) {
    // If we have application data in the old format but not in the new format
    if (ambassador.application && !ambassador.applicationDetails) {
      // Map old structure to new structure
      ambassador.applicationDetails = {
        fullName: ambassador.application.fullName || ambassador.name,
        email: ambassador.application.email || ambassador.email,
        // Map other fields as they exist, with fallbacks to empty strings
        phoneNumber: ambassador.application.phoneNumber || '',
        instagramHandle: ambassador.application.instagramHandle || '',
        // Add other fields with defaults
        // ...
      };
      
      await ambassador.save();
      console.log(`Migrated ambassador data for ${ambassador.email}`);
    }
  }
  
  console.log('Migration complete');
}
```

## UI Updates for Ambassador Details

### Ambassador List View

Update the ambassador list component to display essential information from the expanded application:

```jsx
// components/ambassadors/AmbassadorList.js
import { useState, useEffect } from 'react';
import { Table, Badge, Button } from '../../ui'; // Update with your actual UI components

export default function AmbassadorList({ ambassadors }) {
  // Sort and filter state
  const [sortField, setSortField] = useState('applicationDate');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Filtered and sorted ambassadors
  const filteredAmbassadors = ambassadors
    .filter(ambassador => filterStatus === 'all' || ambassador.status === filterStatus)
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });
  
  return (
    <div>
      {/* Filters and controls */}
      <div className="filters">
        {/* Status filters */}
        <Button 
          onClick={() => setFilterStatus('all')}
          active={filterStatus === 'all'}
        >
          All
        </Button>
        <Button 
          onClick={() => setFilterStatus('pending')}
          active={filterStatus === 'pending'}
        >
          Pending
        </Button>
        {/* Add other status filters */}
      </div>
      
      {/* Ambassador table */}
      <Table>
        <thead>
          <tr>
            <th onClick={() => handleSort('applicationDate')}>Date</th>
            <th onClick={() => handleSort('applicationDetails.fullName')}>Name</th>
            <th onClick={() => handleSort('email')}>Email</th>
            <th onClick={() => handleSort('applicationDetails.instagramHandle')}>Instagram</th>
            <th onClick={() => handleSort('applicationDetails.instagramFollowers')}>Followers</th>
            <th onClick={() => handleSort('status')}>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAmbassadors.map(ambassador => (
            <tr key={ambassador._id}>
              <td>{new Date(ambassador.applicationDate).toLocaleDateString()}</td>
              <td>{ambassador.applicationDetails?.fullName || ambassador.name}</td>
              <td>{ambassador.email}</td>
              <td>{ambassador.applicationDetails?.instagramHandle || 'N/A'}</td>
              <td>{ambassador.applicationDetails?.instagramFollowers || 'N/A'}</td>
              <td>
                <Badge status={ambassador.status}>
                  {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
                </Badge>
              </td>
              <td>
                <Button href={`/ambassadors/${ambassador._id}`}>View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
  
  // Sort handler
  function handleSort(field) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }
}
```

### Ambassador Detail View

Create a detailed view to show all the application information:

```jsx
// components/ambassadors/AmbassadorDetail.js
import { useState } from 'react';
import { Card, Tabs, Tab, InfoGrid, Button, Modal, Form } from '../../ui'; // Update with your actual UI components

export default function AmbassadorDetail({ ambassador, onApprove, onReject }) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    couponCode: '',
    discountPercent: 10,
    commissionRate: 0.1
  });
  
  // Formatted application date
  const applicationDate = ambassador.applicationDate 
    ? new Date(ambassador.applicationDate).toLocaleDateString() 
    : 'N/A';
  
  return (
    <div>
      <div className="header">
        <h1>{ambassador.applicationDetails?.fullName || ambassador.name}</h1>
        <Badge status={ambassador.status}>
          {ambassador.status.charAt(0).toUpperCase() + ambassador.status.slice(1)}
        </Badge>
        
        {ambassador.status === 'pending' && (
          <div className="actions">
            <Button variant="success" onClick={() => setShowApproveModal(true)}>Approve</Button>
            <Button variant="danger" onClick={() => onReject(ambassador._id)}>Reject</Button>
          </div>
        )}
      </div>
      
      <Tabs>
        <Tab title="Application Details">
          <Card>
            <h2>Personal Information</h2>
            <InfoGrid>
              <InfoGrid.Item label="Full Name" value={ambassador.applicationDetails?.fullName || 'N/A'} />
              <InfoGrid.Item label="Email" value={ambassador.applicationDetails?.email || ambassador.email} />
              <InfoGrid.Item label="Phone" value={ambassador.applicationDetails?.phoneNumber || 'N/A'} />
              <InfoGrid.Item label="Application Date" value={applicationDate} />
              <InfoGrid.Item label="Reference" value={ambassador.applicationRef || 'N/A'} />
            </InfoGrid>
            
            <h2>Social Media</h2>
            <InfoGrid>
              <InfoGrid.Item label="Instagram" value={ambassador.applicationDetails?.instagramHandle || 'N/A'} />
              <InfoGrid.Item label="Instagram Followers" value={ambassador.applicationDetails?.instagramFollowers || 'N/A'} />
              <InfoGrid.Item label="TikTok" value={ambassador.applicationDetails?.tiktokHandle || 'N/A'} />
              <InfoGrid.Item label="TikTok Followers" value={ambassador.applicationDetails?.tiktokFollowers || 'N/A'} />
              <InfoGrid.Item label="Other Social Media" value={ambassador.applicationDetails?.otherSocialMedia || 'N/A'} />
              <InfoGrid.Item label="Other Followers" value={ambassador.applicationDetails?.otherFollowers || 'N/A'} />
            </InfoGrid>
            
            <h2>Preferences</h2>
            <InfoGrid>
              <InfoGrid.Item label="Personal Style" value={ambassador.applicationDetails?.personalStyle || 'N/A'} />
              <InfoGrid.Item label="Sold Before" value={ambassador.applicationDetails?.soldBefore || 'N/A'} />
              <InfoGrid.Item label="Investment Option" value={ambassador.applicationDetails?.investmentOption || 'N/A'} />
              <InfoGrid.Item label="Content Comfort" value={ambassador.applicationDetails?.contentComfort || 'N/A'} />
              <InfoGrid.Item label="Has Camera" value={ambassador.applicationDetails?.hasCamera || 'N/A'} />
              <InfoGrid.Item label="Can Attend Events" value={ambassador.applicationDetails?.attendEvents || 'N/A'} />
            </InfoGrid>
            
            <h2>Target Audience</h2>
            <InfoGrid>
              <InfoGrid.Item label="Primary Audience" value={ambassador.applicationDetails?.targetAudience || 'N/A'} />
              {ambassador.applicationDetails?.targetAudience === 'Other' && (
                <InfoGrid.Item label="Other Audience" value={ambassador.applicationDetails?.otherAudience || 'N/A'} />
              )}
            </InfoGrid>
            
            <h2>Motivations</h2>
            <InfoGrid>
              <InfoGrid.Item 
                label="Promotion Plan" 
                value={ambassador.applicationDetails?.promotionPlan || 'N/A'} 
                fullWidth 
              />
              <InfoGrid.Item 
                label="Motivation" 
                value={ambassador.applicationDetails?.motivation || 'N/A'} 
                fullWidth 
              />
              <InfoGrid.Item 
                label="Additional Info" 
                value={ambassador.applicationDetails?.additionalInfo || 'N/A'} 
                fullWidth 
              />
              <InfoGrid.Item 
                label="Questions" 
                value={ambassador.applicationDetails?.questions || 'N/A'} 
                fullWidth 
              />
            </InfoGrid>
          </Card>
        </Tab>
        
        <Tab title="Performance">
          {/* Display performance metrics, recent orders, etc. */}
        </Tab>
        
        <Tab title="Payment History">
          {/* Display payment history, pending payments, etc. */}
        </Tab>
      </Tabs>
      
      {/* Approve Modal */}
      <Modal
        show={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Ambassador Application"
      >
        <Form onSubmit={handleApprove}>
          <Form.Field
            label="Coupon Code"
            name="couponCode"
            value={approvalData.couponCode}
            onChange={e => setApprovalData({...approvalData, couponCode: e.target.value})}
            placeholder="Custom coupon code (optional)"
            hint="Leave blank to auto-generate"
          />
          
          <Form.Field
            label="Discount Percentage"
            name="discountPercent"
            type="number"
            value={approvalData.discountPercent}
            onChange={e => setApprovalData({...approvalData, discountPercent: Number(e.target.value)})}
            min={5}
            max={30}
          />
          
          <Form.Field
            label="Commission Rate"
            name="commissionRate"
            type="number"
            value={approvalData.commissionRate}
            onChange={e => setApprovalData({...approvalData, commissionRate: Number(e.target.value)})}
            step={0.01}
            min={0.05}
            max={0.30}
            hint="Enter as decimal (e.g., 0.10 for 10%)"
          />
          
          <div className="actions">
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button variant="success" type="submit">Approve Ambassador</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
  
  function handleApprove(e) {
    e.preventDefault();
    onApprove(ambassador._id, approvalData);
    setShowApproveModal(false);
  }
}
```

## API Updates

Update your APIs to handle the new data structure:

```typescript
// pages/api/ambassadors/[id]/approve.js
import { connectToDatabase } from '@/utils/mongodb';
import { Ambassador } from '@/models/ambassador';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  const { couponCode, discountPercent, commissionRate } = req.body;
  
  try {
    await connectToDatabase();
    
    const ambassador = await Ambassador.findById(id);
    
    if (!ambassador) {
      return res.status(404).json({ error: 'Ambassador not found' });
    }
    
    if (ambassador.status === 'approved') {
      return res.status(400).json({ error: 'Ambassador already approved' });
    }
    
    // Update the ambassador data
    ambassador.status = 'approved';
    ambassador.reviewDate = new Date();
    ambassador.reviewedBy = req.session.user.email; // Assuming you have session data
    
    if (couponCode) {
      ambassador.couponCode = couponCode.toUpperCase();
    } else {
      // Generate a code based on name or application ref
      const nameBase = ambassador.applicationDetails?.fullName?.substring(0, 3) || 
                      ambassador.name.substring(0, 3);
      ambassador.couponCode = `${nameBase.toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    // Set discount and commission rates
    ambassador.discountPercent = discountPercent || 10;
    ambassador.commissionRate = commissionRate || 0.1;
    
    // If referral code doesn't exist, generate one
    if (!ambassador.referralCode) {
      ambassador.referralCode = `REF${Math.floor(10000 + Math.random() * 90000)}`;
    }
    
    await ambassador.save();
    
    // Send approval notification email
    // await sendApprovalEmail(ambassador.email, ambassador.couponCode, ambassador.discountPercent);
    
    return res.status(200).json({ 
      success: true, 
      ambassador: ambassador 
    });
    
  } catch (error) {
    console.error('Error approving ambassador:', error);
    return res.status(500).json({ error: 'Failed to approve ambassador' });
  }
}
```

## Data Export Functionality

Add the ability to export ambassador data for analysis:

```javascript
// utils/exportAmbassadors.js
import { format } from 'date-fns';
import { saveAs } from 'file-saver';

export function exportAmbassadorsToCsv(ambassadors) {
  // Define CSV headers
  const headers = [
    'Name',
    'Email',
    'Status',
    'Application Date',
    'Instagram',
    'Instagram Followers',
    'TikTok',
    'TikTok Followers',
    'Personal Style',
    'Investment Option',
    'Target Audience',
    'Coupon Code', 
    'Discount %',
    'Commission Rate',
    'Total Orders',
    'Total Sales',
    'Total Earnings'
  ];
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  // Add ambassador data rows
  ambassadors.forEach(ambassador => {
    const row = [
      `"${ambassador.applicationDetails?.fullName || ambassador.name}"`,
      `"${ambassador.email}"`,
      `"${ambassador.status}"`,
      `"${ambassador.applicationDate ? format(new Date(ambassador.applicationDate), 'yyyy-MM-dd') : ''}"`,
      `"${ambassador.applicationDetails?.instagramHandle || ''}"`,
      `"${ambassador.applicationDetails?.instagramFollowers || ''}"`,
      `"${ambassador.applicationDetails?.tiktokHandle || ''}"`,
      `"${ambassador.applicationDetails?.tiktokFollowers || ''}"`,
      `"${ambassador.applicationDetails?.personalStyle || ''}"`,
      `"${ambassador.applicationDetails?.investmentOption || ''}"`,
      `"${ambassador.applicationDetails?.targetAudience || ''}"`,
      `"${ambassador.couponCode || ''}"`,
      `"${ambassador.discountPercent || ''}"`,
      `"${ambassador.commissionRate || ''}"`,
      `"${ambassador.orders || '0'}"`,
      `"${ambassador.sales || '0'}"`,
      `"${ambassador.earnings || '0'}"`,
    ];
    
    csvContent += row.join(',') + '\n';
  });
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `ambassador-data-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}
``` 