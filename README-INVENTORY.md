# Inventory Management for E-commerce Frontend

This document explains how to integrate the admin panel's inventory system with your e-commerce frontend.

## The Problem

You're experiencing two issues:
1. In the admin panel, product stock shows as 0 despite having variants with quantities
2. In your e-commerce frontend, when clicking a specific size, it shows all items rather than just the inventory for that size

## Solution

I've created a dedicated inventory API endpoint that your e-commerce frontend should use to check stock by size.

## API Endpoints

### 1. Check Inventory

**Endpoint:** `GET /api/products/inventory`

**Query Parameters:**
- `productId` (required): The ID of the product
- `size` (optional): The specific size to check

**Examples:**

To get inventory for all sizes of a product:
```javascript
// In your e-commerce frontend
const response = await fetch(`/api/products/inventory?productId=${productId}`);
const data = await response.json();
// data.inventory will contain an array of all sizes with their quantities
```

To get inventory for a specific size:
```javascript
// In your e-commerce frontend
const response = await fetch(`/api/products/inventory?productId=${productId}&size=${selectedSize}`);
const data = await response.json();
// data.quantity will contain the stock level for that size
// data.available will be true if the item is in stock
```

### 2. Update Inventory (for checkouts)

**Endpoint:** `POST /api/products/inventory`

**Request Body:**
```json
{
  "productId": "product-id-here",
  "size": "M",
  "quantity": 1 // How many to deduct from inventory (default: 1)
}
```

## Integration Instructions

1. In your e-commerce product page, when displaying size options:

```javascript
// Fetch all sizes and their availability
useEffect(() => {
  const fetchInventory = async () => {
    const response = await fetch(`/api/products/inventory?productId=${productId}`);
    const data = await response.json();
    setInventory(data.inventory);
  };
  
  fetchInventory();
}, [productId]);

// In your render function
{inventory.map(item => (
  <button 
    key={item.size}
    disabled={!item.available} 
    onClick={() => selectSize(item.size)}
  >
    {item.size} {!item.available && "(Out of Stock)"}
  </button>
))}
```

2. When a user selects a size, check that specific size's inventory:

```javascript
const selectSize = async (size) => {
  const response = await fetch(`/api/products/inventory?productId=${productId}&size=${size}`);
  const data = await response.json();
  
  if (data.available) {
    setSelectedSize(size);
    setQuantityAvailable(data.quantity);
  } else {
    // Show out of stock message
  }
};
```

3. During checkout, update the inventory:

```javascript
const checkout = async () => {
  // Other checkout logic...
  
  // Update inventory
  await fetch('/api/products/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      size: selectedSize,
      quantity: quantityOrdered
    })
  });
  
  // Continue with checkout...
};
```

## Troubleshooting

If you're still experiencing issues:

1. Make sure your e-commerce frontend is making calls to the correct API endpoints
2. Check the browser console for any API errors
3. Verify that your product data in MongoDB has the correct structure with variants
4. Ensure that your admin panel is correctly saving variant quantities when you edit products 