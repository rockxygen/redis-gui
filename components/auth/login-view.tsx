// components/auth/login-view.tsx
'use client';

import React, { useState } from 'react';
import { Database, Lock, KeyRound, ShieldAlert, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { loginAction, changePasswordAction } from '@/actions/auth';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [step, setStep] = useState<'login' | 'change_password'>('login');
  
  // Login Form
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  
  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('123456');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await loginAction(username, password);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Giriş başarısız.');
      return;
    }

    if (res.mustChangePassword) {
      setStep('change_password');
    } else {
      onLoginSuccess();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await changePasswordAction(currentPassword, newPassword);
    setIsLoading(false);

    if (!res.success) {
      setError(res.error || 'Şifre değiştirilemedi.');
      return;
    }

    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 select-none">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur text-slate-100 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-2xl w-fit text-primary">
            <Database className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">Redis Management GUI</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {step === 'login'
              ? 'Yönetim paneline erişmek için kimlik bilgilerinizi girin.'
              : 'Güvenliğiniz için varsayılan şifrenizi değiştirmeniz gerekmektedir.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'login' ? (
            /* 1. GİRİŞ FORMU */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Kullanıcı Adı</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono h-9 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Şifre</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono h-9 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="p-2.5 rounded bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Varsayılan Giriş: <strong>admin</strong> / <strong>123456</strong></span>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs font-semibold gap-2 mt-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Giriş Yap'}
                {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
              </Button>
            </form>
          ) : (
            /* 2. ZORUNLU ŞİFRE DEĞİŞTİRME FORMU */
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-400" />
                <span>İlk kez oturum açtınız. Lütfen yeni bir şifre belirleyin.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Mevcut Şifre</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Yeni Şifre</label>
                <Input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Yeni Şifre (Tekrar)</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs font-mono h-8"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs font-semibold gap-2 mt-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Şifreyi Güncelle ve Başla
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}