// import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from 'expo-file-system';
// import { useRouter } from 'expo-router';
// import { useCallback, useState } from "react";
// import { ActivityIndicator, Button, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

// import ParallaxScrollView from "@/components/ParallaxScrollView";
// import { ThemedText } from "@/components/ThemedText";
// import { ThemedView } from "@/components/ThemedView";
// import { Alert, startMonitoring, StatusMessage } from "@/services/alertService";
// import { speak } from "@/services/speechService"; // Import the speech service
// import { TrainingSuggestion } from "@/services/trainingSuggestionService";
// import { generateUUID } from "@/services/asyncService"; // Import generateUUID

// type DisplayableAlert = (Alert | StatusMessage | TrainingSuggestion) & { displayKey: string };

// export default function AlertsScreen() {
//   const [alerts, setAlerts] = useState<DisplayableAlert[]>([]);
//   const [monitoring, setMonitoring] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [stopMonitoringFunction, setStopMonitoringFunction] = useState<(() => void) | null>(null);
//   const router = useRouter();

//   const handleAlert = useCallback((alert: Alert | StatusMessage | TrainingSuggestion) => {
//     // Assign a unique display key to each alert for React's key prop
//     const alertWithDisplayKey = { ...alert, displayKey: generateUUID() };
//     setAlerts(prevAlerts => [alertWithDisplayKey, ...prevAlerts]);
    
//     // Speak the alert based on its type
//     if ('type' in alert && alert.type === 'training_suggestion') {
//       // This is a TrainingSuggestion
//       const speechText = `Training suggestion: ${alert.title}. ${alert.trainingModuleTitle} training recommended.`;
//       speak(speechText);
//     } else if ('title' in alert) {
//       // This is an Alert object with title and priority
//       let speechText = '';
      
//       // Customize speech based on priority and type
//       switch (alert.priority) {
//         case 'critical':
//           speechText = `Critical alert! ${alert.title}. ${alert.message}`;
//           break;
//         case 'high':
//           speechText = `High priority alert. ${alert.title}. ${alert.message}`;
//           break;
//         case 'medium':
//           speechText = `Medium priority alert. ${alert.title}`;
//           break;
//         case 'low':
//           speechText = `Info: ${alert.title}`;
//           break;
//         default:
//           speechText = `Alert: ${alert.title}. ${alert.message}`;
//       }
      
//       speak(speechText);
//     } else {
//       // This is a status message (like "No problem for machine" or "Finished processing")
//       if (alert.message.includes('No problem')) {
//         // Don't speak "no problem" messages to avoid spam
//         return;
//       } else if (alert.message.includes('Finished processing')) {
//         speak("Alert monitoring has completed processing all data.");
//       } else {
//         speak(alert.message);
//       }
//     }
//   }, []);

//   const pickDocument = async () => {
//     let fileContent: string | null = null; // Declare outside the if block
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: "*/*",
//         copyToCacheDirectory: true,
//       });

//       if (result.canceled === false && result.assets && result.assets[0].name.endsWith('.csv')) {
//         setAlerts([]);
//         setMonitoring(true);
//         setLoading(true);
        
//         // Announce monitoring has started
//         speak("Alert monitoring has started. Processing data file.");
        
//         fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri); // Assign here
//         const cleanup = startMonitoring(fileContent, handleAlert);
//         setStopMonitoringFunction(() => cleanup);
//         setLoading(false);
//       }
//     } catch (error) {
//       console.error("Error picking document:", error);
//       speak("Error occurred while selecting or processing the file.");
//       setLoading(false);
//       setMonitoring(false);
//     }
//   };

//   const stopMonitoring = () => {
//     if (stopMonitoringFunction) {
//       stopMonitoringFunction();
//       setStopMonitoringFunction(null);
//     }
//     setMonitoring(false);
//     speak("Alert monitoring has been stopped.");
//   };

//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
//       headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>🚨</ThemedText>}
//     >
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Alert Monitoring</ThemedText>
//       </ThemedView>

//       <ThemedView style={styles.stepContainer}>
//         <ThemedText>
//           Select a CSV file to begin monitoring for alerts. Critical alerts and training suggestions will be announced audibly.
//         </ThemedText>
//         <Button 
//           title={monitoring ? "Monitoring Active..." : "Select CSV File"} 
//           onPress={pickDocument} 
//           disabled={monitoring} 
//         />
//         {monitoring && (
//           <Button 
//             title="Stop Monitoring" 
//             onPress={stopMonitoring} 
//             color="red"
//           />
//         )}
//         {loading && <ActivityIndicator size="large" color="#0000ff" />}
//       </ThemedView>

