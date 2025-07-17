import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

interface Checkpoint {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: any; // Timestamp
  completedBy?: string;
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

  useEffect(() => {
    filterWorkOrders();
  }, [activeFilter, workOrders]);

  const handleAsyncOperation = async (operation: string, asyncFn: () => Promise<string>) => {
    try {
      setLoading(true);
      const result = await asyncFn();
      console.log(`${operation}: ${result}`);
      return result;
    } catch (error) {
      console.error(`${operation} failed:`, error);
      Alert.alert("Error", `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
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
      return `Found ${workOrders.length} work orders for operator ${selectedOperatorId}`;
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
    setWorkOrders(mockWorkOrders);
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
        // Load all orders when no operator is selected
        setWorkOrders(mockWorkOrders);
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
    return checkpoints.filter(cp => cp.isCompleted).length;
  };

  const renderWorkOrderItem = ({ item }: { item: WorkOrder }) => {
    const completedCheckpoints = getCompletedCheckpoints(item.checkpoints);
    const totalCheckpoints = item.checkpoints.length;
    const progress = totalCheckpoints > 0 ? (completedCheckpoints / totalCheckpoints) * 100 : 0;

    return (
      <TouchableOpacity
        style={styles.workOrderCard}
        onPress={() => {
          // Navigate to work order details
          console.log("Navigate to work order:", item.id);
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
            {[item.location.building, item.location.room].filter(Boolean).join(" - ")}
          </Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Progress: {completedCheckpoints}/{totalCheckpoints} checkpoints
            </Text>
            <Text style={styles.estimatedTime}>
              Est: {Math.floor(item.estimatedDuration / 60)}h {item.estimatedDuration % 60}m
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.scheduleInfo}>
            <Ionicons name="time-outline" size={16} color={catColors.text.secondary} />
            <Text style={styles.scheduleText}>
              {formatDate(item.scheduledStart)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace("_", " ").toUpperCase()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChip = (filter: typeof filterOptions[0]) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterChip,
        activeFilter === filter.key && styles.activeFilterChip
      ]}
      onPress={() => setActiveFilter(filter.key)}
    >
      <Ionicons
        name={filter.icon as any}
        size={16}
        color={activeFilter === filter.key ? catColors.text.light : catColors.primary}
        style={{ marginRight: 4 }}
      />
      <Text style={[
        styles.filterChipText,
        activeFilter === filter.key && styles.activeFilterChipText
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

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
              <Text style={styles.clearButtonText}>Show All</Text>
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
          <Text style={styles.statValue}>{workOrders.filter(w => w.priority === 'urgent').length}</Text>
          <Text style={styles.statLabel}>Urgent</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        {filterOptions.map(renderFilterChip)}
      </View>

      {/* Work Orders List */}
      {workOrders.length === 0 && selectedOperatorId ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color={catColors.text.secondary} />
          <Text style={styles.emptyStateTitle}>No Work Orders Found</Text>
          <Text style={styles.emptyStateText}>
            No work orders found for operator "{selectedOperatorId}"
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearSearch}>
            <Text style={styles.retryButtonText}>Show All Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
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
            filteredOrders.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={48} color={catColors.text.secondary} />
              <Text style={styles.emptyStateTitle}>No Orders Match Filter</Text>
              <Text style={styles.emptyStateText}>
                Try selecting a different filter option
              </Text>
            </View>
          }
        />
      )}
    </View>
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
  voiceButton: {
    padding: spacing.sm,
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
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
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: catColors.background.light,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: catColors.background.gray,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: catColors.primary,
  },
  activeFilterChip: {
    backgroundColor: catColors.primary,
  },
  filterChipText: {
    color: catColors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: catColors.text.light,
  },
  listContainer: {
    padding: spacing.base,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
  operatorIdText: {
    fontWeight: '600',
    color: catColors.primary,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: catColors.primary,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: spacing.base,
  },
  retryButton: {
    backgroundColor: catColors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 8,
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
    marginBottom: spacing.base,
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
  },
  progressSection: {
    marginBottom: spacing.sm,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.primary,
  },
  estimatedTime: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: catColors.background.gray,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: catColors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
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