import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// වෙනම කොම්පোনන්ට් එකක් ලෙස CodeBlock වෙන් කිරීම (Hooks දෝෂය මඟහරවා ගැනීමට)
function CodeBlock({ node, inline, className, children, darkMode, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeTab, setActiveTab] = useState('code');

  const isWebLanguage = match && ['html', 'css', 'javascript', 'js'].includes(match[1].toLowerCase());

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const lang = match ? match[1].toLowerCase() : 'txt';
    const extensionMap = {
      html: 'html', htm: 'html', css: 'css',
      javascript: 'js', js: 'js', jsx: 'jsx',
      typescript: 'ts', ts: 'ts', tsx: 'tsx',
      python: 'py', py: 'py', pyw: 'pyw',
      java: 'java', jar: 'jar', csharp: 'cs', cs: 'cs',
      php: 'php', ruby: 'rb', rb: 'rb', go: 'go',
      rust: 'rs', rs: 'rs', cpp: 'cpp', c: 'c', h: 'h',
      shell: 'sh', bash: 'sh', powershell: 'ps1',
      json: 'json', markdown: 'md', md: 'md', txt: 'txt'
    };

    const ext = extensionMap[lang] || lang || 'txt';
    const blob = new Blob([codeString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code_output.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  if (inline) {
    return <code className={`px-1.5 py-0.5 rounded text-chat-sm font-semibold custom-code-font ${darkMode ? 'bg-zinc-800 text-cyan-300 border border-zinc-700' : 'bg-slate-100 text-blue-600 border border-slate-200'}`} {...props}>{children}</code>;
  }

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl max-h-[550px] flex flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-chat-xs font-semibold shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          <span className="text-cyan-400 font-bold ml-1.5 custom-code-font">{match ? match[1].toUpperCase() : 'SOURCE CODE'}</span>
          
          {isWebLanguage && (
            <div className="flex bg-zinc-800 rounded-lg p-0.5 ml-3">
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-2 py-0.5 rounded text-[11px] font-sans ${activeTab === 'code' ? 'bg-cyan-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                Code
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-0.5 rounded text-[11px] font-sans ${activeTab === 'preview' ? 'bg-cyan-500 text-white font-bold' : 'text-zinc-400 hover:text-white'}`}
              >
                ▶ Preview
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleDownloadFile} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all text-chat-xs shadow-sm cursor-pointer active:scale-95 font-sans font-medium">{downloaded ? '✅ Saved!' : '📥 Download'}</button>
          <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all text-chat-xs shadow-sm cursor-pointer active:scale-95 font-sans font-medium">{copied ? '✅ Copied!' : '📋 Copy'}</button>
        </div>
      </div>

      {activeTab === 'preview' && isWebLanguage ? (
        <div className="w-full h-80 bg-white p-2">
          <iframe 
            srcDoc={codeString}
            title="Live Preview"
            sandbox="allow-scripts"
            className="w-full h-full border-none rounded"
          />
        </div>
      ) : (
        <div className="overflow-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-zinc-950 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          <pre className="p-4 text-code-base text-slate-200 leading-relaxed bg-black/70 custom-code-font m-0" {...props}><code>{children}</code></pre>
        </div>
      )}
    </div>
  );
}

export default function ChatMessageList({ chatHistory, darkMode, loading, loadingText }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, loading]);

  return (
    <div className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 max-w-5xl w-full mx-auto ${
      darkMode 
        ? '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#0e0e11] [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700' 
        : '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-50 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400'
    }`}>
      {chatHistory.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-70 max-w-md mx-auto my-auto pt-24">
          <div className="text-5xl mb-3">✨</div>
          <h2 className={`text-lg font-bold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Ask DevMate</h2>
          <p className={`text-chat-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Type your message below, upload code/images, or use quick shortcuts to begin.</p>
        </div>
      ) : (
        chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] px-5 py-4 rounded-2xl shadow-xl text-chat-base leading-relaxed border transition-all ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/30 rounded-br-none shadow-cyan-950/25 font-normal' 
                : darkMode ? 'bg-[#18181c]/95 text-slate-100 border-zinc-800 rounded-bl-none shadow-black/60' : 'bg-white text-slate-800 border-slate-200 rounded-bl-none shadow-md'
            }`}>
              {msg.sender === 'user' ? (
                <div>
                  {msg.fileName && (
                    <div className="mb-2 px-3 py-1.5 rounded-lg bg-black/25 text-xs flex items-center gap-2 border border-white/20 font-medium">
                      <span>📁</span>
                      <span className="truncate">{msg.fileName}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              ) : (
                <div className="document-template space-y-3.5">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: (props) => <CodeBlock {...props} darkMode={darkMode} />,
                      p({children}) { return <p className={`leading-relaxed mb-3.5 text-chat-base font-normal tracking-wide ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</p>; },
                      h1({children}) { return <div className={`border-b pb-2 mb-3 mt-5 ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`}><h1 className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">{children}</h1></div>; },
                      h2({children}) { return <div className={`flex items-center gap-2 font-bold text-lg mt-5 mb-2.5 pb-1.5 border-b border-dashed ${darkMode ? 'text-cyan-300 border-zinc-800' : 'text-blue-700 border-slate-200'}`}><span className="text-sm">📌</span><span>{children}</span></div>; },
                      h3({children}) { return <div className={`p-3 rounded-xl border my-3 font-bold text-base flex items-center gap-2.5 shadow-sm ${darkMode ? 'bg-zinc-900/80 border-zinc-800 text-cyan-400' : 'bg-slate-50 border-slate-200 text-blue-800'}`}><span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span><span>{children}</span></div>; },
                      strong({children}) { return <strong className={`font-bold ${darkMode ? 'text-cyan-300' : 'text-blue-700'}`}>{children}</strong>; },
                      ul({children}) { return <ul className={`list-disc pl-5 space-y-1.5 mb-3.5 marker:text-cyan-500 text-chat-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</ul>; },
                      ol({children}) { return <ol className={`list-decimal pl-5 space-y-1.5 mb-3.5 marker:text-cyan-500 font-medium text-chat-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{children}</ol>; },
                      li({children}) { return <li className="leading-relaxed pl-1">{children}</li>; },
                      table({children}) { return <div className={`overflow-x-auto my-4 rounded-xl border shadow-lg ${darkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-slate-200 bg-white'}`}><table className="w-full border-collapse text-left text-chat-sm">{children}</table></div>; },
                      thead({children}) { return <thead className={darkMode ? 'bg-zinc-900 text-cyan-400 border-b border-zinc-800' : 'bg-slate-100 text-blue-800 border-b border-slate-200'}>{children}</thead>; },
                      th({children}) { return <th className="px-4 py-3 font-bold tracking-wider">{children}</th>; },
                      td({children}) { return <td className={`px-4 py-3 border-b ${darkMode ? 'border-zinc-900 text-slate-300' : 'border-slate-100 text-slate-700'}`}>{children}</td>; },
                      img({src, alt}) { return <div className="my-4 flex flex-col items-center"><img src={src} alt={alt} className="rounded-xl border border-zinc-700 max-h-80 object-cover shadow-xl" />{alt && <span className="text-chat-xs text-slate-400 mt-1.5 italic font-medium">📷 {alt}</span>}</div>; },
                      blockquote({children}) { return <div className={`border-l-4 p-3.5 my-3.5 rounded-r-xl border-y border-r shadow-inner ${darkMode ? 'border-cyan-500 text-slate-300 bg-cyan-950/20 border-cyan-900/30' : 'border-blue-500 text-slate-700 bg-blue-50/80 border-blue-200'}`}><div className="italic text-chat-base">{children}</div></div>; }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))
      )}
      
      {loading && (
        <div className="flex justify-start items-center gap-3">
          <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm animate-spin ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>⏳</div>
          <div className={`border px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2.5 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-cyan-300' : 'bg-white border-slate-200 text-blue-700'}`}>
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
            <span className="text-chat-sm font-semibold">{loadingText}</span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}