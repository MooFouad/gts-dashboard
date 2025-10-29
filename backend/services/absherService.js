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
   * Generate Access Token from TAMM API with retry logic
   * POST /auth/realms/Tamm-QA/protocol/openid-connect/token
   */
  async generateAccessToken(retryCount = 0) {
    try {
      const config = await this.getConfig();

      // Check if we have a valid token already
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        console.log('✅ Using cached access token');
        return this.accessToken;
      }

      console.log('🔄 Generating new TAMM access token...');
      console.log('🔗 Auth URL:', config.authUrl);
      if (retryCount > 0) {
        console.log(`🔄 Retry attempt ${retryCount}/3`);
      }

      const params = new URLSearchParams();
      params.append('client_id', config.clientId);
      params.append('client_secret', config.clientSecret);
      params.append('grant_type', 'client_credentials');

      const response = await axios.post(config.authUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 90000 // Increased timeout to 90 seconds for slow networks
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

      // Retry logic for timeout errors
      if ((error.code === 'ECONNABORTED' || error.message.includes('timeout')) && retryCount < 3) {
        const waitTime = (retryCount + 1) * 5; // 5s, 10s, 15s waits
        console.log(`⏳ Timeout occurred, waiting ${waitTime} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        return this.generateAccessToken(retryCount + 1);
      }

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
        timeout: 60000 // Increased timeout to 60 seconds for slow networks
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
        timeout: 60000 // Increased timeout to 60 seconds for slow networks
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
   * STEP 1: Verify Vehicle for Istemarah Renewal
   * POST /api/v1/istemarah/renewal/verify
   * Returns conversationId needed for step 2
   * @param {Object} plateNumber - Vehicle plate number (can be string or object)
   */
  async verifyIstemarahRenewal(plateNumber) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔄 ABSHER API CALL - Step 1: Verify Vehicle for Istemarah Renewal`);
      console.log('='.repeat(80));
      console.log(`📋 Input Plate Number: ${JSON.stringify(plateNumber)}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for Istemarah renewal verification
      const apiUrl = `${config.apiUrl}/api/v1/istemarah/renewal/verify`;

      // Prepare plate object based on the documentation
      let plateDto;
      if (typeof plateNumber === 'string') {
        const parts = plateNumber.trim().split(/\s+/);
        if (parts.length >= 4) {
          plateDto = {
            text1: parts[0],
            text2: parts[1],
            text3: parts[2],
            number: parseInt(parts[3]) || parts[3],
            type: {
              code: 1
            }
          };
        } else {
          throw new Error('Invalid plate number format. Expected format: "text1 text2 text3 number"');
        }
      } else {
        plateDto = plateNumber;
      }

      const requestBody = {
        plateDto: plateDto
      };

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
      console.log(`🚀 Sending verification request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
      }

      const response = await axios.post(apiUrl, requestBody, {
        headers: headers,
        timeout: 60000 // Increased timeout to 60 seconds for slow networks
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.data) {
        console.log(`✅ Successfully verified vehicle for renewal`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80) + '\n');

        // Extract conversationId for next step
        const conversationId = response.data.id || response.data.conversationId;
        if (!conversationId) {
          throw new Error('No conversationId returned from verification API');
        }

        return {
          conversationId: conversationId,
          vehicleInfo: response.data.vehicleDtoView,
          ownerIdNumber: response.data.ownerIdNumber,
          ownerName: response.data.ownerName,
          price: response.data.price,
          rawResponse: response.data
        };
      } else {
        throw new Error('Empty response from TAMM API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR VERIFYING VEHICLE FOR RENEWAL`);
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
   * STEP 2: Submit Istemarah Renewal
   * POST /api/v1/istemarah/renewal/
   * Requires conversationId from step 1
   * @param {string} conversationId - Conversation ID from verify step
   * @param {string} ownerMobileNumber - Owner's mobile number
   * @param {string} integratorUserId - Integrator user ID (optional)
   */
  async submitIstemarahRenewal(conversationId, ownerMobileNumber, integratorUserId = null) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔄 ABSHER API CALL - Step 2: Submit Istemarah Renewal`);
      console.log('='.repeat(80));
      console.log(`📋 Conversation ID: ${conversationId}`);
      console.log(`📋 Mobile Number: ${ownerMobileNumber}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for Istemarah renewal submission
      const apiUrl = `${config.apiUrl}/api/v1/istemarah/renewal/`;

      const requestBody = {
        ownerMobileNumber: ownerMobileNumber
      };

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
      console.log(`🚀 Sending renewal submission to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Conversation-Id': conversationId
      };

      // Add integrator user ID if provided
      if (integratorUserId) {
        headers['X-Integrator-User-Id'] = integratorUserId;
        console.log(`🔑 Using Integrator User ID: ${integratorUserId}`);
      }

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
      }

      const response = await axios.post(apiUrl, requestBody, {
        headers: headers,
        timeout: 60000 // Increased timeout to 60 seconds for slow networks
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.status === 200) {
        console.log(`✅ Successfully submitted Istemarah renewal`);
        console.log('📦 RAW ABSHER API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80) + '\n');

        return {
          success: true,
          status: response.status,
          conversationId: conversationId,
          rawResponse: response.data
        };
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR SUBMITTING ISTEMARAH RENEWAL`);
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
   * STEP 3: Search Renewed Istemarah Records
   * POST /api/v1/istemarah/renewal/client-search?page=0&size=10
   * @param {string} plateInfo - Plate info string (e.g., "ببأ_7562_1")
   * @param {string} integratorUserId - Integrator user ID
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 10)
   */
  async searchRenewedIstemarah(plateInfo, integratorUserId, page = 0, size = 10) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 ABSHER API CALL - Step 3: Search Renewed Istemarah`);
      console.log('='.repeat(80));
      console.log(`📋 Plate Info: ${plateInfo}`);
      console.log(`📋 Page: ${page}, Size: ${size}`);

      const config = await this.getConfig();
      const accessToken = await this.generateAccessToken();

      // TAMM API endpoint for Istemarah renewal search
      const apiUrl = `${config.apiUrl}/api/v1/istemarah/renewal/client-search?page=${page}&size=${size}`;

      const requestBody = {
        "$and": [
          { "plateInfo": plateInfo }
        ]
      };

      console.log(`📤 API URL: ${apiUrl}`);
      console.log(`📦 Request Body:`, JSON.stringify(requestBody, null, 2));
      console.log(`🚀 Sending search request to Absher API...`);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Integrator-User-Id': integratorUserId
      };

      // Add subscription key if available
      if (config.subscriptionKey) {
        headers['Ocp-Apim-Subscription-Key'] = config.subscriptionKey;
      }

      const response = await axios.post(apiUrl, requestBody, {
        headers: headers,
        timeout: 60000 // Increased timeout to 60 seconds for slow networks
      });

      console.log(`✅ Response received from Absher API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.data) {
        console.log(`✅ Successfully fetched renewed Istemarah records`);
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
      console.error(`❌ ERROR SEARCHING RENEWED ISTEMARAH`);
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
   * Complete Istemarah Renewal Workflow (All 3 Steps)
   * @param {Object} plateNumber - Vehicle plate number
   * @param {string} ownerMobileNumber - Owner's mobile number
   * @param {string} integratorUserId - Integrator user ID (optional)
   */
  async completeIstemarahRenewal(plateNumber, ownerMobileNumber, integratorUserId = null) {
    try {
      console.log('\n' + '🔄'.repeat(40));
      console.log(`🔄 COMPLETE ISTEMARAH RENEWAL WORKFLOW`);
      console.log('🔄'.repeat(40));

      // Step 1: Verify vehicle
      console.log(`\n📍 STEP 1/3: Verifying vehicle...`);
      const verifyResult = await this.verifyIstemarahRenewal(plateNumber);
      console.log(`✅ Step 1 complete. Conversation ID: ${verifyResult.conversationId}`);

      // Step 2: Submit renewal
      console.log(`\n📍 STEP 2/3: Submitting renewal...`);
      const submitResult = await this.submitIstemarahRenewal(
        verifyResult.conversationId,
        ownerMobileNumber,
        integratorUserId
      );
      console.log(`✅ Step 2 complete. Status: ${submitResult.status}`);

      // Step 3: Search for renewed record (optional, for confirmation)
      console.log(`\n📍 STEP 3/3: Searching renewed record...`);
      const plateInfo = typeof plateNumber === 'string'
        ? plateNumber.replace(/\s+/g, '_')
        : `${plateNumber.text1}_${plateNumber.number}_${plateNumber.text2}`;

      let searchResult = null;
      if (integratorUserId) {
        try {
          searchResult = await this.searchRenewedIstemarah(plateInfo, integratorUserId);
          console.log(`✅ Step 3 complete. Found ${searchResult.totalElements || 0} records`);
        } catch (error) {
          console.log(`⚠️ Step 3 search failed (non-critical): ${error.message}`);
        }
      }

      console.log('\n' + '✅'.repeat(40));
      console.log(`✅ ISTEMARAH RENEWAL COMPLETED SUCCESSFULLY`);
      console.log('✅'.repeat(40) + '\n');

      return {
        success: true,
        verifyResult: verifyResult,
        submitResult: submitResult,
        searchResult: searchResult
      };
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ COMPLETE ISTEMARAH RENEWAL FAILED`);
      console.error('❌'.repeat(40));
      console.error(`Error: ${error.message}`);
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
