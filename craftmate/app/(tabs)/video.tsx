import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Button,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { auth, db } from "../../constants/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  doc,
  getDoc, // added for Firestore user fetch
  getDocs
} from "firebase/firestore";
import { Colors } from "../../constants/Colors";
import ProfAppointmentComp from "@/components/ProfAppointmentComp";
import DateTimePicker from "@react-native-community/datetimepicker";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const categories = [
  { id: "1", name: "Cars", icon: "car-sport", color: "orange" },
  { id: "2", name: "Building", icon: "construct", color: "red" },
  { id: "3", name: "Electricity", icon: "flash", color: "yellow" },
  { id: "4", name: "Plumbing", icon: "water", color: "cyan" },
  { id: "5", name: "Painting", icon: "color-palette", color: "beige" },
  { id: "6", name: "Tools", icon: "hammer", color: "grey" },
];

export default function VideoScreen() {
  const [bookedSlots, setBookedSlots] = useState([]); // [{ date: '2024-04-11', time: '13:00' }]
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [isDateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [dateTimeSet, setDateTimeSet] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<"book" | "my">("book");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);

  const theme = useColorScheme() || "light";
  const router = useRouter();

  useEffect(() => {
    let unsubscribeUserSnapshot;
  
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
  
      if (user) {
        const docRef = doc(db, "users", user.uid);
  
        // Start Firestore snapshot listener to keep user data live
        unsubscribeUserSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data());
          }
        });
      }
    });
  
    return () => {
      unsubscribe();
      if (unsubscribeUserSnapshot) unsubscribeUserSnapshot();
    };
  }, []);

  useEffect(() => {
    let q;
    if (selectedTags.length > 0) {
      q = query(
        collection(db, "users"),
        where("isProfessional", "==", true),
        // Filters to professionals who have at least one of the selected tags
        where("tags", "array-contains-any", selectedTags)
      );
    } else {
      // No tag filters selected – fetch all professionals.
      q = query(
        collection(db, "users"),
        where("isProfessional", "==", true)
      );
    }
  
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const professionalUsers = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => {
          if (a.isActive === b.isActive) {
            return (a.firstName || "").localeCompare(b.firstName || "");
          }
          return a.isActive ? -1 : 1;
        });
  
      setUsers(professionalUsers);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, [selectedTags]);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]); // Add this at top with other state

  const generateTimeSlots = (date: Date) => {
    const slots: string[] = [];
    const now = new Date();
    const currentDay = now.toDateString() === date.toDateString();
  
    for (let h = 8; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const slot = new Date(date);
        slot.setHours(h, m, 0, 0);
  
        const slotDateStr = slot.toLocaleDateString();
        const slotTimeStr = slot.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  
        const isPast = currentDay && slot <= now;
        const isBooked = bookedSlots.some(
          b => b.date === slotDateStr && b.time === slotTimeStr
        );
  
        if (!isPast && !isBooked) {
          slots.push(slotTimeStr);
        }
      }
    }
  
    setAvailableTimeSlots(slots);
  };
  


  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || selectedDate;
    setShowDatePicker(false);
    setSelectedDate(currentDate);
    setDateTimeSet(true);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || selectedTime;
    setShowTimePicker(false);
    setSelectedTime(currentTime);
    setDateTimeSet(true);
  };

  const handleBookingRequest = async () => {
    if (!selectedProfessional || !auth.currentUser) return;
  
    // Combine selectedDate and selectedTime into a single Date object.
    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
  
    // Query for any existing appointment for the professional at this time.
    const appointmentQuery = query(
      collection(db, "appointments"),
      where("professionalId", "==", selectedProfessional.id),
      where("scheduledDateTime", "==", Timestamp.fromDate(appointmentDateTime))
    );
    const appointmentSnapshot = await getDocs(appointmentQuery);
    if (!appointmentSnapshot.empty) {
      alert("This time slot is already booked. Please choose a different time.");
      return;
    }
  
    try {
      await addDoc(collection(db, "appointments"), {
        enthusiastId: auth.currentUser.uid,
        enthusiastName: currentUser?.firstName || "Unknown",
        professionalId: selectedProfessional.id,
        professionalName: selectedProfessional.firstName || "Professional",
        // Save as one combined field.
        scheduledDateTime: Timestamp.fromDate(appointmentDateTime),
        status: "pending",
        createdAt: Timestamp.now(),
      });
  
      alert(
        `Booking requested with ${selectedProfessional.firstName} on ${appointmentDateTime.toLocaleDateString()} at ${appointmentDateTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`
      );
      setDateTimeSet(false);
    } catch (error) {
      console.error("Error sending booking request:", error);
      alert("Something went wrong while sending the request.");
    }
  };
  const sortedCategories = categories.slice().sort((a, b) => {
    const aSelected = selectedTags.includes(a.name);
    const bSelected = selectedTags.includes(b.name);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;
    return 0;
  });
  useEffect(() => {
    // Only query professional users.
    const q = query(collection(db, "users"), where("isProfessional", "==", true));
    getDocs(q)
      .then((snapshot) => {
        const tagSet = new Set<string>();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.tags && Array.isArray(data.tags)) {
            data.tags.forEach((tag: string) => tagSet.add(tag));
          }
        });
        // List of your default category names.
        const defaultCategoryNames = categories.map((category) => category.name);
        // Filter out any custom tag that is a default tag.
        const filteredCustomTags = Array.from(tagSet).filter(
          (tag) => !defaultCategoryNames.includes(tag)
        );
        setCustomTags(filteredCustomTags);
      })
      .catch((err) => {
        console.error("Error fetching custom tags", err);
      });
  }, []);
  
  
  
  if (!isLoggedIn) {
    return (
          <View style={[styles.container, { backgroundColor: Colors[theme].background, justifyContent: "center", alignItems: "center" }]}>
            <Text style={[styles.header, { color: Colors[theme].text, textAlign: "center", marginBottom: 20 }]}>
              Log in to setup appointments.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme === "light" ? "#E89600" : "#E89600", // Orange in both modes
                padding: 10,
                borderRadius: 8,
              }}
              onPress={() => router.push("/login")} // Navigate to the login page
            >
              <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
                Go to Login
              </Text>
            </TouchableOpacity>
          </View>
        );
  }

  return currentUser?.isProfessional ? (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Header */}
      <View style={{ backgroundColor: "#E89600", padding: 20, paddingTop: 50, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: Colors[theme].text, fontSize: 20, fontWeight: "normal", marginLeft: 10 }}>
            Hello, Welcome{"\n"}
            <Text style={{ fontWeight: "bold" }}>{currentUser?.firstName} {currentUser?.lastName}</Text>
          </Text>
          <Image
            source={{ uri: currentUser?.profileImage || "https://via.placeholder.com/50" }}
            style={{ marginRight: 10, width: 50, height: 50, borderRadius: 25 }}
          />
        </View>
      </View>
  
      {/* Professional View */}
      <ProfAppointmentComp theme = {theme} />
    </View>
  )
   : (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Header */}