//       <ScrollView style={styles.logContainer}>
//         {alerts.map((alert) => (
//           <ThemedView 
//             key={alert.displayKey}
//             style={styles.logEntry}
//           >
//             {'type' in alert && alert.type === 'training_suggestion' ? (
//               <TouchableOpacity 
//                 style={styles.suggestionContainer}
//                 onPress={() => {
//                   console.log("Navigating to TrainingModule with ID:", alert.trainingModuleId);
//                   router.push({ pathname: "/(tabs)/TrainingModule", params: { trainingModuleId: alert.trainingModuleId } });
//                   speak(`Opening training module: ${alert.trainingModuleTitle}`);
//                 }}
//               >
//                 <ThemedText type="defaultSemiBold">{alert.title}</ThemedText>
//                 <ThemedText>{alert.message}</ThemedText>
//                 <ThemedText style={styles.linkText}>View Training: {alert.trainingModuleTitle}</ThemedText>
//               </TouchableOpacity>
//             ) : 'title' in alert ? (
//               <ThemedView>
//                 <ThemedText style={{ 
//                   color: alert.priority === 'critical' ? '#FF3B30' : 
//                          alert.priority === 'high' ? '#FF9500' : 
//                          alert.priority === 'medium' ? '#FFCC00' : '#007AFF' 
//                 }}>
//                   <ThemedText type="defaultSemiBold">
//                     [{alert.priority?.toUpperCase()}] {alert.title}
//                   </ThemedText>
//                 </ThemedText>
//                 <ThemedText style={{ marginTop: 4 }}>
//                   {alert.message}
//                 </ThemedText>
//                 <ThemedText style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
//                   {alert.machineId && `Machine: ${alert.machineId}`}
//                   {alert.operatorId && ` | Operator: ${alert.operatorId}`}
//                   {alert.createdAt && ` | ${new Date(alert.createdAt).toLocaleTimeString()}`}
//                 </ThemedText>
//               </ThemedView>
//             ) : (
//               <ThemedText style={{ color: 'green' }}>
//                 {alert.message} 
//                 {alert.machineId && ` - Machine: ${alert.machineId}`} 
//                 {` at ${alert.timestamp}`}
//               </ThemedText>
//             )}
//           </ThemedView>
//         ))}
//       </ScrollView>

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
//   logContainer: {
//     maxHeight: 400,
//     borderColor: '#ccc',
//     borderWidth: 1,
//     borderRadius: 8,
//     padding: 8,
//   },
//   logEntry: {
//     padding: 8,
//     borderBottomColor: '#eee',
//     borderBottomWidth: 1,
//   },
//   suggestionContainer: {
//     backgroundColor: '#e6f7ff',
//     padding: 12,
//     borderRadius: 8,
//     marginVertical: 8,
//   },
//   linkText: {
//     color: '#007AFF',
//     marginTop: 8,
//     textDecorationLine: 'underline',
//   },
// });



import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Alert, startMonitoring, StatusMessage } from "@/services/alertService";
import { generateUUID } from "@/services/asyncService";
import { speak } from "@/services/speechService";
import { TrainingSuggestion } from "@/services/trainingSuggestionService";
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
  critical: catColors.status.urgent,
  high: catColors.status.high,
  medium: catColors.status.medium,
  low: catColors.status.low,
};

