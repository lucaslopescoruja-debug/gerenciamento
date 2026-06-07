import React, { useState, useEffect } from 'react';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

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
        navigate('/dashboard');
      } else {
        toast.error('Usuário ou senha incorretos, ou usuário inativo.');
        setShowForgotPassword(true);
      }
    } catch (error) {
      toast.error('Erro ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast.error('Preencha seu usuário para solicitar o reset.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Import missing usersApi at the top: import { usersApi } from '@/api/users';
      const { usersApi } = await import('@/api/users');
      const users = await usersApi.getUsers();
      const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
      
      if (!user) {
        toast.error('Usuário não encontrado no sistema.');
        return;
      }
      
      await usersApi.updateUser(user.id, { reset_requested: true });
      toast.success('Solicitação enviada! Avise seu gestor para liberar seu acesso.');
      setShowForgotPassword(false);
    } catch (e) {
      toast.error('Erro ao solicitar reset.');
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
          <div className="h-24 w-24 flex items-center justify-center mb-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300" />
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

          {showForgotPassword && (
            <div className="pt-4 border-t border-border/50 text-center slide-up">
              <p className="text-sm text-muted-foreground mb-3">Esqueceu sua senha?</p>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Solicitar Reset ao Gestor
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
