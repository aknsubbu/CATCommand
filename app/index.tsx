import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { colors, spacing, typography } from "../constants/theme";
import { useAuth } from "../contexts/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace("/(tabs)");
        } else {
          router.replace("/auth/login");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, user, router]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
         <Image
    source={{ uri: "https://s7d2.scene7.com/is/image/Caterpillar/CM20220222-5c3c2-280a8?fmt=png-alpha" }}
    style={styles.logoImage}
    resizeMode="contain"
  />
      </Animated.View>
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        CAT Command{" "}
      </Animated.Text>
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        Your Daily Operations Assistant
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: "bold",
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
  },
   logoImage: {
    width: 80,
    height: 80,
  },
});
