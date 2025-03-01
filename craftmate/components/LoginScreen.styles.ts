import { StyleSheet } from "react-native";

export default StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        alignItems: "center",
        padding: 20,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        padding: 10,
        backgroundColor: "#f8f8f8",
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    smallProfileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    username: {
        fontSize: 18,
        fontWeight: "bold",
    },
    profileContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    profileCard: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderWidth: 2,
        borderColor: "#E89600", // Orange border to match the bottom color
    },
    profileImageLarge: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
    input: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
    },
    button: {
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginVertical: 5,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      elevation: 5,
    },
    modalButton: {
      padding: 10,
      borderRadius: 5,
      alignItems: "center",
      marginVertical: 5,
    },
    changePicButton: {
      padding: 10,
      borderRadius: 5,
      alignItems: "center",
      marginVertical: 5,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
    closeButton: {
      fontSize: 16,
      fontWeight: "bold",
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
    }
});
