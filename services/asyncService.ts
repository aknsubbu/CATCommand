import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Buffer } from 'buffer'; // Import Buffer
import pako from 'pako';
import { v4 as uuidv4 } from 'uuid';

// --- Interfaces ---
export interface OfflineQueueItem {
  id: string;
  operatorId: string;
  type: "inspection" | "alert" | "tracking" | "metric" | "workorder_update";
  priority: "low" | "medium" | "high" | "critical";
  data: any; // The actual data to sync (uncompressed)
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "syncing" | "synced" | "failed";
  errorMessage?: string;
  dataSize: number; // in bytes (of compressed data)
  compressed: boolean;
  createdAt: Date;
}

// This interface represents the data structure as it is stored in AsyncStorage
interface StoredQueueItem extends Omit<OfflineQueueItem, 'data' | 'timestamp' | 'createdAt'> {
  data: string; // Compressed data, base64 encoded
  timestamp: string; // ISO string
  createdAt: string; // ISO string
}


// --- Offline Queue Service ---
export class OfflineQueueService {
  private static readonly STORAGE_KEY = '@OfflineQueue:items';

  /**
   * Retrieves and decodes all items from AsyncStorage.
   */
  static async getAllItems(): Promise<OfflineQueueItem[]> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return [];

      const items: StoredQueueItem[] = JSON.parse(storedData);
      
      return items.map(item => {
        let decodedData: any;
        if (item.compressed) {
          const compressedData = Buffer.from(item.data, 'base64');
          const decompressedString = pako.inflate(compressedData, { to: 'string' });
          decodedData = JSON.parse(decompressedString);
        } else {
          // This is a fallback for any uncompressed data that might exist
          decodedData = item.data;
        }

        return {
          ...item,
          timestamp: new Date(item.timestamp),
          createdAt: new Date(item.createdAt),
          data: decodedData,
        };
      });
    } catch (error) {
      console.error('Error retrieving items from AsyncStorage:', error);
      return [];
    }
  }

  /**
   * Compresses and adds a new item to the queue.
   */
  static async addItem(
    newItemData: Omit<OfflineQueueItem, 'id' | 'status' | 'attempts' | 'createdAt' | 'maxAttempts' | 'dataSize' | 'compressed'>
  ): Promise<OfflineQueueItem> {
    try {
      const jsonData = JSON.stringify(newItemData.data);
      const compressedData = pako.deflate(jsonData);

      const newItem: OfflineQueueItem = {
        id: uuidv4(),
        ...newItemData,
        attempts: 0,
        maxAttempts: 3,
        status: 'pending',
        dataSize: compressedData.length,
        compressed: true,
        createdAt: new Date(),
      };

      const itemToStore: StoredQueueItem = {
        ...newItem,
        data: Buffer.from(compressedData).toString('base64'), // Store compressed data as base64
        timestamp: newItem.timestamp.toISOString(),
        createdAt: newItem.createdAt.toISOString(),
      };

      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      const existingItems: StoredQueueItem[] = storedData ? JSON.parse(storedData) : [];
      const updatedItems = [...existingItems, itemToStore];
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedItems));
      return newItem;
    } catch (error) {
      console.error('Error adding item to AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Updates an existing item, ensuring data is re-compressed correctly.
   */
  static async updateItem(updatedItem: OfflineQueueItem): Promise<OfflineQueueItem | null> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return null;
      
      const existingItems: StoredQueueItem[] = JSON.parse(storedData);
      const itemIndex = existingItems.findIndex(item => item.id === updatedItem.id);
      
      if (itemIndex === -1) {
        console.warn(`updateItem: Item with id ${updatedItem.id} not found.`);
        return null;
      }

      const jsonData = JSON.stringify(updatedItem.data);
      const compressedData = pako.deflate(jsonData);

      const itemToStore: StoredQueueItem = {
        ...updatedItem,
        data: Buffer.from(compressedData).toString('base64'),
        dataSize: compressedData.length,
        timestamp: updatedItem.timestamp.toISOString(),
        createdAt: updatedItem.createdAt.toISOString(),
      };

      existingItems[itemIndex] = itemToStore;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingItems));
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating item in AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Removes an item from the queue by its ID.
   */
  static async removeItem(id: string): Promise<boolean> {
    try {
      const storedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!storedData) return false;

      const existingItems: StoredQueueItem[] = JSON.parse(storedData);
      const updatedItems = existingItems.filter(item => item.id !== id);

      if (existingItems.length === updatedItems.length) {
        return false;
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedItems));
      return true;
    } catch (error) {
      console.error('Error removing item from AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Clears the entire offline queue.
   */
  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing queue from AsyncStorage:', error);
      throw error;
    }
  }

  /**
   * Logs all items to the console for debugging.
   */
  static async logAllItems(): Promise<void> {
    try {
      const items = await this.getAllItems();
      console.log('--- Offline Queue Items (Decoded) ---');
      console.log(JSON.stringify(items, null, 2));
      console.log('------------------------------------');
    } catch (error) {
      console.error('Error logging items from AsyncStorage:', error);
    }
  }
}


// --- Sync Manager ---
class SyncManager {
  private static isSyncing = false;
  private static unsubscribe: (() => void) | null = null;

  static initialize() {
    if (this.unsubscribe) return; // Already initialized
    console.log("Initializing SyncManager...");
    this.unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log("Network connection detected. Processing queue...");
        this.processQueue();
      } else {
        console.log("No network connection.");
      }
    });
  }

  static async processQueue() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    console.log("Starting queue processing...");

    try {
      const items = await OfflineQueueService.getAllItems();
      if (items.length === 0) {
        console.log("Queue is empty. Nothing to process.");
        this.isSyncing = false;
        return;
      }

      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
      items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      console.log(`Processing ${items.length} items...`);
      for (const item of items) {
        await this.syncItem(item);
        await new Promise(res => setTimeout(res, 500));
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      console.log("Queue processing finished.");
      this.isSyncing = false;
    }
  }

  private static async syncItem(item: OfflineQueueItem) {
    console.log(`Syncing item ${item.id} (Priority: ${item.priority})`);
    item.attempts++;
    item.status = 'syncing';
    await OfflineQueueService.updateItem(item);

    try {
      // ** REPLACE WITH YOUR ACTUAL API CALL **
      console.log(`Simulating API call for item: ${item.id}`, item.data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      console.log(`Successfully synced item ${item.id}`);
      // Remove item from queue after successful sync
      await OfflineQueueService.removeItem(item.id);

    } catch (error) {
      console.error(`Error syncing item ${item.id}:`, error);
      item.status = 'failed';
      item.errorMessage = (error as Error).message;
      if (item.attempts >= item.maxAttempts) {
        console.warn(`Item ${item.id} reached max attempts and will not be retried.`);
      }
      await OfflineQueueService.updateItem(item);
    }
  }

  static destroy() {
    if (this.unsubscribe) {
      console.log("Destroying SyncManager...");
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

// Initialize the SyncManager when the app starts
SyncManager.initialize();
