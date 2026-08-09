import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

const CodeDiffView = ({ originalCode, modifiedCode, language = 'javascript', darkMode }) => {
  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border shadow-2xl">
      <DiffEditor
        height="100%"
        language={language}
        original={originalCode}
        modified={modifiedCode}
        theme={darkMode ? 'vs-dark' : 'light'}
        options={{
          readOnly: true,               // Read-only mode enable 
          automaticLayout: true,       // Automatically adjust layout on window resize
          renderSideBySide: true,     // Render side-by-side diff view
          fontSize: 14,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
};

export default CodeDiffView;