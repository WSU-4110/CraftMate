import { getImageSource } from '../utils/imageUtils';

describe('getImageSource', () => {
  it('returns undefined for empty string', () => {
    expect(getImageSource('')).toBeUndefined();
  });

  it('returns URI directly if already in data:image format', () => {
    const base64WithPrefix = 'data:image/png;base64,abcdef123456';
    expect(getImageSource(base64WithPrefix)).toEqual({ uri: base64WithPrefix });
  });

  it('adds base64 prefix if only base64 string is passed', () => {
    const base64Raw = 'abcdef123456';
    expect(getImageSource(base64Raw)).toEqual({
      uri: `data:image/jpeg;base64,abcdef123456`,
    });
  });

  it('treats valid image URL as a normal uri', () => {
    const imageUrl = 'https://example.com/image.jpg';
    expect(getImageSource(imageUrl)).toEqual({ uri: imageUrl });
  });
});
