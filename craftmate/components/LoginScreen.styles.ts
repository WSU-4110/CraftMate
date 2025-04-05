import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    paddingTop: 36,
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
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
    fontSize: 16,
  },
  button: {
    backgroundColor: "#E89600", // CraftMate's orange
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
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
  // New styles from provided code
  mediaPreviewContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  mediaPreviewWrapper: {
    position: "relative",
    marginRight: 10,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#E89600", // Added CraftMate's orange to match existing theme
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingVertical: 10,
    zIndex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  topPadding: {
    paddingTop: 8,
  },
  addTagsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: "flex-start",
    backgroundColor: "#E89600", // Added CraftMate's orange
  },
  addTagsButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginRight: 8,
  },
  tagMenu: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedTagButton: {
    backgroundColor: "#E89600",
  },
  customTagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#E89600", // Added CraftMate's orange
  },
  customTagButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  radioText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: -15,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
  },
  characterWarning: {
    fontSize: 12,
    color: 'red',
    marginLeft: 8,
  },
});

export default styles;