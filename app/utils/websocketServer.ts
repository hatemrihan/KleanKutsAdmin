/**
 * WebSocket Server Utility
 * 
 * This file provides the infrastructure for real-time stock updates via WebSockets.
 * It's designed to be compatible with the e-commerce site's stock synchronization system.
 */

import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer } from 'socket.io';
import { logSync } from './logger';

// Access the global io instance initialized in server.js
declare global {
  var io: WebSocketServer | null;
}

// Store active connections reference
const connectedClients = new Set<string>();

// Event types for stock updates
export enum StockEventType {
  STOCK_UPDATED = 'stock:updated',
  STOCK_REDUCED = 'stock:reduced',
  STOCK_VALIDATED = 'stock:validated',
  PRODUCT_UPDATED = 'product:updated',
  PRODUCT_DELETED = 'product:deleted',
}

/**
 * Get reference to the WebSocket server
 * Note: The actual initialization happens in server.js
 */
export function getIoInstance() {
  if (!global.io) {
    logSync('WebSocket server not initialized yet', 'warn');
    return null;
  }
  return global.io;
}

/**
 * Get the WebSocket server instance
 */
export function getWebSocketServer() {
  return getIoInstance();
}

/**
 * Emit a stock update event to all connected clients
 */
export function emitStockUpdate(eventType: StockEventType, data: any) {
  const io = getIoInstance();
  if (!io) {
    logSync('Cannot emit event: WebSocket server not initialized', 'error');
    return false;
  }

  logSync(`Emitting ${eventType} event`, 'info', { data });
  io.emit(eventType, {
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  return true;
}

/**
 * Get the number of connected clients
 */
export function getConnectedClientsCount() {
  const io = getIoInstance();
  if (!io) return 0;
  
  // In Socket.IO v4, we can get the number of connected clients
  return io.engine ? io.engine.clientsCount : 0;
}

/**
 * Utility function to emit stock reduction event
 */
export function emitStockReduction(productId: string, size: string, color: string, newStock: number) {
  return emitStockUpdate(StockEventType.STOCK_REDUCED, {
    productId,
    size,
    color,
    stock: newStock,
    operation: 'reduce'
  });
}

/**
 * Utility function to emit product update event
 */
export function emitProductUpdate(productId: string, updateType: 'create' | 'update' | 'delete') {
  return emitStockUpdate(StockEventType.PRODUCT_UPDATED, {
    productId,
    updateType,
  });
}
