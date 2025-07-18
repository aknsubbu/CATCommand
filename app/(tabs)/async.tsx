// import { Button, StyleSheet } from "react-native";
// import { useState, useEffect, useCallback } from "react";

// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";
// import { OfflineQueueService, OfflineQueueItem } from "@/services/asyncService";

// export default function AsyncScreen() {
//   const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

//   const fetchQueueItems = useCallback(async () => {
//     try {
//       const items = await OfflineQueueService.getAllItems();
//       setOfflineQueue(items);
//     } catch (error) {
//       console.error("Error fetching queue items:", error);
//     }
//   }, []);

//   useEffect(() => {
//     fetchQueueItems();
//   }, [fetchQueueItems]);

//   const handleTestAsyncStorage = async () => {
//     try {
//       console.log("Testing AsyncStorage...");
//       const sampleItem = {
//         operatorId: "op-123",
//         type: "inspection" as const,
//         priority: "high" as const,
//         data: { machineId: "machine-456", inspectionNotes: "All systems nominal." },
//         timestamp: new Date(),
//       };
//       await OfflineQueueService.addItem(sampleItem);
//       console.log("Sample item added to the queue.");
//       fetchQueueItems(); // Refresh the list
//       await OfflineQueueService.logAllItems();
//     } catch (error) {
//       console.error("Error during AsyncStorage test:", error);
//     }
//   };

//   const handleClearQueue = async () => {
//     try {
//       console.log("Clearing the offline queue...");
//       await OfflineQueueService.clearQueue();
//       console.log("Offline queue cleared.");
//       fetchQueueItems(); // Refresh the list
//     } catch (error) {
//       console.error("Error clearing the queue:", error);
//     }
//   };

//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
//       headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>🗄️</ThemedText>}
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Async Storage Test</ThemedText>
//       </ThemedView>

//       <ThemedView style={styles.stepContainer}>
//         <ThemedText>
//           Press the button below to add a sample item to the offline queue.
//         </ThemedText>
//         <Button title="Add Sample Item" onPress={handleTestAsyncStorage} />
//       </ThemedView>

//       <ThemedView style={styles.stepContainer}>
//         <ThemedText>
//           Press the button below to clear the entire offline queue.
//         </ThemedText>
//         <Button title="Clear Queue" onPress={handleClearQueue} color="#ff4d4d" />
//       </ThemedView>

//       <ThemedView style={styles.stepContainer}>
//         <ThemedText>
//           Press the button below to refresh the queue display.
//         </ThemedText>
//         <Button title="Refresh Queue" onPress={fetchQueueItems} />
//       </ThemedView>

//       <ThemedView style={styles.queueContainer}>
//         <ThemedText type="defaultSemiBold">Offline Queue ({offlineQueue.length} items)</ThemedText>
//         {offlineQueue.length === 0 ? (
//           <ThemedText style={{ marginTop: 8, fontStyle: 'italic' }}>The queue is empty.</ThemedText>
//         ) : (
//           offlineQueue.map((item, index) => (
//             <ThemedView key={item.id} style={styles.queueItem}>
//               <ThemedText style={styles.queueItemText}>
//                 {index + 1}. {item.type} - {item.priority} - {item.status}
//               </ThemedText>
//               <ThemedText style={styles.queueItemText}>
//                 ID: {item.id}
//               </ThemedText>
//             </ThemedView>
//           ))
//         )}
//       </ThemedView>

//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 16,
//   },
//   queueContainer: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: 'rgba(0, 0, 0, 0.05)',
//     borderRadius: 8,
//   },
//   queueItem: {
//     marginVertical: 4,
//     padding: 8,
//     backgroundColor: 'rgba(0, 0, 0, 0.02)',
//     borderRadius: 4,
//   },
//   queueItemText: {
//     fontSize: 12,
//     opacity: 0.8,
//   },
// });



import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, Alert as RNAlert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { OfflineQueueItem, OfflineQueueService } from "@/services/asyncService";
import { spacing, typography } from "../../constants/theme";

// CAT Color Scheme (matching other screens)
const catColors = {
  primary: "#FFCD11", // CAT Yellow
  secondary: "#000000", // CAT Black
  background: {
    light: "#FFFFFF",
    gray: "#F5F5F5",
    dark: "#1A1A1A",
  },
  text: {
    primary: "#000000",
    secondary: "#666666",
    light: "#FFFFFF",
  },
  status: {
    pending: "#FFA500",
    inProgress: "#007ACC",
    completed: "#28A745",
    cancelled: "#DC3545",
    urgent: "#DC3545",
    high: "#FF6B35",
    medium: "#FFA500",
    low: "#28A745",
  },
  border: "#E0E0E0",
};

