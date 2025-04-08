import { StyleSheet, Dimensions } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Changed to center the content
    marginBottom: 10,
    marginTop: 30,
    position: "relative",
    width: "100%",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingVertical: 10,
    zIndex: 1,
  },
  headerContent: {
    alignItems: "center", // Center the content
    justifyContent: "center", // Center the content
    flex: 1, // Take up available space
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  postTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    marginTop: 1,
    marginBottom: 10,
    // Removed paddingHorizontal
  },
  postContainer: {
    width: Dimensions.get("window").width - 40,
    marginVertical: 10,
    elevation: 3,
    alignSelf: "center",
    backgroundColor: "#fff",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "center", // Center the profile image
  },
  profileContainer: {
    marginTop: 2,
    flexDirection: "row", // Arrange items horizontally
    alignItems: "center", // Align items vertically in the center
    justifyContent: "center", // Center the container horizontally
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10, // Space between profile picture and username
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    position: "absolute", // Position absolutely
    right: 0, // Align to the right
  },
  postBody: {
    fontSize: 16,
    marginBottom: 8,
  },
  imageContainer: {
    marginBottom: 16,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  imageSliderContainer: {
    marginVertical: 4,
    height: 350, // Adjust height as needed
  },
  sliderImage: {
    width: Dimensions.get("window").width - 40, // Full width for single image
    height: "100%",
    borderRadius: 10, // Default rounded corners
  },
  sliderImageActive: {
    borderRadius: 10, // Rounded corners for the active image
  },
  sliderImageInactive: {
    borderRadius: 10, // Rounded corners for adjacent images
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#E89600",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  postFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  postActions: {
    flexDirection: "row",
  },
  actionButton: {
  },
  ovalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  ovalText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "bold",
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
});

export default styles;