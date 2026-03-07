"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect, useCallback } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Undo, Redo, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Palette,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your article content here..." }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none min-h-[420px] px-6 py-5 focus:outline-none text-slate-700 leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btnBase = "p-2 rounded-lg transition-all text-slate-500 hover:bg-slate-100 hover:text-slate-900";
  const btnActive = "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    attrs ? editor.isActive(name, attrs) : editor.isActive(name);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-slate-100 bg-slate-50/80">

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={`${btnBase} disabled:opacity-30`} title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={`${btnBase} disabled:opacity-30`} title="Redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${btnBase} ${isActive("heading", { level: 1 }) ? btnActive : ""}`} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnBase} ${isActive("heading", { level: 2 }) ? btnActive : ""}`} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnBase} ${isActive("heading", { level: 3 }) ? btnActive : ""}`} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnBase} ${isActive("bold") ? btnActive : ""}`} title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnBase} ${isActive("italic") ? btnActive : ""}`} title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnBase} ${isActive("underline") ? btnActive : ""}`} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnBase} ${isActive("strike") ? btnActive : ""}`} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={`${btnBase} ${isActive("code") ? btnActive : ""}`} title="Inline Code">
            <Code className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`${btnBase} ${isActive({ textAlign: "left" }) ? btnActive : ""}`} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`${btnBase} ${isActive({ textAlign: "center" }) ? btnActive : ""}`} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`${btnBase} ${isActive({ textAlign: "right" }) ? btnActive : ""}`} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`${btnBase} ${isActive({ textAlign: "justify" }) ? btnActive : ""}`} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200 mr-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnBase} ${isActive("bulletList") ? btnActive : ""}`} title="Bullet List">
            <List className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnBase} ${isActive("orderedList") ? btnActive : ""}`} title="Ordered List">
            <ListOrdered className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btnBase} ${isActive("blockquote") ? btnActive : ""}`} title="Blockquote">
            <Quote className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnBase} title="Divider">
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={setLink} className={`${btnBase} ${isActive("link") ? btnActive : ""}`} title="Insert Link">
            <LinkIcon className="w-4 h-4" />
          </button>
          <button type="button" onClick={addImage} className={btnBase} title="Insert Image">
            <ImageIcon className="w-4 h-4" />
          </button>
          <label className={`${btnBase} cursor-pointer relative`} title="Text Color">
            <Palette className="w-4 h-4" />
            <input
              type="color"
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              onChange={e => editor.chain().focus().setColor(e.target.value).run()}
            />
          </label>
        </div>
      </div>

      <EditorContent editor={editor} />

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 1.5rem 0 0.75rem; line-height: 1.2; }
        .ProseMirror h2 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 1.25rem 0 0.6rem; line-height: 1.3; }
        .ProseMirror h3 { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 1rem 0 0.5rem; }
        .ProseMirror p { margin-bottom: 1rem; line-height: 1.75; }
        .ProseMirror ul { list-style: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        .ProseMirror ol { list-style: decimal; margin-left: 1.5rem; margin-bottom: 1rem; }
        .ProseMirror li { margin-bottom: 0.35rem; }
        .ProseMirror a { color: #4f46e5; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .ProseMirror strong { color: #0f172a; font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror code { background: #f1f5f9; color: #4f46e5; padding: 0.15rem 0.4rem; border-radius: 0.375rem; font-size: 0.875em; font-family: monospace; }
        .ProseMirror pre { background: #1e293b; color: #e2e8f0; padding: 1.25rem 1.5rem; border-radius: 0.875rem; overflow-x: auto; margin: 1.25rem 0; font-size: 0.875rem; }
        .ProseMirror pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
        .ProseMirror blockquote { border-left: 3px solid #6366f1; background: #f5f3ff; padding: 0.75rem 1.25rem; border-radius: 0 0.75rem 0.75rem 0; margin: 1.25rem 0; color: #4b5563; font-style: italic; }
        .ProseMirror hr { border: none; border-top: 1px solid #e2e8f0; margin: 2rem 0; }
        .ProseMirror img { border-radius: 1rem; max-width: 100%; margin: 1.5rem 0; box-shadow: 0 10px 30px -8px rgb(0 0 0 / 0.12); }
        .ProseMirror *::selection { background: #e0e7ff; }
      `}</style>
    </div>
  );
}
