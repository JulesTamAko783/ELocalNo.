import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import readmeContent from '../content/readme.md?raw';

/**
 * README viewer — renders the full Elokano language documentation
 * loaded directly from the project's README.md file.
 * Styled as an aged parchment manuscript.
 */

export default function ReadmeViewer() {
  return (
    <div className="h-full overflow-auto inabel-bg">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="panel p-6 rounded-sm readme-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {readmeContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
