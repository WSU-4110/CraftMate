// utils/imageUtils.ts

export const getImageSource = (imageString: string) => {
    if (!imageString) return undefined;
  
    if (imageString.startsWith('data:image')) {
      return { uri: imageString };
    } else if (imageString.match(/^[A-Za-z0-9+/=]+$/)) {
      return { uri: `data:image/jpeg;base64,${imageString}` };
    } else {
      return { uri: imageString };
    }
  };
  