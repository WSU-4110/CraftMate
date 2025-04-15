import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    borderColor: "#ddd",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 36,
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
  radioText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#E89600",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginVertical: 4,
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  addTagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#aaa",
    marginVertical: 4,
  },
  addTagButtonText: {
    color: "#aaa",
  },
  labelText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 15,
  },
});

export default styles;
