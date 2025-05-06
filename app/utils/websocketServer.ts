/**
 * WebSocket Server Utility
 * 
 * This file provides the infrastructure for real-time stock updates via WebSockets.
 * It's designed to be compatible with the e-commerce site's stock synchronization system.
 */

import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer } from 'socket.io';
import { logSync } from './logger';

// Store active connections
let io: WebSocketServer | null = null;
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
 * Initialize the WebSocket server
 */
export function initWebSocketServer(server: HTTPServer) {
  if (io) {
    logSync('WebSocket server already initialized', 'warn');
    return io;
  }

  io = new WebSocketServer(server, {
    cors: {
      origin: '*', // In production, restrict this to your domains
      methods: ['GET', 'POST'],
    },
    path: '/api/socket',
  });

  io.on('connection', (socket) => {
    const clientId = socket.id;
    connectedClients.add(clientId);
    
    logSync(`Client connected: ${clientId}`, 'info', { 
      totalConnections: connectedClients.size 
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      connectedClients.delete(clientId);
      logSync(`Client disconnected: ${clientId}`, 'info', { 
        totalConnections: connectedClients.size 
      });
    });

    // Send welcome message
    socket.emit('welcome', { 
      message: 'Connected to KleanKuts Admin WebSocket Server',
      timestamp: new Date().toISOString(),
    });
  });

  logSync('WebSocket server initialized', 'info');
  return io;
}

/**
 * Get the WebSocket server instance
 */
export function getWebSocketServer() {
  if (!io) {
    logSync('WebSocket server not initialized', 'warn');
    return null;
  }
  return io;
}

/**
 * Emit a stock update event to all connected clients
 */
export function emitStockUpdate(eventType: StockEventType, data: any) {
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
  return connectedClients.size;
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
