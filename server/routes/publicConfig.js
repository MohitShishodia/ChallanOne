import express from 'express';
import ServiceModel from '../models/Service.js';
import SiteSettingModel from '../models/SiteSetting.js';
import { getPageBySlug } from '../data/cms.js';

const router = express.Router();

/**
 * GET /api/config/services
 * Returns active services for the client. Admin can toggle services on/off.
 */
router.get('/services', async (req, res) => {
  try {
    const services = await ServiceModel.find({ status: 'active' })
      .select('name description icon is_featured price status')
      .sort({ is_featured: -1, name: 1 });

    return res.json({
      success: true,
      services: services.map(s => ({
        id: s._id.toString(),
        name: s.name,
        slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        description: s.description,
        icon: s.icon,
        isFeatured: s.is_featured,
        price: s.price,
        active: s.status === 'active'
      }))
    });
  } catch (error) {
    console.error('[PublicConfig] Services error:', error);
    return res.status(500).json({ success: false, services: [] });
  }
});

/**
 * GET /api/config/settings
 * Returns public site settings (non-sensitive) for the client.
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await SiteSettingModel.find({
      category: { $in: ['general', 'seo', 'payment', 'features'] }
    });

    const config = {};
    for (const s of settings) {
      if (!config[s.category]) config[s.category] = {};
      config[s.category][s.key] = s.value;
    }

    return res.json({ success: true, config });
  } catch (error) {
    console.error('[PublicConfig] Settings error:', error);
    return res.status(500).json({ success: false, config: {} });
  }
});

/**
 * GET /api/config/features
 * Quick endpoint returning which features/services are enabled.
 * Client checks this to show/hide flow options.
 */
router.get('/features', async (req, res) => {
  try {
    const [services, featureSettings] = await Promise.all([
      ServiceModel.find({}, 'name status'),
      SiteSettingModel.find({ category: 'features' })
    ]);

    const serviceMap = {};
    for (const s of services) {
      const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      serviceMap[slug] = s.status === 'active';
    }

    const settingsMap = {};
    for (const s of featureSettings) {
      settingsMap[s.key] = s.value === 'true';
    }

    return res.json({
      success: true,
      features: {
        ...settingsMap,
        ...serviceMap,
        delhi_otp_challan: serviceMap.delhi_otp_challan ?? serviceMap.delhi_state_challan ?? true,
        fetch_all_challans: serviceMap.fetch_all_challans ?? serviceMap.challan_lookup ?? true,
        rc_details: serviceMap.rc_details ?? serviceMap.vehicle_info ?? true,
        online_payment: serviceMap.online_payment ?? serviceMap.pay_traffic_challan ?? true
      }
    });
  } catch (error) {
    console.error('[PublicConfig] Features error:', error);
    return res.json({
      success: true,
      features: {
        delhi_otp_challan: true,
        fetch_all_challans: true,
        rc_details: true,
        online_payment: true
      }
    });
  }
});

/**
 * GET /api/config/pages/:slug
 * Public CMS page content (About Us, Terms, etc.)
 */
router.get('/pages/:slug', async (req, res) => {
  try {
    const page = await getPageBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    return res.json({
      success: true,
      page: {
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaTitle: page.meta_title,
        metaDescription: page.meta_description,
        updatedAt: page.updated_at
      }
    });
  } catch (error) {
    console.error('[PublicConfig] CMS page error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load page' });
  }
});

export default router;
