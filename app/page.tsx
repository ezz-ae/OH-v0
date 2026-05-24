'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LandingPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasInput, setHasInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('oh:door') === 'open') {
      router.replace('/house');
    }
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Use ref value as fallback if controlled state didn't update
    const passkey = value || inputRef.current?.value || '';
    const res = await fetch('/api/auth/passkey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passkey }),
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));

    if (res?.ok && json?.ok) {
      window.sessionStorage.setItem('oh:door', 'open');
      router.push('/house');
      return;
    }

    setLoading(false);
    setWrong(true);
    setValue('');
    setTimeout(() => setWrong(false), 600);
    inputRef.current?.focus();
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center font-sans">
      {/* Motion background with gold radial gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-1/2 animate-pulse">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-[pulse_6s_ease-in-out_infinite_1s]" />
        </div>
      </div>

      <form onSubmit={submit} className="relative z-10 w-full max-w-md px-8">
        <div className="mb-12 text-center">
          <h1 className="text-2xl md:text-3xl font-serif font-medium text-foreground mb-2 tracking-tight">
            The House Of Omnia
          </h1>
          <p className="text-sm text-muted-foreground">Command center for operations</p>
        </div>

        <div className={`relative mx-auto w-full max-w-sm transition-transform ${wrong ? 'animate-[shake_400ms_ease]' : ''}`}>
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${wrong ? 'text-destructive' : 'text-muted-foreground'}`} />
            <Input
              ref={inputRef}
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              placeholder="Enter passkey"
              className={`pl-9 pr-3 transition-colors ${wrong ? 'border-destructive focus:ring-destructive/50' : ''}`}
            />
          </div>
          {wrong && <p className="text-xs text-destructive mt-2">Invalid passkey</p>}
        </div>

        <Button
          type="submit"
          disabled={loading || !value}
          variant="default"
          className="w-full mt-6"
        >
          {loading ? 'Unlocking...' : 'Enter'}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-8 uppercase tracking-wider">
          Authorized personnel only
        </p>
      </form>
    </main>
  );
}
