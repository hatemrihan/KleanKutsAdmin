# Ambassador Program Integration Guide

This guide explains how to integrate the Ambassador Program with your e-commerce frontend application.

## Overview

The ambassador program allows approved users to generate referral links and coupon codes that:
1. Give customers a discount (configurable percentage)
2. Track sales and calculate commission for ambassadors
3. Provide analytics on ambassador performance

## API Endpoints

### 1. Validate Coupon Code

**Endpoint:** `POST /api/coupon/validate`

Use this endpoint to validate a coupon code entered by a customer and retrieve the discount percentage.

**Request:**
```json
{
  "code": "COUPON123"
}
```

**Success Response:**
```json
{
  "valid": true,
  "discount": {
    "type": "percentage",
    "value": 10,
    "ambassadorId": "60d21b4667d0d8992e610c85"
  },
  "message": "Coupon code applied: 10% discount"
}
```

**Invalid Coupon Response:**
```json
{
  "valid": false,
  "message": "Invalid or expired coupon code"
}
```

### 2. List All Active Coupon Codes

**Endpoint:** `GET /api/coupon/list`

This endpoint provides a list of all active coupon codes and their discount percentages. Use this to keep your local cache updated.

**Response:**
```json
{
  "coupons": [
    {
      "code": "SUMMER2023",
      "type": "coupon",
      "discountPercent": 15,
      "ambassadorName": "John Doe",
      "ambassadorId": "60d21b4667d0d8992e610c85"
    },
    {
      "code": "JOHNDO25",
      "type": "referral",
      "discountPercent": 15,
      "ambassadorName": "John Doe",
      "ambassadorId": "60d21b4667d0d8992e610c85"
    }
  ]
}
```

### 3. Redeem Coupon Code (Track Purchase)

**Endpoint:** `POST /api/coupon/redeem`

Call this endpoint when a customer completes a purchase using an ambassador's coupon or referral code. This updates the ambassador's statistics and calculates their commission.

**Request:**
```json
{
  "code": "SUMMER2023",
  "orderId": "ORD-12345",
  "orderAmount": 150.99,
  "customerEmail": "customer@example.com",
  "products": [
    {
      "id": "prod-123",
      "name": "Product Name",
      "price": 99.99,
      "quantity": 1
    }
  ]
}
```

**Success Response:**
```json
{
  "success": true,
  "ambassadorId": "60d21b4667d0d8992e610c85",
  "commission": 15.10,
  "message": "Coupon redemption recorded successfully"
}
```

## Implementation Guidelines

### 1. Coupon Code Validation Flow

1. When a customer enters a coupon code in the checkout form, call the `/api/coupon/validate` endpoint
2. If valid, display the discount percentage to the user and apply it to their order
3. Store the ambassador ID with the order for tracking

```javascript
// Example validation code
async function validateCoupon(code) {
  try {
    const response = await fetch('/api/coupon/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      // Apply discount to order
      applyDiscount(data.discount.value, data.discount.type);
      // Store ambassador ID
      storeAmbassadorId(data.discount.ambassadorId);
      // Show success message
      showMessage(data.message);
    } else {
      // Show error message
      showError(data.message);
    }
  } catch (error) {
    console.error('Error validating coupon:', error);
    showError('Failed to validate coupon. Please try again.');
  }
}
```

### 2. Tracking Completed Orders

After a successful order with an ambassador coupon code, call the `/api/coupon/redeem` endpoint to record the sale and update ambassador statistics.

```javascript
// Example order completion code
async function completeOrder(orderDetails, couponCode) {
  try {
    // Process payment and create order first
    const order = await processOrder(orderDetails);
    
    // If the order used a coupon code, redeem it
    if (couponCode) {
      await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          orderId: order.id,
          orderAmount: order.total,
          customerEmail: order.customerEmail,
          products: order.items
        })
      });
    }
    
    // Complete order process
    return order;
  } catch (error) {
    console.error('Error completing order:', error);
    throw error;
  }
}
```

### 3. Referral Links

Referral links follow this format:
```
https://elevee.netlify.app?ref=REFERRALCODE
```

When a user visits your site via a referral link:
1. Extract the referral code from the URL query parameter
2. Store it in localStorage/cookies for the session
3. Apply the discount automatically at checkout
4. Record the origin of the visit for tracking conversion rates

```javascript
// Example referral code handling
function handleReferral() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode) {
    // Store the referral code
    localStorage.setItem('referralCode', refCode);
    
    // Optional: Call API to track the click
    trackReferralClick(refCode);
  }
}

// During checkout, apply the stored referral code automatically
function applyStoredReferralCode() {
  const referralCode = localStorage.getItem('referralCode');
  if (referralCode) {
    applyAndValidateCoupon(referralCode);
  }
}
```

### 4. Keeping Discount Percentages Current

To ensure discount percentages are always current:

1. **Option 1: Real-time validation**
   Always validate coupon codes at checkout using the `/api/coupon/validate` endpoint

2. **Option 2: Periodic syncing**
   Periodically call the `/api/coupon/list` endpoint to update your local cache of coupon codes and their discount percentages

```javascript
// Example syncing implementation
async function syncCouponCodes() {
  try {
    const response = await fetch('/api/coupon/list');
    const data = await response.json();
    
    // Update local cache
    localStorage.setItem('couponCodes', JSON.stringify(data.coupons));
    console.log('Coupon codes synced:', data.coupons.length);
    
    return data.coupons;
  } catch (error) {
    console.error('Error syncing coupon codes:', error);
  }
}

// Call this function periodically
// For example, on app startup and every few hours
syncCouponCodes();
```

## Testing

Use these test coupon codes during development:

- For automatic generation of test data, visit `/api/test/generate-ambassadors` (admin only)
- Use coupon code "TEST10" for a 10% discount
- Use coupon code "TEST20" for a 20% discount

## Support

For any questions about integrating the ambassador program, contact the development team at dev@elevee.app. 