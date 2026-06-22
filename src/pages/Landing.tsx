import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Package, Truck, Smartphone, Briefcase, Play, ArrowRight,
  CheckCircle2, Box, ShieldCheck, Zap, Database,
  Settings, Phone, Check, ChevronRight, Menu, X, ArrowDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saasApi } from '@/api/saas'
import { toast } from '@/components/ui/toaster'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoForm, setDemoForm] = useState({
    nome: '',
    empresa: '',
    telefone: '',
    email: '',
    descricao: ''
  })

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDemoLoading(true)
    try {
      await saasApi.createLead({
        name: demoForm.nome,
        email: demoForm.email,
        phone: demoForm.telefone,
        message: `Empresa: ${demoForm.empresa}\n\nDescrição da Operação: ${demoForm.descricao}`
      })
      toast.success('Solicitação enviada com sucesso! Entraremos em contato em breve.')
      setDemoModalOpen(false)
      setDemoForm({ nome: '', empresa: '', telefone: '', email: '', descricao: '' })
    } catch (e: any) {
      toast.error('Erro ao enviar solicitação. Tente novamente mais tarde.')
    } finally {
      setDemoLoading(false)
    }
  }

  // Efeito para adicionar fundo no cabeçalho ao rolar a página
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClientAreaClick = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/') // The new split screen login is at root
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-50 font-sans antialiased selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[800px] right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
          ? 'bg-[#0F172A]/80 backdrop-blur-md border-b border-white/10 py-4 shadow-lg'
          : 'bg-transparent py-6'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="h-10 w-10 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Estoque Fácil
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <button onClick={() => scrollToSection('problema')} className="hover:text-white transition-colors">Problema</button>
              <button onClick={() => scrollToSection('solucao')} className="hover:text-white transition-colors">Solução</button>
              <button onClick={() => scrollToSection('planos')} className="hover:text-white transition-colors">Planos</button>
              <button onClick={() => scrollToSection('tecnologia')} className="hover:text-white transition-colors">Tecnologia</button>
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" onClick={handleClientAreaClick}>
                Acessar Sistema
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/30 rounded-full px-6" onClick={() => setDemoModalOpen(true)}>
                Solicitar Demonstração
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#0F172A] border-b border-white/10 shadow-xl py-4 px-4 flex flex-col gap-4">
            <button onClick={() => scrollToSection('problema')} className="text-left py-2 text-slate-300">Problema</button>
            <button onClick={() => scrollToSection('solucao')} className="text-left py-2 text-slate-300">Solução</button>
            <button onClick={() => scrollToSection('planos')} className="text-left py-2 text-slate-300">Planos</button>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setDemoModalOpen(true)}>Solicitar Demonstração</Button>
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/5" onClick={handleClientAreaClick}>Acessar Sistema</Button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Sistema Completo para Logística e Força de Vendas</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Controle sua operação do <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">estoque</span> até a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">entrega.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-400 max-w-xl leading-relaxed">
              O Estoque Fácil conecta estoque, expedição, entregas e força de vendas em uma única plataforma integrada.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button className="h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:-translate-y-1 transition-all" onClick={() => setDemoModalOpen(true)}>
                Solicitar Demonstração
              </Button>
              <Button variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 text-white hover:bg-white/5 rounded-full hover:-translate-y-1 transition-all bg-transparent">
                <Play className="mr-2 h-5 w-5" /> Ver Funcionalidades
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-8 border-t border-white/10">
              {['Controle de estoque', 'Conferência por bipagem', 'App do motorista', 'Assinatura digital', 'Gestão comercial', 'Suporte Especializado'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 lg:ml-10 perspective-1000">
            {/* Dashboard Mockup Animado */}
            <div className="relative rounded-2xl border border-white/10 bg-[#1E293B]/80 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="h-8 bg-[#0F172A]/50 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="p-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="h-2 w-1/2 bg-slate-600 rounded mb-4" />
                    <div className="h-8 w-3/4 bg-blue-500/20 rounded" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="h-2 w-1/2 bg-slate-600 rounded mb-4" />
                    <div className="h-8 w-3/4 bg-cyan-500/20 rounded" />
                  </div>
                </div>
                <div className="h-40 bg-white/5 rounded-lg border border-white/5 p-4 flex items-end gap-2">
                  {[40, 70, 45, 90, 65, 85, 120].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-blue-600/50 to-cyan-400/50 rounded-t-sm" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -bottom-10 -left-10 bg-[#1E293B] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce-slow">
              <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Entrega #10293</p>
                <p className="text-emerald-400 text-xs">Confirmada com assinatura</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - PROBLEMA */}
      <section id="problema" className="py-24 bg-[#0B1120] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Sua operação ainda depende de processos manuais?</h2>
            <p className="text-slate-400 text-lg">Empresas perdem tempo e dinheiro diariamente com falhas de comunicação e retrabalho.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {[
                'Erros de separação constantes',
                'Estoque físico divergente do sistema',
                'Falta de rastreabilidade na rua',
                'Conferência manual demorada',
                'Falta de comunicação entre vendas e logística',
                'Rotas sem controle de trajeto',
                'Falta de comprovante de entrega (canhoto perdido)'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                  <span className="text-slate-300 font-medium">{text}</span>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 p-8 rounded-3xl border border-blue-500/20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-8">A Solução Definitiva</h3>
                <div className="flex flex-col gap-4 items-center font-bold text-lg text-blue-300">
                  <div className="bg-white/10 w-full py-4 rounded-lg border border-white/10">Venda</div>
                  <ArrowDown className="text-cyan-400" />
                  <div className="bg-white/10 w-full py-4 rounded-lg border border-white/10">Separação</div>
                  <ArrowDown className="text-cyan-400" />
                  <div className="bg-white/10 w-full py-4 rounded-lg border border-white/10">Entrega</div>
                  <ArrowDown className="text-cyan-400" />
                  <div className="bg-blue-600 text-white w-full py-4 rounded-lg shadow-lg shadow-blue-600/30">Confirmação em tempo real</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - SOLUÇÃO */}
      <section id="solucao" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Uma plataforma completa para sua operação</h2>
            <p className="text-slate-400 text-lg">O Estoque Fácil centraliza toda a gestão operacional da empresa em um único ambiente conectado.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-[#1E293B] transition-colors group">
              <div className="h-14 w-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Estoque e Inventário</h3>
              <ul className="space-y-3">
                {['Contagem por bipagem', 'Inventários rápidos', 'Divergências online', 'Recebimento ágil'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-blue-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-[#1E293B] transition-colors group">
              <div className="h-14 w-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Truck className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Expedição e Rotas</h3>
              <ul className="space-y-3">
                {['Montagem de cargas', 'Conferência de doca', 'Separação de pedidos', 'Controle de entregas'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-cyan-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-[#1E293B] transition-colors group">
              <div className="h-14 w-14 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">App do Motorista</h3>
              <ul className="space-y-3">
                {['Rotas no celular', 'Assinatura digital', 'Histórico de entregas', 'Comprovante online'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-indigo-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 4 */}
            <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-[#1E293B] transition-colors group">
              <div className="h-14 w-14 bg-violet-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Força de Vendas</h3>
              <ul className="space-y-3">
                {['Pedidos e orçamentos', 'Gestão de clientes', 'Tabelas de preço', 'Funil de vendas'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 text-violet-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - DIFERENCIAIS */}
      <section className="py-24 bg-[#0B1120] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-16">Desenvolvido para operações reais</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              'Suporte Rápido', 'Controle por permissões', 'Liberação remota',
              'Dashboard operacional', 'Mobile First', 'Integração ERP',
              'Auditoria', 'Rastreabilidade total', 'Estrutura escalável', 'Deploy em nuvem'
            ].map((diff, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center gap-3 hover:bg-white/10 transition-colors">
                <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-sm font-medium text-slate-300">{diff}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - COMO FUNCIONA */}
      <section className="py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Fluxo operacional completo</h2>
            <p className="text-slate-400 text-lg">Do clique do vendedor até a assinatura do cliente, sem papel.</p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/50 via-cyan-500/50 to-transparent hidden md:block" />
            
            {[
              { title: 'Passo 1', desc: 'Pedido realizado pelo vendedor no Força de Vendas.', icon: Briefcase },
              { title: 'Passo 2', desc: 'Separação e conferência por bipagem no estoque.', icon: Box },
              { title: 'Passo 3', desc: 'Montagem da rota de entrega e romaneio.', icon: Truck },
              { title: 'Passo 4', desc: 'Motorista realiza a entrega utilizando o App.', icon: Smartphone },
              { title: 'Passo 5', desc: 'Cliente assina na tela e a entrega é finalizada no ERP.', icon: CheckCircle2 }
            ].map((step, i) => (
              <div key={i} className={`flex flex-col md:flex-row items-center gap-8 mb-12 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`flex-1 text-center ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-2">{step.title}</h3>
                  <p className="text-xl font-medium text-white">{step.desc}</p>
                </div>
                <div className="h-16 w-16 rounded-full bg-[#0F172A] border-4 border-blue-500 flex items-center justify-center z-10 shrink-0 shadow-lg shadow-blue-500/20">
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6 - PLANOS */}
      <section id="planos" className="py-32 bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Escolha o plano ideal para sua operação</h2>
            <p className="text-slate-400 text-lg">Pague apenas pelo que utilizar e adicione módulos conforme cresce.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Bronze */}
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-orange-400 mb-2">Bronze</h3>
              <p className="text-slate-400 text-sm mb-6">Ideal para controle interno</p>
              <ul className="space-y-4 mb-8 flex-1">
                {['Dashboard', 'Produtos', 'Inventários', 'Recebimentos'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-orange-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white">Assinar Bronze</Button>
            </div>

            {/* Prata */}
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-slate-300 mb-2">Prata</h3>
              <p className="text-slate-400 text-sm mb-6">Ideal para expedição</p>
              <div className="text-sm font-semibold text-white mb-4 pb-4 border-b border-white/10">Tudo do Bronze +</div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Rotas', 'Cargas', 'Conferência de doca'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-slate-300" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white">Assinar Prata</Button>
            </div>

            {/* Ouro */}
            <div className="bg-gradient-to-b from-blue-900/50 to-[#1E293B] border border-blue-500 rounded-2xl p-8 flex flex-col relative transform lg:-translate-y-4 shadow-2xl shadow-blue-900/50">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">MAIS POPULAR</div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-2">Ouro</h3>
              <p className="text-slate-300 text-sm mb-6">Operação de Last-Mile</p>
              <div className="text-sm font-semibold text-white mb-4 pb-4 border-b border-white/10">Tudo do Prata +</div>
              <ul className="space-y-4 mb-8 flex-1">
                {['App do motorista', 'Tracking', 'Assinatura digital', 'Histórico de clientes'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-medium">
                    <Check className="h-5 w-5 text-blue-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg">Assinar Ouro</Button>
            </div>

            {/* Platina */}
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl p-8 flex flex-col">
              <h3 className="text-2xl font-bold text-cyan-400 mb-2">Platina</h3>
              <p className="text-slate-400 text-sm mb-6">Operação ponta a ponta</p>
              <div className="text-sm font-semibold text-white mb-4 pb-4 border-b border-white/10">Tudo do Ouro +</div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Sistema Força de Vendas', 'Gestão de vendedores', 'Integração completa ERP', 'Painel B2B'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <Check className="h-5 w-5 text-cyan-400" /> {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-white/10 hover:bg-white/20 text-white">Assinar Platina</Button>
            </div>
          </div>
        </div>
      </section>


      {/* SECTION 8 - FUTURO / IA */}
      <section className="py-24 bg-gradient-to-r from-blue-900/20 to-cyan-900/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-6">
            <Zap className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">O Futuro: Inteligência Artificial Integrada</h2>
          <p className="text-slate-300 text-lg mb-12 max-w-2xl mx-auto">Estamos preparando novos recursos autônomos para elevar a sua operação a um nível jamais visto no mercado logístico.</p>
          
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
            {[
              'Pedidos via Chatbot e WhatsApp',
              'Assistente operacional IA para Gestores',
              'Sugestão automática de reposição de estoque',
              'Monitoramento preditivo de atrasos em rotas'
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-cyan-400 shrink-0" />
                <span className="text-white font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 - CTA FINAL */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/20" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8">Pronto para profissionalizar sua operação?</h2>
          <p className="text-xl text-blue-200 mb-12">Automatize estoque, expedição, entregas e vendas em uma única plataforma.</p>
          <Button className="h-16 px-12 text-xl font-bold bg-white text-blue-600 hover:bg-slate-100 rounded-full shadow-2xl hover:-translate-y-1 transition-all" onClick={() => setDemoModalOpen(true)}>
            Solicitar Demonstração Gratuita
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0B1120] py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Box className="h-6 w-6 text-blue-500" />
            <span className="text-white font-bold text-lg">Estoque Fácil</span>
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 Estoque Fácil. Sistema completo para logística e força de vendas.
          </p>
          <div className="flex gap-4">
            {/* Social links placeholder */}
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">in</div>
            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors">ig</div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 h-14 w-14 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 hover:scale-110 transition-all z-50">
        <Phone className="h-6 w-6" />
      </a>

      {/* MODAL DE DEMONSTRAÇÃO */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="sm:max-w-[500px] border-blue-500/20 bg-[#0F172A]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Solicitar Demonstração</DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha os dados abaixo e entraremos em contato para mostrar como o Estoque Fácil se adequa à sua operação.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDemoSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Seu Nome</Label>
              <Input 
                required 
                className="bg-white/5 border-white/10 text-white" 
                value={demoForm.nome} 
                onChange={e => setDemoForm({...demoForm, nome: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nome da Empresa</Label>
              <Input 
                required 
                className="bg-white/5 border-white/10 text-white" 
                value={demoForm.empresa} 
                onChange={e => setDemoForm({...demoForm, empresa: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Telefone</Label>
                <Input 
                  required 
                  className="bg-white/5 border-white/10 text-white" 
                  value={demoForm.telefone} 
                  onChange={e => setDemoForm({...demoForm, telefone: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">E-mail</Label>
                <Input 
                  required 
                  type="email"
                  className="bg-white/5 border-white/10 text-white" 
                  value={demoForm.email} 
                  onChange={e => setDemoForm({...demoForm, email: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Descrição da Operação</Label>
              <Textarea 
                required 
                placeholder="Como é a sua operação hoje? Ex: Tenho 3 caminhões e 5 vendedores..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]" 
                value={demoForm.descricao} 
                onChange={e => setDemoForm({...demoForm, descricao: e.target.value})} 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white h-12 text-lg font-bold"
              disabled={demoLoading}
            >
              {demoLoading ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}
