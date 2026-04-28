// Admin CMS management routes
import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { requirePermission, PERMISSIONS } from '../../middleware/rbac.js';
import { getPages, getPageBySlug, updatePage, getFAQs, createFAQ, updateFAQ, deleteFAQ, getPosts, getPostById, createPost, updatePost, deletePost } from '../../data/cms.js';
import { logActivity } from '../../data/activityLog.js';

const router = express.Router();

// ========================
// STATIC PAGES
// ========================

// GET /api/admin/cms/pages
router.get('/pages', adminAuth, requirePermission(PERMISSIONS.VIEW_CMS), async (req, res) => {
  try {
    const pages = await getPages();
    return res.json({ success: true, pages });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/cms/pages/:slug
router.get('/pages/:slug', adminAuth, requirePermission(PERMISSIONS.VIEW_CMS), async (req, res) => {
  try {
    const page = await getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    return res.json({ success: true, page });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/cms/pages/:slug
router.put('/pages/:slug', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const result = await updatePage(req.params.slug, req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'page_updated', 'cms_page', req.params.slug, { title: req.body.title });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========================
// FAQS
// ========================

// GET /api/admin/cms/faqs
router.get('/faqs', adminAuth, requirePermission(PERMISSIONS.VIEW_CMS), async (req, res) => {
  try {
    const faqs = await getFAQs(req.query);
    return res.json({ success: true, faqs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/cms/faqs
router.post('/faqs', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const result = await createFAQ(req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'faq_created', 'cms_faq', result.faq.id);
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/cms/faqs/:id
router.put('/faqs/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const result = await updateFAQ(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/cms/faqs/:id
router.delete('/faqs/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const result = await deleteFAQ(req.params.id);

    if (result.success) {
      await logActivity(req.admin.id, 'faq_deleted', 'cms_faq', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ========================
// BLOG / NEWS POSTS
// ========================

// GET /api/admin/cms/posts
router.get('/posts', adminAuth, requirePermission(PERMISSIONS.VIEW_CMS), async (req, res) => {
  try {
    const result = await getPosts(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/admin/cms/posts/:id
router.get('/posts/:id', adminAuth, requirePermission(PERMISSIONS.VIEW_CMS), async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.json({ success: true, post });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/admin/cms/posts
router.post('/posts', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const result = await createPost({ ...req.body, author_id: req.admin.id });

    if (result.success) {
      await logActivity(req.admin.id, 'post_created', 'cms_post', result.post.id, { title });
    }

    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/cms/posts/:id
router.put('/posts/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const result = await updatePost(req.params.id, req.body);

    if (result.success) {
      await logActivity(req.admin.id, 'post_updated', 'cms_post', req.params.id, { title: req.body.title });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/cms/posts/:id
router.delete('/posts/:id', adminAuth, requirePermission(PERMISSIONS.MANAGE_CMS), async (req, res) => {
  try {
    const result = await deletePost(req.params.id);

    if (result.success) {
      await logActivity(req.admin.id, 'post_deleted', 'cms_post', req.params.id);
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
