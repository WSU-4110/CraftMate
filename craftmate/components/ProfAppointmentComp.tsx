import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import { auth, db } from "../constants/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 100;
const placeholderImage = "https://via.placeholder.com/50";

interface ProfAppointmentCompProps {
  theme: "light" | "dark";
}

// Helper: Renders a status indicator with an icon.
const renderStatus = (status: string) => {
  let iconName = "";
  let displayText = "";
  let iconColor = "";
  switch (status) {
    case "pending":
      iconName = "time-outline";
      displayText = "Pending";
      iconColor = "#FFA500";
      break;
    case "accepted":
      iconName = "checkmark-circle-outline";
      displayText = "Accepted";
      iconColor = "green";
      break;
    case "completed":
      iconName = "checkmark-done-outline";
      displayText = "Completed";
      iconColor = "blue";
      break;
    case "missed":
      iconName = "close-circle-outline";
      displayText = "Missed";
      iconColor = "red";
      break;
    default:
      iconName = "alert-circle-outline";
      displayText = status;
      iconColor = "gray";
      break;
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={iconName} size={20} color={iconColor} />
      <Text style={[styles.details, { marginLeft: 4 }]}>{displayText}</Text>
    </View>
  );
};

// Helper: Formats scheduledDateTime into a readable string.
const formatScheduledDateTime = (scheduledDateTime: any) => {
  const dt = scheduledDateTime?.toDate
    ? scheduledDateTime.toDate()
    : new Date(scheduledDateTime);
  const dateStr = dt.toLocaleDateString();
  const timeStr = dt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
};




interface UpcomingCardProps {
  item: any;
  handleJoin: (appointment: any) => void;
}

const UpcomingCard = ({ item, handleJoin }: UpcomingCardProps) => {
  const [profileImage, setProfileImage] = useState(placeholderImage);

  useEffect(() => {
    if (item.enthusiastId) {
      const userDocRef = doc(db, "users", item.enthusiastId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfileImage(docSnap.data().profileImage || placeholderImage);
        }
      });
      return () => unsubscribe();
    }
  }, [item.enthusiastId]);

  // Swipe-to-cancel functionality
  const translateX = useSharedValue(0);
  const resetCard = () => {
    translateX.value = withTiming(0);
  };
  const handleCancel = () => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", onPress: resetCard, style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "appointments", item.id), {
                status: "cancelled",
              });
            } catch (error) {
              console.error("Error cancelling appointment:", error);
              Alert.alert("Error", "Could not cancel appointment.");
            }
          },
        },
      ]
    );
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: () => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, {}, () => {
          runOnJS(handleCancel)();
        });
      } else {
        translateX.value = withTiming(0);
      }
    },
  });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const bgStyle = useAnimatedStyle(() => {
    const opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return {
      backgroundColor:
        translateX.value < 0
          ? `rgba(200, 0, 0, ${opacity * 0.4})`
          : "transparent",
    };
  });

  // Updated join confirmation uses the passed handleJoin function
  const joinConfirmation = () => {
    Alert.alert("Join Appointment", "Are you sure you want to join this appointment?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => handleJoin(item) },
    ]);
  };

  const noShowConfirmation = () => {
    Alert.alert("Mark No Show", "Are you sure you want to mark this appointment as missed?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "appointments", item.id), {
              status: "missed",
            });
          } catch (error) {
            console.error("Error marking no show:", error);
            Alert.alert("Error", "Could not update status to missed.");
          }
        },
      },
    ]);
  };

  const completedConfirmation = () => {
    Alert.alert("Mark Completed", "Are you sure you want to mark this appointment as completed?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "appointments", item.id), {
              status: "completed",
            });
          } catch (error) {
            console.error("Error marking completed:", error);
            Alert.alert("Error", "Could not update status to completed.");
          }
        },
      },
    ]);
  };

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={{ marginBottom: 12 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 12 }, bgStyle]} />
        <Animated.View style={[styles.upcomingCard, animatedCardStyle]}>
          <View style={styles.cardContent}>
            <Image source={{ uri: profileImage }} style={styles.avatar} />
            <View style={styles.infoContainer}>
              <Text style={styles.name}>
                {item.enthusiastfirstName} {item.enthusiastlastName}
              </Text>
              <Text style={styles.details}>{formatScheduledDateTime(item.scheduledDateTime)}</Text>
              <View style={styles.statusContainer}>{renderStatus(item.status)}</View>
            </View>
          </View>
          {/* Action buttons integrated into the upcoming card */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.joinButton} onPress={joinConfirmation}>
              <Text style={styles.buttonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.noShowButton} onPress={noShowConfirmation}>
              <Text style={styles.buttonText}>No Show</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completedButton} onPress={completedConfirmation}>
              <Text style={styles.buttonText}>Completed</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};


const SwipeableCard = ({ item }: { item: any }) => {
  const [profileImage, setProfileImage] = useState(placeholderImage);
  useEffect(() => {
    if (item.enthusiastId) {
      const userDocRef = doc(db, "users", item.enthusiastId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfileImage(docSnap.data().profileImage || placeholderImage);
        }
      });
      return () => unsubscribe();
    }
  }, [item.enthusiastId]);
  
  const translateX = useSharedValue(0);
  const resetCard = () => {
    translateX.value = withTiming(0);
  };

  // Confirm rejection (swipe left)
  const confirmReject = (appointmentId: string, resetCard: () => void) => {
    Alert.alert(
      "Reject Appointment",
      "Are you sure you want to reject this appointment?",
      [
        { text: "No", style: "cancel", onPress: resetCard },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "appointments", appointmentId), {
                status: "rejected",
              });
            } catch (error) {
              console.error("Error rejecting appointment:", error);
              Alert.alert("Error", "Failed to reject appointment.");
            }
          },
        },
      ]
    );
  };

  // Confirm acceptance (swipe right)
  const confirmAccept = (appointmentId: string, resetCard: () => void) => {
    Alert.alert(
      "Accept Appointment",
      "Are you sure you want to accept this appointment?",
      [
        { text: "No", onPress: resetCard, style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "appointments", appointmentId), {
                status: "accepted",
              });
            } catch (error) {
              console.error("Error accepting appointment:", error);
              Alert.alert("Error", "Failed to accept appointment.");
            }
          },
        },
      ]
    );
  };

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX;
    },
    onEnd: () => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        // Swipe left: reject appointment
        translateX.value = withTiming(-SWIPE_THRESHOLD, {}, () => {
          runOnJS(confirmReject)(item.id, resetCard);
        });
      } else if (translateX.value > SWIPE_THRESHOLD) {
        // Swipe right: accept appointment
        translateX.value = withTiming(SWIPE_THRESHOLD, {}, () => {
          runOnJS(confirmAccept)(item.id, resetCard);
        });
      } else {
        translateX.value = withTiming(0);
      }
    },
  });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const bgStyle = useAnimatedStyle(() => {
    const opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    return {
      backgroundColor:
        translateX.value < 0
          ? `rgba(200, 0, 0, ${opacity * 0.4})`
          : "transparent",
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={{ marginBottom: 12 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 12 }, bgStyle]} />
        <Animated.View style={[styles.cardRow, animatedCardStyle]}>
          <Image source={{ uri: profileImage }} style={styles.avatar} />
          <View style={styles.infoContainer}>
            <Text style={styles.name}>
              {item.enthusiastfirstName} {item.enthusiastlastName}
            </Text>
            <Text style={styles.details}>
              {formatScheduledDateTime(item.scheduledDateTime)}
            </Text>
            <View style={styles.statusContainer}>{renderStatus(item.status)}</View>
          </View>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

// PastCard for completed/missed appointments using the original horizontal layout.
const PastCard = ({ item }: { item: any }) => {
  const [profileImage, setProfileImage] = useState(placeholderImage);
  useEffect(() => {
    if (item.enthusiastId) {
      const userDocRef = doc(db, "users", item.enthusiastId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfileImage(docSnap.data().profileImage || placeholderImage);
        }
      });
      return () => unsubscribe();
    }
  }, [item.enthusiastId]);
  return (
    <View style={styles.cardRow}>
      <Image source={{ uri: profileImage }} style={styles.avatar} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>
          {item.enthusiastfirstName} {item.enthusiastlastName}
        </Text>
        <Text style={styles.details}>
          {formatScheduledDateTime(item.scheduledDateTime)}
        </Text>
        <View style={styles.statusContainer}>{renderStatus(item.status)}</View>
      </View>
    </View>
  );
};

export default function ProfAppointmentComp({ theme }: ProfAppointmentCompProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "pending" | "past" | null>(null);
  const navigation = useNavigation<any>();

  // Handler: Join an appointment.
  const handleJoin = (appointment: any) => {
    navigation.navigate("call", { meetingId: appointment.id });
  };

  const filterOptions = [
    { key: "upcoming", label: "Upcoming", icon: "calendar-outline" },
    { key: "pending", label: "Pending", icon: "time-outline" },
    { key: "past", label: "Past", icon: "checkmark-done-outline" },
  ];

  // Query appointments for the current professional...
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, "appointments"),
        where("professionalId", "==", auth.currentUser.uid),
        where("status", "in", ["pending", "accepted", "completed", "missed"])
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setAppointments(apps);
      });
      return () => unsubscribe();
    }
  }, []);

  // Group appointments by status.
  const upcomingApps = appointments.filter((app) => app.status === "accepted");
  const pendingApps = appointments.filter((app) => app.status === "pending");
  const pastApps = appointments.filter((app) => app.status === "completed" || app.status === "missed");

  let filteredAppointments: any[] = [];
  if (activeFilter === "upcoming") filteredAppointments = upcomingApps;
  else if (activeFilter === "pending") filteredAppointments = pendingApps;
  else if (activeFilter === "past") filteredAppointments = pastApps;

  // Render each appointment.
  const renderAppointment = ({ item }: { item: any }) => {
    if (activeFilter === "upcoming")
      return <UpcomingCard item={item} handleJoin={handleJoin} />;
    else if (activeFilter === "pending")
      return <SwipeableCard item={item} />;
    else return <PastCard item={item} />;
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      {/* Filter Bar */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setActiveFilter(option.key as "upcoming" | "pending" | "past")}
              style={[
                styles.filterButton,
                activeFilter === option.key && { borderWidth: 2, borderColor: theme === "dark" ? "white" : "black" },
              ]}
            >
              <Ionicons name={option.icon} size={16} color="white" />
              <Text style={styles.filterButtonText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {activeFilter && (
          <TouchableOpacity onPress={() => setActiveFilter(null)} style={styles.clearFilterButton}>
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text style={styles.clearFilterButtonText}>Clear Filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Appointment Display */}
      {activeFilter === null ? (
        <ScrollView>
          <Text style={[styles.sectionHeader, { color: Colors[theme].text }]}>Upcoming Appointments</Text>
          {upcomingApps.length > 0 ? (
            <FlatList
              data={upcomingApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <UpcomingCard item={item} handleJoin={handleJoin} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No upcoming appointments found.</Text>
          )}
          <Text style={[styles.sectionHeader, { color: Colors[theme].text }]}>Pending Appointments</Text>
          {pendingApps.length > 0 ? (
            <FlatList
              data={pendingApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SwipeableCard item={item} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No pending appointments found.</Text>
          )}
          <Text style={[styles.sectionHeader, { color: Colors[theme].text }]}>Past Appointments</Text>
          {pastApps.length > 0 ? (
            <FlatList
              data={pastApps}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PastCard item={item} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No past appointments found.</Text>
          )}
        </ScrollView>
      ) : (
        <>
          <Text style={[styles.sectionHeader, { color: Colors[theme].text }]}>
            {activeFilter === "upcoming" ? "Upcoming Appointments" : activeFilter === "pending" ? "Pending Appointments" : "Past Appointments"}
          </Text>
          {filteredAppointments.length > 0 ? (
            <FlatList
              data={filteredAppointments}
              keyExtractor={(item) => item.id}
              renderItem={renderAppointment}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No appointments found.</Text>
          )}
        </>
      )}
    </GestureHandlerRootView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  filterWrapper: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#E89600",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonText: {
    marginLeft: 5,
    fontWeight: "bold",
    color: "white",
  },
  clearFilterButton: {
    alignSelf: "center",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#D32F2F",
    borderWidth: 1,
    borderColor: "#D32F2F",
  },
  clearFilterButtonText: {
    marginLeft: 5,
    color: "#fff",
    fontWeight: "bold",
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginVertical: 10,
  },
  noAppointments: {
    textAlign: "center",
    marginVertical: 10,
    color: "#555",
  },
  list: {
    paddingBottom: 20,
  },
  // Original horizontal card style for pending and past cards.
  cardRow: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  // UpcomingCard style: vertical layout with integrated button row.
  upcomingCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "500",
  },
  details: {
    fontSize: 14,
    marginTop: 4,
    color: "#555",
  },
  statusContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  joinButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 25,
    alignItems: "center",
  },
  noShowButton: {
    flex: 1,
    backgroundColor: "#F44336",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 25,
    alignItems: "center",
  },
  completedButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
