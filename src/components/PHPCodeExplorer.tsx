import React, { useState } from 'react';
import { PHP_CODE_TEMPLATES } from '../data/phpCodeTemplates';
import { PHPFile } from '../types';
import { FolderCode, FileCode, Copy, Check, Download, Info } from 'lucide-react';

export default function PHPCodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<PHPFile>(PHP_CODE_TEMPLATES[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-140px)]">
      {/* Code Header */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <FolderCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Mã Nguồn PHP 8.3 & MySQL Backend</h3>
            <p className="text-slate-400 text-sm">Toàn bộ mã nguồn backend hoàn chỉnh được viết bởi Senior PHP Developer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm font-medium transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép Code</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium transition"
          >
            <Download className="w-4 h-4" />
            <span>Tải file về</span>
          </button>
        </div>
      </div>

      {/* Explorer Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Folder Tree */}
        <div className="w-80 bg-slate-950 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-4">
          <div>
            <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">Thư mục dự án (PHP-POS)</div>
            <div className="flex flex-col gap-1">
              {PHP_CODE_TEMPLATES.map((file) => {
                const isSelected = selectedFile.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition text-sm ${
                      isSelected
                        ? 'bg-slate-800/80 text-sky-400 border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                    }`}
                  >
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-400'}`} />
                    <div className="overflow-hidden">
                      <div className="font-semibold truncate">{file.name}</div>
                      <div className="text-slate-500 text-xs truncate">{file.path}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto bg-slate-900/50 rounded-xl p-3.5 border border-slate-800/60">
            <div className="flex items-start gap-2.5 text-xs text-slate-400 leading-relaxed">
              <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300">Hướng dẫn cài đặt:</span>
                <ol className="list-decimal pl-4 mt-1.5 space-y-1">
                  <li>Tải file <code className="text-sky-400 font-mono">database.sql</code> về import vào MySQL database.</li>
                  <li>Cấu hình thông tin tài khoản ở file <code className="text-sky-400 font-mono">config.php</code>.</li>
                  <li>Copy toàn bộ file PHP vào thư mục root (vd: htdocs trên XAMPP) và truy cập trên trình duyệt.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
          {/* Active File Banner */}
          <div className="px-5 py-3.5 bg-[#161b22] border-b border-slate-800 text-sm text-slate-400 flex items-center justify-between">
            <span className="font-mono">
              Đang xem: <span className="text-emerald-400 font-semibold">{selectedFile.path}</span>
            </span>
            <span className="text-slate-500 italic text-xs">{selectedFile.description}</span>
          </div>

          {/* Code Viewer Container */}
          <div className="flex-1 overflow-y-auto p-5 font-mono text-xs md:text-sm leading-relaxed text-slate-300 select-text">
            <pre className="whitespace-pre">
              <code>
                {selectedFile.content.split('\n').map((line, index) => (
                  <div key={index} className="table-row hover:bg-slate-900/50">
                    <span className="table-cell text-slate-600 text-right pr-4 select-none border-r border-slate-900 bg-[#0d1117] sticky left-0 w-8">
                      {index + 1}
                    </span>
                    <span className="table-cell pl-4">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