<View
  style={{
    backgroundColor: "#E89600",
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  }}
>
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Text
      style={{
        color: Colors[theme].text,
        fontSize: 20,
        fontWeight: "normal",
        marginLeft: 10,
      }}
    >
      Hello, Welcome{"\n"}
      <Text style={{ fontWeight: "bold" }}>
        {currentUser?.firstName} {currentUser?.lastName}
      </Text>
    </Text>
    <Image
      source={{
        uri: currentUser?.profileImage || "https://via.placeholder.com/50",
      }}
      style={{ marginRight: 10, width: 50, height: 50, borderRadius: 25 }}
    />
  </View>
</View>

{/* Tabs for enthusiasts */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 10,
  }}
>
  <TouchableOpacity
    onPress={() => setActiveTab("book")}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderBottomWidth: 2,
      borderBottomColor:
        activeTab === "book" ? Colors[theme].text : "transparent",
      marginHorizontal: 10,
    }}
  >
    <Text
      style={{
        fontSize: 16,
        fontWeight: activeTab === "book" ? "bold" : "normal",
        color: Colors[theme].text,
      }}
    >
      Book an Appointment
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={() => setActiveTab("my")}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderBottomWidth: 2,
      borderBottomColor:
        activeTab === "my" ? Colors[theme].text : "transparent",
      marginHorizontal: 10,
    }}
  >
    <Text
      style={{
        fontSize: 16,
        fontWeight: activeTab === "my" ? "bold" : "normal",
        color: Colors[theme].text,
      }}
    >
      My Appointments
    </Text>
  </TouchableOpacity>
