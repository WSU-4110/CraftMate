import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
    },
    postContainer: {
      flexDirection: 'row',
      padding: 15,
      marginVertical: 8,
      borderRadius: 20,
      elevation: 3,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    postContentContainer: {
      flex: 1,
    },
    postTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    postContent: {
      fontSize: 14,
    },
    postTimestamp: {
      fontSize: 12,
      marginTop: 5,
    },
    commentContainer: {
      flexDirection: 'row',
      padding: 10,
      marginVertical: 5,
      backgroundColor: '#f0f0f0',
      borderRadius: 10,
    },
    commentProfileImage: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    commentContentContainer: {
      flex: 1,
    },
    commentUsername: {
      fontWeight: 'bold',
    },
    commentContent: {
      fontSize: 14,
    },
    commentTimestamp: {
      fontSize: 12,
      color: '#666',
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    commentInput: {
      flex: 1,
      padding: 10,
      borderRadius: 5,
      borderWidth: 1,
    },
    commentButton: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      marginLeft: 10,
    },
    commentButtonText: {
      fontWeight: 'bold',
    },
});

export default styles;
