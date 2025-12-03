// components/SubscriptionForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SubscriptionForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Mohon masukkan email Anda');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email }]);
      
      if (error) {
        // Check if it's a duplicate email error
        if (error.code === '23505') {
          setMessage('Email Anda sudah terdaftar dalam daftar langganan kami.');
          setMessageType('error');
        } else {
          setMessage('Gagal berlangganan. Silakan coba lagi.');
          setMessageType('error');
          console.error('Error subscribing:', error);
        }
      } else {
        setMessage('Terima kasih telah berlangganan! Anda akan menerima update artikel terbaru dari kami.');
        setMessageType('success');
        setEmail('');
      }
    } catch (error) {
      setMessage('Gagal berlangganan. Silakan coba lagi.');
      setMessageType('error');
      console.error('Error subscribing:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-primary rounded-lg p-8 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-4">
          Berlangganan Artikel Terbaru
        </h3>
        <p className="mb-6">
          Dapatkan artikel terbaru langsung di inbox Anda. Tidak ada spam, hanya konten berkualitas.
        </p>
        
        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            messageType === 'success' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Email Anda"
            className="flex-1 px-4 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-white text-primary font-semibold rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Berlangganan'}
          </button>
        </form>
      </div>
    </div>
  );
}