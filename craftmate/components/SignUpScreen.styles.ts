import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f5f5f5", // Light background color
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#E89600", // Match CraftMate's orange
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: "#E89600", // CraftMate's orange
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff", // White text for the button
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#333", // Dark gray
  },
  footerLink: {
    color: "#E89600", // Match CraftMate's orange
    fontWeight: "bold",
  },
  // ** Radio Button Styles **
  radioContainer: {
    marginVertical: 15,
  },
  radioText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  radioButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  radioOption: {
    fontSize: 16,
    fontWeight: "normal",
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E89600",
  },
});

export default styles;
