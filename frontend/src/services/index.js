// Central export for all services
import api from './api';
import vehicleService from './vehicleService';
import homeRentService from './homeRentService';
import electricityService from './electricityService';
import absherService from './absherService';
import socialInsuranceService from './socialInsuranceService';
import insuranceService from './insuranceService';
import mvpiService from './mvpiService';
import gosiService from './gosiService';

export {
  api,
  vehicleService,
  homeRentService,
  electricityService,
  absherService,
  socialInsuranceService,
  insuranceService,
  mvpiService,
  gosiService
};

export default {
  api,
  vehicle: vehicleService,
  homeRent: homeRentService,
  electricity: electricityService,
  absher: absherService,
  socialInsurance: socialInsuranceService,
  insurance: insuranceService,
  mvpi: mvpiService,
  gosi: gosiService
};