</View>
      {/* Booking Tab */}
      {(activeTab === "book") && (
        <>



{/* Basic Categories */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 15, paddingHorizontal: 15 }}>
            {categories.map((category) => {
              const isSelected = selectedTags.includes(category.name);
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedTags((prev) => prev.filter((tag) => tag !== category.name));
                    } else {
                      setSelectedTags((prev) => [...prev, category.name]);
                    }
                  }}
                  style={{
                    backgroundColor: Colors[theme].tint,
                    padding: 10,
                    borderRadius: 20,
                    marginRight: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: theme === "light" ? "#000" : "#fff",
                  }}
                >
                  <Ionicons name={category.icon} size={16} color={category.color} />
                  <Text style={{ marginLeft: 5, color: Colors[theme].text }}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Custom Tags */}
          {customTags.length > 0 && (
            <View style={{ marginVertical: 10, paddingHorizontal: 15 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text, marginBottom: 5 }}>
                Custom Tags
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {customTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedTags((prev) => prev.filter((t) => t !== tag));
                        } else {
                          setSelectedTags((prev) => [...prev, tag]);
                        }
                      }}
                      style={{
                        backgroundColor: Colors[theme].tint,
                        padding: 10,
                        borderRadius: 20,
                        marginRight: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: theme === "light" ? "#000" : "#fff",
                      }}
                    >
                      <Text style={{ color: Colors[theme].text }}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Clear Filters Button */}
          {selectedTags.length > 0 && (
            <TouchableOpacity
              onPress={() => setSelectedTags([])}
              style={{
                backgroundColor: "#E89600",
                padding: 10,
                borderRadius: 20,
                marginVertical: 15,
                alignSelf: "center",
              }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Clear Filters</Text>
            </TouchableOpacity>
          )}

{/* Professionals */}
<View style={{ paddingHorizontal: 15 }}>
  <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors[theme].text }}>
    Current Professionals
  </Text>
  <FlatList
    horizontal
    data={users}
    keyExtractor={(item) => item.id}
    showsHorizontalScrollIndicator={false}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={{
          // Use the subtle green tint for a selected professional.
          backgroundColor: selectedProfessional?.id === item.id ? "#C8E6C9" : "#fff",
          padding: 10,
          borderRadius: 10,
          marginRight: 10,
          marginTop: 10,
        }}
        onPress={() => {
          setSelectedProfessional(item);
          const now = new Date();
          // Start with rounding up the current time to the next half-hour.
          let defaultAppointment = new Date(now);
          const minutes = now.getMinutes();
          const remainder = minutes % 30;
          if (remainder !== 0) {
            defaultAppointment.setMinutes(minutes + (30 - remainder));
          }
          defaultAppointment.setSeconds(0, 0);
          
          // Ensure the default appointment is in the future.
          if (defaultAppointment <= now) {
            defaultAppointment = new Date(defaultAppointment.getTime() + 30 * 60 * 1000);
          }
        
          // Now, query the appointments for this professional.
          const q = query(
            collection(db, "appointments"),
            where("professionalId", "==", item.id),
            where("status", "in", ["pending", "accepted"])
          );
          getDocs(q)
            .then(snapshot => {
              const existingSlots = snapshot.docs.map(doc => {
                const data = doc.data();
                const dt = data.scheduledDateTime?.toDate();
                return dt
                  ? {
                      date: dt.toLocaleDateString(),
                      time: dt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      }),
                    }
                  : null;
              }).filter(Boolean);
              
              // Loop: while the defaultAppointment's slot is already booked,
              // add 30 minutes.
              while (
                existingSlots.some(slot => {
                  const apptDateStr = defaultAppointment.toLocaleDateString();
                  const apptTimeStr = defaultAppointment.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return slot.date === apptDateStr && slot.time === apptTimeStr;
                })
              ) {
                defaultAppointment = new Date(defaultAppointment.getTime() + 30 * 60 * 1000);
                // If we reach 12:00 AM (i.e. midnight), then we accept that as a valid slot.
                // (No special rollover adjustment is needed since we want any time.)
              }
              // Set the default appointment time in both date and time pickers.
              setSelectedDate(new Date(defaultAppointment));
              setSelectedTime(new Date(defaultAppointment));
            })
            .catch(err => console.error(err));
        }}
        
        
      >
        <Image
          source={{
            uri: item.profileImage?.trim() ? item.profileImage : "https://via.placeholder.com/100"
          }}
          style={{ width: 100, height: 100, borderRadius: 10 }}
        />
        <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 5, color: "black" }}>
          {item.firstName}
        </Text>
        <Text style={{ fontSize: 14, color: item.isActive ? "green" : "gray" }}>
          {item.isActive ? "Online" : "Offline"}
        </Text>
      </TouchableOpacity>
    )}
  />
