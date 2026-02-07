#!/bin/bash

# Shadcn Markdown Editor Migration Script
# This script migrates from react-markdown-editor-lite to shadcn-based Tiptap editor

set -e

echo "🚀 Starting Shadcn Markdown Editor Migration..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing Tiptap dependencies..."

cd frontend

# Install core Tiptap dependencies
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count

# Install additional extensions for enhanced functionality
npm install @tiptap/extension-code-block-lowlight @tiptap/extension-image @tiptap/extension-link @tiptap/extension-table

echo "✅ Tiptap dependencies installed successfully"

echo "🧹 Removing old dependencies..."

# Remove the old editor
npm uninstall react-markdown-editor-lite

echo "✅ Old dependencies removed"

echo "📝 Updating files..."

# Backup old files
if [ -f "src/components/MarkdownEditor.tsx" ]; then
    cp src/components/MarkdownEditor.tsx src/components/MarkdownEditor.tsx.backup
    echo "📋 Backed up old MarkdownEditor.tsx"
fi

if [ -f "src/styles/markdown-editor.css" ]; then
    cp src/styles/markdown-editor.css src/styles/markdown-editor.css.backup
    echo "📋 Backed up old markdown-editor.css"
fi

# Remove old files
rm -f src/components/MarkdownEditor.tsx
rm -f src/styles/markdown-editor.css

# Remove CSS import from globals.css
sed -i "s/@import '\.\/markdown-editor.css';//g" src/styles/globals.css

echo "✅ Old files cleaned up"

echo "🔧 Updating ErrorCreate component..."

# Update ErrorCreate.tsx to use the new component
sed -i 's/import MarkdownEditor from '\''@\/components\/MarkdownEditor'\'';/import ShadcnMarkdownEditor from '\''@\/components\/ShadcnMarkdownEditor'\'';/g' src/pages/ErrorCreate.tsx
sed -i 's/<MarkdownEditor/<ShadcnMarkdownEditor/g' src/pages/ErrorCreate.tsx
sed -i 's/<\/MarkdownEditor>/<\/ShadcnMarkdownEditor>/g' src/pages/ErrorCreate.tsx

echo "✅ ErrorCreate component updated"

echo "🔍 Running TypeScript check..."

npm run type-check

echo "✅ TypeScript check passed"

echo "🧪 Running build test..."

npm run build

echo "✅ Build test passed"

cd ..

echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the new editor by visiting the error creation page"
echo "2. Verify all toolbar buttons are visible and functional"
echo "3. Test the preview functionality"
echo "4. Check dark mode theming"
echo ""
echo "🔄 Rollback instructions (if needed):"
echo "- Restore backup files: MarkdownEditor.tsx.backup and markdown-editor.css.backup"
echo "- Reinstall old dependency: npm install react-markdown-editor-lite"
echo "- Revert ErrorCreate.tsx changes"
echo ""
echo "📖 For more information, see: docs/shadcn-editor-migration.md"