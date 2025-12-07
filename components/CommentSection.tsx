// components/CommentSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReCAPTCHA from '@/components/ReCAPTCHA';

interface Comment {
  id: number;
  name: string;
  email: string;
  website: string;
  content: string;
  created_at: string;
  replies: Comment[];
}

interface CommentSectionProps {
  articleId: number;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    content: '',
    parentId: null as number | null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for articleId:', articleId);

      // Coba tanpa filter status terlebih dahulu untuk debugging
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: true });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        // Filter komentar yang approved di client-side
        const approvedComments = data?.filter(comment => comment.status === 'approved') || [];

        // Organize comments into parent-child structure
        const parentComments = approvedComments.filter(comment => !comment.parent_id);
        const childComments = approvedComments.filter(comment => comment.parent_id);

        const organizedComments = parentComments.map(parent => ({
          ...parent,
          replies: childComments.filter(child => child.parent_id === parent.id)
        }));

        setComments(organizedComments);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.content) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    if (!recaptchaToken) {
      alert('Mohon verifikasi bahwa Anda bukan robot');
      return;
    }

    setSubmitting(true);

    try {
      const commentData = {
        article_id: articleId,
        parent_id: formData.parentId,
        name: formData.name,
        email: formData.email,
        website: formData.website || null,
        content: formData.content,
        status: 'pending', // Status default untuk komentar baru
      };

      const { error } = await supabase
        .from('comments')
        .insert([commentData]);

      if (error) {
        console.error('Error submitting comment:', error);
        alert(`Gagal mengirim komentar: ${error.message || 'Silakan coba lagi.'}`);
      } else {
        alert('Komentar Anda telah dikirim dan menunggu persetujuan.');
        setFormData({
          name: '',
          email: '',
          website: '',
          content: '',
          parentId: null,
        });
        setReplyingTo(null);
        setRecaptchaToken(null);

        // Reset reCAPTCHA
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      alert(`Gagal mengirim komentar: ${error.message || 'Silakan coba lagi.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: number) => {
    setReplyingTo(commentId);
    setFormData({
      ...formData,
      parentId: commentId,
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setFormData({
      ...formData,
      parentId: null,
    });
  };

  // Format tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Komentar ({comments.length})
        </h3>
        {!showCommentForm && (
          <button
            onClick={() => setShowCommentForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 text-sm font-medium"
          >
            Tambah Komentar
          </button>
        )}
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">Tulis Komentar</h4>
            <button
              onClick={() => setShowCommentForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Tutup</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nama *
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                id="website"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Komentar *
              </label>
              <textarea
                id="content"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <ReCAPTCHA onChange={setRecaptchaToken} containerId="recaptcha-main" />
            </div>
            {replyingTo && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  Membalas komentar #{replyingTo}
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    Batal
                  </button>
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting || !recaptchaToken}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
            >
              {submitting ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-gray-500">Belum ada komentar. Jadilah yang pertama berkomentar!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {comment.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {comment.name}
                    </h4>
                    <span className="ml-2 text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {comment.content}
                  </div>
                  <button
                    onClick={() => handleReply(comment.id)}
                    className="mt-2 text-sm text-primary hover:text-primary/80"
                  >
                    Balas
                  </button>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label htmlFor={`reply-name-${comment.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Nama *
                          </label>
                          <input
                            type="text"
                            id={`reply-name-${comment.id}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor={`reply-email-${comment.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                          </label>
                          <input
                            type="email"
                            id={`reply-email-${comment.id}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <label htmlFor={`reply-content-${comment.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                            Komentar *
                          </label>
                          <textarea
                            id={`reply-content-${comment.id}`}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                          />
                        </div>
                        <div className="mb-4">
                          <ReCAPTCHA onChange={setRecaptchaToken} containerId={`recaptcha-reply-${comment.id}`} />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="submit"
                            disabled={submitting || !recaptchaToken}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 disabled:opacity-50"
                          >
                            {submitting ? 'Mengirim...' : 'Kirim Balasan'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelReply}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                          >
                            Batal
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 ml-8 space-y-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {reply.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex items-center">
                                <h5 className="text-sm font-semibold text-gray-900">
                                  {reply.name}
                                </h5>
                                <span className="ml-2 text-xs text-gray-500">
                                  {formatDate(reply.created_at)}
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-gray-700">
                                {reply.content}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}