import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hashPassword } from '@/utils/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { LogIn, Package, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Preencha o usuário e a senha.');
      return;
    }

    setIsLoading(true);
    try {
      const hashed = await hashPassword(password);
      const success = await login(username.trim(), hashed);
      
      if (success) {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        toast.error('Usuário ou senha incorretos, ou usuário inativo.');
      }
    } catch (error) {
      toast.error('Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md glass-card p-8 relative z-10 slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Estoque Fácil</h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Faça login para acessar o sistema logístico.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                id="username"
                type="text" 
                placeholder="Seu nome de usuário" 
                className="pl-10 h-12 bg-background/50 border-primary/20 focus:border-primary/50"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                id="password"
                type="password" 
                placeholder="••••••" 
                className="pl-10 h-12 bg-background/50 border-primary/20 focus:border-primary/50"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 glow"
            disabled={isLoading}
          >
            {isLoading ? 'Acessando...' : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
          </Button>
        </form>
      </div>
    </div>
  );
}
