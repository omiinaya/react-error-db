# Rich Text Markdown Support

This document describes the rich text markdown support implemented for error descriptions and solutions in the Error Database application.

## Overview

The application now supports rich text markdown formatting for:
- Error descriptions
- Solution texts

This allows users to create well-formatted, readable content with support for:
- Headers (H1-H6)
- Bold and italic text
- Code blocks and inline code
- Lists (ordered and unordered)
- Links
- Tables
- Blockquotes
- Images (with sanitization)

## Components

### MarkdownRenderer
A reusable component that safely renders markdown content with XSS protection.

**Usage:**
```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

// Basic usage
<MarkdownRenderer content={markdownString} />

// With custom styling
<MarkdownRenderer content={markdownString} className="custom-class" />

// Preview mode
<MarkdownRenderer content={markdownString} isPreview={true} />
```

### MarkdownEditor
A rich text editor with live preview functionality.

**Usage:**
```tsx
import MarkdownEditor from '@/components/MarkdownEditor';

// Basic usage
<MarkdownEditor
  value={content}
  onChange={setContent}
  placeholder="Enter your content..."
/>

// With advanced options
<MarkdownEditor
  value={content}
  onChange={setContent}
  placeholder="Enter your content..."
  height={400}
  maxLength={5000}
  showCharacterCount={true}
  showToolbar={true}
/>
```

## Features

### 1. Live Preview
The editor includes a "Write" and "Preview" tab, allowing users to see how their markdown will be rendered in real-time.

### 2. Toolbar Support
The editor provides a toolbar with common formatting options:
- Headers (H1, H2, H3)
- Bold, italic, strikethrough
- Lists (ordered/unordered)
- Links
- Code blocks and inline code
- Tables
- Blockquotes

### 3. Character Counting
Built-in character counting with visual indicators:
- Normal: Gray text
- Warning (80% of limit): Yellow text
- Over limit: Red text with negative count

### 4. Security
- XSS protection through `rehype-sanitize`
- Configurable allowed HTML tags and attributes
- Safe handling of user-generated content

### 5. Responsive Design
- Mobile-friendly interface
- Touch-friendly toolbar buttons
- Adaptive layout for different screen sizes

## Markdown Syntax Support

### Basic Formatting
```markdown
**bold text**
*italic text*
~~strikethrough~~
```

### Headers
```markdown
# H1 Header
## H2 Header
### H3 Header
```

### Lists
```markdown
- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2
```

### Code
```markdown
Inline `code` text

```javascript
// Code block
const example = "Hello World";
```
```

### Links and Images
```markdown
[Link text](https://example.com)

![Alt text](image-url.jpg)
```

### Tables
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Blockquotes
```markdown
> This is a blockquote
> With multiple lines
```

## Implementation Details

### Database Schema
No changes were required to the database schema. The existing `String` fields for `description` and `solutionText` can store markdown content.

### Validation
The backend validation schemas have been updated to handle markdown content while maintaining the same character limits:
- Error descriptions: 5000 characters max
- Solution texts: 10000 characters max

### Styling
Custom CSS has been implemented to ensure proper styling of rendered markdown content, including:
- Consistent typography
- Code syntax highlighting colors
- Table borders and spacing
- Blockquote styling
- Link colors and hover effects

## Usage Examples

### Creating an Error with Rich Description
1. Navigate to the error creation page
2. Use the markdown editor in the "Description" field
3. Format your content using the toolbar or markdown syntax
4. Switch to the "Preview" tab to see how it will look
5. Submit the form

### Adding a Solution with Formatting
1. On any error detail page, scroll to the solutions section
2. Use the markdown editor in the "Add Solution" form
3. Format your solution with code blocks, lists, or other markdown features
4. Preview your formatting before submitting

### Editing Solutions
1. Click the edit button on your solution
2. The edit dialog will open with the markdown editor
3. Make your changes with full formatting support
4. Preview and save your changes

## Best Practices

1. **Use headers** to structure long content
2. **Add code blocks** for error messages, configurations, or code examples
3. **Use lists** for step-by-step instructions
4. **Include links** to relevant documentation or resources
5. **Preview before submitting** to ensure proper formatting
6. **Stay within character limits** to avoid submission issues

## Troubleshooting

### Common Issues
1. **Character limit exceeded**: Check the character counter and reduce content
2. **Formatting not working**: Ensure you're using correct markdown syntax
3. **Preview not updating**: Switch between Write/Preview tabs to refresh

### Browser Compatibility
The markdown editor and renderer are compatible with all modern browsers. For older browsers, a graceful fallback to plain text is provided.

## Future Enhancements
Potential future improvements include:
- Image upload functionality
- Math equation support (LaTeX)
- Mermaid diagram support
- Custom color themes
- Collaborative editing features