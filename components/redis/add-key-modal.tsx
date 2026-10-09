// components/redis/add-key-modal.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Key, Clock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setKeyValue, RedisKeyItem } from '@/actions/redis';

const addKeySchema = z.object({
  key: z.string().min(1, 'Key adı boş olamaz.'),
  type: z.enum(['string', 'json', 'hash', 'list']),
  value: z.string().min(1, 'Veri içeriği boş olamaz.'),
  ttl: z.coerce.number().default(-1),
});

type AddKeyFormValues = z.infer<typeof addKeySchema>;

interface AddKeyModalProps {
  onSuccess: () => void;
}

export function AddKeyModal({ onSuccess }: AddKeyModalProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddKeyFormValues>({
    resolver: zodResolver(addKeySchema),
    defaultValues: {
      key: '',
      type: 'string',
      value: '',
      ttl: -1,
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (values: AddKeyFormValues) => {
    try {
      if (values.type === 'json') {
        JSON.parse(values.value);
      }
      await setKeyValue(values.key, values.value, values.type as RedisKeyItem['type'], values.ttl);
      reset();
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      alert(err.message || 'Key eklenirken hata oluştu.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ✅ FIX: asChild kaldırıldı */}
      <DialogTrigger className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-7 px-3 gap-1">
        <Plus className="h-3.5 w-3.5" />
        Yeni Key
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            Yeni Redis Key Ekle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Key Adı</label>
            <Input
              placeholder="Örn: user:102:profile"
              {...register('key')}
              className="h-8 text-xs font-mono"
            />
            {errors.key && <p className="text-[10px] text-destructive">{errors.key.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Veri Tipi</label>
            <select
              {...register('type')}
              className="w-full h-8 px-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="string">String</option>
              <option value="json">JSON</option>
              <option value="hash">Hash</option>
              <option value="list">List</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Değer (Value)</label>
            <textarea
              rows={4}
              placeholder={
                selectedType === 'json'
                  ? '{\n  "status": "active"\n}'
                  : 'Değer giriniz...'
              }
              {...register('value')}
              className="w-full p-2 text-xs font-mono rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {errors.value && <p className="text-[10px] text-destructive">{errors.value.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> TTL (Saniye, -1 Süresiz)
            </label>
            <Input type="number" {...register('ttl')} className="h-8 text-xs font-mono" />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 text-xs"
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm" className="h-8 text-xs">
              {isSubmitting ? 'Ekleniyor...' : 'Key Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}