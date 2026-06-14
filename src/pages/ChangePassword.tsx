import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { usersApi } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth(); // using login to refresh the local state slightly if needed
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha os dois campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error('Erro ao atualizar a senha no provedor de autenticação.');
        setIsLoading(false);
        return;
      }

      await usersApi.updateUser(user.id, { must_change_password: false });
      
      // Força a re-leitura do perfil na AuthContext (via onAuthStateChange ou recarregando a página)
      window.location.href = '/dashboard';
      
      toast.success('Senha atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md glass-card p-8 relative z-10 slide-up border-amber-500/20">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold gradient-text text-center">Troca Obrigatória</h1>
          <p className="text-muted-foreground mt-2 text-center text-sm">
            Para sua segurança, você deve trocar a senha padrão antes de acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                id="newPassword"
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                className="pl-10 h-12 bg-background/50 border-amber-500/20 focus:border-amber-500/50"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme a Nova Senha</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                id="confirmPassword"
                type="password" 
                placeholder="Repita a senha" 
                className="pl-10 h-12 bg-background/50 border-amber-500/20 focus:border-amber-500/50"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-warning text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar e Continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
