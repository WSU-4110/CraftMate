import { toggleLikeData } from '../utils/postUtils';

describe('toggleLikeData', () => {
  const uid = 'user123';

  it('removes like if user already liked', () => {
    const post = { likes: 5, likedBy: ['user123', 'user456'] };

    const result = toggleLikeData(uid, post);

    expect(result.updatedLikes).toBe(4);
    expect(result.updatedLikedBy).toEqual(['user456']);
  });

  it('adds like if user has not liked yet', () => {
    const post = { likes: 2, likedBy: ['user456'] };

    const result = toggleLikeData(uid, post);

    expect(result.updatedLikes).toBe(3);
    expect(result.updatedLikedBy).toEqual(['user456', 'user123']);
  });
});
