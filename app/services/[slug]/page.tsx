// app/services/[slug]/page.tsx
import { notFound } from 'next/navigation';
import SingleServicePricing from '@/components/SingleServicePricing';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types/service';

// Fungsi untuk mengambil data layanan berdasarkan slug
async function getService(slug: string): Promise<Service> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error || !data) {
        // Jika ada error atau data tidak ditemukan, panggil notFound()
        notFound();
    }

    return data;
}

// Page Component adalah async function yang menerima params
export default async function ServicePage({ params }: { params: { slug: string } }) {
    const service = await getService(params.slug);

    // Render komponen dengan data yang sudah diambil
    return <SingleServicePricing service={service} />;
}