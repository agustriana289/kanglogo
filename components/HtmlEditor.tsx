// components/HtmlEditor.tsx
'use client';

import React, { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Impor style default

interface HtmlEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function HtmlEditor({ value, onChange, placeholder }: HtmlEditorProps) {
    const quillRef = useRef<ReactQuill>(null);

    // Konfigurasi toolbar dan modul lainnya
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean'] // Tombol untuk menghapus formatting
        ],
    };

    // Format yang diizinkan
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video',
        'color', 'background',
        'align', 'script', 'direction'
    ];

    return (
        <div className="bg-white">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Tulis konten artikel di sini...'}
                style={{ minHeight: '300px' }}
            />
        </div>
    );
}