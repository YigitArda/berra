'use client';

import { FormEvent, useEffect, useState } from 'react';

type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api';

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function loadFeed() {
    const res = await fetch(`${API_BASE}/feed?page=1`, { credentials: 'include' });
    const data = (await res.json()) as { posts: FeedPost[] };
    setPosts(data.posts || []);
  }

  useEffect(() => {
    loadFeed().catch(() => setMessage('Feed yüklenemedi.'));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const res = await fetch(`${API_BASE}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
      credentials: 'include',
    });

    const data = (await res.json()) as { message?: string; error?: string };
    if (!res.ok) {
      setMessage(data.error || 'Gönderi oluşturulamadı.');
      return;
    }

    setBody('');
    await loadFeed();
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: '0 16px' }}>
      <h1>Yeni Feed (Migration)</h1>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ne düşünüyorsun?"
          maxLength={500}
          rows={3}
        />
        <button type="submit">Paylaş</button>
      </form>
      {message && <p>{message}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {posts.map((post) => (
          <article key={post.id} style={{ border: '1px solid #2a2e38', borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: 700 }}>{post.username}</div>
            <p>{post.body}</p>
            <small>♥ {post.like_count} · 💬 {post.comment_count}</small>
          </article>
        ))}
      </div>
    </main>
  );
}
