"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo,
  Redo,
  Quote,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, mode]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  if (mode === 'html') {
    return (
      <div className={cn("border rounded-md", className)}>
        <div className="flex gap-1 p-2 border-b bg-muted/50">
          <button 
            type="button" 
            onClick={() => setMode('visual')} 
            className="h-8 px-3 inline-flex items-center justify-center rounded text-sm font-medium hover:bg-accent"
            data-testid="editor-visual-mode"
          >
            Visual
          </button>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Enter HTML content..."}
          className="w-full min-h-[200px] p-4 bg-transparent focus:outline-none resize-y font-mono text-sm"
          data-testid="editor-html-textarea"
        />
      </div>
    );
  }

  const ToolbarButton = ({ onClick, icon: Icon, label, testId }: { onClick: () => void; icon: any; label: string; testId: string }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="h-8 w-8 inline-flex items-center justify-center rounded text-sm font-medium hover:bg-accent transition-colors"
      title={label}
      data-testid={testId}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} label="Bold" testId="editor-bold" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} label="Italic" testId="editor-italic" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={UnderlineIcon} label="Underline" testId="editor-underline" />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h1')} icon={Heading1} label="Heading 1" testId="editor-h1" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h2')} icon={Heading2} label="Heading 2" testId="editor-h2" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'h3')} icon={Heading3} label="Heading 3" testId="editor-h3" />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} label="Bullet List" testId="editor-bullet-list" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} label="Numbered List" testId="editor-ordered-list" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} label="Blockquote" testId="editor-blockquote" />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton 
          onClick={() => {
            const sel = window.getSelection();
            const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
            const url = window.prompt('Enter URL:');
            if (url && range) {
              sel!.removeAllRanges();
              sel!.addRange(range);
              execCommand('createLink', url);
            }
          }} 
          icon={LinkIcon} 
          label="Insert Link" 
          testId="editor-link" 
        />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} label="Undo" testId="editor-undo" />
        <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} label="Redo" testId="editor-redo" />
        
        <div className="w-px h-8 bg-border mx-1" />
        
        <button 
          type="button" 
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMode('html')} 
          className="h-8 px-2 inline-flex items-center justify-center gap-1 rounded text-sm font-medium hover:bg-accent transition-colors"
          title="Edit HTML"
          data-testid="editor-html-mode"
        >
          <Code className="h-4 w-4" />
          <span className="text-xs">HTML</span>
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-4 focus:outline-none"
        data-testid="editor-content"
        data-placeholder={placeholder || "Start typing..."}
        suppressContentEditableWarning
      />
    </div>
  );
}
