// Admin panel MongoDB seed script
// Run with: node data/adminSeed.js

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import RoleModel from '../models/Role.js';
import AdminUserModel from '../models/AdminUser.js';
import ServiceCategoryModel from '../models/ServiceCategory.js';
import ServiceModel from '../models/Service.js';
import CmsPageModel from '../models/CmsPage.js';
import CmsFaqModel from '../models/CmsFaq.js';
import SiteSettingModel from '../models/SiteSetting.js';

const MONGODB_URI = process.env.MONGODB_URI;
const SALT_ROUNDS = 12;

const ALL_PERMISSIONS = [
  'view_dashboard',
  'view_users', 'manage_users',
  'view_challans', 'manage_challans',
  'view_payments', 'manage_payments', 'process_refunds',
  'view_services', 'manage_services',
  'view_reports', 'export_reports',
  'view_settings', 'manage_settings',
  'view_notifications', 'send_notifications',
  'view_cms', 'manage_cms',
  'view_tickets', 'manage_tickets',
  'view_roles', 'manage_roles', 'manage_admins'
];

async function seed() {
  console.log('🌱 Starting Admin Panel MongoDB seed...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // --- CLEAR ---
    console.log('🗑️  Clearing admin data...');
    await AdminUserModel.deleteMany({});
    await RoleModel.deleteMany({});
    await ServiceModel.deleteMany({});
    await ServiceCategoryModel.deleteMany({});
    await CmsPageModel.deleteMany({});
    await CmsFaqModel.deleteMany({});
    await SiteSettingModel.deleteMany({});
    console.log('✅ Cleared\n');

    // --- ROLES ---
    console.log('👤 Seeding roles...');
    const roles = await RoleModel.insertMany([
      { name: 'Super Admin', permissions: ALL_PERMISSIONS, is_system: true },
      { name: 'Manager', permissions: ['view_dashboard','view_users','manage_users','view_challans','manage_challans','view_payments','manage_payments','view_services','manage_services','view_reports','export_reports','view_tickets','manage_tickets','view_cms','manage_cms','view_notifications'], is_system: true },
      { name: 'Viewer', permissions: ['view_dashboard','view_users','view_challans','view_payments','view_services','view_reports','view_tickets','view_cms'], is_system: true }
    ]);
    const superAdminRole = roles.find(r => r.name === 'Super Admin');
    console.log(`✅ Inserted ${roles.length} roles\n`);

    // --- SUPER ADMIN USER ---
    console.log('👑 Creating default Super Admin...');
    const defaultPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);
    await AdminUserModel.create({
      email: 'admin@challanone.com',
      password_hash: defaultPassword,
      name: 'Super Admin',
      role_id: superAdminRole._id,
      status: 'active'
    });
    console.log('✅ Created Super Admin: admin@challanone.com / Admin@123\n');

    // --- SERVICE CATEGORIES ---
    console.log('📂 Seeding service categories...');
    const categories = await ServiceCategoryModel.insertMany([
      { name: 'Challan Services', slug: 'challan-services' },
      { name: 'Vehicle Services', slug: 'vehicle-services' },
      { name: 'Document Services', slug: 'document-services' },
      { name: 'Insurance', slug: 'insurance' }
    ]);
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c._id; });
    console.log(`✅ Inserted ${categories.length} categories\n`);

    // --- SERVICES ---
    console.log('🛠️  Seeding services...');
    const services = await ServiceModel.insertMany([
      { name: 'Pay Traffic Challan', description: 'Pay your pending traffic challans online instantly. Supports all Indian states.', category_id: catMap['challan-services'], price: 49.00, status: 'active', is_featured: true, icon: '💳' },
      { name: 'Check Challan Status', description: 'Track the status of your challan payment and resolution in real-time.', category_id: catMap['challan-services'], price: 0.00, status: 'active', is_featured: true, icon: '🔍' },
      { name: 'Vehicle RC Details', description: 'Get complete RC details including owner info, registration, insurance status.', category_id: catMap['vehicle-services'], price: 29.00, status: 'active', is_featured: true, icon: '🚗' },
      { name: 'Challan History Report', description: 'Download complete challan history for any vehicle number.', category_id: catMap['challan-services'], price: 99.00, status: 'active', is_featured: false, icon: '📋' },
      { name: 'Driving License Verification', description: 'Verify driving license details and validity online.', category_id: catMap['document-services'], price: 39.00, status: 'inactive', is_featured: false, icon: '📄' },
      { name: 'Insurance Check', description: 'Check vehicle insurance status and policy details.', category_id: catMap['insurance'], price: 19.00, status: 'active', is_featured: false, icon: '🛡️' }
    ]);
    console.log(`✅ Inserted ${services.length} services\n`);

    // --- CMS PAGES ---
    console.log('📄 Seeding CMS pages...');
    await CmsPageModel.insertMany([
      { slug: 'about-us', title: 'About Us', content: '<h2>About ChallanOne</h2><p>ChallanOne is India\'s leading platform for online challan payment and vehicle information services.</p>', meta_title: 'About Us - ChallanOne', meta_description: 'Learn about ChallanOne, India\'s leading online challan payment platform.' },
      { slug: 'terms-and-conditions', title: 'Terms & Conditions', content: '<h2>Terms & Conditions</h2><p>By using ChallanOne services, you agree to the following terms and conditions...</p>', meta_title: 'Terms & Conditions - ChallanOne', meta_description: 'Read the terms and conditions for using ChallanOne services.' },
      { slug: 'privacy-policy', title: 'Privacy Policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.</p>', meta_title: 'Privacy Policy - ChallanOne', meta_description: 'ChallanOne privacy policy - how we handle your data.' }
    ]);
    console.log('✅ Inserted 3 CMS pages\n');

    // --- FAQs ---
    console.log('❓ Seeding FAQs...');
    await CmsFaqModel.insertMany([
      { question: 'How to pay traffic challan online?', answer: 'Enter your vehicle number on the Pay Challan page. The system will fetch all pending challans.', category: 'payment', sort_order: 1 },
      { question: 'What payment methods are accepted?', answer: 'We accept UPI, credit/debit cards, net banking, and digital wallets through Razorpay.', category: 'payment', sort_order: 2 },
      { question: 'How long does it take for challan status to update?', answer: 'Challan status is updated instantly upon successful payment.', category: 'general', sort_order: 3 },
      { question: 'Is my payment secure?', answer: 'Yes, all payments are processed through RBI-approved Razorpay gateway with 256-bit SSL encryption.', category: 'payment', sort_order: 4 },
      { question: 'Can I get a refund?', answer: 'Refunds are processed within 5-7 business days for eligible transactions.', category: 'payment', sort_order: 5 }
    ]);
    console.log('✅ Inserted 5 FAQs\n');

    // --- SITE SETTINGS ---
    console.log('⚙️  Seeding site settings...');
    await SiteSettingModel.insertMany([
      { key: 'site_name', value: 'ChallanOne', category: 'general' },
      { key: 'site_tagline', value: 'Pay Traffic Challans Online', category: 'general' },
      { key: 'contact_email', value: 'support@challanone.com', category: 'general' },
      { key: 'contact_phone', value: '+91-9876543210', category: 'general' },
      { key: 'logo_url', value: '/logo.png', category: 'general' },
      { key: 'seo_title', value: 'ChallanOne - Pay Traffic Challans Online | Check E-Challan Status', category: 'seo' },
      { key: 'seo_description', value: 'Pay traffic challans online, check e-challan status, and get vehicle information.', category: 'seo' },
      { key: 'razorpay_enabled', value: 'true', category: 'payment' },
      { key: 'convenience_fee_percent', value: '2.5', category: 'payment' },
      { key: 'email_notifications_enabled', value: 'true', category: 'notifications' },
      { key: 'sms_notifications_enabled', value: 'false', category: 'notifications' },
      { key: 'push_notifications_enabled', value: 'false', category: 'notifications' }
    ]);
    console.log('✅ Inserted 12 site settings\n');

    console.log('🎉 Admin panel seeding completed!\n');
    console.log('=== Login Credentials ===');
    console.log('Email:    admin@challanone.com');
    console.log('Password: Admin@123');
    console.log('=========================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
