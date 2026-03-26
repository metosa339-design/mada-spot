'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import NextImage from 'next/image';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Quote, Heading2, Heading3 } from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  availableImages: string[];
  onInsertImage?: (url: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  availableImages,
  placeholder: _placeholder = "Écrivez votre article ici..."
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL du lien:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    // Show image picker modal
    const imageUrl = window.prompt('URL de l\'image (ou choisissez dans la galerie):');
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  }, [editor]);

  const insertImageFromGallery = useCallback((url: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="h-[400px] bg-white/5 animate-pulse rounded-lg" />;
  }

  return (
    <div className="border border-[#2a2a36] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#12121a] border-b border-[#2a2a36] p-2 flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#2a2a36]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('bold') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Gras (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('italic') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Italique (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2a2a36]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Titre H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Titre H3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2a2a36]">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('bulletList') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('orderedList') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('blockquote') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Citation"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* Links and images */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2a2a36]">
          <button
            type="button"
            onClick={addLink}
            className={`p-2 rounded hover:bg-white/10 transition-colors ${
              editor.isActive('link') ? 'bg-white/10 text-blue-600' : 'text-gray-400'
            }`}
            title="Ajouter un lien"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400"
            title="Insérer une image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400 disabled:opacity-30"
            title="Annuler (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400 disabled:opacity-30"
            title="Rétablir (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Image gallery for quick insert */}
      {availableImages.length > 0 && (
        <div className="border-t border-[#2a2a36] p-3 bg-[#12121a]">
          <p className="text-xs text-gray-500 mb-2">Insérer une image de la galerie:</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableImages.map((imgUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertImageFromGallery(imgUrl)}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-[#2a2a36] hover:border-blue-500 transition-colors"
              >
                <NextImage src={imgUrl} alt={`Image ${index + 1}`} fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
