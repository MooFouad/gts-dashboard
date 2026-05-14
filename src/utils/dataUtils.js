import { loadSavedData } from './storageUtils';
import { mockVehicles } from '../data/mockVehicles';
import { mockHomeRents } from '../data/mockHomeRents';
import { mockElectricity } from '../data/mockElectricity';

export const getDataCount = (type) => {
  switch (type) {
    case 'vehicles':
      return loadSavedData('vehicle', mockVehicles).length;
    case 'homeRents':
      return loadSavedData('homeRent', mockHomeRents).length;
    case 'electricity':
      return loadSavedData('electricity', mockElectricity).length;
    default:
      return 0;
  }
};