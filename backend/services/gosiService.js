const axios = require('axios');
const crypto = require('crypto');

/**
 * GOSI API Service
 * Handles integration with GOSI (General Organization for Social Insurance) API
 * for fetching employee engagement deduction data
 *
 * Authentication: Uses DPoP (Demonstrative Proof-of-Possession) tokens
 * Documentation: data/GOSI.pdf
 */

class GOSIService {
  constructor() {
    this.baseURL = process.env.GOSI_BASE_URL || 'https://sandbox-api.gosi.gov.sa';
    this.apiKey = process.env.GOSI_API_KEY || 'L6LK4GEAAIVrQbVo4AOVrQk781kvIT3X';
    this.registrationNumber = process.env.GOSI_REGISTRATION_NUMBER;
    this.clientId = process.env.GOSI_CLIENT_ID;
    this.clientSecret = process.env.GOSI_CLIENT_SECRET;
    this.privateKey = process.env.GOSI_PRIVATE_KEY;

    // Cache for access token (valid for certain duration)
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Generate DPoP Token using RSA private key
   * DPoP token must be unique for each request and generated within 10 seconds
   *
   * @param {string} method - HTTP method (POST, GET, etc.)
   * @param {string} url - Full URL of the API endpoint
   * @returns {string} - DPoP JWT token
   */
  generateDPoPToken(method, url) {
    try {
      // Generate unique ID for this token
      const jti = crypto.randomBytes(12).toString('base64url');

      // Current timestamp (in seconds)
      const iat = Math.floor(Date.now() / 1000);

      // DPoP Header
      const header = {
        typ: 'dpop+jwt',
        alg: 'RS256'
      };

      // DPoP Payload (as per GOSI documentation)
      const payload = {
        jti,           // Unique token ID
        htm: method,   // HTTP method
        htu: url,      // HTTP URL
        iat            // Issued at timestamp
      };

      // Encode header and payload
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

      // Create signature
      const signatureInput = `${encodedHeader}.${encodedPayload}`;

      // Parse private key (handle newlines in environment variable)
      const privateKeyFormatted = this.privateKey.replace(/\\n/g, '\n');

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signatureInput);
      sign.end();

      const signature = sign.sign(privateKeyFormatted, 'base64url');

      // Combine to create DPoP token
      const dpopToken = `${encodedHeader}.${encodedPayload}.${signature}`;

      return dpopToken;
    } catch (error) {
      console.error('Error generating DPoP token:', error);
      throw new Error(`Failed to generate DPoP token: ${error.message}`);
    }
  }

