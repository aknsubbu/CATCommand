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

export default function Task4Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
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
          <Ionicons name="time-outline" size={60} color={colors.primary} />
          <Text style={styles.title}>Time Logging & Reports</Text>
          <Text style={styles.subtitle}>
            Track work hours and generate detailed reports
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Current Session */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Session</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <Ionicons name="play-circle" size={20} color={colors.success} />
                <Text style={styles.statusText}>Active: 2h 45m</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.statusText}>Started: Today, 9:15 AM</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons
                  name="person"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.statusText}>
                  Task: Equipment Maintenance
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="pause" size={24} color={colors.warning} />
                <Text style={styles.quickActionText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="stop" size={24} color={colors.error} />
                <Text style={styles.quickActionText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="add" size={24} color={colors.success} />
                <Text style={styles.quickActionText}>Break</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons
                  name="swap-horizontal"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.quickActionText}>Switch</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Today's Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Hours</Text>
                <Text style={styles.summaryValue}>6.5h</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tasks Completed</Text>
                <Text style={styles.summaryValue}>4</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Break Time</Text>
                <Text style={styles.summaryValue}>45m</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons
                name="document-text"
                size={20}
                color={colors.background.light}
              />
              <Text style={styles.primaryButtonText}>Generate Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="analytics" size={20} color={colors.primary} />
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
  statusCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionButton: {
    width: "48%",
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  quickActionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    marginTop: spacing.xs,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
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
