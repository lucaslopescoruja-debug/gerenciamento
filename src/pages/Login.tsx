import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hashPassword } from '@/utils/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { LogIn, Package, ShieldCheck } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

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
    <div className="min-h-screen flex w-full bg-background font-sans">
      {/* LEFT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 bg-white dark:bg-background relative">
        
        <div className="w-full max-w-[360px] space-y-8 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 flex items-center justify-center gap-2 mb-8">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
              <span className="font-bold text-2xl text-foreground">Estoque Fácil</span>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">Acessar o sistema</h1>
            <p className="text-[#00d06c] text-sm font-medium px-4">
              Seu usuário acessou o sistema de outro computador ou dispositivo, por isso você foi desconectado. Por favor, entre no sistema novamente.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs text-muted-foreground ml-1">E-mail</Label>
              <Input 
                id="username"
                type="text" 
                placeholder="Seu usuário ou e-mail" 
                className="h-12 rounded-full px-5 border-[#00d06c] focus-visible:ring-[#00d06c] focus-visible:border-[#00d06c] bg-white dark:bg-card"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs text-muted-foreground ml-1">Senha</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                className="h-12 rounded-full px-5 border-border focus-visible:ring-border bg-white dark:bg-card"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowForgotPassword(true)}
                className="text-sm font-bold text-foreground hover:text-[#00d06c] transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold bg-[#00d06c] hover:bg-[#00b55d] text-white rounded-full shadow-[0_4px_14px_0_rgba(0,208,108,0.39)] hover:shadow-[0_6px_20px_rgba(0,208,108,0.23)] hover:-translate-y-0.5 transition-all duration-200 uppercase tracking-wide"
                disabled={isLoading}
              >
                {isLoading ? 'Acessando...' : 'ENTRAR'}
              </Button>
            </div>
            
            {showForgotPassword && (
              <div className="pt-4 border-t border-border/50 text-center slide-up">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full rounded-full border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Solicitar Reset ao Gestor
                </Button>
              </div>
            )}
          </form>

          <div className="text-center pt-8 text-sm text-muted-foreground">
            Ainda não possui uma conta? <a href="#" className="font-bold text-foreground hover:underline">Crie uma agora</a>
          </div>
          <div className="text-center text-[11px] text-muted-foreground/60 max-w-xs mx-auto leading-tight">
            Para saber como tratamos os dados pessoais visite nosso <a href="#" className="font-medium underline">Aviso de privacidade</a>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - MARKETING */}
      <div className="hidden lg:flex w-1/2 bg-[#6b4c9a] flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        
        {/* Background decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl text-center space-y-8 flex flex-col items-center">
          
          <div className="bg-white text-[#6b4c9a] font-bold text-xs px-5 py-2 rounded-full inline-block shadow-sm tracking-wide">
            Lançamento Estoque Fácil
          </div>

          <h2 className="text-[2.5rem] font-bold tracking-tight leading-tight text-white mb-2">
            Funil de Vendas e<br />Estoque Fácil IA
          </h2>

          {/* Fake Application Mockup image based on user's reference */}
          <div className="w-full aspect-[4/3] bg-white/10 rounded-xl border border-white/20 p-2 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col gap-2">
            
            {/* Mockup Card 1 */}
            <div className="flex-1 bg-[#f9f5ff] rounded-lg border border-purple-100 p-4 relative overflow-hidden flex flex-col">
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-white rounded shadow-sm flex items-center justify-center border border-purple-100">
                  <span className="text-[8px] text-purple-900 font-medium">Quanto já vendi esse mês?</span>
                </div>
              </div>
              <div className="mt-auto flex justify-end">
                <div className="w-48 bg-white rounded-lg shadow-sm border border-purple-100 p-3">
                  <p className="text-[10px] text-purple-900 font-semibold mb-1">Estoque Fácil IA</p>
                  <p className="text-[9px] text-purple-700/80">Seu total de vendas no mês atual é <span className="font-bold text-purple-900">R$ 35.135,14</span>.</p>
                </div>
              </div>
            </div>

            {/* Mockup Card 2 */}
            <div className="flex-1 bg-[#f0fdf4] rounded-lg border border-emerald-100 p-4 relative overflow-hidden flex flex-col">
               <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-emerald-900">FUNIL DE VENDAS</span>
               </div>
               <div className="flex-1 flex gap-2">
                  <div className="flex-1 bg-white rounded shadow-sm border border-emerald-100 p-2 opacity-50"></div>
                  <div className="flex-1 bg-white rounded shadow-sm border border-emerald-100 p-2 opacity-80"></div>
                  <div className="flex-1 bg-white rounded shadow-sm border border-emerald-100 p-2 border-l-2 border-l-emerald-500"></div>
               </div>
            </div>

          </div>

          <p className="text-white/90 font-medium text-[15px] max-w-[380px] leading-relaxed pt-2">
            Tudo o que você precisa para uma gestão completa da sua operação comercial, de ponta a ponta
          </p>

          <Link to="/saiba-mais">
            <Button 
              className="bg-[#00d06c] hover:bg-[#00b55d] text-white font-bold h-11 px-8 rounded-full shadow-[0_4px_14px_0_rgba(0,208,108,0.39)] hover:shadow-[0_6px_20px_rgba(0,208,108,0.23)] hover:-translate-y-0.5 transition-all duration-200 mt-2"
            >
              Saiba Mais
            </Button>
          </Link>

        </div>
      </div>

    </div>
  );
}
