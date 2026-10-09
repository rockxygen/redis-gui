// components/redis/zset-editor.tsx
'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, ArrowUpDown } from 'lucide-react';

export interface ZSetMember {
  value: string;
  score: number;
}

interface ZSetEditorProps {
  keyName: string;
  initialMembers: ZSetMember[];
  onSaveMember: (member: string, score: number) => Promise<void>;
  onRemoveMember: (member: string) => Promise<void>;
}

export function ZSetEditor({ keyName, initialMembers, onSaveMember, onRemoveMember }: ZSetEditorProps) {
  const [members, setMembers] = useState<ZSetMember[]>(initialMembers);
  const [newValue, setNewValue] = useState('');
  const [newScore, setNewScore] = useState<number>(0);

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    await onSaveMember(newValue, newScore);
    setMembers((prev) => [...prev, { value: newValue, score: newScore }]);
    setNewValue('');
    setNewScore(0);
  };

  const handleRemove = async (val: string) => {
    await onRemoveMember(val);
    setMembers((prev) => prev.filter((m) => m.value !== val));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Yeni Member Ekleme */}
      <div className="p-3 border-b border-border flex items-center gap-2 bg-muted/20">
        <Input
          placeholder="Member değeri..."
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="h-8 text-xs font-mono"
        />
        <Input
          type="number"
          placeholder="Score"
          value={newScore}
          onChange={(e) => setNewScore(Number(e.target.value))}
          className="w-24 h-8 text-xs font-mono"
        />
        <Button size="sm" onClick={handleAdd} className="h-8 text-xs gap-1">
          <Plus className="h-3.5 w-3.5" /> Ekle
        </Button>
      </div>

      {/* ZSet Tablosu */}
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Value</TableHead>
              <TableHead className="w-[120px]">
                <div className="flex items-center gap-1">
                  Score <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[60px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.value} className="text-xs">
                <TableCell className="font-mono">{m.value}</TableCell>
                <TableCell className="font-mono font-bold text-amber-500">{m.score}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(m.value)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}