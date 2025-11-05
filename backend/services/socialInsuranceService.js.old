const axios = require('axios');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * GOSI Social Insurance Service
 * Handles authentication with DPoP tokens and fetches engagement deduction data
 */
class SocialInsuranceService {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;

    // GOSI API Configuration - Read from environment variables
    // Handle private key - replace literal \n with actual newlines
    let privateKey = process.env.GOSI_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('GOSI_PRIVATE_KEY is not configured in environment variables. Please check your .env file.');
    }

    // If the key is stored with escaped newlines (e.g., "\\n"), replace them with actual newlines
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Validate required environment variables
    if (!process.env.GOSI_BASE_URL) {
      throw new Error('GOSI_BASE_URL is not configured. Please set it in your .env file.');
    }
    if (!process.env.GOSI_API_KEY) {
      throw new Error('GOSI_API_KEY is not configured. Please set it in your .env file.');
    }
    if (!process.env.GOSI_CLIENT_ID) {
      throw new Error('GOSI_CLIENT_ID is not configured. Please set it in your .env file.');
    }
    if (!process.env.GOSI_CLIENT_SECRET) {
      throw new Error('GOSI_CLIENT_SECRET is not configured. Please set it in your .env file.');
    }

    this.config = {
      baseUrl: process.env.GOSI_BASE_URL,
      apiKey: process.env.GOSI_API_KEY,
      registrationNumber: process.env.GOSI_REGISTRATION_NUMBER || '',
      clientId: process.env.GOSI_CLIENT_ID,
      clientSecret: process.env.GOSI_CLIENT_SECRET,
      privateKey: privateKey
    };

    console.log('🔧 GOSI Social Insurance Service initialized');
    console.log(`   Base URL: ${this.config.baseUrl}`);
    console.log(`   Registration Number: ${this.config.registrationNumber || 'NOT SET'}`);
    console.log(`   Client ID: ${this.config.clientId ? '***' + this.config.clientId.slice(-4) : 'NOT SET'}`);
  }

  /**
   * Generate DPoP (Demonstrate Proof-of-Possession) token
   * Required for each API call with unique jti, method, and URL
   * @param {string} method - HTTP method (POST, GET, etc.)
   * @param {string} url - Full URL of the API endpoint
   */
  generateDPoPToken(method, url) {
    try {
      // Generate unique token ID
      const jti = crypto.randomBytes(12).toString('hex');

      // Current timestamp (in seconds)
      const iat = Math.floor(Date.now() / 1000);

      // DPoP payload according to GOSI documentation
      const payload = {
        jti: jti,
        htm: method,
        htu: url,
        iat: iat
      };

      // Sign with RS256 algorithm using the private key
      const dpopToken = jwt.sign(payload, this.config.privateKey, {
        algorithm: 'RS256',
        header: {
          typ: 'dpop+jwt',
          alg: 'RS256'
        }
      });

      console.log(`🔐 Generated DPoP token for ${method} ${url}`);
      console.log(`   JTI: ${jti}`);
      console.log(`   Timestamp: ${iat}`);

      return dpopToken;
    } catch (error) {
      console.error('❌ Error generating DPoP token:', error);
      throw new Error(`Failed to generate DPoP token: ${error.message}`);
    }
  }

  /**
   * Get Access Token from GOSI API
   * POST /v1/establishment/{registration_number}/access-token
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token already
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        console.log('✅ Using cached GOSI access token');
        return this.accessToken;
      }

      console.log('🔄 Generating new GOSI access token...');

      if (!this.config.registrationNumber) {
        throw new Error('GOSI Registration Number is not configured. Please set GOSI_REGISTRATION_NUMBER in environment variables.');
      }

      const url = `${this.config.baseUrl}/v1/establishment/${this.config.registrationNumber}/access-token`;

      // Generate DPoP token for this specific request
      const dpopToken = this.generateDPoPToken('POST', url);

      console.log(`🔗 Token URL: ${url}`);

      const response = await axios.post(url, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }, {
        headers: {
          'x-apikey': this.config.apiKey,
          'dpop': dpopToken,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;

        // Set token expiry (default 1 hour if not specified)
        const expiresIn = response.data.expires_in || 3600;
        this.tokenExpiry = new Date(Date.now() + (expiresIn * 1000) - 60000); // Refresh 1 minute before expiry

        console.log('✅ GOSI access token generated successfully');
        console.log(`⏰ Token expires in ${expiresIn} seconds`);

        return this.accessToken;
      } else {
        throw new Error('Invalid response from GOSI API - no access token received');
      }
    } catch (error) {
      console.error('❌ Error getting GOSI access token:', error.message);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }

      throw new Error(`Failed to authenticate with GOSI API: ${error.message}`);
    }
  }

  /**
   * Get Contributor Data from GOSI API
   * GET /v2/establishment/{registration_number}/contributor/{ninOrIqamaOrBorderNumber}
   * @param {string} nin - National ID, Iqama, or Border Number
   */
  async getContributorData(nin) {
    try {
      console.log('\n' + '='.repeat(80));
      console.log(`🔍 GOSI API CALL - Fetching contributor data`);
      console.log('='.repeat(80));
      console.log(`📋 National ID/Iqama: ${nin}`);

      if (!this.config.registrationNumber) {
        throw new Error('GOSI Registration Number is not configured');
      }

      // Get access token first
      const accessToken = await this.getAccessToken();

      const url = `${this.config.baseUrl}/v2/establishment/${this.config.registrationNumber}/contributor/${nin}`;

      // Generate DPoP token for this specific request
      const dpopToken = this.generateDPoPToken('GET', url);

      console.log(`📤 API URL: ${url}`);
      console.log(`🚀 Sending request to GOSI API...`);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-apikey': this.config.apiKey,
          'dpop': dpopToken,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`✅ Response received from GOSI API`);
      console.log(`📊 Response Status: ${response.status}`);

      if (response.data) {
        console.log('✅ Successfully fetched contributor data');
        console.log('📦 RAW GOSI API RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(response.data, null, 2));
        console.log('='.repeat(80) + '\n');

        // Parse the response
        const parsedData = this.parseContributorData(response.data, nin);
        return parsedData;
      } else {
        throw new Error('Empty response from GOSI API');
      }
    } catch (error) {
      console.error('\n' + '❌'.repeat(40));
      console.error(`❌ ERROR FETCHING CONTRIBUTOR DATA`);
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
   * Parse contributor data from GOSI API response
   */
  parseContributorData(gosiData, nin) {
    try {
      // Extract relevant fields from GOSI response
      // Note: Actual structure may vary, adjust based on real API response
      return {
        nin: nin,
        name: gosiData.name || gosiData.contributorName || null,
        employerDeductionRate: gosiData.employerDeductionRate || gosiData.employerRate || null,
        employeeDeductionRate: gosiData.employeeDeductionRate || gosiData.employeeRate || null,
        products: gosiData.products || gosiData.subscriptionProducts || [],
        establishmentName: gosiData.establishmentName || null,
        engagementDate: gosiData.engagementDate ? new Date(gosiData.engagementDate) : null,
        salary: gosiData.salary || gosiData.wage || null,
        status: gosiData.status || 'active',
        rawData: gosiData,
        lastSyncDate: new Date(),
        dataSource: 'gosi'
      };
    } catch (error) {
      console.error('Error parsing GOSI contributor data:', error);
      throw new Error('Failed to parse contributor data from GOSI response');
    }
  }

  /**
   * Test connection to GOSI API
   */
  async testConnection() {
    try {
      console.log('🧪 Testing GOSI API connection...');
      const token = await this.getAccessToken();

      if (token) {
        console.log('✅ GOSI API connection test successful');
        return {
          success: true,
          message: 'Connection successful',
          token: token.substring(0, 20) + '...'
        };
      } else {
        throw new Error('Failed to obtain access token');
      }
    } catch (error) {
      console.error('❌ GOSI API connection test failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Clear cached token
   */
  clearCache() {
    this.accessToken = null;
    this.tokenExpiry = null;
    console.log('🗑️ GOSI token cache cleared');
  }
}

module.exports = new SocialInsuranceService();
