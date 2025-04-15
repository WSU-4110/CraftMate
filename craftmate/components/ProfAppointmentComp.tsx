import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Colors } from "@/constants/Colors";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;

const dummyAppointments = [
  { id: "1", customerName: "warif", time: "10:00 AM", date: "2025-04-03" },
  { id: "2", customerName: "darick", time: "12:30 PM", date: "2025-04-03" },
  { id: "3", customerName: "keenan", time: "2:00 PM", date: "2025-04-03" },
];

const placeholderImage = "https://via.placeholder.com/50";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor will be set dynamically from the Colors constant.
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 15,
    textAlign: "center",
  },
  subHeader: {
    fontSize: 20,
    fontWeight: "500",
    marginVertical: 15,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "500",
  },
  details: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
});

interface ProfAppointmentCompProps {
  theme: "light" | "dark";
}

export default function ProfAppointmentComp({ theme }: ProfAppointmentCompProps) {
  const [appointments, setAppointments] = useState(dummyAppointments);
  const [acceptedAppointments, setAcceptedAppointments] = useState<typeof dummyAppointments>([]);
  const [lastRemoved, setLastRemoved] = useState<{
    item: typeof dummyAppointments[0];
    type: "accept" | "reject";
  } | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (lastRemoved) {
      setShowUndo(true);
      const timeout = setTimeout(() => {
        setShowUndo(false);
        setLastRemoved(null);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [lastRemoved]);

  const handleDecision = (id: string, type: "accept" | "reject") => {
    const target = appointments.find((appt) => appt.id === id);
    if (!target) return;

    if (type === "accept") {
      setAcceptedAppointments((prev) => [...prev, target]);
    }

    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
    setLastRemoved({ item: target, type });
  };

  const handleUndo = () => {
    if (!lastRemoved) return;
    const { item, type } = lastRemoved;
    if (type === "accept") {
      setAcceptedAppointments((prev) => prev.filter((appt) => appt.id !== item.id));
    }
    setAppointments((prev) => [item, ...prev]);
    setLastRemoved(null);
    setShowUndo(false);
  };

  const SwipeableCard = ({ item }: { item: typeof dummyAppointments[0] }) => {
    const translateX = useSharedValue(0);

    const gestureHandler = useAnimatedGestureHandler({
      onActive: (event) => {
        translateX.value = event.translationX;
      },
      onEnd: () => {
        if (translateX.value > SWIPE_THRESHOLD) {
          translateX.value = withTiming(SCREEN_WIDTH, {}, () => {
            runOnJS(handleDecision)(item.id, "accept");
          });
        } else if (translateX.value < -SWIPE_THRESHOLD) {
          translateX.value = withTiming(-SCREEN_WIDTH, {}, () => {
            runOnJS(handleDecision)(item.id, "reject");
          });
        } else {
          translateX.value = withTiming(0);
        }
      },
    });

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    const backgroundStyle = useAnimatedStyle(() => {
      let opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
      return {
        backgroundColor:
          translateX.value > 0
            ? `rgba(0, 200, 0, ${opacity * 0.5})`
            : translateX.value < 0
            ? `rgba(200, 0, 0, ${opacity * 0.5})`
            : "transparent",
      };
    });

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={{ marginBottom: 12 }}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 12 },
              backgroundStyle,
            ]}
          />
          <Animated.View style={[styles.card, animatedCardStyle]}>
            <Image source={{ uri: placeholderImage }} style={styles.avatar} />
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.details}>
                {item.date} at {item.time}
              </Text>
            </View>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderAccepted = ({ item }: { item: typeof dummyAppointments[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: placeholderImage }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.customerName}</Text>
        <Text style={styles.details}>
          {item.date} at {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      {/* Update text color using Colors for the current theme */}
      <Text style={[styles.header, { color: Colors[theme].text }]}>Today's Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SwipeableCard item={item} />}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />

      {acceptedAppointments.length > 0 && (
        <>
          <Text style={[styles.subHeader, { color: Colors[theme].text }]}>Accepted Appointments</Text>
          <FlatList
            data={acceptedAppointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAccepted}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
          />
        </>
      )}

      {showUndo && lastRemoved && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: "#333",
            padding: 16,
            borderRadius: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", flex: 1 }}>
            Appointment {lastRemoved.type === "accept" ? "accepted" : "rejected"}.
          </Text>
          <TouchableOpacity onPress={handleUndo}>
            <Text style={{ color: "#4FC3F7", fontWeight: "bold" }}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}
