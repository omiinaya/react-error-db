import React, { useState, useCallback } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { Eye, Edit3, Bold, Italic, List, ListOrdered, Quote, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';

interface ShadcnMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  showToolbar?: boolean;
}

const ShadcnMarkdownEditor: React.FC<ShadcnMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing in markdown...",
  className,
  height = 400,
  maxLength,
  showCharacterCount = true,
  showToolbar = true
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      ...(maxLength ? [CharacterCount.configure({
        limit: maxLength,
      })] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || editor.getHTML();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none min-h-[300px] p-4',
          'rounded-md border border-input bg-background',
          'text-sm leading-relaxed'
        ),
      },
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'write' | 'preview');
  };

  const currentLength = value.length;
  const charactersRemaining = maxLength ? maxLength - currentLength : undefined;
  const isOverLimit = maxLength && currentLength > maxLength;

  // Toolbar actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();

  const Toolbar = () => {
    if (!showToolbar || !editor) return null;

    return (
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={toggleBold}
          aria-label="Toggle bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={toggleItalic}
          aria-label="Toggle italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={toggleBulletList}
          aria-label="Toggle bullet list"
        >
          <List className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={toggleOrderedList}
          aria-label="Toggle ordered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={toggleBlockquote}
          aria-label="Toggle blockquote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={toggleCode}
          aria-label="Toggle code"
        >
          <Code className="h-4 w-4" />
        </Toggle>
      </div>
    );
  };

  return (
    <div className={cn("shadcn-markdown-editor", className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="write" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>
          
          {showCharacterCount && maxLength && (
            <div className={cn(
              "text-sm font-medium",
              isOverLimit ? "text-red-500" : 
              charactersRemaining && charactersRemaining < maxLength * 0.2 ? "text-yellow-500" : 
              "text-muted-foreground"
            )}>
              {currentLength} / {maxLength}
              {isOverLimit && ` (${Math.abs(charactersRemaining!)} over limit)`}
            </div>
          )}
        </div>

        <TabsContent value="write" className="mt-0">
          <div className="border rounded-lg overflow-hidden">
            <Toolbar />
            <EditorContent 
              editor={editor} 
              style={{ height: `${height}px` }}
              className="overflow-y-auto"
            />
          </div>
          
          {/* Markdown hints */}
          <div className="mt-2 text-xs text-muted-foreground flex flex-wrap gap-4">
            <span><code className="px-1 py-0.5 bg-muted rounded">**bold**</code> for bold text</span>
            <span><code className="px-1 py-0.5 bg-muted rounded">*italic*</code> for italic text</span>
            <span><code className="px-1 py-0.5 bg-muted rounded">`code`</code> for inline code</span>
            <span><code className="px-1 py-0.5 bg-muted rounded">```code```</code> for code blocks</span>
            <span><code className="px-1 py-0.5 bg-muted rounded">[link](url)</code> for links</span>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div 
            className="border rounded-lg p-4 bg-muted/30 overflow-y-auto"
            style={{ height: `${height}px` }}
          >
            <MarkdownRenderer 
              content={value}
              isPreview={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShadcnMarkdownEditor;