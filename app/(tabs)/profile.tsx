import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, spacing, typography } from "../../constants/theme";
import { useAuth } from "../../contexts/AuthContext";
import { authService, UserProfile } from "../../services/authService";

// Types
interface SettingItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: "navigate" | "toggle";
  value?: boolean | string;
}

interface SettingsSection {
  title: string;
  items: SettingItem[];
}

interface Settings {
  [key: string]: boolean;
}

// Mock data
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://example.com/avatar.jpg",
  membershipLevel: "Gold",
  points: 1250,
  orders: 12,
  wishlist: 8,
};

const suggestedCommands = [
  "Update my profile",
  "Change password",
  "View order history",
  "Check my points",
  "Manage preferences",
];

const settingsSections: SettingsSection[] = [
  {
    title: "Account",
    items: [
      {
        id: "personal",
        title: "Personal Information",
        icon: "person-outline",
        action: "navigate",
      },
      {
        id: "security",
        title: "Security & Privacy",
        icon: "shield-outline",
        action: "navigate",
      },
      {
        id: "notifications",
        title: "Notifications",
        icon: "notifications-outline",
        action: "navigate",
      },
    ],
  },
  {
    title: "Preferences",
    items: [
      {
        id: "voice",
        title: "Voice Assistant",
        icon: "mic-outline",
        action: "toggle",
        value: true,
      },
      {
        id: "darkMode",
        title: "Dark Mode",
        icon: "moon-outline",
        action: "toggle",
        value: false,
      },
      {
        id: "language",
        title: "Language",
        icon: "language-outline",
        action: "navigate",
        value: "English",
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        id: "help",
        title: "Help Center",
        icon: "help-circle-outline",
        action: "navigate",
      },
      {
        id: "feedback",
        title: "Send Feedback",
        icon: "chatbubble-outline",
        action: "navigate",
      },
      {
        id: "about",
        title: "About",
        icon: "information-circle-outline",
        action: "navigate",
      },
    ],
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(
    settingsSections.reduce((acc, section) => {
      section.items.forEach((item) => {
        if (item.action === "toggle" && typeof item.value === "boolean") {
          acc[item.id] = item.value;
        }
      });
      return acc;
    }, {} as Settings)
  );

  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await authService.getUserProfile(user.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePress = () => {
    setIsListening(!isListening);
    // Add voice interaction logic here
  };

  const handleSettingToggle = (settingId: string) => {
    setSettings((prev) => ({
      ...prev,
      [settingId]: !prev[settingId],
    }));
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/auth/login");
          } catch (error) {
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          Please sign in to view your profile
        </Text>
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.replace("/auth/login")}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = userProfile?.displayName || user.displayName || "User";
  const email = userProfile?.email || user.email || "";
  const membershipLevel = "Gold"; // TODO: Get from user profile

  const renderSettingItem = (item: SettingItem) => {
    switch (item.action) {
      case "toggle":
        return (
          <Switch
            value={settings[item.id]}
            onValueChange={() => handleSettingToggle(item.id)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.background.light}
          />
        );
      case "navigate":
        return (
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.text.secondary}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.voiceButton} onPress={handleVoicePress}>
          <Ionicons
            name={isListening ? "mic" : "mic-outline"}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Voice Commands */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
      >
        {suggestedCommands.map((command, index) => (
          <TouchableOpacity
            key={index}
            style={styles.chip}
            onPress={() => {
              setIsListening(true);
              // Add voice command logic here
            }}
          >
            <Ionicons
              name="mic-outline"
              size={16}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.chipText}>{command}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        {userProfile?.photoURL ? (
          <Image source={{ uri: userProfile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={colors.text.secondary} />
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <View style={styles.membershipBadge}>
            <Ionicons name="star" size={16} color={colors.primary} />
            <Text style={styles.membershipText}>{membershipLevel} Tier Operator</Text>
          </View>
        </View>
      </View>

      {/* Stats
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Wishlist</Text>
        </View>
      </View> */}

      {/* Settings */}
      <ScrollView style={styles.settingsContainer}>
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                onPress={() => {
                  if (item.action === "toggle") {
                    handleSettingToggle(item.id);
                  }
                  // Add navigation logic here
                }}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={colors.text.primary}
                  />
                  <Text style={styles.settingText}>{item.title}</Text>
                </View>
                {renderSettingItem(item)}
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons
            name="log-out-outline"
            size={24}
            color={colors.status.error}
          />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    paddingBottom: spacing["3xl"],
    marginBottom: spacing["3xl"],
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: 8,
  },
  signInButtonText: {
    color: colors.text.light,
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.base,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing["2xl"],
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
  },
  voiceButton: {
    padding: spacing.sm,
  },
  chipsContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.light,
    maxHeight: 36,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    marginRight: spacing.sm,
  },
  chipText: {
    color: colors.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: "500",
  },
  profileSection: {
    flexDirection: "row",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.base,
  },
  profileInfo: {
    justifyContent: "center",
  },
  name: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "10",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  membershipText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  settingsContainer: {
    flex: 1,
  },
  settingsSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background.light,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.base,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.lg,
    backgroundColor: colors.background.light,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    color: colors.status.error,
    marginLeft: spacing.sm,
  },
});
