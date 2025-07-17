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

export default function Task5Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };
  const handleBackToTasks = () => {
    // Option 1: Go back to previous screen (if came from TasksPage)
    router.back();

    // Option 2: Navigate directly to TasksPage (more reliable)
    // router.push("/TasksPage");

    // Option 3: Replace current screen with TasksPage (prevents back stack)
    // router.replace("/TasksPage");
  };

  // Usage in your header:
  <TouchableOpacity style={styles.backButton} onPress={handleBackToTasks}>
    <Ionicons name="arrow-back" size={24} color={colors.primary} />
  </TouchableOpacity>;

  // Alternative: Add a "Home" button alongside back button
  const handleHome = () => {
    router.push("/tasksPage");
  };

  // Usage for home button:
  <TouchableOpacity style={styles.homeButton} onPress={handleHome}>
    <Ionicons name="home" size={24} color={colors.primary} />
  </TouchableOpacity>;

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
          <Ionicons
            name="shield-checkmark-outline"
            size={60}
            color={colors.primary}
          />
          <Text style={styles.title}>Safety Documentation</Text>
          <Text style={styles.subtitle}>
            Manage safety protocols and incident reporting
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Safety Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.statusText}>No incidents today</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="shield" size={20} color={colors.primary} />
                <Text style={styles.statusText}>Safety score: 98%</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="calendar" size={20} color={colors.warning} />
                <Text style={styles.statusText}>
                  Last training: 15 days ago
                </Text>
              </View>
            </View>
          </View>

          {/* Safety Protocols */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Protocols</Text>
            <View style={styles.protocolsCard}>
              <View style={styles.protocolItem}>
                <Ionicons name="medical" size={20} color={colors.error} />
                <Text style={styles.protocolText}>Emergency Procedures</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.secondary}
                />
              </View>
              <View style={styles.protocolItem}>
                <Ionicons name="hardhat" size={20} color={colors.warning} />
                <Text style={styles.protocolText}>PPE Requirements</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.secondary}
                />
              </View>
              <View style={styles.protocolItem}>
                <Ionicons name="warning" size={20} color={colors.error} />
                <Text style={styles.protocolText}>Hazard Identification</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.secondary}
                />
              </View>
              <View style={styles.protocolItem}>
                <Ionicons name="clipboard" size={20} color={colors.primary} />
                <Text style={styles.protocolText}>Safety Checklists</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.text.secondary}
                />
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name="document-text"
                    size={16}
                    color={colors.success}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    Safety Report Completed
                  </Text>
                  <Text style={styles.activityTime}>2 hours ago</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="school" size={16} color={colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    Training Module Updated
                  </Text>
                  <Text style={styles.activityTime}>Yesterday</Text>
                </View>
              </View>
              <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={colors.warning}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Safety Alert Issued</Text>
                  <Text style={styles.activityTime}>3 days ago</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons
                name="add-circle"
                size={20}
                color={colors.background.light}
              />
              <Text style={styles.primaryButtonText}>Report Incident</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="library" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>View Documentation</Text>
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
  protocolsCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.sm,
  },
  protocolItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
    paddingVertical: spacing.xs,
  },
  protocolText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  activityCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.sm,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: "500",
  },
  activityTime: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
