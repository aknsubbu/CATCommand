import { Ionicons } from "@expo/vector-icons";
import React, { useState } from 'react';
import { Alert as RNAlert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import taskEstimationService from '@/services/taskEstimationService';
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

export default function TaskPageScreen() {
  const [loadCycles, setLoadCycles] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleEstimate = async () => {
    const cycles = parseInt(loadCycles, 10);
    if (isNaN(cycles) || cycles <= 0) {
      RNAlert.alert("Invalid Input", "Please enter a valid positive number for load cycles.");
      setEstimatedTime(null);
      setHasError(true);
      return;
    }

    setLoading(true);
    setHasError(false);

    // Simulate processing time for better UX
    setTimeout(() => {
      const estimation = taskEstimationService.estimateTimeForLoadCycles(cycles);
      if (estimation !== null) {
        setEstimatedTime(taskEstimationService.formatMinutesToHoursAndMinutes(estimation));
        setHasError(false);
      } else {
        setEstimatedTime("Model not ready. Process historical data first.");
        setHasError(true);
      }
      setLoading(false);
    }, 800);
  };

  const clearInput = () => {
    setLoadCycles('');
    setEstimatedTime(null);
    setHasError(false);
  };

  const getExampleEstimates = () => {
    const examples = [
      { cycles: 10, time: "~2-3 hours" },
      { cycles: 25, time: "~5-6 hours" },
      { cycles: 50, time: "~10-12 hours" },
      { cycles: 100, time: "~20-24 hours" },
    ];
    return examples;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Plan your workload</Text>
          <Text style={styles.title}>Task Time Estimator</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="time" size={24} color={catColors.primary} />
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>Load Cycles Input</Text>
        <Text style={styles.sectionDescription}>
          Enter the number of load cycles you plan to complete to get an accurate time estimation.
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="refresh-circle" size={20} color={catColors.text.secondary} />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter target load cycles"
              placeholderTextColor={catColors.text.secondary}
              value={loadCycles}
              onChangeText={setLoadCycles}
              editable={!loading}
            />
            {loadCycles.length > 0 && (
              <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={catColors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.estimateButton, loading && styles.estimateButtonDisabled]}
            onPress={handleEstimate}
            disabled={loading || !loadCycles.trim()}
          >
            {loading ? (
              <>
                <Ionicons name="hourglass" size={20} color={catColors.text.light} />
                <Text style={styles.estimateButtonText}>Calculating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="calculator" size={20} color={catColors.text.light} />
                <Text style={styles.estimateButtonText}>Get Estimation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Section */}
      {estimatedTime && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Estimation Results</Text>
          <View style={[styles.resultCard, hasError && styles.errorCard]}>
            <View style={styles.resultHeader}>
              <View style={[styles.resultIcon, { backgroundColor: hasError ? catColors.status.cancelled + '20' : catColors.status.completed + '20' }]}>
                <Ionicons 
                  name={hasError ? "warning" : "checkmark-circle"} 
                  size={24} 
                  color={hasError ? catColors.status.cancelled : catColors.status.completed} 
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultLabel}>
                  {hasError ? "Estimation Error" : "Estimated Completion Time"}
                </Text>
                <Text style={[styles.resultValue, { color: hasError ? catColors.status.cancelled : catColors.status.completed }]}>
                  {estimatedTime}
                </Text>
              </View>
            </View>
            
            {!hasError && loadCycles && (
              <View style={styles.resultDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="refresh" size={16} color={catColors.text.secondary} />
                  <Text style={styles.detailText}>Load Cycles: {loadCycles}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="speedometer" size={16} color={catColors.text.secondary} />
                  <Text style={styles.detailText}>Estimated based on historical data</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Examples Section */}
      <View style={styles.examplesSection}>
        <Text style={styles.sectionTitle}>Quick Reference</Text>
        <Text style={styles.sectionDescription}>
          Common load cycle estimates for planning purposes
        </Text>
        <View style={styles.examplesGrid}>
          {getExampleEstimates().map((example, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.exampleCard}
              onPress={() => setLoadCycles(example.cycles.toString())}
            >
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleCycles}>{example.cycles}</Text>
                <Text style={styles.exampleLabel}>cycles</Text>
              </View>
              <Text style={styles.exampleTime}>{example.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Estimation Tips</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <View style={styles.tipIcon}>
              <Ionicons name="bulb" size={16} color={catColors.primary} />
            </View>
            <Text style={styles.tipText}>
              Estimates are based on average machine performance and may vary with conditions
            </Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipIcon}>
              <Ionicons name="trending-up" size={16} color={catColors.primary} />
            </View>
            <Text style={styles.tipText}>
              Accuracy improves as more historical data is processed by the system
            </Text>
          </View>
          <View style={styles.tipItem}>
            <View style={styles.tipIcon}>
              <Ionicons name="settings" size={16} color={catColors.primary} />
            </View>
            <Text style={styles.tipText}>
              Consider machine maintenance status and operator experience for best results
            </Text>
          </View>
        </View>
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
    paddingTop:spacing.xl
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
  inputSection: {
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
  inputContainer: {
    gap: spacing.base,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: catColors.background.gray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: catColors.border,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: catColors.text.primary,
    marginLeft: spacing.xs,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs / 2,
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: catColors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    gap: spacing.sm,
  },
  estimateButtonDisabled: {
    backgroundColor: catColors.text.secondary,
  },
  estimateButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  resultsSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  resultCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    borderLeftWidth: 4,
    borderLeftColor: catColors.status.completed,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorCard: {
    borderLeftColor: catColors.status.cancelled,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  resultContent: {
    flex: 1,
  },
  resultLabel: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  resultValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '700',
  },
  resultDetails: {
    gap: spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  examplesSection: {
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: catColors.border,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exampleCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: catColors.background.light,
    borderRadius: 8,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: catColors.border,
    alignItems: 'center',
  },
  exampleHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  exampleCycles: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: catColors.primary,
  },
  exampleLabel: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  exampleTime: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.primary,
    fontWeight: '500',
  },
  tipsSection: {
    padding: spacing.base,
  },
  tipsList: {
    gap: spacing.base,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  tipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: catColors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
  },
  bottomPadding: {
    height: spacing["5xl"],
  },
});