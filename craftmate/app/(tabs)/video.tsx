import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, FlatList, TouchableOpacity, ScrollView, Button, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { auth, db } from "../../constants/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Colors } from "../../constants/Colors";
import styles from "../../components/VideoScreen.styles";
import DateTimePicker from "@react-native-community/datetimepicker"; // Date picker for iOS

const categories = [
  { id: "1", name: "All", icon: "expand-all", color: "red" },
  { id: "2", name: "Vehicle", icon: "car", color: "orange" },
  { id: "3", name: "Home", icon: "home", color: "yellow" },
  { id: "4", name: "Arts", icon: "design-services", color: "blue" },
];

export default function VideoScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimeSet, setDateTimeSet] = useState(false);
  const theme = useColorScheme() || "light";

  useEffect(() => {
    const fetchActiveProfessionals = async () => {
      try {
        const q = query(collection(db, "users"), where("isProfessional", "==", true));
        const querySnapshot = await getDocs(q);
        const professionalUsers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          status: auth.currentUser?.uid === doc.id ? "Online" : "Offline", // Mark current authenticated user as online
        }));
        setUsers(professionalUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveProfessionals();
  }, []);

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Header */}
      <View style={{ backgroundColor: "#E89600", padding: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Use auth.currentUser?.photoURL for profile image */}
          <Image
            source={{ uri: auth.currentUser?.profileImage || "https://via.placeholder.com/50" }}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
          <Text style={{ color: Colors[theme].text, fontSize: 18, fontWeight: "bold", marginLeft: 10 }}>
            Hello, Welcome 🎉 {"\n"} <Text style={{ fontWeight: "normal" }}>{auth.currentUser?.displayName || "Guest"}</Text>
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, padding: 10, marginTop: 15 }}>
          <Ionicons name="search" size={20} color="gray" />
          <TextInput placeholder="Search user.." style={{ marginLeft: 10, flex: 1 }} />
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 15, paddingHorizontal: 15 }}>
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={{ backgroundColor: Colors[theme].tint, padding: 10, borderRadius: 20, marginRight: 10 }}>
            <Ionicons name={category.icon} size={16} color={category.color} />
            <Text style={{ marginLeft: 5, color: Colors[theme].text }}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Users */}
      <View style={{ paddingHorizontal: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors[theme].text }}>Active Professionals</Text>
        <FlatList
          horizontal
          data={users}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                backgroundColor: selectedProfessional?.id === item.id ? "#ddd" : "#fff",
                padding: 10,
                borderRadius: 10,
                marginRight: 10,
                marginTop: 10,
              }}
              onPress={() => setSelectedProfessional(item)}
            >
              <Image source={{ uri: item.profileImage || "https://via.placeholder.com/100" }} style={{ width: 100, height: 100, borderRadius: 10 }} />
              <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 5, color: "black" }}>{item.firstName}</Text>
              <Text style={{ fontSize: 14, color: item.status === "Online" ? "green" : "gray" }}>{item.status}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Date Picker */}
      {selectedProfessional && (
        <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text }}>Select a Date:</Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 10,
              marginTop: 5,
            }}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{selectedDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
            />
          )}

          <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text, marginTop: 10 }}>Select a Time:</Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              padding: 10,
              borderRadius: 10,
              marginTop: 5,
            }}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>{selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
            />
          )}
        </View>
      )}

      {/* Request Booking Button */}
      {dateTimeSet && (
        <View style={{ paddingHorizontal: 15, marginTop: 20 }}>
          <Button title="Request Booking" onPress={() => alert(`Booking requested with ${selectedProfessional.firstName} on ${selectedDate.toLocaleDateString()} at ${selectedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`)} />
        </View>
      )}
    </ScrollView>
  );
}
