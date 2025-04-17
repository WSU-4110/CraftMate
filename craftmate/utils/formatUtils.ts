// utils/formatUtils.ts

export const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "No date";
  
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString();
    }
  
    try {
      const date = new Date(timestamp);
  
      if (isNaN(date.getTime())) {
        return "No date";
      }
  
      return date.toLocaleDateString();
    } catch (e) {
      return "No date";
    }
  };

  