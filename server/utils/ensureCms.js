import CmsPageModel from '../models/CmsPage.js';

const DEFAULT_PAGES = [
  {
    slug: 'about-us',
    title: 'About Challan One',
    content: `<h2>About Challan One</h2>
<p>Challan One is your trusted partner for challan clearance across India. We help vehicle owners check traffic challans, pay fines securely, and complete Parivahan OTP verification with expert support.</p>
<h3>Our Mission</h3>
<p>We simplify the entire journey — from discovery to payment to post-payment agent support — so you can focus on the road, not paperwork.</p>
<ul>
<li>Instant challan check and RC lookup</li>
<li>Secure online payments via Razorpay</li>
<li>Dedicated agent support (10 AM – 8 PM)</li>
</ul>`,
    meta_title: 'About Us - Challan One',
    meta_description: 'Learn about Challan One — your trusted partner for challan clearance.'
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    content: '<h2>Terms & Conditions</h2><p>By using Challan One services, you agree to our terms and conditions.</p>',
    meta_title: 'Terms & Conditions - Challan One',
    meta_description: 'Terms and conditions for using Challan One.'
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content: '<h2>Privacy Policy</h2><p>Your privacy is important to us. We protect your personal information.</p>',
    meta_title: 'Privacy Policy - Challan One',
    meta_description: 'Challan One privacy policy.'
  }
];

export async function ensureDefaultCmsPages() {
  try {
    for (const page of DEFAULT_PAGES) {
      const exists = await CmsPageModel.findOne({ slug: page.slug });
      if (!exists) {
        await CmsPageModel.create(page);
        console.log(`📄 CMS page created: ${page.slug}`);
      }
    }
  } catch (error) {
    console.error('Ensure CMS pages error:', error.message);
  }
}
