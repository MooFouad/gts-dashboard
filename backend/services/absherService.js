const axios = require('axios');
const AbsherConfig = require('../models/AbsherConfig');

/**
 * TAMM API Service (Absher Business)
 * Handles authentication and vehicle insurance inquiries
 * Configuration is read from database first, then falls back to environment variables
 */
class TammService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.config = null;
    this.configLoaded = false;

    // Initialize config asynchronously
    this.initializeConfig();
  }

  /**
   * Initialize configuration from database or environment variables
   */
  async initializeConfig() {
    try {
      // Try to load from database first
      const dbConfig = await AbsherConfig.findOne({ status: 'active' });

      if (dbConfig) {
        // Build auth URL from database config
        const authUrl = `${dbConfig.authorizationServer}/auth/realms/${dbConfig.realmName}/protocol/openid-connect/token`;

        this.config = {
          authUrl: authUrl,
          apiUrl: process.env.TAMM_API_URL || 'https://tamm-qa-api.apps.devocp4.elm.sa',
          clientId: dbConfig.clientId,
          clientSecret: dbConfig.clientSecret,
          subscriptionKey: process.env.TAMM_SUBSCRIPTION_KEY || '',
          authServer: dbConfig.authorizationServer,
          realmName: dbConfig.realmName
        };

        console.log('🔧 Absher Service initialized with DATABASE configuration');
        console.log(`   Auth URL: ${this.config.authUrl}`);
        console.log(`   API URL: ${this.config.apiUrl}`);
        console.log(`   Client ID: ***${this.config.clientId.slice(-4)}`);
        console.log(`   Realm: ${this.config.realmName}`);
      } else {
        // Fallback to environment variables
        this.config = {
          authUrl: process.env.TAMM_AUTH_URL,
          apiUrl: process.env.TAMM_API_URL,
          clientId: process.env.TAMM_CLIENT_ID,
          clientSecret: process.env.TAMM_CLIENT_SECRET,
          subscriptionKey: process.env.TAMM_SUBSCRIPTION_KEY
        };

        console.log('🔧 Absher Service initialized with ENVIRONMENT VARIABLES (fallback)');
        console.log(`   Auth URL: ${this.config.authUrl || 'NOT SET'}`);
        console.log(`   API URL: ${this.config.apiUrl || 'NOT SET'}`);
        console.log(`   Client ID: ${this.config.clientId ? '***' + this.config.clientId.slice(-4) : 'NOT SET'}`);
      }

      this.configLoaded = true;
    } catch (error) {
      console.error('❌ Error loading config from database, using environment variables:', error.message);

      // Fallback to environment variables on error
      this.config = {
        authUrl: process.env.TAMM_AUTH_URL,
        apiUrl: process.env.TAMM_API_URL,
        clientId: process.env.TAMM_CLIENT_ID,
        clientSecret: process.env.TAMM_CLIENT_SECRET,
        subscriptionKey: process.env.TAMM_SUBSCRIPTION_KEY
      };

      this.configLoaded = true;
    }
  }

  /**
   * Reload configuration from database
   */
  async reloadConfig() {
    this.configLoaded = false;
    await this.initializeConfig();
    // Clear token cache when config changes
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get TAMM configuration (wait for config to load if needed)
   */
  async getConfig() {
    // Wait for config to be loaded
    let attempts = 0;
    while (!this.configLoaded && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.config) {
      throw new Error('TAMM configuration not loaded. Please check database or environment variables.');
    }

    if (!this.config.authUrl || !this.config.apiUrl || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('TAMM configuration is incomplete. Please check database configuration or environment variables (TAMM_AUTH_URL, TAMM_API_URL, TAMM_CLIENT_ID, TAMM_CLIENT_SECRET)');
    }

    return this.config;
  }

  /**
   * Generate Access Token from TAMM API
   * POST /auth/realms/Tamm-QA/protocol/openid-connect/token
   */
  async generateAccessToken() {
    try {
      const config = await this.getConfig();

      // Check if we have a valid token already
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        console.log('✅ Using cached access token');
        return this.accessToken;
      }

      console.log('🔄 Generating new TAMM access token...');
      console.log('🔗 Auth URL:', config.authUrl);

      const params = new URLSearchParams();
      params.append('client_id', config.clientId);
      params.append('client_secret', config.clientSecret);
      params.append('grant_type', 'client_credentials');

      const response = await axios.post(config.authUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;

        // Set token expiry (usually expires_in is in seconds)
        const expiresIn = response.data.expires_in || 3600; // Default 1 hour
        this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000) - 60000); // Refresh 1 minute before expiry

        console.log('✅ Access token generated successfully');
        console.log(`⏰ Token expires in ${expiresIn} seconds`);

        return this.accessToken;
      } else {
        throw new Error('Invalid response from TAMM auth server');
      }
    } catch (error) {
      console.error('❌ Error generating access token:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw new Error(`Failed to authenticate with TAMM API: ${error.message}`);
    }
  }

  /**
   * Get Vehicle Insurance Details from TAMM API
   * POST /api/v1/inquiry/vehicle-insurance
   * @param {string} plateNumber - Vehicle plate number (or sequenceNumber if searchType=1)
   * @param {string} sequenceNumber - Vehicle sequence number (optional, used when searchType=1)
   */
  async getVehicleInsuranceDetails(plateNumber, sequenceNumber = null) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 ABSHER API CALL - Fetching insurance details`);
      console.log('='.repeat(80));
      console.log(`📋 Input Plate Number: ${plateNumber}`);
      console.log(`📋 Input Sequence Number: ${sequenceNumber}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for vehicle insurance
      const apiUrl = `${config.apiUrl}/api/v1/inquiry/vehicle-insurance`;

      // Determine search type based on what's provided
      // searchType: 0 = by plate, 1 = by sequence number
      const searchType = sequenceNumber ? 1 : 0;

      // Prepare request payload based on the PDF documentation
      let plateData;

      if (searchType === 1) {
        // Search by sequence number
        plateData = {
          searchType: 1,
          sequenceNumber: sequenceNumber,
          plate: {
            text1: "",
            text2: "",
            text3: "",
            number: "",
            type: {}
          }
        };
      } else {
        // Search by plate number
        // Parse plate number string (e.g., "أ م ح 9459") into structured format
        if (typeof plateNumber === 'string') {
          const parts = plateNumber.trim().split(/\s+/);
          if (parts.length >= 4) {
            plateData = {
              searchType: 0,
              plate: {
                text1: parts[0],
                text2: parts[1],
                text3: parts[2],
                number: parseInt(parts[3]) || parts[3],
                type: {
                  code: 1,
                  nameAr: "خاص",
                  nameEn: "Private Car"
                }
              }
            };
          } else {
            throw new Error('Invalid plate number format. Expected format: "text1 text2 text3 number"');
          }
        } else {
          plateData = {
            searchType: 0,
            plate: plateNumber
          };
        }
      }

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(plateData, null, 2));

      console.log(`🚀 Sending request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
        console.log(`🔑 Using Subscription Key: ${config.subscriptionKey.substring(0, 8)}...`);
      }

      const response = await axios.post(apiUrl, plateData, {
        headers: headers,
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);
      console.log(`📦 Response Headers:`, JSON.stringify(response.headers, null, 2));

      if (response.data) {
        console.log(`✅ Successfully fetched insurance details`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80));

        const parsedData = this.parseInsuranceData(response.data, plateNumber);
        console.log('📋 PARSED VEHICLE DATA:');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('='.repeat(80) + '\n');

        return parsedData;
      } else {
        throw new Error('Empty response from TAMM API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR FETCHING VEHICLE INSURANCE`);
      console.error('❌'.repeat(40));
      console.error(`Error Message: ${error.message}`);

      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Headers:`, JSON.stringify(error.response.headers, null, 2));
        console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error(`Request was made but no response received`);
        console.error(`Request details:`, error.request);
      } else {
        console.error(`Error details:`, error);
      }
      console.error('❌'.repeat(40) + '\n');
      throw error;
    }
  }

  /**
   * Get MVPI (Vehicle Inspection) Details from TAMM API
   * POST /api/v1/inquiry/mvpi/latest-inspection
   * @param {string} plateNumber - Vehicle plate number (or sequenceNumber if searchType=1)
   * @param {string} sequenceNumber - Vehicle sequence number (optional, used when searchType=1)
   */
  async getMVPIDetails(plateNumber, sequenceNumber = null) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 ABSHER API CALL - Fetching MVPI details`);
      console.log('='.repeat(80));
      console.log(`📋 Input Plate Number: ${plateNumber}`);
      console.log(`📋 Input Sequence Number: ${sequenceNumber}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for MVPI
      const apiUrl = `${config.apiUrl}/api/v1/inquiry/mvpi/latest-inspection`;

      // Determine search type based on what's provided
      // searchType: 0 = by plate, 1 = by sequence number
      const searchType = sequenceNumber ? 1 : 0;

      // Prepare request payload based on the PDF documentation
      let plateData;

      if (searchType === 1) {
        // Search by sequence number
        plateData = {
          searchType: 1,
          sequenceNumber: sequenceNumber,
          plate: {
            text1: "",
            text2: "",
            text3: "",
            number: "",
            type: {}
          }
        };
      } else {
        // Search by plate number
        // Parse plate number string (e.g., "أ م ح 9459") into structured format
        if (typeof plateNumber === 'string') {
          const parts = plateNumber.trim().split(/\s+/);
          if (parts.length >= 4) {
            plateData = {
              searchType: 0,
              plate: {
                text1: parts[0],
                text2: parts[1],
                text3: parts[2],
                number: parseInt(parts[3]) || parts[3],
                type: {
                  code: 1,
                  nameAr: "خاص",
                  nameEn: "Private Car"
                }
              }
            };
          } else {
            throw new Error('Invalid plate number format. Expected format: "text1 text2 text3 number"');
          }
        } else {
          plateData = {
            searchType: 0,
            plate: plateNumber
          };
        }
      }

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(plateData, null, 2));
      console.log(`🚀 Sending request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
        console.log(`🔑 Using Subscription Key: ${config.subscriptionKey.substring(0, 8)}...`);
      }

      const response = await axios.post(apiUrl, plateData, {
        headers: headers,
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.data) {
        console.log(`✅ Successfully fetched MVPI details`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80) + '\n');
        return response.data;
      } else {
        throw new Error('Empty response from TAMM API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR FETCHING MVPI DETAILS`);
      console.error('❌'.repeat(40));
      console.error(`Error Message: ${error.message}`);

      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      console.error('❌'.repeat(40) + '\n');
      throw error;
    }
  }

  /**
   * Request Istemarah (Vehicle Registration) Renewal
   * POST /api/v1/request/istemarah-renewal
   * @param {Object} plateNumber - Vehicle plate number (can be string or object)
   * @param {string} sequenceNumber - Vehicle sequence number
   * @param {Object} additionalData - Additional data for renewal request (optional)
   */
  async requestIstemarahRenewal(plateNumber, sequenceNumber, additionalData = {}) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔄 ABSHER API CALL - Requesting Istemarah Renewal`);
      console.log('='.repeat(80));
      console.log(`📋 Input Plate Number: ${JSON.stringify(plateNumber)}`);
      console.log(`📋 Input Sequence Number: ${sequenceNumber}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for Istemarah renewal
      const apiUrl = `${config.apiUrl}/api/v1/request/istemarah-renewal`;

      // Prepare plate object based on the documentation
      let plateData;
      if (typeof plateNumber === 'string') {
        const parts = plateNumber.trim().split(/\s+/);
        if (parts.length >= 4) {
          plateData = {
            plate: {
              text1: parts[0],
              text2: parts[1],
              text3: parts[2],
              number: parseInt(parts[3]) || parts[3]
            },
            sequenceNumber: sequenceNumber,
            ...additionalData
          };
        } else {
          plateData = {
            plate: plateNumber,
            sequenceNumber: sequenceNumber,
            ...additionalData
          };
        }
      } else {
        plateData = {
          plate: plateNumber,
          sequenceNumber: sequenceNumber,
          ...additionalData
        };
      }

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(plateData, null, 2));
      console.log(`🚀 Sending Istemarah renewal request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
        console.log(`🔑 Using Subscription Key: ${config.subscriptionKey.substring(0, 8)}...`);
      }

      const response = await axios.post(apiUrl, plateData, {
        headers: headers,
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);
      console.log(`📦 Response Headers:`, JSON.stringify(response.headers, null, 2));

      if (response.data) {
        console.log(`✅ Successfully submitted Istemarah renewal request`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80));

        const parsedData = this.parseIstemarahRenewalResponse(response.data, plateNumber, sequenceNumber);
        console.log('📋 PARSED RENEWAL DATA:');
        console.log(JSON.stringify(parsedData, null, 2));
        console.log('='.repeat(80) + '\n');

        return parsedData;
      } else {
        throw new Error('Empty response from TAMM API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR REQUESTING ISTEMARAH RENEWAL`);
      console.error('❌'.repeat(40));
      console.error(`Error Message: ${error.message}`);

      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Headers:`, JSON.stringify(error.response.headers, null, 2));
        console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error(`Request was made but no response received`);
        console.error(`Request details:`, error.request);
      } else {
        console.error(`Error details:`, error);
      }
      console.error('❌'.repeat(40) + '\n');
      throw error;
    }
  }

  /**
   * Get Istemarah (Vehicle Registration) Renewal Details
   * POST /api/v1/inquiry/istemarah-renewal-details
   * @param {Object} plateNumber - Vehicle plate number (can be string or object)
   * @param {string} sequenceNumber - Vehicle sequence number
   */
  async getIstemarahRenewalDetails(plateNumber, sequenceNumber) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 ABSHER API CALL - Fetching Istemarah Renewal Details`);
      console.log('='.repeat(80));
      console.log(`📋 Input Plate Number: ${JSON.stringify(plateNumber)}`);
      console.log(`📋 Input Sequence Number: ${sequenceNumber}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for Istemarah renewal details
      const apiUrl = `${config.apiUrl}/api/v1/inquiry/istemarah-renewal-details`;

      // Prepare plate object
      let plateData;
      if (typeof plateNumber === 'string') {
        const parts = plateNumber.trim().split(/\s+/);
        if (parts.length >= 4) {
          plateData = {
            plate: {
              text1: parts[0],
              text2: parts[1],
              text3: parts[2],
              number: parseInt(parts[3]) || parts[3]
            },
            sequenceNumber: sequenceNumber
          };
        } else {
          plateData = {
            plate: plateNumber,
            sequenceNumber: sequenceNumber
          };
        }
      } else {
        plateData = {
          plate: plateNumber,
          sequenceNumber: sequenceNumber
        };
      }

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(plateData, null, 2));
      console.log(`🚀 Sending request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
      }

      const response = await axios.post(apiUrl, plateData, {
        headers: headers,
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.data) {
        console.log(`✅ Successfully fetched Istemarah renewal details`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80) + '\n');

        return response.data;
      } else {
        throw new Error('Empty response from TAMM API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR FETCHING ISTEMARAH RENEWAL DETAILS`);
      console.error('❌'.repeat(40));
      console.error(`Error Message: ${error.message}`);

      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Data:`, JSON.stringify(error.response.data, null, 2));
      }
      console.error('❌'.repeat(40) + '\n');
      throw error;
    }
  }

  /**
   * Parse Istemarah renewal response
   */
  parseIstemarahRenewalResponse(tammData, plateNumber, sequenceNumber) {
    try {
      return {
        plateNumber: typeof plateNumber === 'string' ? plateNumber :
          `${plateNumber.text1} ${plateNumber.text2} ${plateNumber.text3} ${plateNumber.number}`,
        sequenceNumber: sequenceNumber,
        renewalRequestId: tammData.requestId || tammData.id || null,
        renewalStatus: tammData.status || 'pending',
        renewalFees: tammData.fees || tammData.totalAmount || null,
        renewalExpiryDate: this.parseDate(tammData.expiryDate || tammData.renewalDate),
        renewalResponse: tammData,
        lastRenewalRequestDate: new Date(),
        dataSource: 'absher'
      };
    } catch (error) {
      console.error('Error parsing Istemarah renewal response:', error);
      throw new Error('Failed to parse renewal response from TAMM API');
    }
  }

  /**
   * Parse and map TAMM API insurance response to our Vehicle model format
   */
  parseInsuranceData(tammData, originalPlate) {
    try {
      // Based on the documentation, the response has a 'list' array
      const insuranceList = tammData.list || [];
      const firstInsurance = insuranceList[0] || {};

      return {
        // Keep original plate number (it's a string like "أ م ح 9459")
        plateNumber: typeof originalPlate === 'string'
          ? originalPlate
          : (originalPlate.text1 && originalPlate.text2 && originalPlate.text3 && originalPlate.number
              ? `${originalPlate.text1} ${originalPlate.text2} ${originalPlate.text3} ${originalPlate.number}`
              : originalPlate),

        // Insurance details from TAMM API
        insuranceCompany: firstInsurance.insuranceCompanyName || null,
        insurancePolicyNumber: firstInsurance.mainPolicyNumber || null,
        insuranceExpiryDate: this.parseDate(firstInsurance.policyEndDate),
        insuranceStatus: firstInsurance.policyStatus || null,

        // Metadata
        lastSyncDate: new Date(),
        dataSource: 'absher'
      };
    } catch (error) {
      console.error('Error parsing TAMM insurance data:', error);
      throw new Error('Failed to parse vehicle data from TAMM response');
    }
  }

  /**
   * Parse date from various formats
   */
  parseDate(dateString) {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error('Error parsing date:', dateString);
      return null;
    }
  }

  /**
   * Test connection to TAMM API
   */
  async testConnection() {
    try {
      console.log('🧪 Testing TAMM API connection...');
      const token = await this.generateAccessToken();

      if (token) {
        console.log('✅ TAMM API connection test successful');
        return { success: true, message: 'Connection successful', token: token.substring(0, 20) + '...' };
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      console.error('❌ TAMM API connection test failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Clear cached token (useful when credentials are updated)
   */
  clearCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('🗑️ Token cache cleared');
  }
}

module.exports = new TammService();
