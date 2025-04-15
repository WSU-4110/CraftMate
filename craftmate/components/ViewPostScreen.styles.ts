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
    justifyContent: "center",
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
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
    marginVertical: 10,
    marginTop: 1,
    marginBottom: 10,
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
    alignSelf: "center",
  },
  profileContainer: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    position: "absolute",
    right: 0,
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
    height: 200,
  },
  sliderImage: {
    width: Dimensions.get("window").width - 40,
    height: "100%",
    borderRadius: 10,
  },
  sliderImageActive: {
    borderRadius: 10,
  },
  sliderImageInactive: {
    borderRadius: 0,
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
  actionButton: {},
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
  // New Styles
  commentContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  commentText: {
    color: 'gray',
  },
  commentTimestamp: {
    fontSize: 12,
    color: 'lightgray',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  likeText: {
    marginLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInput: {
    width: '80%',
    height: 40,
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
  }
});

export default styles;
