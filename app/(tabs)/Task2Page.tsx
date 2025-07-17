import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, shadows, spacing, typography } from "../../constants/theme";

export default function Task2Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const workOrders = [
    {
      id: "WO001",
      status: "pending",
      priority: "high",
      title: "Pump Maintenance",
    },
    {
      id: "WO002",
      status: "in-progress",
      priority: "medium",
      title: "Belt Replacement",
    },
    {
      id: "WO003",
      status: "completed",
      priority: "low",
      title: "Routine Cleaning",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return colors.warning;
      case "in-progress":
        return colors.primary;
      case "completed":
        return colors.success;
      default:
        return colors.text.secondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return colors.error;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Ionicons name="clipboard-outline" size={60} color={colors.primary} />
          <Text style={styles.title}>Work Order Management</Text>
          <Text style={styles.subtitle}>
            Manage and track work orders efficiently
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>3</Text>
                <Text style={styles.statLabel}>Active Orders</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>95%</Text>
                <Text style={styles.statLabel}>Completion Rate</Text>
              </View>
            </View>
          </View>

          {/* Work Orders List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Work Orders</Text>
            {workOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(order.priority) },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {order.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderTitle}>{order.title}</Text>
                <View style={styles.orderFooter}>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {order.status.replace("-", " ").toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="add" size={20} color={colors.background.light} />
              <Text style={styles.primaryButtonText}>Create New Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="filter" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Filter Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  contentContainer: {
    width: "100%",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    flex: 1,
    marginHorizontal: spacing.xs,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  orderId: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
    color: colors.background.light,
  },
  orderTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.base,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  viewButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.background.light,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: 12,
    ...shadows.sm,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: spacing.sm,
  },
});
