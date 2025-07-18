import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCallback, useState } from "react";
import { ActivityIndicator, Button, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Alert, startMonitoring } from "@/services/alertService";
import { speak } from "@/services/speechService"; // Import the speech service
import { TrainingSuggestion } from "@/services/trainingSuggestionService";

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<(Alert | { message: string, machineId: string, timestamp: string } | TrainingSuggestion)[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stopMonitoringFunction, setStopMonitoringFunction] = useState<(() => void) | null>(null);
  const router = useRouter();

  const handleAlert = useCallback((alert: Alert | { message: string, machineId: string, timestamp: string } | TrainingSuggestion) => {
    setAlerts(prevAlerts => [alert, ...prevAlerts]);
    
    // Speak the alert based on its type
    if ('type' in alert && alert.type === 'training_suggestion') {
      // This is a TrainingSuggestion
      const speechText = `Training suggestion: ${alert.title}. ${alert.trainingModuleTitle} training recommended.`;
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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<ThemedText style={{ fontSize: 100, textAlign: 'center', lineHeight: 250, color: '#808080' }}>🚨</ThemedText>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Alert Monitoring</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText>
          Select a CSV file to begin monitoring for alerts. Critical alerts and training suggestions will be announced audibly.
        </ThemedText>
        <Button 
          title={monitoring ? "Monitoring Active..." : "Select CSV File"} 
          onPress={pickDocument} 
          disabled={monitoring} 
        />
        {monitoring && (
          <Button 
            title="Stop Monitoring" 
            onPress={stopMonitoring} 
            color="red"
          />
        )}
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
      </ThemedView>

      <ScrollView style={styles.logContainer}>
        {alerts.map((alert) => (
          <ThemedView key={alert.id || Math.random().toString()} style={styles.logEntry}>
            {'type' in alert && alert.type === 'training_suggestion' ? (
              <TouchableOpacity 
                style={styles.suggestionContainer}
                onPress={() => {
                  console.log("Navigating to TrainingModule with ID:", alert.trainingModuleId);
                  router.push({ pathname: "/(tabs)/TrainingModule", params: { trainingModuleId: alert.trainingModuleId } });
                  speak(`Opening training module: ${alert.trainingModuleTitle}`);
                }}
              >
                <ThemedText type="defaultSemiBold">{alert.title}</ThemedText>
                <ThemedText>{alert.message}</ThemedText>
                <ThemedText style={styles.linkText}>View Training: {alert.trainingModuleTitle}</ThemedText>
              </TouchableOpacity>
            ) : 'title' in alert ? (
              <ThemedView>
                <ThemedText style={{ 
                  color: alert.priority === 'critical' ? '#FF3B30' : 
                         alert.priority === 'high' ? '#FF9500' : 
                         alert.priority === 'medium' ? '#FFCC00' : '#007AFF' 
                }}>
                  <ThemedText type="defaultSemiBold">
                    [{alert.priority?.toUpperCase()}] {alert.title}
                  </ThemedText>
                </ThemedText>
                <ThemedText style={{ marginTop: 4 }}>
                  {alert.message}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {alert.machineId && `Machine: ${alert.machineId}`}
                  {alert.operatorId && ` | Operator: ${alert.operatorId}`}
                  {alert.createdAt && ` | ${new Date(alert.createdAt).toLocaleTimeString()}`}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={{ color: 'green' }}>
                {alert.message} 
                {alert.machineId && ` - Machine: ${alert.machineId}`} 
                {` at ${alert.timestamp}`}
              </ThemedText>
            )}
          </ThemedView>
        ))}
      </ScrollView>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  logContainer: {
    maxHeight: 400,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  logEntry: {
    padding: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  suggestionContainer: {
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  linkText: {
    color: '#007AFF',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});