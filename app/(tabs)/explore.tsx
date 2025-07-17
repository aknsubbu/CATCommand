import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";

import { Collapsible } from "@/components/Collapsible";
import { DataPushScript } from "@/components/DataPushScript";
import { ExternalLink } from "@/components/ExternalLink";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore & Test</ThemedText>
      </ThemedView>

      <Collapsible title="🚀 Push Sample Data">
        <ThemedText style={styles.description}>
          Click the button below to push comprehensive sample data to all
          Firestore collections. This will create users, machines, alerts,
          maintenance tasks, AI interactions, and more.
        </ThemedText>
        <DataPushScript />
      </Collapsible>

      <Collapsible title="📊 Available Services">
        <ThemedText>
          The following services are available for testing:
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">User Service:</ThemedText> User
          management, roles, permissions, sessions
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Machine Service:</ThemedText>{" "}
          Equipment tracking, status, specifications
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Alert Service:</ThemedText> Alert
          creation, management, escalation
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Maintenance Service:</ThemedText>{" "}
          Task scheduling, tracking, completion
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          •{" "}
          <ThemedText type="defaultSemiBold">
            AI Interaction Service:
          </ThemedText>{" "}
          Conversation management, feedback
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          • <ThemedText type="defaultSemiBold">Session Service:</ThemedText>{" "}
          User session tracking, device info
        </ThemedText>
        <ThemedText style={styles.serviceItem}>
          •{" "}
          <ThemedText type="defaultSemiBold">
            Role & Permission Service:
          </ThemedText>{" "}
          Access control, permissions
        </ThemedText>
      </Collapsible>

      <Collapsible title="🔧 Test Features">
        <ThemedText>Each test suite includes:</ThemedText>
        <ThemedText style={styles.featureItem}>
          ✅ <ThemedText type="defaultSemiBold">Create Operations:</ThemedText>{" "}
          Test data creation with validation
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          📖 <ThemedText type="defaultSemiBold">Read Operations:</ThemedText>{" "}
          Data retrieval with filtering and pagination
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          ✏️ <ThemedText type="defaultSemiBold">Update Operations:</ThemedText>{" "}
          Data modification and status changes
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          📈 <ThemedText type="defaultSemiBold">Analytics:</ThemedText>{" "}
          Statistics and metrics calculation
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          ⚡ <ThemedText type="defaultSemiBold">Performance:</ThemedText>{" "}
          Execution time tracking for each operation
        </ThemedText>
        <ThemedText style={styles.featureItem}>
          🎯 <ThemedText type="defaultSemiBold">Error Handling:</ThemedText>{" "}
          Comprehensive error catching and reporting
        </ThemedText>
      </Collapsible>

      <Collapsible title="🗄️ Database Schema">
        <ThemedText>
          The Firestore database includes the following collections:
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">users:</ThemedText> User
          profiles, roles, and settings
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">machines:</ThemedText> Equipment
          data, specifications, status
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">alerts:</ThemedText> System
          alerts, notifications, escalations
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">maintenanceTasks:</ThemedText>{" "}
          Scheduled and completed maintenance
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">aiInteractions:</ThemedText> AI
          conversation history and feedback
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">roles:</ThemedText> Role
          definitions and permissions
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold">permissions:</ThemedText> System
          permissions and access control
        </ThemedText>
        <ThemedText style={styles.schemaItem}>
          📁 <ThemedText type="defaultSemiBold"></ThemedText> User session
          tracking
        </ThemedText>
      </Collapsible>

      <Collapsible title="📱 Original App Features">
        <ThemedText>
          This app includes example code to help you get started.
        </ThemedText>
        <ThemedText>
          This app has two screens:{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          and{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
        </ThemedText>
        <ThemedText>
          The layout file in{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText>{" "}
          sets up the tab navigator.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/router/introduction">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="🌐 Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the
          web version, press <ThemedText type="defaultSemiBold">w</ThemedText>{" "}
          in the terminal running this project.
        </ThemedText>
      </Collapsible>

      <Collapsible title="🖼️ Images">
        <ThemedText>
          For static images, you can use the{" "}
          <ThemedText type="defaultSemiBold">@2x</ThemedText> and{" "}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to
          provide files for different screen densities
        </ThemedText>
        <Image
          source={require("@/assets/images/react-logo.png")}
          style={{ alignSelf: "center" }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="🔤 Custom fonts">
        <ThemedText>
          Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText>{" "}
          to see how to load{" "}
          <ThemedText style={{ fontFamily: "SpaceMono" }}>
            custom fonts such as this one.
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="🌙 Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{" "}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook
          lets you inspect what the user&apos;s current color scheme is, and so
          you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="✨ Animations">
        <ThemedText>
          This template includes an example of an animated component. The{" "}
          <ThemedText type="defaultSemiBold">
            components/HelloWave.tsx
          </ThemedText>{" "}
          component uses the powerful{" "}
          <ThemedText type="defaultSemiBold">
            react-native-reanimated
          </ThemedText>{" "}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The{" "}
              <ThemedText type="defaultSemiBold">
                components/ParallaxScrollView.tsx
              </ThemedText>{" "}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  serviceItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
  featureItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
  schemaItem: {
    marginVertical: 4,
    marginLeft: 8,
    lineHeight: 20,
  },
});