  /**
   * Get Access Token from GOSI API
   * Caches token to avoid repeated calls
   *
   * @returns {Promise<string>} - Access token
   */
  async getAccessToken() {
    try {
      // Check if we have a valid cached token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        console.log('✅ Using cached GOSI access token');
        return this.accessToken;
      }

      console.log('🔄 Fetching new GOSI access token...');

      // Validate required credentials
      if (!this.registrationNumber || !this.clientId || !this.clientSecret || !this.privateKey) {
        throw new Error('Missing GOSI credentials. Please check environment variables.');
      }

      // API endpoint
      const url = `${this.baseURL}/v1/establishment/${this.registrationNumber}/access-token`;

      // Generate DPoP token for this specific request
      const dpopToken = this.generateDPoPToken('POST', url);

      // Make API request
      const response = await axios.post(
        url,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret
        },
        {
          headers: {
            'x-apikey': this.apiKey,
            'dpop': dpopToken,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Extract access token
      this.accessToken = response.data.access_token;

      // Calculate token expiry (assume 1 hour if not specified)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // 1 minute buffer

      console.log('✅ GOSI access token obtained successfully');
      console.log(`   Token expires in: ${expiresIn} seconds`);

      return this.accessToken;
    } catch (error) {
      console.error('❌ Error getting GOSI access token:', error.response?.data || error.message);

      if (error.response) {
        throw new Error(
          `GOSI API Error (${error.response.status}): ${
            JSON.stringify(error.response.data) || error.message
          }`
        );
      }

      throw new Error(`Failed to get GOSI access token: ${error.message}`);
    }
  }

  /**
   * Fetch Contributor (Employee) Data from GOSI
   *
   * @param {string} ninOrIqama - National ID or Iqama number
   * @param {number} retryCount - Internal retry counter (do not set manually)
   * @returns {Promise<Object>} - Contributor data with deduction rates
   */
  async getContributorData(ninOrIqama, retryCount = 0) {
    try {
      console.log(`🔄 Fetching GOSI data for NIN/Iqama: ${ninOrIqama}...`);

      // Get access token
      const accessToken = await this.getAccessToken();

      // API endpoint
      const url = `${this.baseURL}/v2/establishment/${this.registrationNumber}/contributor/${ninOrIqama}`;

      // Generate DPoP token for this specific request
      const dpopToken = this.generateDPoPToken('GET', url);

      // Make API request
      const response = await axios.get(url, {
        headers: {
          'x-apikey': this.apiKey,
          'dpop': dpopToken,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ GOSI contributor data fetched successfully');

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error fetching GOSI contributor data:', error.response?.data || error.message);

      if (error.response?.status === 401 && retryCount === 0) {
        // Token might be expired, clear cache and retry once
        this.accessToken = null;
        this.tokenExpiry = null;
        console.log('🔄 Token expired, retrying once...');

        // Retry once with retry counter
        return this.getContributorData(ninOrIqama, retryCount + 1);
      }

      if (error.response?.status === 401 && retryCount > 0) {
        return {
          success: false,
          error: 'Authentication failed. Please check GOSI credentials (Client ID, Client Secret, Registration Number).',
          code: 'AUTH_FAILED'
        };
      }

      if (error.response?.status === 404) {
        return {
          success: false,
          error: 'Employee not found in GOSI system',
          code: 'NOT_FOUND'
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        code: error.response?.status || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Sync multiple employees from GOSI
   *
   * @param {Array<string>} ninList - Array of NIN/Iqama numbers
   * @returns {Promise<Object>} - Results for all employees
   */
  async syncMultipleEmployees(ninList) {
    const results = {
      success: [],
      failed: [],
      total: ninList.length
    };

    console.log(`🔄 Syncing ${ninList.length} employees from GOSI...`);

    for (const nin of ninList) {
      try {
        const result = await this.getContributorData(nin);

        if (result.success) {
          results.success.push({
            nin,
            data: result.data
          });
        } else {
          results.failed.push({
            nin,
            error: result.error,
            code: result.code
          });
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.failed.push({
          nin,
          error: error.message,
          code: 'EXCEPTION'
        });
      }
    }

    console.log(`✅ GOSI sync completed: ${results.success.length} success, ${results.failed.length} failed`);

    return results;
  }

  /**
   * Test GOSI API connection
   * Uses sandbox test data (NIN starting with '10' for testing)
   *
   * @returns {Promise<Object>} - Test result
   */
  async testConnection() {
    try {
      console.log('🧪 Testing GOSI API connection...');

      // Test with sandbox NIN (starts with '10' for private establishment)
      const testNIN = '1000000001'; // Sandbox test NIN

      const result = await this.getContributorData(testNIN);

      return {
        success: result.success,
        message: result.success
          ? 'GOSI API connection successful'
          : `GOSI API connection failed: ${result.error}`,
        testData: result.data
      };
    } catch (error) {
      return {
        success: false,
        message: `GOSI API test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Get establishment info (if available in API)
   *
   * @returns {Promise<Object>} - Establishment information
   */
  async getEstablishmentInfo() {
    try {
      // Note: This endpoint might not be available in the API
      // Keeping for future use if GOSI provides establishment info endpoint

      const accessToken = await this.getAccessToken();

      return {
        success: true,
        registrationNumber: this.registrationNumber,
        hasValidToken: !!accessToken
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new GOSIService();
