const fs = require('fs');

// Read the file
let content = fs.readFileSync('e:\\Next\\kanglogo\\app\\admin\\landing-content\\page.tsx', 'utf8');

// Pattern 1: Replace the className
content = content.replace(/className="inline-flex items-center px-3 py-1\.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"/g,
  'className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition flex-shrink-0" title="Edit"');

// Pattern 2: Replace the icon
content = content.replace(/<PencilIcon className="h-4 w-4 mr-1" \/>/g,
  '<PencilIcon className="h-5 w-5" />');

// Pattern 3: Remove standalone "Edit" text lines
const lines = content.split('\n');
const newLines = lines.filter(line => line.trim() !== 'Edit');
content = newLines.join('\n');

// Write back
fs.writeFileSync('e:\\Next\\kanglogo\\app\\admin\\landing-content\\page.tsx', content, 'utf8');

console.log('Done! All Edit buttons have been converted to icon-only.');
