import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        marginBottom: 10,
    },
    button: {
      padding: 10,
      backgroundColor: "#E89600",
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 100, // Ensures a consistent button width
      maxWidth: 200, // Prevents excessive stretching
      flexShrink: 1, // Prevents expansion due to growing text
  },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
    profileSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    profileName: {
        fontSize: 20,
        fontWeight: "bold",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "80%",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
      width: "80%",
      padding: 20,
      backgroundColor: "#fff",
      borderRadius: 10,
      alignItems: "center",
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
  },
  cancelButton: {
      marginTop: 10,
      backgroundColor: "#E89600",
      padding: 10,
      borderRadius: 5,
  },
  
});

export default styles;