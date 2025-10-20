import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Absher Integration Settings Component
 * Allows configuration of Absher Business API credentials
 */
const AbsherIntegrationSettings = () => {
  const [activeTab, setActiveTab] = useState('smart'); // smart or subscriptions
  const [config, setConfig] = useState({
    clientId: '3fd125a2',  // معرف الربط (Link ID)
    clientSecret: '42d53a3e57bfc9e87a7391c3ce633ce1',  // الكتلة السرية
    authorizationServer: 'https://idp.elm.sa',  // خادم المصادقة للإنتاج
    realmName: 'Tamm',  // اسم المجال للإنتاج
    linkId: '3fd125a2',  // نفس معرف الربط
    status: 'active',
    notes: 'Production Environment - Live Configuration'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [existingConfig, setExistingConfig] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/absher/config/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.data) {
        setExistingConfig(response.data.data);
        setConfig({
          clientId: response.data.data.clientId || '3fd125a2',
          clientSecret: response.data.data.clientSecret || '42d53a3e57bfc9e87a7391c3ce633ce1',
          authorizationServer: response.data.data.authorizationServer || 'https://idp.elm.sa',
          realmName: response.data.data.realmName || 'Tamm',
          linkId: response.data.data.linkId || '3fd125a2',
          status: response.data.data.status || 'active',
          notes: response.data.data.notes || 'Production Environment - Live Configuration'
        });
      }
    } catch (error) {
      console.error('Error fetching Absher config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');

      if (existingConfig) {
        // Update existing config
        await axios.put(`${API_URL}/absher/config/${existingConfig._id}`, config, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ تم تحديث إعدادات أبشر بنجاح');
      } else {
        // Create new config
        await axios.post(`${API_URL}/absher/config`, config, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('✅ تم حفظ إعدادات أبشر بنجاح');
      }

      fetchConfig();
    } catch (error) {
      console.error('Error saving Absher config:', error);
      alert('❌ حدث خطأ أثناء حفظ الإعدادات: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/absher/test-connection`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTestResult({
        success: response.data.success,
        message: response.data.message
      });

      if (response.data.success) {
        alert('✅ نجح الاتصال بـ API أبشر!');
      } else {
        alert('❌ فشل الاتصال بـ API أبشر: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        message: error.response?.data?.message || error.message
      });
      alert('❌ فشل اختبار الاتصال: ' + (error.response?.data?.message || error.message));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          إدارة اشتراكات التكامل
        </h1>
        <p className="text-sm text-gray-600 text-center mt-2">
          عزيزي العميل، يوجد لديكم متوافر مستحقة بمبلغ 308.20 ريال، لذا تأمل منكم سدادها قبل 39 يوماً وذلك لتجنب إيقاف الخدمة.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('smart')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'smart'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          الربط الذكي
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'subscriptions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          الاشتراكات
        </button>
      </div>

      {/* Content */}
      {activeTab === 'smart' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client ID */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              رقم العميل
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3fd125a2"
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                الحالة
              </span>
            </div>
          </div>

          {/* Link ID */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              معرف الربط
            </label>
            <input
              type="text"
              value={config.linkId}
              onChange={(e) => setConfig({ ...config, linkId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="3fd125a2"
            />
          </div>

          {/* Secret Key */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              الكتلة السرية
            </label>
            <input
              type="text"
              value={config.clientSecret}
              onChange={(e) => setConfig({ ...config, clientSecret: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="42d53a3e57bfc9e87a7391c3ce633ce1"
              required
            />
          </div>

          {/* Authorization Server */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              خادم المصادقة
            </label>
            <input
              type="text"
              value={config.authorizationServer}
              onChange={(e) => setConfig({ ...config, authorizationServer: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://idp.elm.sa"
              required
            />
          </div>

          {/* Realm Name */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              اسم المجال
            </label>
            <input
              type="text"
              value={config.realmName}
              onChange={(e) => setConfig({ ...config, realmName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tamm"
              required
            />
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <label className="text-right font-medium text-gray-700">
              الحالة
            </label>
            <select
              value={config.status}
              onChange={(e) => setConfig({ ...config, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">نشط (Active)</option>
              <option value="inactive">غير نشط (Inactive)</option>
              <option value="testing">اختبار (Testing)</option>
            </select>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <label className="text-right font-medium text-gray-700 pt-2">
              ملاحظات
            </label>
            <textarea
              value={config.notes}
              onChange={(e) => setConfig({ ...config, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="أضف أي ملاحظات هنا..."
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </p>
            </div>
          )}

          {/* Last Test Info */}
          {existingConfig?.lastTestResult && (
            <div className="text-sm text-gray-600 text-center">
              آخر اختبار: {new Date(existingConfig.lastTestResult.testedAt).toLocaleString('ar-SA')} -
              {existingConfig.lastTestResult.success ? ' ✅ نجح' : ' ❌ فشل'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.clientId || !config.clientSecret}
              className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>

          {/* Last Sync Info */}
          {existingConfig?.lastSyncDate && (
            <div className="text-sm text-gray-600 text-center pt-2">
              آخر مزامنة: {new Date(existingConfig.lastSyncDate).toLocaleString('ar-SA')}
            </div>
          )}
        </form>
      )}

      {activeTab === 'subscriptions' && (
        <div className="text-center py-12 text-gray-600">
          <p>لا توجد اشتراكات إضافية حالياً</p>
        </div>
      )}
    </div>
  );
};

export default AbsherIntegrationSettings;
