import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Image, Dimensions } from "react-native";
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
    backgroundColor: "#F9F9F9",
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
    marginBottom: 12,
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

export default function ProfAppointmentComp() {
  const [appointments, setAppointments] = useState(dummyAppointments);
  const [acceptedAppointments, setAcceptedAppointments] = useState<typeof dummyAppointments>([]);

  const handleDecision = (id: string, type: "accept" | "reject") => {
    const target = appointments.find((appt) => appt.id === id);
    if (type === "accept" && target) {
      setAcceptedAppointments((prev) => [...prev, target]);
    }
    setAppointments((prev) => prev.filter((appt) => appt.id !== id));
  };

  const SwipeableCard = ({ item }: { item: typeof dummyAppointments[0] }) => {
    const translateX = useSharedValue(0);
    const cardHeight = useSharedValue(1);

    const gestureHandler = useAnimatedGestureHandler({
      onActive: (event) => {
        translateX.value = event.translationX;
      },
      onEnd: () => {
        if (translateX.value > SWIPE_THRESHOLD) {
          // Accept
          translateX.value = withTiming(SCREEN_WIDTH, {}, () => {
            runOnJS(handleDecision)(item.id, "accept");
          });
        } else if (translateX.value < -SWIPE_THRESHOLD) {
          // Reject
          translateX.value = withTiming(-SCREEN_WIDTH, {}, () => {
            runOnJS(handleDecision)(item.id, "reject");
          });
        } else {
          translateX.value = withTiming(0);
        }
      },
    });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Image source={{ uri: placeholderImage }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{item.customerName}</Text>
            <Text style={styles.details}>
              {item.date} at {item.time}
            </Text>
          </View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const renderAccepted = ({ item }: { item: typeof dummyAppointments[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: placeholderImage }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.customerName}</Text>
        <Text style={styles.details}>{item.date} at {item.time}</Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <Text style={styles.header}>Today's Appointments</Text>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SwipeableCard item={item} />}
        contentContainerStyle={styles.list}
        scrollEnabled={false}
      />
      {acceptedAppointments.length > 0 && (
        <>
          <Text style={styles.subHeader}>Accepted Appointments</Text>
          <FlatList
            data={acceptedAppointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAccepted}
            contentContainerStyle={styles.list}
            scrollEnabled={false}
          />
        </>
      )}
    </GestureHandlerRootView>
  );
}
