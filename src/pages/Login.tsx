import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { LogIn, Box, Smartphone, CheckCircle2, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, Mail, ScanLine, BarChart3, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSessionConflictDialog, setShowSessionConflictDialog] = useState(false);
  const [pendingLoginData, setPendingLoginData] = useState<{ pendingUserId?: string, isInitialPassword?: boolean } | null>(null);

  const { user, login, confirmLogin, cancelLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.must_change_password) {
        navigate('/trocar-senha', { replace: true });
      } else {
        if (!user.permissions?.can_view_dashboard && user.permissions?.can_use_sales_app) {
          navigate('/vendas', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      
      if (result && result.success) {
        if (result.requiresConfirmation) {
          setPendingLoginData({ pendingUserId: result.pendingUserId, isInitialPassword: result.isInitialPassword });
          setShowSessionConflictDialog(true);
          return; // Espera a resposta do usuário
        }

        toast.success('Login realizado com sucesso!');
        if (result.mustChangePassword) {
          navigate('/trocar-senha');
        } else {
          if (!user?.permissions?.can_view_dashboard && user?.permissions?.can_use_sales_app) {
            navigate('/vendas');
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        // O Supabase Auth vai emitir o toast no AuthContext em caso de erro
        setShowForgotPassword(true);
      }
    } catch (error) {
      toast.error('Erro ao realizar login.');
    } finally {
      if (!showSessionConflictDialog) {
        setIsLoading(false);
      }
    }
  };

  const handleConfirmSessionDrop = async () => {
    setIsLoading(true);
    try {
      const result = await confirmLogin(pendingLoginData?.pendingUserId, pendingLoginData?.isInitialPassword);
      if (result && result.success) {
        toast.success('Sessão assumida com sucesso!');
        if (result.mustChangePassword) {
          navigate('/trocar-senha');
        } else {
          if (!user?.permissions?.can_view_dashboard && user?.permissions?.can_use_sales_app) {
            navigate('/vendas');
          } else {
            navigate('/dashboard');
          }
        }
      }
    } catch (error) {
      toast.error('Erro ao assumir a sessão.');
    } finally {
      setIsLoading(false);
      setShowSessionConflictDialog(false);
      setPendingLoginData(null);
    }
  };

  const handleCancelSessionDrop = async () => {
    await cancelLogin();
    setShowSessionConflictDialog(false);
    setPendingLoginData(null);
    toast.info('Login cancelado.');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Preencha seu e-mail para solicitar o reset.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password-auto`,
      });
      
      if (error) throw error;
      
      toast.success('Se este e-mail estiver cadastrado, você receberá um link de redefinição.');
      setShowForgotPassword(false);
    } catch (e) {
      toast.error('Erro ao solicitar reset de senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070314] font-sans relative overflow-hidden p-4 sm:p-8">
      
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#4F25A0]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[#32127A]/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10 min-h-[600px]">
        
        {/* LEFT SIDE - MARKETING (Dark Purple) */}
        <div className="hidden lg:flex w-5/12 bg-gradient-to-b from-[#2B116A] to-[#120638] flex-col p-10 text-white relative overflow-hidden">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgxOG0tMTggOThoMTgiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] opacity-30" />

          <div className="relative z-10 flex flex-col h-full items-center text-center">
            
            {/* Logo Section */}
            <div className="mb-8 flex flex-col items-center mt-4">
              <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                Estoque <span className="text-[#9D71FF]">Fácil</span>
              </h1>
              <p className="text-[#9D71FF] text-sm tracking-widest font-medium uppercase">
                Logística Inteligente
              </p>
            </div>

            {/* Typography Section */}
            <div className="mb-10 mt-auto">
              <h2 className="text-2xl font-bold leading-snug mb-4">
                Controle sua operação do <span className="text-[#9D71FF]">estoque</span> até a <span className="text-[#9D71FF]">entrega.</span>
              </h2>
              <p className="text-white/70 text-sm leading-relaxed max-w-[280px] mx-auto">
                A plataforma completa que integra estoque, expedição, entregas e força de vendas em um único sistema.
              </p>
            </div>

            {/* Features Row */}
            <div className="grid grid-cols-4 gap-3 w-full mb-12">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Box className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Estoque<br/>inteligente</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <ScanLine className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Conferência<br/>por bipagem</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">App do<br/>Motorista</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[#9D71FF]" />
                </div>
                <span className="text-[10px] text-white/60 text-center leading-tight">Gestão<br/>completa</span>
              </div>
            </div>

          </div>

          {/* Floating Cubes Decoration at Bottom */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full h-32 opacity-40 pointer-events-none flex justify-center items-end gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#6231E2] to-transparent border border-[#9D71FF]/30 rounded-lg transform rotate-12 translate-y-4" />
            <div className="w-24 h-24 bg-gradient-to-tr from-[#7B42F6] to-transparent border border-[#9D71FF]/40 rounded-xl transform -rotate-12 z-10" />
            <div className="w-12 h-12 bg-gradient-to-tr from-[#4F25A0] to-transparent border border-[#9D71FF]/20 rounded-lg transform rotate-45 translate-y-8" />
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM (White) */}
        <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-8 lg:p-16 bg-white relative">
          
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-xl text-[#0A0520]">Estoque Fácil</span>
          </div>

          <div className="w-full max-w-[380px]">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#0A0520] mb-2 flex items-center justify-center gap-2">
                Bem-vindo de volta! <span className="animate-wave inline-block origin-bottom-right">👋</span>
              </h2>
              <p className="text-[#64748B] text-sm">
                Acesse sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[#64748B] ml-0.5">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Digite seu e-mail" 
                    className="h-12 pl-11 rounded-xl border-[#E2E8F0] focus-visible:ring-[#6231E2] focus-visible:border-[#6231E2] text-sm shadow-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-[#64748B] ml-0.5">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94A3B8]" />
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha" 
                    className="h-12 pl-11 pr-11 rounded-xl border-[#E2E8F0] focus-visible:ring-[#6231E2] focus-visible:border-[#6231E2] text-sm shadow-sm"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-semibold text-[#6231E2] hover:text-[#4F25A0] transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-[#4F25A0] hover:bg-[#3D1A84] text-white rounded-xl shadow-lg shadow-[#4F25A0]/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Acessando...' : <>Entrar <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>

              {showForgotPassword && (
                <div className="pt-6 text-center slide-up">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full rounded-xl border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                  >
                    Solicitar Reset ao Gestor
                  </Button>
                </div>
              )}
            </form>

            <div className="text-center pt-8 text-sm text-[#64748B]">
              Ainda não tem uma conta? <a href="#" className="font-semibold text-[#4F25A0] hover:underline">Fale com seu administrador.</a>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Conflito de Sessão */}
      <Dialog open={showSessionConflictDialog} onOpenChange={(open) => { if (!open) handleCancelSessionDrop(); }}>
        <DialogContent className="max-w-[400px] bg-white border-none shadow-2xl rounded-lg p-0 overflow-hidden">
          <DialogHeader className="bg-white p-5 pb-4 border-b border-gray-100 m-0">
            <DialogTitle className="text-xl font-semibold text-gray-800 tracking-tight">Exclusão de sessões anteriores</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-5 bg-white">
            <p className="text-gray-600 text-[15px] leading-relaxed">Você possui outra(s) conexão(ões) ativa(s).</p>
            <p className="text-gray-600 text-[15px] leading-relaxed">Gostaria de derrubar a(s) sessão(ões) anterior(es)?</p>
          </div>
          <DialogFooter className="px-6 py-4 bg-gray-50/50 flex sm:justify-center gap-3 border-t border-gray-100">
            <Button 
              type="button" 
              className="bg-[#EFF4FB] text-[#2A61D2] hover:bg-[#E2EAF6] border-none shadow-none font-medium h-10 px-8 rounded-md transition-colors" 
              onClick={handleConfirmSessionDrop} 
              disabled={isLoading}
            >
              Sim
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              className="text-[#2A61D2] hover:bg-transparent hover:text-[#1e4aab] font-medium h-10 px-6 rounded-md shadow-none" 
              onClick={handleCancelSessionDrop} 
              disabled={isLoading}
            >
              Não
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer Links & Info */}
      <div className="relative z-10 mt-12 w-full max-w-[1000px] flex flex-col items-center gap-6 text-white/60 text-sm">
        
        <div className="flex items-center gap-4">
          <span>Quer conhecer mais sobre o sistema?</span>
          <Link to="/saiba-mais">
            <Button variant="outline" className="h-10 rounded-xl border-white/20 text-white hover:bg-white/10 hover:border-white/30 bg-transparent flex items-center gap-2">
              <Box className="h-4 w-4" /> Saiba mais <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-[#94A3B8]">
          <ShieldCheck className="h-4 w-4" /> Sua conexão é segura e criptografada
        </div>

        <div className="text-[#64748B] text-xs">
          © 2025 LS Stokc. Todos os direitos reservados.
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
        }
      `}</style>

    </div>
  );
}
