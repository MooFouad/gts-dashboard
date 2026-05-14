const LOCAL_STORAGE_KEYS = {
  vehicle: 'savedVehicles',
  homeRent: 'savedHomeRents',
  electricity: 'savedElectricity'
};

const loadSavedData = (type, initialData) => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEYS[type]);
    return savedData ? JSON.parse(savedData) : initialData;
  } catch (error) {
    console.error('Error loading saved data:', error);
    return initialData;
  }
};

const updateMockData = (type, data) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS[type], JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error updating mock data:', error);
    return false;
  }
};

export { updateMockData, loadSavedData };