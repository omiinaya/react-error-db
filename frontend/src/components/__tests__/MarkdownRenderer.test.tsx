import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MarkdownRenderer from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders basic markdown content', () => {
    const markdownContent = `
# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`javascript
const example = "code block";
\`\`\`

[Link text](https://example.com)
    `;

    render(<MarkdownRenderer content={markdownContent} />);
    
    // Check for headings
    expect(screen.getByText('Heading 1')).toBeInTheDocument();
    expect(screen.getByText('Heading 2')).toBeInTheDocument();
    
    // Check for formatted text
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    
    // Check for list items
    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
    
    // Check for code block
    expect(screen.getByText('const example = "code block";')).toBeInTheDocument();
    
    // Check for link
    const link = screen.getByText('Link text');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('renders empty content message when content is empty', () => {
    render(<MarkdownRenderer content="" />);
    expect(screen.getByText('No content available')).toBeInTheDocument();
  });

  it('renders preview message when isPreview is true', () => {
    render(<MarkdownRenderer content="" isPreview={true} />);
    expect(screen.getByText('Preview will appear here...')).toBeInTheDocument();
  });

  it('sanitizes potentially dangerous HTML', () => {
    const maliciousContent = `
# Safe Heading

<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')" />
<a href="javascript:alert('XSS')">Click me</a>
    `;

    render(<MarkdownRenderer content={maliciousContent} />);
    
    // Safe content should be rendered
    expect(screen.getByText('Safe Heading')).toBeInTheDocument();
    
    // Malicious content should be sanitized and not rendered as executable code
    expect(screen.queryByText("alert('XSS')")).not.toBeInTheDocument();
  });

  it('renders tables correctly', () => {
    const tableContent = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
    `;

    render(<MarkdownRenderer content={tableContent} />);
    
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Header 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 3')).toBeInTheDocument();
    expect(screen.getByText('Cell 4')).toBeInTheDocument();
  });

  it('renders blockquotes correctly', () => {
    const quoteContent = `
> This is a blockquote
> With multiple lines
> And **formatting**
    `;

    render(<MarkdownRenderer content={quoteContent} />);
    
    // Check that the blockquote element exists
    const blockquote = document.querySelector('blockquote');
    expect(blockquote).toBeInTheDocument();
    expect(blockquote).toHaveClass('border-l-4', 'border-muted-foreground/20');
    expect(blockquote).toHaveTextContent('This is a blockquote');
    expect(blockquote).toHaveTextContent('With multiple lines');
    expect(blockquote).toHaveTextContent('And formatting');
  });
});