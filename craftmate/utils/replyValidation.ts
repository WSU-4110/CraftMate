// utils/replyValidation.ts

export const validateReplyInput = (
    replyText: string,
    currentUser: { uid?: string } | null
  ): { error?: string } => {
    if (!replyText.trim()) {
      return { error: "Your reply cannot be empty." };
    }
  
    if (!currentUser?.uid) {
      return { error: "User not found. Please log in again." };
    }
  
    return {};
  };

  