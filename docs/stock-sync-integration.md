# Real-Time Stock Synchronization Integration Guide

This document provides comprehensive information about the new real-time stock synchronization system implemented in the admin panel. These changes allow for better integration between the admin panel and the e-commerce site, ensuring accurate stock information and preventing overselling.

## Overview of Changes

We've implemented a comprehensive real-time stock synchronization system with the following components:

1. **Enhanced Stock APIs** with timestamp tracking and cache control
2. **WebSocket Integration** for real-time updates
3. **Detailed Logging** for troubleshooting and monitoring
4. **Product-specific Stock Endpoints** for targeted queries

## New API Endpoints

### Stock Validation API
- **Endpoint**: `/api/stock/validate`
- **Method**: POST
- **Purpose**: Validates if requested quantities are available in stock
- **Features**:
  - Timestamp tracking for cache busting
  - Detailed error responses for each item
  - Cache control headers

### Stock Reduction API
- **Endpoint**: `/api/stock/reduce`
- **Method**: POST
- **Purpose**: Reduces stock quantities after successful orders
- **Features**:
  - Real-time WebSocket event emission
  - Timestamp tracking
  - Detailed logging
  - Cache control headers
  - Query parameter `afterOrder=true` for bypassing cache

### Product-specific Stock API
- **Endpoint**: `/api/products/[id]/stock`
- **Method**: GET
- **Purpose**: Gets real-time stock information for a specific product
- **Features**:
  - Timestamp tracking
  - Cache control headers
  - Last-Modified headers for conditional requests

### Stock Synchronization API
- **Endpoint**: `/api/stock/sync`
- **Method**: GET/POST
- **Purpose**: Bulk operations for stock information
- **Features**:
  - GET: Retrieves stock information for multiple products
  - POST: Updates timestamps for multiple products
  - WebSocket event emission
  - Cache control headers

### WebSocket API
- **Endpoint**: `/api/socket`
- **Method**: GET/POST
- **Purpose**: WebSocket connection status and manual event emission
- **Features**:
  - GET: Checks WebSocket server status
  - POST: Manually emits stock update events

## WebSocket Integration

The system now supports real-time stock updates through WebSocket events. When stock changes occur, the system automatically emits events that connected clients can listen to.

### Event Types

- `STOCK_UPDATED`: Emitted when stock information is updated
- `STOCK_REDUCED`: Emitted when stock is reduced after an order
- `STOCK_VALIDATED`: Emitted when stock is validated for an order

### Event Payload

```typescript
{
  productId: string;
  size?: string;
  color?: string;
  stock?: number;
  timestamp: string;
  afterOrder?: boolean;
}
```

## Integration Instructions

### 1. Stock Validation Before Checkout

Before processing a checkout, validate the stock to ensure all items are available:

```javascript
// Example request
const response = await fetch('/api/stock/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      {
        productId: '60d21b4667d0d8992e610c85',
        size: 'M',
        color: 'Red',
        quantity: 2
      }
    ]
  })
});

const data = await response.json();

if (data.success) {
  // Proceed with checkout
} else {
  // Show errors to the user
  // data.errors contains details about which items are out of stock
}
```

### 2. Stock Reduction After Order

After a successful order, reduce the stock:

```javascript
// Example request
const response = await fetch('/api/stock/reduce?afterOrder=true&orderId=12345', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      {
        productId: '60d21b4667d0d8992e610c85',
        size: 'M',
        color: 'Red',
        quantity: 2
      }
    ]
  })
});

const data = await response.json();
```

### 3. Real-time Stock Updates via WebSocket

Connect to the WebSocket server to receive real-time stock updates:

```javascript
import { io } from 'socket.io-client';

// Connect to the WebSocket server
const socket = io();

// Listen for stock update events
socket.on('STOCK_UPDATED', (data) => {
  console.log('Stock updated:', data);
  // Update UI or local cache
});

// Listen for stock reduction events
socket.on('STOCK_REDUCED', (data) => {
  console.log('Stock reduced:', data);
  // Update UI or local cache
});
```

### 4. Fetching Stock for Multiple Products

To get stock information for multiple products at once:

```javascript
// Example request
const productIds = ['60d21b4667d0d8992e610c85', '60d21b4667d0d8992e610c86'];
const response = await fetch(`/api/stock/sync?productIds=${productIds.join(',')}`);
const data = await response.json();

// data.products contains stock information for all requested products
```

### 5. Fetching Stock for a Single Product

To get stock information for a single product:

```javascript
// Example request
const productId = '60d21b4667d0d8992e610c85';
const response = await fetch(`/api/products/${productId}/stock`);
const data = await response.json();

// data contains stock information for the requested product
```

## Cache Control

The system implements smart caching to improve performance while ensuring data accuracy:

1. After an order (`afterOrder=true`), all responses include `no-cache` headers to ensure fresh data
2. Normal requests include short-lived cache headers (5-10 seconds) to improve performance
3. All responses include a `X-Stock-Timestamp` header for client-side cache validation

## Error Handling

All APIs follow a consistent error format:

```javascript
{
  error: string;            // Error message
  timestamp: string;        // ISO timestamp
  [additional fields]       // Additional context-specific fields
}
```

For batch operations, errors for individual items are returned in an `errors` array:

```javascript
{
  success: false,
  errors: [
    {
      item: { /* original request item */ },
      error: 'Item out of stock'
    }
  ]
}
```

## Product Data Structure Changes

The product data structure now includes:

1. `updatedAt` field for timestamp tracking
2. Optional `stock` field (now calculated from size/color variants)
3. Size variants with color variants and stock quantities

Example product structure:

```javascript
{
  _id: '60d21b4667d0d8992e610c85',
  title: 'Product Name',
  description: 'Product Description',
  price: 100,
  currency: 'L.E.',  // Changed from USD to Egyptian Pounds
  sizeVariants: [
    {
      size: 'M',
      colorVariants: [
        {
          color: 'Red',
          stock: 10
        }
      ]
    }
  ],
  updatedAt: '2025-05-07T02:06:47+03:00'
}
```

## Testing

To test the integration:

1. Use the provided API endpoints with sample data
2. Monitor the WebSocket events using browser dev tools
3. Check the admin panel logs for detailed information

## Troubleshooting

If you encounter issues:

1. Check the response headers for timestamp information
2. Verify that the WebSocket connection is established
3. Ensure that product IDs, sizes, and colors match exactly
4. Contact the admin panel team for assistance

---

For any questions or issues, please contact the admin panel development team.