</View>




          {/* Date/Time Picker */}
          {selectedProfessional && (
            <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text }}>Select a Date:</Text>
              <TouchableOpacity
                style={{ backgroundColor: "#fff", padding: 10, borderRadius: 10, marginTop: 5 }}
                onPress={() => {
                  setPickerMode("date");
                  setDateTimePickerVisible(true);
                }}
              >
                <Text>{selectedDate.toLocaleDateString()}</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text, marginTop: 10 }}>Select a Time:</Text>
              <TouchableOpacity
                style={{ backgroundColor: "#fff", padding: 10, borderRadius: 10, marginTop: 5 }}
                onPress={() => {
                  setPickerMode("time");
                  setDateTimePickerVisible(true);
                }}
              >
                <Text>
                  {selectedTime
                    ? selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
                    : "Select a time"}
                </Text>
              </TouchableOpacity>

              <DateTimePickerModal
  isVisible={isDateTimePickerVisible}
  mode={pickerMode}
  date={pickerMode === "date" ? selectedDate : selectedTime || new Date()}
  minimumDate={pickerMode === "date" ? new Date() : undefined}
  minuteInterval={30}
  onConfirm={(date) => {
    if (pickerMode === "date") {
      const today = new Date();
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (selected < today) {
        alert("You cannot select a past date.");
        setDateTimePickerVisible(false);
        return;
      }
      setSelectedDate(date);
    } else {
      // Check if the selected date is today and if the chosen time is in the past.
      if (selectedDate.toLocaleDateString() === new Date().toLocaleDateString() && date < new Date()) {
        alert("You cannot select a time in the past.");
        setDateTimePickerVisible(false);
        return;
      }
      setSelectedTime(date);
      setDateTimeSet(true);
    }
    setDateTimePickerVisible(false);
  }}
  onCancel={() => setDateTimePickerVisible(false)}
/>
            </View>
          )}

          {/* Booking Button*/}
          {dateTimeSet && (
            <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
              <Button title="Request Booking" onPress={handleBookingRequest} />
            </View>
          )}
        </>
      )}

      {/* My Appointments Tab */}
{activeTab === "my" && (
  <View style={{ padding: 20 }}>
    <Text style={{ color: Colors[theme].text, fontSize: 16 }}>
      My Appointments View Coming Soon...
    </Text>
  </View>
)}
{/* Don't put a closing fragment here! */}
</ScrollView>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 38, // Added top margin to prevent clipping
    textAlign: "center",
  },
});