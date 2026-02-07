import React, { useState, useCallback } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarkdownRenderer from './MarkdownRenderer';
import { cn } from '@/lib/utils';
import { Eye, Edit3 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  maxLength?: number;
  showCharacterCount?: boolean;
  showToolbar?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
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
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleEditorChange = useCallback(({ text }: { text: string }) => {
    setLocalValue(text);
    onChange(text);
  }, [onChange]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'write' | 'preview');
  };

  const currentLength = localValue.length;
  const charactersRemaining = maxLength ? maxLength - currentLength : undefined;
  const isOverLimit = maxLength && currentLength > maxLength;

  // Custom toolbar configuration
  const toolbarConfig = showToolbar ? {
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    bold: true,
    italic: true,
    strikethrough: true,
    underline: true,
    listUl: true,
    listOl: true,
    link: true,
    unlink: true,
    quote: true,
    code: true,
    inlineCode: true,
    table: true,
    image: true,
    fullscreen: false,
    preview: false, // We'll use our own preview tab
    hideMenu: false,
    menu: true
  } : false;

  return (
    <div className={cn("markdown-editor-wrapper", className)}>
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
            <MdEditor
              value={localValue}
              style={{ height: `${height}px` }}
              renderHTML={(text) => text} // We'll handle rendering separately
              onChange={handleEditorChange}
              placeholder={placeholder}
              config={{
                view: {
                  menu: showToolbar,
                  md: true,
                  html: false,
                  fullScreen: false,
                  hideMenu: false,
                  toc: false
                },
                canView: {
                  menu: showToolbar,
                  md: true,
                  html: false,
                  fullScreen: false,
                  hideMenu: false,
                  toc: false
                },
                // Force show all toolbar items
                ...toolbarConfig,
                // Override any default hiding behavior
                toolbar: toolbarConfig
              }}
              className="markdown-editor"
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
              content={localValue}
              isPreview={true}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarkdownEditor;