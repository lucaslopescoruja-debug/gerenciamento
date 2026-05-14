import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { User, UserRole, UserPermissions } from '@/types/database'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toaster'
import { ShieldCheck, Plus, Pencil, Trash2, UserCircle } from 'lucide-react'
import { hashPassword } from '@/utils/crypto'

const roleLabels: Record<UserRole, string> = { admin: 'Admin', gestor: 'Gestor', conferente: 'Conferente', motorista: 'Motorista' }
const roleVariants: Record<UserRole, 'default' | 'success' | 'warning' | 'destructive'> = { admin: 'default', gestor: 'success', conferente: 'warning', motorista: 'destructive' }

const defaultPermissions: Record<UserRole, UserPermissions> = {
  admin: { can_view_dashboard: true, can_manage_loads: true, can_do_conference: true, can_manage_products: true, can_manage_users: true },
  gestor: { can_view_dashboard: true, can_manage_loads: true, can_do_conference: true, can_manage_products: true, can_manage_users: true },
  conferente: { can_view_dashboard: false, can_manage_loads: false, can_do_conference: true, can_manage_products: false, can_manage_users: false },
  motorista: { can_view_dashboard: false, can_manage_loads: false, can_do_conference: false, can_manage_products: false, can_manage_users: false }
}

export default function AccessControl() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('conferente')
  const [perms, setPerms] = useState<UserPermissions>(defaultPermissions.conferente)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getUsers,
  })

  const createMutation = useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário criado')
      setIsOpen(false)
    },
    onError: (e: any) => toast.error(`Erro ao criar: ${e.message}`)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<User> }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário atualizado')
      setIsOpen(false)
    },
    onError: (e: any) => toast.error(`Erro ao atualizar: ${e.message}`)
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.info('Usuário removido')
    }
  })

  const openNew = () => {
    setEditing(null)
    setName('')
    setUsername('')
    setPassword('')
    setRole('conferente')
    setPerms(defaultPermissions.conferente)
    setIsOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setName(u.name)
    setUsername(u.username)
    setPassword('') // Don't show existing hash
    setRole(u.role)
    setPerms(u.permissions || defaultPermissions[u.role])
    setIsOpen(true)
  }

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole)
    if (!editing) {
      setPerms(defaultPermissions[newRole])
    }
  }

  const togglePerm = (key: keyof UserPermissions) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !username) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    if (!editing && !password) {
      toast.error('A senha é obrigatória para novos usuários')
      return
    }

    const baseData: Partial<User> = {
      name,
      username,
      role,
      permissions: perms
    }

    if (password) {
      baseData.password_hash = await hashPassword(password)
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: baseData })
    } else {
      createMutation.mutate({ ...baseData, active: true } as Omit<User, 'id' | 'created_at'>)
    }
  }

  const toggleActive = (id: string, currentActive: boolean) => {
    updateMutation.mutate({ id, data: { active: !currentActive } })
  }

  const deleteUser = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando usuários...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Controle de Acesso
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} usuários cadastrados</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1.5" />Novo Usuário</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {users.map((user, i) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center gap-4 slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${user.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <UserCircle className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`font-semibold text-sm ${user.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{user.name}</span>
                  <Badge variant={roleVariants[user.role]}>{roleLabels[user.role]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(user.id, user.active)}>
                  <div className={`h-3 w-3 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteUser(user.id)} disabled={deleteMutation.isPending}><Trash2 className="h-3.5 w-3.5 text-red-400" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {users.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground glass-card">
            Nenhum usuário cadastrado.
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={o => { setIsOpen(o); if (!o) setEditing(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Usuário de Login *</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Senha {editing && '(opcional para manter)'}</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acesso</Label>
                <select 
                  value={role} 
                  onChange={e => handleRoleChange(e.target.value as UserRole)} 
                  className="flex h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
                >
                  <option value="admin">Administrador Geral</option>
                  <option value="gestor">Gestor</option>
                  <option value="conferente">Conferente</option>
                  <option value="motorista">Motorista</option>
                </select>
              </div>
            </div>

            {role !== 'admin' && (
              <div className="pt-4 border-t border-border mt-4">
                <Label className="mb-3 block font-bold text-primary">Permissões Específicas</Label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={perms.can_view_dashboard} onChange={() => togglePerm('can_view_dashboard')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Visão Geral (Dashboard)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={perms.can_manage_loads} onChange={() => togglePerm('can_manage_loads')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Gerenciar Cargas/Rotas</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={perms.can_do_conference} onChange={() => togglePerm('can_do_conference')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Operar Conferência (Bipar itens)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={perms.can_manage_products} onChange={() => togglePerm('can_manage_products')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Cadastro de Produtos</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={perms.can_manage_users} onChange={() => togglePerm('can_manage_users')} className="w-4 h-4 accent-primary" />
                    <span className="text-sm">Gestão de Usuários (Acessos)</span>
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>Salvar Usuário</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
