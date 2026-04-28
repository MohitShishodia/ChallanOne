// CMS Management - Pages, FAQs, Posts
import { useState } from 'react'
import { Plus, Edit, Trash2, Save, BookOpen, HelpCircle, Newspaper } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function CMS() {
  const { request } = useApi()
  const [tab, setTab] = useState('pages')

  const { data: pagesData, loading: pagesLoading, refetch: refetchPages } = useFetch('/api/admin/cms/pages')
  const { data: faqsData, loading: faqsLoading, refetch: refetchFaqs } = useFetch('/api/admin/cms/faqs')
  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = useFetch('/api/admin/cms/posts?limit=50')

  const pages = pagesData?.pages || []
  const faqs = faqsData?.faqs || []
  const posts = postsData?.posts || []

  // Page editing
  const [editPage, setEditPage] = useState(null)
  const [pageForm, setPageForm] = useState({ title: '', content: '', meta_title: '', meta_description: '' })

  // FAQ editing
  const [faqModal, setFaqModal] = useState(false)
  const [editFaq, setEditFaq] = useState(null)
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general' })
  const [deleteFaqTarget, setDeleteFaqTarget] = useState(null)

  // Post editing
  const [postModal, setPostModal] = useState(false)
  const [editPost, setEditPost] = useState(null)
  const [postForm, setPostForm] = useState({ title: '', content: '', excerpt: '', status: 'draft' })
  const [deletePostTarget, setDeletePostTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const openEditPage = (page) => {
    setEditPage(page)
    setPageForm({ title: page.title, content: page.content, meta_title: page.meta_title || '', meta_description: page.meta_description || '' })
  }

  const savePage = async () => {
    setSaving(true)
    try {
      const res = await request(`/api/admin/cms/pages/${editPage.slug}`, { method: 'PUT', body: pageForm })
      if (res.success) { toast.success('Page updated'); setEditPage(null); refetchPages() }
      else toast.error(res.message)
    } catch { toast.error('Failed to save page') }
    finally { setSaving(false) }
  }

  const saveFaq = async () => {
    setSaving(true)
    try {
      const url = editFaq ? `/api/admin/cms/faqs/${editFaq.id}` : '/api/admin/cms/faqs'
      const method = editFaq ? 'PUT' : 'POST'
      const res = await request(url, { method, body: faqForm })
      if (res.success) {
        toast.success(editFaq ? 'FAQ updated' : 'FAQ created')
        setFaqModal(false); refetchFaqs()
      } else toast.error(res.message)
    } catch { toast.error('Failed to save FAQ') }
    finally { setSaving(false) }
  }

  const deleteFaq = async () => {
    try {
      const res = await request(`/api/admin/cms/faqs/${deleteFaqTarget.id}`, { method: 'DELETE' })
      if (res.success) { toast.success('FAQ deleted'); refetchFaqs() }
    } catch { toast.error('Delete failed') }
    finally { setDeleteFaqTarget(null) }
  }

  const savePost = async () => {
    setSaving(true)
    try {
      const url = editPost ? `/api/admin/cms/posts/${editPost.id}` : '/api/admin/cms/posts'
      const method = editPost ? 'PUT' : 'POST'
      const res = await request(url, { method, body: postForm })
      if (res.success) {
        toast.success(editPost ? 'Post updated' : 'Post created')
        setPostModal(false); refetchPosts()
      } else toast.error(res.message)
    } catch { toast.error('Failed to save post') }
    finally { setSaving(false) }
  }

  const deletePost = async () => {
    try {
      const res = await request(`/api/admin/cms/posts/${deletePostTarget.id}`, { method: 'DELETE' })
      if (res.success) { toast.success('Post deleted'); refetchPosts() }
    } catch { toast.error('Delete failed') }
    finally { setDeletePostTarget(null) }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Management</h1>
          <p className="page-subtitle">Manage static pages, FAQs, and blog posts</p>
        </div>
        {tab === 'faqs' && (
          <button className="btn btn-primary" onClick={() => { setEditFaq(null); setFaqForm({ question: '', answer: '', category: 'general' }); setFaqModal(true) }}>
            <Plus size={14} /> Add FAQ
          </button>
        )}
        {tab === 'posts' && (
          <button className="btn btn-primary" onClick={() => { setEditPost(null); setPostForm({ title: '', content: '', excerpt: '', status: 'draft' }); setPostModal(true) }}>
            <Plus size={14} /> New Post
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['pages', BookOpen, 'Pages'], ['faqs', HelpCircle, 'FAQs'], ['posts', Newspaper, 'Blog Posts']].map(([key, Icon, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Pages */}
      {tab === 'pages' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {pagesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card"><div className="card-body"><div className="skeleton" style={{ height: 60, borderRadius: 6 }} /></div></div>
              ))
            : pages.map(page => (
                <div key={page.id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{page.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/{page.slug}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditPage(page)}>
                    <Edit size={13} /> Edit
                  </button>
                </div>
              ))
          }
        </div>
      )}

      {/* FAQs */}
      {tab === 'faqs' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {faqsLoading
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)
            : faqs.map(faq => (
                <div key={faq.id} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{faq.question}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{faq.answer}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditFaq(faq); setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category }); setFaqModal(true) }}>
                      <Edit size={13} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#ef4444' }} onClick={() => setDeleteFaqTarget(faq)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Posts */}
      {tab === 'posts' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Status</th><th>Created</th><th>Published</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {postsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>)}</tr>
                  ))
                : posts.length === 0
                ? <tr><td colSpan={5}><div className="empty-state">No posts yet. Create your first!</div></td></tr>
                : posts.map(post => (
                    <tr key={post.id}>
                      <td style={{ fontWeight: 600 }}>{post.title}</td>
                      <td><Badge status={post.status}>{post.status}</Badge></td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDate(post.created_at)}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{post.published_at ? formatDate(post.published_at) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditPost(post); setPostForm({ title: post.title, content: post.content, excerpt: post.excerpt || '', status: post.status }); setPostModal(true) }}><Edit size={13} /></button>
                          <button className="btn btn-ghost btn-icon btn-sm" style={{ color: '#ef4444' }} onClick={() => setDeletePostTarget(post)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Page Edit Modal */}
      <Modal open={!!editPage} onClose={() => setEditPage(null)} title={`Edit: ${editPage?.title}`} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setEditPage(null)}>Cancel</button><button className="btn btn-primary" onClick={savePage} disabled={saving}><Save size={13} />{saving ? 'Saving…' : 'Save'}</button></>}>
        {editPage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={pageForm.title} onChange={e => setPageForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Content (HTML)</label><textarea className="form-textarea" style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 12 }} value={pageForm.content} onChange={e => setPageForm(f => ({ ...f, content: e.target.value }))} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label">Meta Title</label><input className="form-input" value={pageForm.meta_title} onChange={e => setPageForm(f => ({ ...f, meta_title: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Meta Description</label><input className="form-input" value={pageForm.meta_description} onChange={e => setPageForm(f => ({ ...f, meta_description: e.target.value }))} /></div>
            </div>
          </div>
        )}
      </Modal>

      {/* FAQ Modal */}
      <Modal open={faqModal} onClose={() => setFaqModal(false)} title={editFaq ? 'Edit FAQ' : 'Add FAQ'}
        footer={<><button className="btn btn-secondary" onClick={() => setFaqModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveFaq} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Question *</label><input className="form-input" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Answer *</label><textarea className="form-textarea" value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Category</label><input className="form-input" value={faqForm.category} onChange={e => setFaqForm(f => ({ ...f, category: e.target.value }))} placeholder="general" /></div>
        </div>
      </Modal>

      {/* Post Modal */}
      <Modal open={postModal} onClose={() => setPostModal(false)} title={editPost ? 'Edit Post' : 'New Post'} size="lg"
        footer={<><button className="btn btn-secondary" onClick={() => setPostModal(false)}>Cancel</button><button className="btn btn-primary" onClick={savePost} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" value={postForm.status} onChange={e => setPostForm(f => ({ ...f, status: e.target.value }))}>
              <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Excerpt</label><input className="form-input" value={postForm.excerpt} onChange={e => setPostForm(f => ({ ...f, excerpt: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Content *</label><textarea className="form-textarea" style={{ minHeight: 200 }} value={postForm.content} onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))} /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteFaqTarget} onClose={() => setDeleteFaqTarget(null)} onConfirm={deleteFaq} title="Delete FAQ" message={`Delete this FAQ: "${deleteFaqTarget?.question}"?`} confirmLabel="Delete" danger />
      <ConfirmDialog open={!!deletePostTarget} onClose={() => setDeletePostTarget(null)} onConfirm={deletePost} title="Delete Post" message={`Delete post "${deletePostTarget?.title}"?`} confirmLabel="Delete" danger />
    </div>
  )
}
