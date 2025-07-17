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

export default function Task1Page() {
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
          <Ionicons name="construct-outline" size={60} color={colors.primary} />
          <Text style={styles.title}>Equipment Inspection</Text>
          <Text style={styles.subtitle}>
            Inspect and maintain equipment to ensure optimal performance
          </Text>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* Current Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusItem}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.statusText}>Equipment operational</Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="time" size={20} color={colors.warning} />
                <Text style={styles.statusText}>
                  Next inspection due: 2 days
                </Text>
              </View>
            </View>
          </View>

          {/* Inspection Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inspection Checklist</Text>
            <View style={styles.checklistCard}>
              <View style={styles.checklistItem}>
                <Ionicons
                  name="square-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.checklistText}>
                  Visual inspection of components
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons
                  name="square-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.checklistText}>Check fluid levels</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons
                  name="square-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.checklistText}>Test safety mechanisms</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons
                  name="square-outline"
                  size={20}
                  color={colors.text.secondary}
                />
                <Text style={styles.checklistText}>
                  Lubrication points check
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="play" size={20} color={colors.background.light} />
              <Text style={styles.primaryButtonText}>Start Inspection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>View History</Text>
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
  checklistCard: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.lg,
    ...shadows.sm,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  checklistText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.sm,
    flex: 1,
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
