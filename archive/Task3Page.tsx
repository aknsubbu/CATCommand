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
import { colors, shadows, spacing, typography } from "../constants/theme";

export default function Task3Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const materials = [
    {
      id: "M001",
      name: "Steel Bolts",
      quantity: 45,
      unit: "pcs",
      status: "in-stock",
    },
    {
      id: "M002",
      name: "Hydraulic Oil",
      quantity: 12,
      unit: "liters",
      status: "low",
    },
    {
      id: "M003",
      name: "Rubber Seals",
      quantity: 8,
      unit: "pcs",
      status: "critical",
    },
    {
      id: "M004",
      name: "Wire Mesh",
      quantity: 25,
      unit: "meters",
      status: "in-stock",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return colors.success;
      case "low":
        return colors.warning;
      case "critical":
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-stock":
        return "checkmark-circle";
      case "low":
        return "warning";
      case "critical":
        return "alert-circle";
      default:
        return "help-circle";
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
          <Ionicons name="cube-outline" size={60} color={colors.primary} />
          <Text style={styles.title}>Material Tracking</Text>
          <Text style={styles.subtitle}>
            Monitor inventory levels and track material usage
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Inventory Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inventory Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <Ionicons name="cube" size={24} color={colors.success} />
                <Text style={styles.summaryNumber}>24</Text>
                <Text style={styles.summaryLabel}>Items In Stock</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons
                  name="alert-circle"
                  size={24}
                  color={colors.warning}
                />
                <Text style={styles.summaryNumber}>3</Text>
                <Text style={styles.summaryLabel}>Low Stock</Text>
              </View>
              <View style={styles.summaryCard}>
                <Ionicons name="ban" size={24} color={colors.error} />
                <Text style={styles.summaryNumber}>1</Text>
                <Text style={styles.summaryLabel}>Critical</Text>
              </View>
            </View>
          </View>

          {/* Material List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Materials</Text>
            {materials.map((material) => (
              <View key={material.id} style={styles.materialCard}>
                <View style={styles.materialHeader}>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.name}</Text>
                    <Text style={styles.materialId}>{material.id}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Ionicons
                      name={getStatusIcon(material.status)}
                      size={16}
                      color={getStatusColor(material.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(material.status) },
                      ]}
                    >
                      {material.status.replace("-", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.materialFooter}>
                  <Text style={styles.quantityText}>
                    {material.quantity} {material.unit}
                  </Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons
                        name="remove"
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="scan" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Scan Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Add Material</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons
                  name="document-text"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.quickActionText}>Generate Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="sync" size={20} color={colors.background.light} />
              <Text style={styles.primaryButtonText}>Sync Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>View Analytics</Text>
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
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
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
  summaryNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: "bold",
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  materialCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  materialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  materialId: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  materialFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
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
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginTop: spacing.xs,
    textAlign: "center",
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
