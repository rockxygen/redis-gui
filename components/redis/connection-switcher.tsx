// components/redis/connection-switcher.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Plus, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Plug, 
  Loader2, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  getConnections,
  getActiveConnectionId,
  setActiveConnection,
  saveConnection,
  deleteConnection,
  testRedisConnection,
  RedisConnectionProfile,
} from '@/actions/connections';

export function ConnectionSwitcher({ onConnectionChanged }: { onConnectionChanged?: () => void }) {
  const [connections, setConnections] = useState<RedisConnectionProfile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; msg?: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    host: '127.0.0.1',
    port: 6379,
    password: '',
    tls: false,
  });

  const loadData = async () => {
    const list = await getConnections();
    const active = await getActiveConnectionId();
    setConnections(list);
    setActiveId(active || list[0]?.id || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeProfile = connections.find((c) => c.id === activeId) || {
    name: 'Localhost',
    host: '127.0.0.1',
    port: 6379,
  };

  const handleSelectServer = async (id: string) => {
    await setActiveConnection(id);
    setActiveId(id);
    if (onConnectionChanged) onConnectionChanged();
  };

  const handleOpenModal = () => {
    // Radix Dropdown kapanma animasyonu ve odak yönetiminin Dialog ile çakışmaması için
    // küçük bir zaman aşımı ile modal açılır.
    setTimeout(() => {
      setIsModalOpen(true);
    }, 100);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testRedisConnection(form);
    setIsTesting(false);
    if (res.success) {
      setTestResult({ success: true, msg: 'Bağlantı Başarılı (PONG)' });
    } else {
      setTestResult({ success: false, msg: res.error });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.host) return;

    await saveConnection(form);
    setIsModalOpen(false);
    setForm({ name: '', host: '127.0.0.1', port: 6379, password: '', tls: false });
    setTestResult(null);
    await loadData();
    if (onConnectionChanged) onConnectionChanged();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Bu sunucu profilini silmek istediğinize emin misiniz?')) {
      await deleteConnection(id);
      await loadData();
      if (onConnectionChanged) onConnectionChanged();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2 font-mono text-xs border-border bg-background">
            <Server className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {activeProfile.name}
            </span>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              ({activeProfile.host}:{activeProfile.port})
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64 bg-background">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Kayıtlı Redis Sunucuları</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 font-normal">
                Encrypted Cookie
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {connections.length === 0 ? (
              <div className="p-2 text-xs text-muted-foreground text-center">
                Kayıtlı özel sunucu bulunamadı (Localhost aktif).
              </div>
            ) : (
              connections.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSelectServer(item.id)}
                  className="flex items-center justify-between text-xs cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.id === activeId ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium truncate">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {item.host}:{item.port}
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => handleDelete(e, item.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Sunucuyu Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleOpenModal}
              className="text-xs font-semibold text-primary cursor-pointer gap-2"
            >
              <Plus className="h-3.5 w-3.5" /> Yeni Sunucu Ekle
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sunucu Ekleme Modalı */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground z-[100]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Yeni Redis Sunucu Bağlantısı
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Bağlantı Adı</label>
              <Input
                placeholder="Örn: Production Redis"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="font-medium text-muted-foreground">Host / IP</label>
                <Input
                  placeholder="127.0.0.1 veya redis.domain.com"
                  value={form.host}
                  onChange={(e) => setForm({ ...form, host: e.target.value })}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-muted-foreground">Port</label>
                <Input
                  type="number"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-muted-foreground">Parola (Opsiyonel)</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="tls"
                checked={form.tls}
                onChange={(e) => setForm({ ...form, tls: e.target.checked })}
                className="rounded border-input cursor-pointer"
              />
              <label htmlFor="tls" className="font-medium text-muted-foreground cursor-pointer">
                TLS / SSL Bağlantısını Etkinleştir (Upstash / Cloud için)
              </label>
            </div>

            {testResult && (
              <div
                className={`p-2 rounded text-[11px] font-mono ${
                  testResult.success
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-destructive/15 text-destructive border border-destructive/30'
                }`}
              >
                {testResult.msg}
              </div>
            )}

            <DialogFooter className="pt-3 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTesting || !form.host}
                className="h-8 text-xs gap-1.5"
              >
                {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                Bağlantıyı Test Et
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 text-xs"
                >
                  İptal
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs">
                  Kaydet ve Bağlan
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}