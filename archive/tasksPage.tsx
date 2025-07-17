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

interface Task {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function TasksPage() {
  const router = useRouter();

  const tasks: Task[] = [
    {
      id: "task1",
      title: "Task 1",
      description: "Equipment inspection and maintenance",
      icon: "construct-outline",
    },
    {
      id: "task2",
      title: "Task 2",
      description: "Work order management",
      icon: "clipboard-outline",
    },
    {
      id: "task3",
      title: "Task 3",
      description: "Material tracking and inventory",
      icon: "cube-outline",
    },
    {
      id: "task4",
      title: "Task 4",
      description: "Time logging and reports",
      icon: "time-outline",
    },
    {
      id: "task5",
      title: "Task 5",
      description: "Safety documentation",
      icon: "shield-checkmark-outline",
    },
    {
      id: "task6",
      title: "Task 6",
      description: "Machine diagnostics",
      icon: "analytics-outline",
    },
  ];

  const handleTaskPress = (taskId: string): void => {
    console.log(`Navigate to ${taskId}`);

    // Update paths to match your actual file names
    switch (taskId) {
      case "task1":
        router.push("./Task1Page"); // or "/Task1Page"
        break;
      case "task2":
        router.push("./Task2Page");
        break;
      case "task3":
        router.push("./Task3Page");
        break;
      case "task4":
        router.push("./Task4Page");
        break;
      case "task5":
        router.push("./Task5Page");
        break;
      case "task6":
        router.push("./Task6Page");
        break;
      default:
        console.log(`Unknown task: ${taskId}`);
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
          <Ionicons name="build" size={60} color={colors.primary} />
          <Text style={styles.title}>Available Tasks</Text>
          <Text style={styles.subtitle}>
            Select a task to continue with your work
          </Text>
        </View>

        {/* Tasks List */}
        <View style={styles.tasksContainer}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskButton}
              onPress={() => handleTaskPress(task.id)}
              activeOpacity={0.7}
            >
              <View style={styles.taskContent}>
                <View style={styles.taskIconContainer}>
                  <Ionicons name={task.icon} size={24} color={colors.primary} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.secondary}
                />
              </View>
            </TouchableOpacity>
          ))}
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
  tasksContainer: {
    width: "100%",
  },
  taskButton: {
    backgroundColor: colors.background.light,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginBottom: spacing.base,
    ...shadows.sm,
  },
  taskContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  taskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.light,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  taskDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
