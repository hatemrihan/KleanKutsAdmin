/**
 * Cache Utilities
 * 
 * This file contains utilities for managing product-related caches and ensuring
 * real-time updates throughout the application.
 */

import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongoose';

/**
 * Cache keys for different types of data
 */
export const CACHE_KEYS = {
  PRODUCT_COUNTS: 'product_counts',
  DASHBOARD_STATS: 'dashboard_stats',
  RECENT_CHANGES: 'recent_changes'
};

/**
 * Record a product change in the cache for real-time synchronization
 * @param changeType - Type of change (add, update, delete)
 * @param productId - ID of the product that changed
 * @param details - Additional details about the change
 */
export async function recordProductChange(
  changeType: 'add' | 'update' | 'delete',
  productId: string,
  details?: Record<string, any>
): Promise<boolean> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      console.error('Failed to connect to database for cache update');
      return false;
    }
    
    // Get or create cache collection
    const cacheCollection = db.collection('cache');
    
    // Current timestamp
    const timestamp = new Date();
    
    // Create a change record
    const changeRecord = {
      type: changeType,
      productId,
      timestamp,
      details: details || {}
    };
    
    // Get the current document to update arrays properly
    const productCountsDoc = await cacheCollection.findOne({ key: CACHE_KEYS.PRODUCT_COUNTS });
    
    // Update the product counts cache status with changes array
    const updateDoc: any = { 
      $set: { 
        lastInvalidated: timestamp,
        requiresRefresh: true
      }
    };
    
    // Add the changes array if it exists, otherwise create it
    if (productCountsDoc && Array.isArray(productCountsDoc.changes)) {
      const updatedChanges = [changeRecord, ...productCountsDoc.changes.slice(0, 19)];
      updateDoc.$set.changes = updatedChanges;
    } else {
      updateDoc.$set.changes = [changeRecord];
    }
    
    await cacheCollection.updateOne(
      { key: CACHE_KEYS.PRODUCT_COUNTS },
      updateDoc,
      { upsert: true }
    );
    
    // Also update the dashboard stats cache
    await cacheCollection.updateOne(
      { key: CACHE_KEYS.DASHBOARD_STATS },
      { 
        $set: { 
          lastInvalidated: timestamp,
          requiresRefresh: true
        }
      },
      { upsert: true }
    );
    
    // Add to recent changes collection for real-time sync
    const recentChangesDoc = await cacheCollection.findOne({ key: CACHE_KEYS.RECENT_CHANGES });
    
    const recentUpdateDoc: any = {
      $set: {
        lastUpdated: timestamp
      }
    };
    
    // Add the changes array if it exists, otherwise create it
    if (recentChangesDoc && Array.isArray(recentChangesDoc.changes)) {
      const updatedRecentChanges = [changeRecord, ...recentChangesDoc.changes.slice(0, 49)];
      recentUpdateDoc.$set.changes = updatedRecentChanges;
    } else {
      recentUpdateDoc.$set.changes = [changeRecord];
    }
    
    await cacheCollection.updateOne(
      { key: CACHE_KEYS.RECENT_CHANGES },
      recentUpdateDoc,
      { upsert: true }
    );
    
    console.log(`Recorded ${changeType} of product ${productId} in cache`);
    return true;
  } catch (error) {
    console.error('Error recording product change in cache:', error);
    return false;
  }
}

/**
 * Get recent product changes to detect out-of-sync states
 * @param since - Optional timestamp to get changes since a specific time
 * @returns Array of recent product changes
 */
export async function getRecentProductChanges(since?: Date): Promise<any[]> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      console.error('Failed to connect to database for fetching recent changes');
      return [];
    }
    
    const cacheCollection = db.collection('cache');
    
    // Get the recent changes record
    const recentChangesRecord = await cacheCollection.findOne({ key: CACHE_KEYS.RECENT_CHANGES });
    
    if (!recentChangesRecord || !recentChangesRecord.changes) {
      return [];
    }
    
    // Filter changes if a since timestamp is provided
    if (since) {
      return recentChangesRecord.changes.filter((change: any) => 
        new Date(change.timestamp) > since
      );
    }
    
    return recentChangesRecord.changes;
  } catch (error) {
    console.error('Error fetching recent product changes:', error);
    return [];
  }
}

/**
 * Check if product counts need to be refreshed
 * @returns Boolean indicating if refresh is needed and the last invalidation timestamp
 */
export async function checkProductCountsCache(): Promise<{ requiresRefresh: boolean, lastInvalidated?: Date }> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      // If we can't connect, assume refresh is needed
      return { requiresRefresh: true };
    }
    
    const cacheCollection = db.collection('cache');
    
    // Get the product counts cache record
    const productCountsCache = await cacheCollection.findOne({ key: CACHE_KEYS.PRODUCT_COUNTS });
    
    if (!productCountsCache) {
      // No cache record exists, needs refresh
      return { requiresRefresh: true };
    }
    
    return { 
      requiresRefresh: productCountsCache.requiresRefresh === true,
      lastInvalidated: productCountsCache.lastInvalidated
    };
  } catch (error) {
    console.error('Error checking product counts cache:', error);
    // If there's an error, assume refresh is needed
    return { requiresRefresh: true };
  }
}

/**
 * Mark the product counts cache as refreshed
 */
export async function markProductCountsCacheRefreshed(): Promise<boolean> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return false;
    }
    
    const cacheCollection = db.collection('cache');
    
    // Update the product counts cache status
    await cacheCollection.updateOne(
      { key: CACHE_KEYS.PRODUCT_COUNTS },
      { 
        $set: { 
          lastRefreshed: new Date(),
          requiresRefresh: false
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking product counts cache as refreshed:', error);
    return false;
  }
}

/**
 * Invalidate a specific cache to force refresh on next fetch
 * @param cacheKey - The key of the cache to invalidate
 * @returns Boolean indicating if the invalidation was successful
 */
export async function invalidateCache(cacheKey: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      console.error('Failed to connect to database for cache invalidation');
      return false;
    }
    
    // Get cache collection
    const cacheCollection = db.collection('cache');
    
    // Current timestamp
    const timestamp = new Date();
    
    // Update the cache status
    await cacheCollection.updateOne(
      { key: cacheKey },
      { 
        $set: { 
          lastInvalidated: timestamp,
          requiresRefresh: true
        }
      },
      { upsert: true }
    );
    
    console.log(`Cache invalidated: ${cacheKey}`);
    return true;
  } catch (error) {
    console.error(`Error invalidating cache ${cacheKey}:`, error);
    return false;
  }
} 