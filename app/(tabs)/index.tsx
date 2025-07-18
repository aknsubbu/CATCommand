import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { spacing, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";

import FirestoreService, {
  Checkpoint,
  WorkOrder
} from "@/services/FirestoreService";

// CAT Color Scheme
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

// Types
interface BaseDocument {
  id: string;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

interface Location {
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const filterOptions = [
  { key: "all", label: "All Orders", icon: "list-outline" },
  { key: "pending", label: "Pending", icon: "time-outline" },
  { key: "in_progress", label: "In Progress", icon: "play-outline" },
  { key: "completed", label: "Completed", icon: "checkmark-outline" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [operatorId, setOperatorId] = useState("");
  const [selectedOperatorId, setSelectedOperatorId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsyncOperation = async (
    operationName: string,
    operation: () => Promise<any>
  ) => {
    setLoading(true);
    try {
      const result = await operation();
      Alert.alert('Success', 'Fetched work orders')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getWorkOrdersByOperator = () =>
    handleAsyncOperation("Get Work Orders by Operator", async () => {
      if (!selectedOperatorId) throw new Error("No operator selected");
      const workOrders = await FirestoreService.getWorkOrdersByOperator(
        selectedOperatorId
      );
      setWorkOrders(workOrders);
      console.log(workOrders);
      return `Found ${workOrders} work orders for operator ${selectedOperatorId}`;
    });

  const handleSearchOperator = async () => {
    if (!operatorId.trim()) {
      Alert.alert("Error", "Please enter an Operator ID");
      return;
    }
    
    setSelectedOperatorId(operatorId.trim());
    try {
      await getWorkOrdersByOperator();
    } catch {
      // Error already handled in handleAsyncOperation
    }
  };

  const clearSearch = () => {
    setOperatorId("");
    setSelectedOperatorId("");
  };

  const filterWorkOrders = () => {
    if (activeFilter === "all") {
      setFilteredOrders(workOrders);
    } else {
      setFilteredOrders(workOrders.filter(order => order.status === activeFilter));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedOperatorId) {
        await getWorkOrdersByOperator();
      } else {
        alert('No operator selected')
      }
    } catch {
      // Error already handled
    } finally {
      setRefreshing(false);
    }
  };

  const handleVoicePress = () => {
    setIsListening(!isListening);
    // Add voice interaction logic here
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return catColors.status.urgent;
      case "high": return catColors.status.high;
      case "medium": return catColors.status.medium;
      case "low": return catColors.status.low;
      default: return catColors.status.medium;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return catColors.status.pending;
      case "in_progress": return catColors.status.inProgress;
      case "completed": return catColors.status.completed;
      case "cancelled": return catColors.status.cancelled;
      default: return catColors.status.pending;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCompletedCheckpoints = (checkpoints: Checkpoint[]) => {
    return checkpoints.filter(cp => cp.completed).length;
  };

  const renderWorkOrderItem = ({ item }: { item: WorkOrder }) => {
    return (
      <TouchableOpacity
        style={styles.workOrderCard}
        onPress={() => {
          console.log("Navigate to work order:", item.id);
          router.push({pathname:'/workOrders',params:{workOrderID:item.id}});
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleSection}>
            <Text style={styles.workOrderTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.machineId} numberOfLines={1}>
              {item.assignedMachineId || "No machine assigned"}
            </Text>
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.locationSection}>
          <Ionicons name="location-outline" size={16} color={catColors.text.secondary} />
          <Text style={styles.locationText}>
            {item.location && typeof item.location.latitude === "number" && typeof item.location.longitude === "number"
              ? `${item.location.latitude}, ${item.location.longitude}`
              : "Location not specified"}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.scheduleInfo}>
            <Ionicons name="time-outline" size={16} color={catColors.text.secondary} />
            <Text style={styles.scheduleText}>
              {item.scheduledStart && typeof item.scheduledStart.toDate === "function"
                ? formatDate(item.scheduledStart.toDate())
                : item.scheduledStart instanceof Date
                  ? formatDate(item.scheduledStart)
                  : "No schedule"}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace("_", " ").toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (workOrders.length === 0 && selectedOperatorId) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color={catColors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No Work Orders Found</Text>
          <Text style={styles.emptyStateText}>
            {`No work orders found for operator "${selectedOperatorId}"`}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearSearch}>
            <Text style={styles.retryButtonText}>Show All Orders</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (workOrders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color={catColors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No Work Orders</Text>
          <Text style={styles.emptyStateText}>
            Search for an operator to view their work orders
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.title}>Work Orders</Text>
        </View>
        <TouchableOpacity style={styles.voiceButton} onPress={handleVoicePress}>
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={24}
            color={catColors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Operator Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={catColors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter Operator ID"
              placeholderTextColor={catColors.text.secondary}
              value={operatorId}
              onChangeText={setOperatorId}
              onSubmitEditing={handleSearchOperator}
              returnKeyType="search"
            />
            {operatorId.length > 0 && (
              <TouchableOpacity onPress={() => setOperatorId("")}>
                <Ionicons name="close-circle" size={20} color={catColors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
            onPress={handleSearchOperator}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.searchButtonText}>...</Text>
            ) : (
              <Ionicons name="search" size={20} color={catColors.text.light} />
            )}
          </TouchableOpacity>
        </View>
        
        {selectedOperatorId && (
          <View style={styles.activeSearchContainer}>
            <Text style={styles.activeSearchText}>
              Showing orders for: <Text style={styles.operatorIdText}>{selectedOperatorId}</Text>
            </Text>
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workOrders.filter(w => w.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workOrders.filter(w => w.status === 'in_progress').length}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{workOrders.filter(w => w.status === 'completed').length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      {/* Work Orders List */}
      <View style={styles.listWrapper}>
        <FlatList
          data={workOrders}
          renderItem={renderWorkOrderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[catColors.primary]}
              tintColor={catColors.primary}
            />
          }
          contentContainerStyle={[
            styles.listContainer,
            workOrders.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListHeaderComponent={() => <View style={styles.listHeader} />}
          ListFooterComponent={() => <View style={styles.listFooter} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.gray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    paddingTop: spacing["2xl"],
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
    // Add shadow for iOS
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Add elevation for Android
    elevation: 3,
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
  voiceButton: {
    padding: spacing.sm,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
  },
  searchSection: {
    padding: spacing.base,
    backgroundColor: catColors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: catColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    marginLeft: spacing.xs,
    paddingVertical: spacing.xs,
  },
  searchButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  searchButtonDisabled: {
    backgroundColor: catColors.text.secondary,
  },
  searchButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  activeSearchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: catColors.primary + '15',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: catColors.primary,
  },
  activeSearchText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.primary,
    flex: 1,
  },
  operatorIdText: {
    fontWeight: '600',
    color: catColors.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: catColors.primary,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.light,
    fontWeight: '500',
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
  listWrapper: {
    flex: 1,
    backgroundColor: catColors.background.gray,
  },
  listContainer: {
    padding: spacing.base,
    flexGrow: 1,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listHeader: {
    height: spacing.sm,
  },
  listFooter: {
    height: spacing["5xl"], // Extra space at bottom for better scrolling
  },
  itemSeparator: {
    height: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    color: catColors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  workOrderCard: {
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  workOrderTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: catColors.text.primary,
    marginBottom: 2,
  },
  machineId: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 8,
  },
  priorityText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginLeft: spacing.xs,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scheduleText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
  },
  statusText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: "500",
  },
});