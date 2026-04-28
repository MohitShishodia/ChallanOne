// CMS content management data layer - MongoDB
import CmsPageModel from '../models/CmsPage.js';
import CmsFaqModel from '../models/CmsFaq.js';
import CmsPostModel from '../models/CmsPost.js';

// ========================
// STATIC PAGES
// ========================

export async function getPages() {
  try {
    return await CmsPageModel.find().sort({ title: 1 });
  } catch (error) {
    console.error('Get pages error:', error);
    return [];
  }
}

export async function getPageBySlug(slug) {
  try {
    return await CmsPageModel.findOne({ slug });
  } catch (error) {
    return null;
  }
}

export async function updatePage(slug, updates) {
  try {
    const page = await CmsPageModel.findOneAndUpdate(
      { slug },
      {
        title: updates.title,
        content: updates.content,
        meta_title: updates.meta_title,
        meta_description: updates.meta_description,
        updated_at: new Date()
      },
      { new: true }
    );
    if (!page) return { success: false, message: 'Page not found' };
    return { success: true, page };
  } catch (error) {
    return { success: false, message: 'Database error' };
  }
}

// ========================
// FAQ MANAGEMENT
// ========================

export async function getFAQs({ category, active } = {}) {
  try {
    const filter = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.is_active = active;
    return await CmsFaqModel.find(filter).sort({ sort_order: 1 });
  } catch (error) {
    console.error('Get FAQs error:', error);
    return [];
  }
}

export async function createFAQ(faqData) {
  try {
    const faq = await CmsFaqModel.create({
      question: faqData.question,
      answer: faqData.answer,
      category: faqData.category || 'general',
      sort_order: faqData.sort_order || 0,
      is_active: faqData.is_active !== undefined ? faqData.is_active : true
    });
    return { success: true, faq };
  } catch (error) {
    return { success: false, message: 'Failed to create FAQ' };
  }
}

export async function updateFAQ(id, updates) {
  try {
    const updateData = {};
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
    updateData.updated_at = new Date();

    const faq = await CmsFaqModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!faq) return { success: false, message: 'FAQ not found' };
    return { success: true, faq };
  } catch (error) {
    return { success: false, message: 'Failed to update FAQ' };
  }
}

export async function deleteFAQ(id) {
  try {
    await CmsFaqModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to delete FAQ' };
  }
}

// ========================
// BLOG / NEWS POSTS
// ========================

export async function getPosts({ status, search, page = 1, limit = 20 } = {}) {
  try {
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      CmsPostModel.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      CmsPostModel.countDocuments(filter)
    ]);

    return { success: true, posts: data, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Get posts error:', error);
    return { success: false, posts: [], total: 0 };
  }
}

export async function getPostById(id) {
  try {
    return await CmsPostModel.findById(id);
  } catch (error) {
    return null;
  }
}

export async function createPost(postData) {
  try {
    const slug = postData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const post = await CmsPostModel.create({
      title: postData.title,
      slug,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft',
      author_id: postData.author_id,
      published_at: postData.status === 'published' ? new Date() : null
    });
    return { success: true, post };
  } catch (error) {
    return { success: false, message: 'Failed to create post' };
  }
}

export async function updatePost(id, updates) {
  try {
    const updateData = {};
    if (updates.title !== undefined) {
      updateData.title = updates.title;
      updateData.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.excerpt !== undefined) updateData.excerpt = updates.excerpt;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'published') updateData.published_at = new Date();
    }
    updateData.updated_at = new Date();

    const post = await CmsPostModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!post) return { success: false, message: 'Post not found' };
    return { success: true, post };
  } catch (error) {
    return { success: false, message: 'Failed to update post' };
  }
}

export async function deletePost(id) {
  try {
    await CmsPostModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Failed to delete post' };
  }
}
