// components/Pagination.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Pagination() {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaginationData();
    }, []);

    const fetchPaginationData = async () => {
        try {
            // Get total count for pagination
            const { count, error } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'published');

            if (error) {
                console.error('Error counting articles:', error);
            } else {
                setTotalPages(Math.ceil((count || 0) / 5)); // Assuming 5 articles per page
            }
        } catch (error) {
            console.error('Error fetching pagination data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Trigger a page change event that the DynamicArticlesList component can listen to
        window.dispatchEvent(new CustomEvent('pageChange', { detail: { page } }));
    };

    if (loading || totalPages <= 1) {
        return null;
    }

    return (
        <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded-md ${currentPage === index + 1
                            ? 'bg-primary text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {index + 1}
                    </button>
                ))}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </nav>
        </div>
    );
}