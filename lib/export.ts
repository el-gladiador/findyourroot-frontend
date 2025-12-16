// Export functionality is now handled by the backend API
// See ApiClient.exportJSON(), ApiClient.exportCSV(), ApiClient.exportText()

// Share functionality (uses native Web Share API)
export const shareData = async (title: string, text: string, url?: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
};
