export const getExpiryStatus = (dateString) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryDate = new Date(dateString);
      expiryDate.setHours(0, 0, 0, 0);
      
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'expired';
      if (diffDays <= 10) return 'warning';
      return 'valid';
};

export const isExpired = (dateString) => {
      if (!dateString) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryDate = new Date(dateString);
      expiryDate.setHours(0, 0, 0, 0);
      
      return expiryDate < today;
};