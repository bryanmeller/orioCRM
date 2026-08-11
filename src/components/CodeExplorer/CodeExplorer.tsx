import React, { useState } from 'react';
import { FLUTTER_PROJECT_TREE } from '../../data/flutterFiles';
import { FileNode } from '../../types/flutter';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  Search, 
  Download,
  Terminal,
  Code2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileNode>(
    FLUTTER_PROJECT_TREE[0] // pubspec.yaml initially or lib/main.dart
  );
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    lib: true,
    'lib/config': true,
    'lib/screens': true,
    'lib/screens/splash': true,
  });

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCopy = () => {
    if (selectedFile.content) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadAll = () => {
    // Generate downloadable text package or export
    const fullSourceText = flattenTree(FLUTTER_PROJECT_TREE)
      .filter(f => f.content)
      .map(f => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n\n${f.content}\n\n`)
      .join('\n');

    const blob = new Blob([fullSourceText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streamflix_tv_modulo1_codigo_completo.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const flattenTree = (nodes: FileNode[]): FileNode[] => {
    let result: FileNode[] = [];
    for (const node of nodes) {
      if (node.type === 'file') {
        result.push(node);
      } else if (node.children) {
        result = result.concat(flattenTree(node.children));
      }
    }
    return result;
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map((node) => {
      if (searchQuery && node.type === 'file') {
        const matchesName = node.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesContent = node.content?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesName && !matchesContent) return null;
      }

      if (node.type === 'folder') {
        const isOpen = openFolders[node.id] ?? depth < 2;
        return (
          <div key={node.id} className="select-none">
            <div
              onClick={() => toggleFolder(node.id)}
              style={{ paddingLeft: `${depth * 14 + 12}px` }}
              className="flex items-center gap-1.5 py-1.5 px-2 hover:bg-white/5 rounded-lg cursor-pointer text-gray-300 text-xs font-mono font-medium transition-colors"
            >
              {isOpen ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-500" />}
              {isOpen ? <FolderOpen size={15} className="text-gray-300" /> : <Folder size={15} className="text-gray-400" />}
              <span>{node.name}</span>
            </div>
            {isOpen && node.children && (
              <div>{renderTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      const isSelected = selectedFile.id === node.id;
      return (
        <div
          key={node.id}
          onClick={() => setSelectedFile(node)}
          style={{ paddingLeft: `${depth * 14 + 22}px` }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-xs font-mono transition-all ${
            isSelected
              ? 'bg-[#6A00FF] text-white font-bold shadow-sm shadow-[#6A00FF]/40 border-l-2 border-[#9C4DFF]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          {node.name.endsWith('.yaml') || node.name.endsWith('.xml') ? (
            <FileText size={14} className={isSelected ? 'text-white' : 'text-amber-400'} />
          ) : (
            <FileCode size={14} className={isSelected ? 'text-white' : 'text-cyan-400'} />
          )}
          <span className="truncate">{node.name}</span>
        </div>
      );
    });
  };

  return (
    <div className="w-full h-[calc(100vh-120px)] max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4">
      {/* File Tree Explorer Sidebar */}
      <div className="w-full lg:w-80 bg-[#000000] border border-white/10 rounded-lg flex flex-col overflow-hidden shadow-sm">
        {/* Search Header */}
        <div className="p-3.5 border-b border-white/10 bg-[#000000]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-tight">
              <Code2 size={16} className="text-gray-300" />
              <span>Arquivos Módulo 1</span>
            </div>
            <span className="text-xs text-gray-300 bg-[#6A00FF]/20 px-2.5 py-0.5 rounded-full font-mono font-bold border border-white/10">
              Flutter Dart
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivo ou classe..."
              className="w-full pl-9 pr-3 py-2 bg-[#1E1E1E] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30 font-medium"
            />
          </div>
        </div>

        {/* Tree List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
          {renderTree(FLUTTER_PROJECT_TREE)}
        </div>

        {/* Export Code Footer Button */}
        <div className="p-3 border-t border-white/10 bg-[#000000]">
          <button
            onClick={handleDownloadAll}
            className="w-full py-2.5 px-3 bg-white text-black hover:from-[#7b14ff] hover:to-[#a760ff] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all border border-white/10 cursor-pointer"
          >
            <Download size={14} />
            <span>Baixar Código Módulo 1 (TXT)</span>
          </button>
        </div>
      </div>

      {/* Code Editor Preview Area */}
      <div className="flex-1 bg-[#000000] border border-white/10 rounded-lg flex flex-col overflow-hidden shadow-sm">
        {/* Editor Top Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-[#000000] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-gray-300" />
              <span className="text-xs font-mono font-bold text-white">{selectedFile.path}</span>
            </div>
            {selectedFile.description && (
              <p className="text-xs text-gray-400 mt-0.5 font-medium">{selectedFile.description}</p>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white text-xs font-bold transition-colors border border-white/10 cursor-pointer shadow-sm"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Container */}
        <div className="flex-1 overflow-auto p-4 bg-[#000000] font-mono text-xs leading-relaxed text-gray-300 custom-scrollbar select-text">
          {selectedFile.content ? (
            <pre className="whitespace-pre tab-4">
              <code>{selectedFile.content}</code>
            </pre>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
              <FileCode size={40} className="mb-2 text-gray-600" />
              <span>Selecione um arquivo da árvore para visualizar o código Dart</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
