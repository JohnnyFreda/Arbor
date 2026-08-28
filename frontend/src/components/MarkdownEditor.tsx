import MDEditor from '@uiw/react-md-editor';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  // MDEditor themes itself from data-color-mode, not from Tailwind's dark
  // class, so it has to be told. Pinned to "light" it rendered a white panel
  // inside every dark page -- which only became obvious once dark was the
  // default rather than the opt-in.
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle image pasting (JPG, PNG, GIF, WebP, etc.)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // Check if we're pasting into the editor
      const target = e.target as HTMLElement;
      if (!editorRef.current?.contains(target)) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Check if the pasted item is an image (including JPG/JPEG)
        const isImage = item.type.indexOf('image') !== -1;
        const isJpeg = item.type === 'image/jpeg' || item.type === 'image/jpg';
        const isPng = item.type === 'image/png';
        const isGif = item.type === 'image/gif';
        const isWebP = item.type === 'image/webp';
        
        if (isImage || isJpeg || isPng || isGif || isWebP) {
          e.preventDefault();
          e.stopPropagation();
          
          const file = item.getAsFile();
          if (!file) continue;

          // Limit file size to 10MB to avoid performance issues with base64
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            alert(`Image is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please use an image smaller than 10MB.`);
            continue;
          }

          // Show loading indicator (optional - could add a toast notification)
          const imageName = file.name || `pasted-image.${item.type.split('/')[1] || 'jpg'}`;
          
          // Convert image to base64 data URL
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            
            // Create markdown image syntax
            // For JPG/JPEG, we'll use the data URL directly
            const imageMarkdown = `![${imageName}](${dataUrl})`;
            
            // Insert the image markdown at the current cursor position
            // If we can't determine cursor position, append to the end
            const currentValue = value || '';
            const separator = currentValue && !currentValue.endsWith('\n') ? '\n\n' : '\n';
            const newValue = currentValue + separator + imageMarkdown;
            onChange(newValue);
          };
          reader.onerror = () => {
            alert('Failed to process image. Please try again.');
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    // Attach paste event listener to document to catch all paste events
    document.addEventListener('paste', handlePaste, true);
    
    return () => {
      document.removeEventListener('paste', handlePaste, true);
    };
  }, [value, onChange]);

  return (
    <div 
      ref={editorRef}
      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-moss-500 focus-within:border-moss-500 dark:focus-within:ring-moss-500 dark:focus-within:border-moss-500 overflow-hidden"
      data-color-mode={theme}
    >
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setViewMode('edit')}
          className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            viewMode === 'edit'
              ? 'bg-moss-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setViewMode('preview')}
          className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            viewMode === 'preview'
              ? 'bg-moss-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setViewMode('split')}
          className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-moss-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
            viewMode === 'split'
              ? 'bg-moss-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Split
        </button>
      </div>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview={viewMode === 'edit' ? 'edit' : viewMode === 'preview' ? 'preview' : 'live'}
        hideToolbar={false}
      />
    </div>
  );
}

