import { StyleSheet, Dimensions } from 'react-native';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
    },
    logo: {
      width: 200,
      height: 100,
      paddingTop: 50,
      marginBottom: 20,
    },
    searchInput: {
      width: '100%',
      padding: 10,
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 15,
    },
    listContent: {
      paddingBottom: 20,
      width: '100%',
    },
    postContainer: {
      width: Dimensions.get('window').width - 40,
      padding: 15,
      marginVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 3,
      alignSelf: 'center',
    },
    postHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    postHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    profileImage: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    postUsername: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    postContent: {
      fontSize: 16,
      marginBottom: 10,
    },
    postFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#eee',
      paddingTop: 8,
    },
    postTimestamp: {
      fontSize: 12,
      color: '#888',
    },
    postActions: {
      flexDirection: 'row',
    },
    actionButton: {
      marginLeft: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      width: '100%',
    },
    input: {
      flex: 1,
      padding: 10,
      borderRadius: 5,
    },
    postButton: {
      backgroundColor: '#E89600',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
    postButtonText: {
      fontWeight: 'bold',
    },
    ovalContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginLeft: 10,
    },
    ovalText: {
      marginLeft: 5,
      fontSize: 14,
      fontWeight: 'bold',
    },
    postImage: {
      width: '100%',
      height: 200,
      borderRadius: 10,
      marginTop: 10,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    imageButton: {
      marginLeft: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedImagesContainer: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    imagePreviewContainer: {
      marginRight: 10,
      alignItems: 'center',
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 10,
    },
    removeImageButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      padding: 2,
    },
  });

export default styles;