// utils/postUtils.ts

export const toggleLikeData = (
    currentUserUid: string,
    postData: { likes: number; likedBy: string[] }
  ) => {
    const alreadyLiked = postData.likedBy.includes(currentUserUid);
  
    if (alreadyLiked) {
      return {
        updatedLikes: postData.likes - 1,
        updatedLikedBy: postData.likedBy.filter((uid) => uid !== currentUserUid),
      };
    } else {
      return {
        updatedLikes: postData.likes + 1,
        updatedLikedBy: [...postData.likedBy, currentUserUid],
      };
    }
  };

  