# Rich Text Markdown Implementation

This document describes the rich text markdown functionality implemented for the React Error Database application.

## Overview

The application now supports rich text markdown formatting for both error descriptions and solution content. Users can create and edit content using a rich text editor with live preview functionality.

## Components

### MarkdownRenderer Component
**Location:** [`frontend/src/components/MarkdownRenderer.tsx`](frontend/src/components/MarkdownRenderer.tsx)

A reusable component that safely renders markdown content with:
- XSS protection through content sanitization
- Support for GitHub Flavored Markdown (GFM)
- Tables, blockquotes, code blocks, and inline code
- Links and images
- Lists (ordered and unordered)

**Usage:**
```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

<MarkdownRenderer content={markdownContent} isPreview={false} />
```

### MarkdownEditor Component
**Location:** [`frontend/src/components/MarkdownEditor.tsx`](frontend/src/components/MarkdownEditor.tsx)

A rich text editor with:
- Live preview functionality (Write/Preview tabs)
- Comprehensive toolbar with formatting options
- Character counting with visual indicators
- XSS-safe content handling
- Responsive design for mobile devices

**Features:**
- Headers (H1-H6)
- Bold, italic, strikethrough, underline
- Lists (ordered/unordered)
- Links and images
- Code blocks and inline code
- Tables
- Blockquotes
- Full-screen editing mode

**Usage:**
```tsx
import MarkdownEditor from '@/components/MarkdownEditor';

<MarkdownEditor
  value={content}
  onChange={setContent}
  placeholder="Enter your content..."
  maxLength={5000}
  showCharacterCount={true}
  height={400}
/>
```

## Styling

### Markdown Content Styling
**Location:** [`frontend/src/styles/markdown-content.css`](frontend/src/styles/markdown-content.css)

Comprehensive styling for rendered markdown including:
- Typography (headings, paragraphs, lists)
- Code blocks with syntax highlighting support
- Tables with borders and alternating rows
- Blockquotes with left border styling
- Links with hover effects
- Dark mode support

### Markdown Editor Styling
**Location:** [`frontend/src/styles/markdown-editor.css`](frontend/src/styles/markdown-editor.css)

Custom styling for the rich text editor:
- Toolbar button styling and hover effects
- Responsive design for mobile devices
- Dark mode support
- Scrollbar styling for horizontal toolbar
- Dropdown menu positioning and z-index management

## Integration Points

### Error Creation
**Location:** [`frontend/src/pages/ErrorCreate.tsx`](frontend/src/pages/ErrorCreate.tsx)

The error creation form now uses the MarkdownEditor for the description field, replacing the previous textarea.

### Error Detail View
**Location:** [`frontend/src/pages/ErrorDetail.tsx`](frontend/src/pages/ErrorDetail.tsx)

Error descriptions and solution content are now rendered using the MarkdownRenderer component.

### Solution Editing
**Location:** [`frontend/src/components/EditSolutionDialog.tsx`](frontend/src/components/EditSolutionDialog.tsx)

Solution editing now uses the MarkdownEditor for rich text formatting.

## Security Features

### XSS Protection
- All markdown content is sanitized using `rehype-sanitize`
- Dangerous HTML elements and attributes are removed
- JavaScript execution is prevented

### Content Validation
- Backend validation schemas updated to handle markdown content
- Character limits enforced on both frontend and backend
- Input sanitization on API endpoints

## Dependencies

### Frontend Dependencies
```json
{
  "react-markdown": "^9.0.1",
  "react-markdown-editor-lite": "^1.3.4",
  "remark-gfm": "^4.0.0",
  "rehype-raw": "^7.0.0",
  "rehype-sanitize": "^6.0.0"
}
```

## Testing

### Test Coverage
**Location:** [`frontend/src/components/__tests__/MarkdownRenderer.test.tsx`](frontend/src/components/__tests__/MarkdownRenderer.test.tsx)

Comprehensive test suite covering:
- Basic markdown rendering
- Empty content handling
- Preview mode functionality
- XSS protection and sanitization
- Table rendering
- Blockquote rendering

**Run tests:**
```bash
cd frontend
npm test -- src/components/__tests__/MarkdownRenderer.test.tsx
```

## Configuration

### Editor Configuration
The MarkdownEditor component accepts the following props:
- `value`: string - The markdown content
- `onChange`: function - Callback when content changes
- `placeholder`: string - Placeholder text
- `className`: string - Additional CSS classes
- `height`: number - Editor height in pixels (default: 400)
- `maxLength`: number - Maximum character limit
- `showCharacterCount`: boolean - Show character counter (default: true)
- `showToolbar`: boolean - Show formatting toolbar (default: true)

### Renderer Configuration
The MarkdownRenderer component accepts:
- `content`: string - The markdown content to render
- `className`: string - Additional CSS classes
- `isPreview`: boolean - Apply preview styling (default: false)

## Usage Examples

### Basic Usage
```tsx
import { useState } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';
import MarkdownRenderer from '@/components/MarkdownRenderer';

function MyComponent() {
  const [content, setContent] = useState('# Hello World\n\nThis is **bold** text.');

  return (
    <div>
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="Write something..."
      />
      <div className="mt-4">
        <h3>Preview:</h3>
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
```

### With Validation
```tsx
<MarkdownEditor
  value={description}
  onChange={setDescription}
  maxLength={2000}
  showCharacterCount={true}
  placeholder="Describe the error..."
/>
```

## Browser Compatibility

The implementation is compatible with:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- Lazy loading of markdown parsing libraries
- Efficient re-rendering with React.memo
- Debounced input handling for large documents
- Optimized CSS with minimal specificity

## Troubleshooting

### Common Issues

1. **Toolbar buttons not visible**
   - Check CSS imports in your component
   - Ensure `markdown-editor.css` is imported
   - Verify browser console for any CSS conflicts

2. **Markdown not rendering**
   - Check that content is being passed correctly
   - Verify markdown syntax is valid
   - Check browser console for parsing errors

3. **Preview not updating**
   - Ensure `onChange` callback is properly implemented
   - Check for state management issues
   - Verify component re-rendering

### Debug Mode

Enable debug logging by setting:
```typescript
window.DEBUG_MARKDOWN = true;
```

## Future Enhancements

Potential improvements for future versions:
- Image upload functionality
- Custom toolbar buttons
- Collaborative editing
- Export to PDF functionality
- Advanced table editing
- Code syntax highlighting themes
- Math equation support (KaTeX)

## Support

For issues or questions regarding the markdown implementation:
1. Check existing tests for usage examples
2. Review component source code
3. Check browser console for errors
4. Verify all dependencies are properly installed