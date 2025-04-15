import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Alert,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../constants/firebaseConfig";
import { Colors } from "@/constants/Colors";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;

interface EnthusAppointmentCompProps {
  theme: "light" | "dark";
}

export default function EnthusAppointmentComp({ theme }: EnthusAppointmentCompProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  // When activeFilter is null, no filter is selected – showing all sections.
  // Otherwise, activeFilter is one of "upcoming", "pending", or "past".
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "pending" | "past" | null>(null);

  // Subscribe to appointments for the current enthusiastic user.
  useEffect(() => {
    if (auth.currentUser) {
      const q = query(
        collection(db, "appointments"),
        where("enthusiastId", "==", auth.currentUser.uid),
        where("status", "in", ["pending", "accepted", "completed", "missed"])
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAppointments(apps);
      });
      return () => unsubscribe();
    }
  }, []);

  // Helper function to render a friendly status display with an icon.
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
        <Text style={[styles.details, { marginLeft: 4, color: "iconColor" }]}>{displayText}</Text>
      </View>
    );
  };

  // Handler for cancellation with confirmation.
  const confirmCancel = (appointmentId: string, resetCard: () => void) => {
    Alert.alert(
      "Cancel Appointment",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel", onPress: () => resetCard() },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "appointments", appointmentId), { status: "cancelled" });
            } catch (error) {
              console.error("Error cancelling appointment:", error);
              Alert.alert("Error", "Failed to cancel appointment.");
            }
          },
        },
      ]
    );
  };

  // Handler for joining an appointment.
  const handleJoin = (appointment: any) => {
    navigation.navigate("call", { meetingId: appointment.id })
  };

  // -----------------------------------------------------------
  // UI Components for displaying appointment cards.
  // -----------------------------------------------------------

  // For upcoming & pending appointments – horizontal layout with swipe actions.
  const SwipeableCard = ({ item }: { item: any }) => {
    const translateX = useSharedValue(0);
    const [professionalImage, setProfessionalImage] = useState<string | null>(null);

    useEffect(() => {
      if (item.professionalId) {
        const professionalDocRef = doc(db, "users", item.professionalId);
        const unsubscribe = onSnapshot(professionalDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfessionalImage(docSnap.data().profileImage);
          }
        });
        return () => unsubscribe();
      }
    }, [item.professionalId]);

    const resetCard = () => {
      translateX.value = withTiming(0);
    };

    const gestureHandler = useAnimatedGestureHandler({
      onActive: (event) => {
        translateX.value = event.translationX;
      },
      onEnd: () => {
        if (translateX.value < -SWIPE_THRESHOLD) {
          translateX.value = withTiming(-SWIPE_THRESHOLD, {}, () => {
            runOnJS(confirmCancel)(item.id, resetCard);
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
      const opacity = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
      return {
        backgroundColor:
          translateX.value < 0 ? `rgba(200, 0, 0, ${opacity * 0.4})` : "transparent",
      };
    });

    const dt = item.scheduledDateTime?.toDate?.() ?? new Date();
    const dateStr = dt.toLocaleDateString();
    const timeStr = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return (
      
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={{ marginBottom: 12 }}>
          <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 12 }, backgroundStyle]} />
          <Animated.View style={[styles.cardRow, animatedCardStyle]}>
            <Image
              source={{ uri: professionalImage || "https://via.placeholder.com/100" }}
              style={styles.avatar}
            />
            <View style={styles.infoContainer}>
              <Text style={[styles.name, { color: "black" }]}>
                {item.professionalfirstName} {item.professionallastName}
              </Text>
              <Text style={[styles.details, { color: "black" }]}>{dateStr} at {timeStr}</Text>
              <View style={styles.statusContainer}>{renderStatus(item.status)}</View>
            </View>
            {item.status === "accepted" && (
              <TouchableOpacity onPress={() => handleJoin(item)} style={styles.joinButton}>
                <Text style={styles.buttonText}>Join</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  // For past appointments – vertical layout with rating UI.
  const StaticCard = ({ item }: { item: any }) => {
    const [professionalImage, setProfessionalImage] = useState<string | null>(null);
    const [isRatingActive, setIsRatingActive] = useState<boolean>(false);
    const [ratingValue, setRatingValue] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>("");
    const [existingReview, setExistingReview] = useState<any>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
    setKeyboardHeight(e.endCoordinates.height);
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardHeight(0);
  });
  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, []);

    useEffect(() => {
      if (item.professionalId) {
        const professionalDocRef = doc(db, "users", item.professionalId);
        const unsubscribe = onSnapshot(professionalDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfessionalImage(docSnap.data().profileImage);
          }
        });
        return () => unsubscribe();
      }
    }, [item.professionalId]);

    useEffect(() => {
      if (auth.currentUser) {
        const reviewQuery = query(
          collection(db, "reviews"),
          where("appointmentId", "==", item.id),
          where("enthusiastId", "==", auth.currentUser.uid)
        );
        const unsubscribeReview = onSnapshot(reviewQuery, (snapshot) => {
          if (!snapshot.empty) {
            const reviewDoc = snapshot.docs[0];
            const reviewData = reviewDoc.data();
            setExistingReview({ id: reviewDoc.id, ...reviewData });
            setRatingValue(reviewData.rating);
            setReviewText(reviewData.review);
          } else {
            setExistingReview(null);
          }
        });
        return () => unsubscribeReview();
      }
    }, [item.id]);

    const dt = item.scheduledDateTime?.toDate?.() ?? new Date();
    const dateStr = dt.toLocaleDateString();
    const timeStr = dt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const renderStars = () => {
      const stars = [];
      for (let i = 1; i <= 5; i++) {
        stars.push(
          <TouchableOpacity key={i} onPress={() => setRatingValue(i)}>
            <Ionicons
              name={ratingValue >= i ? "star" : "star-outline"}
              size={24}
              color="#FFD700"
            />
          </TouchableOpacity>
        );
      }
      return <View style={styles.starsContainer}>{stars}</View>;
    };

    const submitReview = async () => {
      if (ratingValue === 0) {
        Alert.alert("Error", "Please select a star rating.");
        return;
      }
      const reviewData = {
        appointmentId: item.id,
        professionalId: item.professionalId,
        professionalfirstName: item.professionalfirstName,
        professionallastName: item.professionallastName,
        enthusiastId: auth.currentUser?.uid,
        enthusiastfirstName: item.enthusiastfirstName || "",
        enthusiastlastName: item.enthusiastlastName || "",
        scheduledDateTime: item.scheduledDateTime?.toDate?.().toISOString() || new Date().toISOString(),
        rating: ratingValue,
        review: reviewText,
        createdAt: new Date().toISOString(),
      };
      try {
        if (existingReview) {
          await updateDoc(doc(db, "reviews", existingReview.id), reviewData);
        } else {
          await addDoc(collection(db, "reviews"), reviewData);
        }
        Alert.alert("Success", "Review submitted!");
        setIsRatingActive(false);
      } catch (error) {
        console.error("Review submission error:", error);
        Alert.alert("Error", "Failed to submit review.");
      }
    };

    const deleteReview = async () => {
      Alert.alert("Delete Review", "Are you sure you want to delete this review?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "reviews", existingReview.id));
              Alert.alert("Success", "Review deleted.");
            } catch (error) {
              console.error("Error deleting review:", error);
              Alert.alert("Error", "Failed to delete review.");
            }
          },
        },
      ]);
    };

    return (
      <KeyboardAvoidingView
    style={styles.ratingContainer}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={272}>
      
      <View style={[styles.card, { marginBottom: 12 }]}>
        <View style={styles.cardTop}>
          <Image
            source={{ uri: professionalImage || "https://via.placeholder.com/100" }}
            style={styles.avatar}
          />
          <View style={styles.infoContainer}>
            <Text style={[styles.name, { color: "black" }]}>
              {item.professionalfirstName} {item.professionallastName}
            </Text>
            <Text style={[styles.details, { color: "black" }]}>{dateStr} at {timeStr}</Text>
            <View style={styles.statusContainer}>{renderStatus(item.status)}</View>
          </View>
        </View>
        {!isRatingActive ? (
          item.status === "completed" && (
            existingReview ? (
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => setIsRatingActive(true)} style={styles.editButton}>
                  <Text style={styles.buttonText}>Edit Review</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteReview} style={styles.deleteButton}>
                  <Text style={styles.buttonText}>Delete Review</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsRatingActive(true)} style={styles.rateButtonNew}>
                <Text style={styles.buttonText}>Rate Professional</Text>
              </TouchableOpacity>
            )
          )
        ) : (

           // Adjust this value based on your header/navigation height.

          <View style={styles.ratingContainer}>
            
            {renderStars()}
            <TextInput
              style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
              placeholder="Write your review (optional)..."
              placeholderTextColor={theme === "light" ? "#555" : "#aaa"}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />
            <View style={styles.ratingButtons}>
              <TouchableOpacity onPress={submitReview} style={styles.submitButton}>
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsRatingActive(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
          // </KeyboardAvoidingView>
          
        )}
      </View>
      </KeyboardAvoidingView>
    );
    
  };

  // Compute appointment groups.
  const upcomingApps = appointments.filter(app => app.status === "accepted");
  const pendingApps = appointments.filter(app => app.status === "pending");
  const pastApps = appointments.filter(app => app.status === "completed" || app.status === "missed");

  // If a filter is selected, use that group; otherwise, show all sections.
  let filteredAppointments: any[] = [];
  if (activeFilter === "upcoming") {
    filteredAppointments = upcomingApps;
  } else if (activeFilter === "pending") {
    filteredAppointments = pendingApps;
  } else if (activeFilter === "past") {
    filteredAppointments = pastApps;
  }

  // Decide which card component to use based on the active filter.
  const renderAppointment = ({ item }: { item: any }) => {
    if (activeFilter === "past") {
      return <StaticCard item={item} />;
    }
    return <SwipeableCard item={item} />;
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: Colors[theme].tabIconDefault }]}>
      {/* Filter Bar */}
      <View style={styles.filterWrapper}>
      <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.filterContainer}
>
  {filterOptions.map(option => (
    <TouchableOpacity
      key={option.key}
      onPress={() =>
        setActiveFilter(option.key as "upcoming" | "pending" | "past")
      }
      style={[
        styles.filterButton,
        // Add active filter styles conditionally:
        activeFilter === option.key && {
          borderWidth: 2,
          borderColor: theme === "dark" ? "white" : "black",
        },
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
          <Text style={[styles.sectionHeader, { color: theme === "dark" ? "#f2f2f2" : "#222222" }]}>Upcoming Appointments</Text>
          {upcomingApps.length > 0 ? (
            <FlatList
              data={upcomingApps}
              keyExtractor={(item) => item.id}
              renderItem={(props) => <SwipeableCard {...props} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No upcoming appointments found.</Text>
          )}

          <Text style={[styles.sectionHeader, { color: theme === "dark" ? "#f2f2f2" : "#222222" }]}>Pending Appointments</Text>
          {pendingApps.length > 0 ? (
            <FlatList
              data={pendingApps}
              keyExtractor={(item) => item.id}
              renderItem={(props) => <SwipeableCard {...props} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No pending appointments found.</Text>
          )}

          <Text style={[styles.sectionHeader, { color: theme === "dark" ? "#f2f2f2" : "#222222" }]}>Past Appointments</Text>
          {pastApps.length > 0 ? (
            <FlatList
              data={pastApps}
              keyExtractor={(item) => item.id}
              renderItem={(props) => <StaticCard {...props} />}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noAppointments}>No past appointments found.</Text>
          )}
        </ScrollView>
      ) : (
        <>
          <Text style={[styles.sectionHeader, { color: theme === "dark" ? "#f2f2f2" : "#222222" }]}>
            {activeFilter === "upcoming"
              ? "Upcoming Appointments"
              : activeFilter === "pending"
              ? "Pending Appointments"
              : "Past Appointments"}
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

const filterOptions = [
  { key: "upcoming", label: "Upcoming", icon: "calendar-outline" },
  { key: "pending", label: "Pending", icon: "time-outline" },
  { key: "past", label: "Past", icon: "checkmark-done-outline" },
];

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
    color: "white" 
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
    color: "#555",
    textAlign: "center",
    marginVertical: 10,
  },
  list: {
    paddingBottom: 20,
  },
  cardRow: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
    marginTop: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statusContainer: {
    marginTop: 4,
  },
  joinButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  rateButtonNew: {
    backgroundColor: "#E89600",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: "center",
    marginTop: 10,
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  editButton: {
    backgroundColor: "#E89600",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginRight: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: "#D32F2F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginLeft: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginRight: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flex: 1,
    marginLeft: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  ratingContainer: {
    marginTop: 10,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  ratingButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
});
