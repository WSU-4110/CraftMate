import { StyleSheet, Dimensions } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 40,
    paddingBottom: 10,
  },
  leftPlaceholder: {
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
  },
  leftIconContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  searchIconContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  listContent: {
    paddingBottom: 20,
    width: '100%',
  },
  postContainer: {
    width: Dimensions.get('window').width - 40,
    marginVertical: 10,
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
    width: 26,
    height: 26,
    borderRadius: 13,
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
  dropdownContainer: {
    overflow: 'hidden', // Ensure content doesn't overflow the dropdown
    width: '100%',
    position: 'absolute',
    top: 72, // Adjust based on your header height
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 5,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 10,
  },
  separator: {
    height: 1, // Thickness of the line
    backgroundColor: '#ddd', // Color of the line
    width: '100%', // Full width of the separator
    alignSelf: 'center',
  },
});

export default styles;