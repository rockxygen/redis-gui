// components/redis/key-tree.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Key, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  RefreshCw, 
  Plus 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildKeyTree, KeyNode } from '@/lib/redis-tree';

interface KeyTreeProps {
  keys: Array<{ key: string; type?: KeyNode['type'] }>;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
  onRefresh?: () => void;
  onAddKey?: () => void;
  isLoading?: boolean;
}

// Key tipine göre rozet renkleri
const TYPE_COLORS: Record<string, string> = {
  string: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  hash: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  list: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  set: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  zset: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
  json: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  stream: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
};

export function KeyTree({
  keys,
  selectedKey,
  onSelectKey,
  onRefresh,
  onAddKey,
  isLoading = false,
}: KeyTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Arama filtresi
  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return keys;
    return keys.filter((item) =>
      item.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [keys, searchQuery]);

  // Tree veri yapısını oluştur
  const treeData = useMemo(() => {
    return buildKeyTree(filteredKeys);
  }, [filteredKeys]);

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  return (
    <div className="flex flex-col h-full border-r bg-sidebar border-border select-none w-80">
      {/* Üst Araç Çubuğu */}
      <div className="p-3 space-y-2 border-b border-border">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Keys ({keys.length})
          </span>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {onAddKey && (
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={onAddKey}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Arama Inputu */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Tree Liste Alanı */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {treeData.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {searchQuery ? 'No keys match your search.' : 'No keys found in Redis.'}
          </div>
        ) : (
          treeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              selectedKey={selectedKey}
              onSelectKey={onSelectKey}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Rekürsif Tree Node Bileşeni
interface TreeNodeProps {
  node: KeyNode;
  level: number;
  openFolders: Record<string, boolean>;
  toggleFolder: (id: string) => void;
  selectedKey: string | null;
  onSelectKey: (key: string) => void;
}

function TreeNode({
  node,
  level,
  openFolders,
  toggleFolder,
  selectedKey,
  onSelectKey,
}: TreeNodeProps) {
  const isOpen = openFolders[node.id] ?? false;
  const isSelected = selectedKey === node.fullKey;

  // Girintileme için sol marjin
  const paddingLeft = `${level * 12 + 8}px`;

  if (node.isFolder) {
    return (
      <div className="space-y-0.5">
        <div
          onClick={() => toggleFolder(node.id)}
          style={{ paddingLeft }}
          className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-accent/50 cursor-pointer text-xs font-medium text-foreground transition-colors group"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                selectedKey={selectedKey}
                onSelectKey={onSelectKey}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Key Node (Yaprak Düğüm)
  return (
    <div
      onClick={() => node.fullKey && onSelectKey(node.fullKey)}
      style={{ paddingLeft }}
      className={`flex items-center justify-between gap-1.5 py-1 px-2 rounded-md cursor-pointer text-xs transition-colors ${
        isSelected
          ? 'bg-primary text-primary-foreground font-medium'
          : 'hover:bg-accent text-muted-foreground hover:text-foreground'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <Key className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
        <span className="truncate" title={node.fullKey}>
          {node.name}
        </span>
      </div>

      {node.type && (
        <Badge
          variant="outline"
          className={`text-[9px] px-1 py-0 h-4 border uppercase font-semibold shrink-0 ${
            isSelected ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' : TYPE_COLORS[node.type]
          }`}
        >
          {node.type}
        </Badge>
      )}
    </div>
  );
}