type DisplayableAlert = (Alert | StatusMessage | TrainingSuggestion) & { displayKey: string };

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<DisplayableAlert[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stopMonitoringFunction, setStopMonitoringFunction] = useState<(() => void) | null>(null);
  const router = useRouter();

  const handleAlert = useCallback((alert: Alert | StatusMessage | TrainingSuggestion) => {
    // Assign a unique display key to each alert for React's key prop
    const alertWithDisplayKey = { ...alert, displayKey: generateUUID() };
    setAlerts(prevAlerts => [alertWithDisplayKey, ...prevAlerts]);
    
    // Speak the alert based on its type
    if ('type' in alert && alert.type === 'training_suggestion') {
      // This is a TrainingSuggestion
      const speechText = ` ${alert.title}. ${alert.trainingModuleTitle} training recommended.`;
      speak(speechText);
    } else if ('title' in alert) {
      // This is an Alert object with title and priority
      let speechText = '';
      
      // Customize speech based on priority and type
      switch (alert.priority) {
        case 'critical':
          speechText = `Critical alert! ${alert.title}. ${alert.message}`;
          break;
        case 'high':
          speechText = `High priority alert. ${alert.title}. ${alert.message}`;
          break;
        case 'medium':
          speechText = `Medium priority alert. ${alert.title}`;
          break;
        case 'low':
          speechText = `Info: ${alert.title}`;
          break;
        default:
          speechText = `Alert: ${alert.title}. ${alert.message}`;
      }
      
      speak(speechText);
    } else {
      // This is a status message (like "No problem for machine" or "Finished processing")
      if (alert.message.includes('No problem')) {
        // Don't speak "no problem" messages to avoid spam
        return;
      } else if (alert.message.includes('Finished processing')) {
        speak("Alert monitoring has completed processing all data.");
      } else {
        speak(alert.message);
      }
    }
  }, []);

  const pickDocument = async () => {
    let fileContent: string | null = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets[0].name.endsWith('.csv')) {
        setAlerts([]);
        setMonitoring(true);
        setLoading(true);
        
        // Announce monitoring has started
        speak("Alert monitoring has started. Processing data file.");
        
        fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const cleanup = startMonitoring(fileContent, handleAlert);
        setStopMonitoringFunction(() => cleanup);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      speak("Error occurred while selecting or processing the file.");
      setLoading(false);
      setMonitoring(false);
    }
  };

  const stopMonitoring = () => {
    if (stopMonitoringFunction) {
      stopMonitoringFunction();
      setStopMonitoringFunction(null);
    }
    setMonitoring(false);
    speak("Alert monitoring has been stopped.");
  };

  const clearAlerts = () => {
    setAlerts([]);
    speak("All alerts have been cleared.");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const getAlertStats = () => {
    const stats = {
      critical: alerts.filter(a => 'priority' in a && a.priority === 'critical').length,
      high: alerts.filter(a => 'priority' in a && a.priority === 'high').length,
      medium: alerts.filter(a => 'priority' in a && a.priority === 'medium').length,
      suggestions: alerts.filter(a => 'type' in a && a.type === 'training_suggestion').length,
    };
    return stats;
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderAlert = (alert: DisplayableAlert) => {
    if ('type' in alert && alert.type === 'training_suggestion') {
      return (
        <TouchableOpacity 
          key={alert.displayKey}
          style={[styles.alertCard, styles.suggestionCard]}
          onPress={() => {
            console.log("Navigating to TrainingModule with ID:", alert.trainingModuleId);
            router.push({ pathname: "/(tabs)/TrainingModule", params: { trainingModuleId: alert.trainingModuleId } });
            speak(`Opening training module: ${alert.trainingModuleTitle}`);
          }}
        >
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { backgroundColor: catColors.status.inProgress + '20' }]}>
              <Ionicons name="school" size={20} color={catColors.status.inProgress} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.suggestionTitle}>{alert.title}</Text>
              <Text style={styles.suggestionMessage}>{alert.message}</Text>
              <View style={styles.trainingLinkContainer}>
                <Ionicons name="play-circle" size={16} color={catColors.primary} />
                <Text style={styles.trainingLinkText}>{alert.trainingModuleTitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={catColors.text.secondary} />
          </View>
        </TouchableOpacity>
      );
    } else if ('title' in alert) {
      const priorityColor = priorityColors[alert.priority as keyof typeof priorityColors] || catColors.status.medium;
      return (
        <View key={alert.displayKey} style={[styles.alertCard, styles.standardAlert]}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { backgroundColor: priorityColor + '20' }]}>
              <Ionicons 
                name={getPriorityIcon(alert.priority)} 
                size={20} 
                color={priorityColor} 
              />
            </View>
            <View style={styles.alertContent}>
              <View style={styles.alertTitleRow}>
                <Text style={[styles.alertTitle, { color: priorityColor }]}>
                  {alert.title}
                </Text>
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                  <Text style={styles.priorityText}>{alert.priority?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <View style={styles.alertMeta}>
                {alert.machineId && (
                  <View style={styles.metaItem}>
                    <Ionicons name="hardware-chip" size={14} color={catColors.text.secondary} />
                    <Text style={styles.metaText}>{alert.machineId}</Text>
                  </View>
                )}
                {alert.operatorId && (
                  <View style={styles.metaItem}>
                    <Ionicons name="person" size={14} color={catColors.text.secondary} />
                    <Text style={styles.metaText}>{alert.operatorId}</Text>
                  </View>
                )}
                {alert.createdAt && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={14} color={catColors.text.secondary} />
                    <Text style={styles.metaText}>{formatTimestamp(alert.createdAt)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View key={alert.displayKey} style={[styles.alertCard, styles.statusMessage]}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { backgroundColor: catColors.status.completed + '20' }]}>
              <Ionicons name="checkmark-circle" size={20} color={catColors.status.completed} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.statusText}>{alert.message}</Text>
              <View style={styles.alertMeta}>
                {alert.machineId && (
                  <View style={styles.metaItem}>
                    <Ionicons name="hardware-chip" size={14} color={catColors.text.secondary} />
                    <Text style={styles.metaText}>{alert.machineId}</Text>
                  </View>
                )}
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={catColors.text.secondary} />
                  <Text style={styles.metaText}>{alert.timestamp}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const stats = getAlertStats();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Real-time monitoring</Text>
          <Text style={styles.title}>Alert Center</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>🚨</Text>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.urgent }]}>{stats.critical}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.high }]}>{stats.high}</Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.medium }]}>{stats.medium}</Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: catColors.status.inProgress }]}>{stats.suggestions}</Text>
          <Text style={styles.statLabel}>Training</Text>
        </View>
      </View>

      {/* Control Section */}
      <View style={styles.controlSection}>
        <Text style={styles.sectionTitle}>Monitoring Controls</Text>
        <Text style={styles.sectionDescription}>
          Select a CSV file to begin monitoring for alerts. Critical alerts and training suggestions will be announced audibly.
        </Text>
        
        <View style={styles.controlButtons}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.primaryButton, monitoring && styles.disabledButton]}
            onPress={pickDocument}
            disabled={monitoring}
          >
            <Ionicons 
              name={monitoring ? "radio-button-on" : "document-text"} 
              size={20} 
              color={monitoring ? catColors.text.secondary : catColors.text.light} 
            />
            <Text style={[styles.controlButtonText, monitoring && styles.disabledButtonText]}>
              {monitoring ? "Monitoring Active..." : "Select CSV File"}
            </Text>
          </TouchableOpacity>

          {monitoring && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopMonitoring}
            >
              <Ionicons name="stop-circle" size={20} color={catColors.text.light} />
              <Text style={styles.controlButtonText}>Stop Monitoring</Text>
            </TouchableOpacity>
          )}

          {alerts.length > 0 && (
            <TouchableOpacity 
              style={[styles.controlButton, styles.clearButton]}
              onPress={clearAlerts}
            >
              <Ionicons name="trash" size={20} color={catColors.status.cancelled} />
              <Text style={[styles.controlButtonText, { color: catColors.status.cancelled }]}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={catColors.primary} />
            <Text style={styles.loadingText}>Processing CSV file...</Text>
          </View>
        )}
      </View>

      {/* Alerts List */}
      <View style={styles.alertsSection}>
        <Text style={styles.sectionTitle}>
          Recent Alerts {alerts.length > 0 && `(${alerts.length})`}
        </Text>
        
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={catColors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No Alerts</Text>
            <Text style={styles.emptyStateText}>
              {monitoring 
                ? "Monitoring is active. Alerts will appear here when detected."
                : "Start monitoring a CSV file to see alerts and recommendations."
              }
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.alertsList}
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
            {alerts.map(renderAlert)}
            <View style={styles.bottomPadding} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: catColors.background.light,
    paddingTop:spacing["xl"]
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
  controlSection: {
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
  controlButtons: {
    gap: spacing.sm,
  },
  controlButton: {
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
  stopButton: {
    backgroundColor: catColors.status.cancelled,
  },
  clearButton: {
    backgroundColor: catColors.background.gray,
    borderWidth: 1,
    borderColor: catColors.status.cancelled,
  },
  disabledButton: {
    backgroundColor: catColors.text.secondary,
  },
  controlButtonText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: catColors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
  },
  alertsSection: {
    flex: 1,
    padding: spacing.base,
  },
  alertsList: {
    flex: 1,
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
  },
  alertCard: {
    backgroundColor: catColors.background.light,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: catColors.border,
    shadowColor: catColors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionCard: {
    borderLeftWidth: 4,
    borderLeftColor: catColors.status.inProgress,
  },
  standardAlert: {
    // Standard alert styling
  },
  statusMessage: {
    borderLeftWidth: 4,
    borderLeftColor: catColors.status.completed,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.base,
  },
  alertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  alertTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 6,
  },
  priorityText: {
    color: catColors.text.light,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  alertMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: catColors.text.secondary,
  },
  suggestionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: catColors.text.primary,
    marginBottom: spacing.xs,
  },
  suggestionMessage: {
    fontSize: typography.fontSize.base,
    color: catColors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  trainingLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trainingLinkText: {
    fontSize: typography.fontSize.base,
    color: catColors.primary,
    fontWeight: '500',
  },
  statusText: {
    fontSize: typography.fontSize.base,
    color: catColors.status.completed,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  bottomPadding: {
    height: spacing["5xl"],
  },
});