import re

# Read the file
with open(r'e:\Next\kanglogo\app\admin\landing-content\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Replace the className
content = content.replace(
    'className="inline-flex items-center px-3 py-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-100 transition-colors"',
    'className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition flex-shrink-0" title="Edit"'
)

# Pattern 2: Replace the icon
content = content.replace(
    '<PencilIcon className="h-4 w-4 mr-1" />',
    '<PencilIcon className="h-5 w-5" />'
)

# Pattern 3: Remove standalone "Edit" text lines (with various whitespace)
lines = content.split('\n')
new_lines = []
for line in lines:
    # Skip lines that are just whitespace + "Edit" + whitespace
    if line.strip() == 'Edit':
        continue
    new_lines.append(line)

content = '\n'.join(new_lines)

# Write back
with open(r'e:\Next\kanglogo\app\admin\landing-content\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
