import { Button, StyleSheet } from "react-native";
import { useState, useEffect, useCallback } from "react";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { OfflineQueueService, OfflineQueueItem } from "@/services/asyncService";

export default function AsyncScreen() {
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  const fetchQueueItems = useCallback(async () => {
    try {
      const items = await OfflineQueueService.getAllItems();
      setOfflineQueue(items);
    } catch (error) {
      console.error("Error fetching queue items:", error);
    }
  }, []);

  useEffect(() => {
    fetchQueueItems();
  }, [fetchQueueItems]);

  const handleTestAsyncStorage = async () => {
    try {
      console.log("Testing AsyncStorage...");
      const sampleItem = {
        operatorId: "op-123",
        type: "inspection" as const,
        priority: "high" as const,
        data: { machineId: "machine-456", inspectionNotes: "All systems nominal." },
        timestamp: new Date(),
      };
      await OfflineQueueService.addItem(sampleItem);
      console.log("Sample item added to the queue.");
      fetchQueueItems(); // Refresh the list
      await OfflineQueueService.logAllItems();
    } catch (error) {
      console.error("Error during AsyncStorage test:", error);
    }
  };

  const handleClearQueue = async () => {
    try {
      console.log("Clearing the offline queue...");
      await OfflineQueueService.clearQueue();
      console.log("Offline queue cleared.");
      fetchQueueItems(); // Refresh the list
    } catch (error) {
      console.error("Error clearing the queue:", error);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>🗄️</ThemedText>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Async Storage Test</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Press the button below to add a sample item to the offline queue.
        </ThemedText>
        <Button title="Add Sample Item" onPress={handleTestAsyncStorage} />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Press the button below to clear the entire offline queue.
        </ThemedText>
        <Button title="Clear Queue" onPress={handleClearQueue} color="#ff4d4d" />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Press the button below to refresh the queue display.
        </ThemedText>
        <Button title="Refresh Queue" onPress={fetchQueueItems} />
      </ThemedView>

      <ThemedView style={styles.queueContainer}>
        <ThemedText type="defaultSemiBold">Offline Queue ({offlineQueue.length} items)</ThemedText>
        {offlineQueue.length === 0 ? (
          <ThemedText style={{ marginTop: 8, fontStyle: 'italic' }}>The queue is empty.</ThemedText>
        ) : (
          offlineQueue.map((item, index) => (
            <ThemedView key={item.id} style={styles.queueItem}>
              <ThemedText style={styles.queueItemText}>
                {index + 1}. {item.type} - {item.priority} - {item.status}
              </ThemedText>
              <ThemedText style={styles.queueItemText}>
                ID: {item.id}
              </ThemedText>
            </ThemedView>
          ))
        )}
      </ThemedView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  queueContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  queueItem: {
    marginVertical: 4,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 4,
  },
  queueItemText: {
    fontSize: 12,
    opacity: 0.8,
  },
});