const priorityColors = {
  high: catColors.status.high,
  medium: catColors.status.medium,
  low: catColors.status.low,
};

const statusColors = {
  pending: catColors.status.pending,
  processing: catColors.status.inProgress,
  completed: catColors.status.completed,
  failed: catColors.status.cancelled,
};

export default function AsyncScreen() {
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastAction, setLastAction] = useState<string>("");

  const fetchQueueItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await OfflineQueueService.getAllItems();
      setOfflineQueue(items);
    } catch (error) {
      console.error("Error fetching queue items:", error);
      RNAlert.alert("Error", "Failed to fetch queue items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueueItems();
  }, [fetchQueueItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQueueItems();
    setRefreshing(false);
  };

  const handleTestAsyncStorage = async () => {
    try {
      setLoading(true);
      console.log("Testing AsyncStorage...");
      
      const sampleItems = [
        {
          operatorId: "op-123",
          type: "inspection" as const,
          priority: "high" as const,
          data: { machineId: "CAT-789", inspectionNotes: "Hydraulic pressure check completed." },
          timestamp: new Date(),
        },
        {
          operatorId: "op-456",
          type: "maintenance" as const,
          priority: "medium" as const,
          data: { machineId: "CAT-456", maintenanceType: "Oil change scheduled." },
          timestamp: new Date(),
        },
        {
          operatorId: "op-789",
          type: "alert" as const,
          priority: "low" as const,
          data: { machineId: "CAT-123", alertMessage: "Low fuel warning cleared." },
          timestamp: new Date(),
        }
      ];

      for (const item of sampleItems) {
        await OfflineQueueService.addItem(item);
      }
      
      console.log("Sample items added to the queue.");
      setLastAction(`Added ${sampleItems.length} sample items to queue`);
      await fetchQueueItems();
      await OfflineQueueService.logAllItems();
      
      RNAlert.alert("Success", `Added ${sampleItems.length} sample items to the offline queue.`);
    } catch (error) {
      console.error("Error during AsyncStorage test:", error);
      RNAlert.alert("Error", "Failed to add sample items");
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async () => {
    RNAlert.alert(
      "Clear Queue",
      "Are you sure you want to clear all items from the offline queue? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              console.log("Clearing the offline queue...");
              await OfflineQueueService.clearQueue();
              console.log("Offline queue cleared.");
              setLastAction("Cleared all queue items");
              await fetchQueueItems();
              RNAlert.alert("Success", "Offline queue cleared successfully.");
            } catch (error) {
              console.error("Error clearing the queue:", error);
              RNAlert.alert("Error", "Failed to clear queue");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddSingleItem = async (type: 'inspection' | 'maintenance' | 'alert') => {
    try {
      setLoading(true);
      const sampleItem = {
        operatorId: `op-${Math.floor(Math.random() * 1000)}`,
        type,
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        data: { 
          machineId: `CAT-${Math.floor(Math.random() * 1000)}`, 
          message: `Test ${type} item created at ${new Date().toLocaleTimeString()}` 
        },
        timestamp: new Date(),
      };
      
      await OfflineQueueService.addItem(sampleItem);
      setLastAction(`Added ${type} item to queue`);
      await fetchQueueItems();
      
      RNAlert.alert("Success", `Added ${type} item to queue.`);
    } catch (error) {
      console.error("Error adding single item:", error);
      RNAlert.alert("Error", `Failed to add ${type} item`);
    } finally {
      setLoading(false);
    }
  };

  const getQueueStats = () => {
    const stats = {
      total: offlineQueue.length,
      pending: offlineQueue.filter(item => item.status === 'pending').length,
      processing: offlineQueue.filter(item => item.status === 'processing').length,
      completed: offlineQueue.filter(item => item.status === 'completed').length,
      failed: offlineQueue.filter(item => item.status === 'failed').length,
    };
    return stats;
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection': return 'search';
      case 'maintenance': return 'construct';
      case 'alert': return 'warning';
      default: return 'document';
    }
  };

  const renderQueueItem = (item: OfflineQueueItem, index: number) => {
    const priorityColor = priorityColors[item.priority as keyof typeof priorityColors] || catColors.status.medium;
    const statusColor = statusColors[item.status as keyof typeof statusColors] || catColors.status.pending;

    return (
      <View key={item.id} style={styles.queueItemCard}>
        <View style={styles.queueItemHeader}>
          <View style={[styles.typeIcon, { backgroundColor: priorityColor + '20' }]}>
            <Ionicons name={getTypeIcon(item.type)} size={16} color={priorityColor} />
          </View>
          <View style={styles.queueItemContent}>
            <Text style={styles.queueItemTitle}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} #{index + 1}
            </Text>
            <Text style={styles.queueItemId}>ID: {item.id.slice(0, 8)}...</Text>
          </View>
          <View style={styles.queueItemBadges}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.badgeText}>{item.priority.toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.queueItemDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color={catColors.text.secondary} />
            <Text style={styles.detailText}>Operator: {item.operatorId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={catColors.text.secondary} />
            <Text style={styles.detailText}>Created: {formatTimestamp(item.timestamp)}</Text>
          </View>
          {item.data && typeof item.data === 'object' && 'machineId' in item.data && (
            <View style={styles.detailRow}>
              <Ionicons name="hardware-chip" size={14} color={catColors.text.secondary} />
              <Text style={styles.detailText}>Machine: {item.data.machineId as string}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const stats = getQueueStats();

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[catColors.primary]}
          tintColor={catColors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Development tools</Text>
          <Text style={styles.title}>Async Storage Testing</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>🗄️</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.pending }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.inProgress }]}>{stats.processing}</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.completed }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Test Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        <Text style={styles.sectionDescription}>
          Use these buttons to test AsyncStorage functionality and queue management.
        </Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleTestAsyncStorage}
            disabled={loading}
          >
            <Ionicons name="add-circle" size={20} color={catColors.text.light} />
            <Text style={styles.actionButtonText}>Add Sample Items</Text>
          </TouchableOpacity>

          <View style={styles.singleItemButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleAddSingleItem('inspection')}
              disabled={loading}
            >
              <Ionicons name="search" size={18} color={catColors.primary} />
              <Text style={styles.secondaryButtonText}>Inspection</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleAddSingleItem('maintenance')}
              disabled={loading}
            >
              <Ionicons name="construct" size={18} color={catColors.primary} />
              <Text style={styles.secondaryButtonText}>Maintenance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleAddSingleItem('alert')}
              disabled={loading}
            >
              <Ionicons name="warning" size={18} color={catColors.primary} />
              <Text style={styles.secondaryButtonText}>Alert</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearQueue}
            disabled={loading || offlineQueue.length === 0}
          >
            <Ionicons name="trash" size={20} color={catColors.text.light} />
            <Text style={styles.actionButtonText}>Clear All Queue</Text>
          </TouchableOpacity>
        </View>

        {lastAction && (
          <View style={styles.lastActionContainer}>
            <Ionicons name="checkmark-circle" size={16} color={catColors.status.completed} />
            <Text style={styles.lastActionText}>Last action: {lastAction}</Text>
          </View>
        )}
      </View>

      {/* Queue Display */}
      <View style={styles.queueSection}>
        <Text style={styles.sectionTitle}>
          Offline Queue {offlineQueue.length > 0 && `(${offlineQueue.length} items)`}
        </Text>
        
        {loading && offlineQueue.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={24} color={catColors.primary} />
            <Text style={styles.loadingText}>Loading queue items...</Text>
          </View>
        ) : offlineQueue.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="archive-outline" size={48} color={catColors.text.secondary} />
            <Text style={styles.emptyStateTitle}>Queue is Empty</Text>
            <Text style={styles.emptyStateText}>
              Add some test items to see how AsyncStorage queue management works.
            </Text>
          </View>
        ) : (
          <View style={styles.queueList}>
            {offlineQueue.map((item, index) => renderQueueItem(item, index))}
          </View>
        )}
      </View>

      {/* Bottom Padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.light,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  greeting: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: 2,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
  },
  headerIcon: {
    padding: spacing.sm,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
  },
  headerEmoji: {
    fontSize: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: "row",
    padding: spacing.base,
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: catColors.border,
  },
  actionsSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  actionButtons: {
    gap: spacing.base,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: catColors.primary,
  },
  secondaryButton: {
    backgroundColor: catColors.background.gray,
    borderWidth: 1,
    borderColor: catColors.primary,
    flex: 1,
  },
  dangerButton: {
    backgroundColor: catColors.status.cancelled,
  },
  actionButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: catColors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },
  singleItemButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lastActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: catColors.status.completed + '15',
    padding: spacing.sm,
    borderRadius: 6,
    marginTop: spacing.base,
    gap: spacing.xs,
  },
  lastActionText: {
    fontSize: typography.fontSize.sm,
    color: catColors.status.completed,
    fontWeight: '500',
  },
  queueSection: {
    padding: spacing.base,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  queueList: {
    gap: spacing.sm,
  },
  queueItemCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  queueItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  queueItemContent: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: 2,
  },
  queueItemId: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  queueItemBadges: {
    gap: spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
  },
  badgeText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  queueItemDetails: {
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  bottomPadding: {
    height: spacing["5xl"],
  },
});