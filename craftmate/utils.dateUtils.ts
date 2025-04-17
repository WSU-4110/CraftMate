// utils/dateUtils.ts

export const formatReplyDate = (timestamp: Date): string => {
    const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(timestamp.getDate()).padStart(2, '0');
    const year = timestamp.getFullYear();
    return `${month}/${day}/${year}`;
  };
  