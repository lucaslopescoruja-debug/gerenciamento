import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Boxes, Truck, Package, CheckCircle2, ArrowRight, ShieldCheck,
  BarChart3, Phone, Mail, MapPin, Menu, X, ExternalLink, ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { saasApi } from '@/api/saas'
import { toast } from '@/components/ui/toaster'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Form State for Leads
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadMessage, setLeadMessage] = useState('')
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)

  // Efeito para adicionar fundo no cabeçalho ao rolar a página
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Se o usuário clicar para ir para a Área do Cliente e já estiver logado, redireciona direto
  const handleClientAreaClick = () => {
    if (user) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leadName || !leadEmail || !leadPhone) {
      toast.error('Preencha todos os campos obrigatórios (Nome, E-mail e Telefone).')
      return
    }

    setIsSubmittingLead(true)
    try {
      await saasApi.createLead({
        name: leadName,
        email: leadEmail,
        phone: leadPhone,
        message: leadMessage
      })
      toast.success('Solicitação enviada com sucesso! Em breve entraremos em contato.')
      setLeadName('')
      setLeadEmail('')
      setLeadPhone('')
      setLeadMessage('')
      setLeadSubmitted(true)
    } catch (err: any) {
      toast.error('Erro ao registrar solicitação: ' + err.message)
    } finally {
      setIsSubmittingLead(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] right-1/4 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[150px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm py-4'
          : 'bg-transparent py-6'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="h-12 w-12 flex items-center justify-center">
                <img src="/logo.png" alt="Estoque Fácil Logo" className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Estoque Fácil
                </span>
                <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider -mt-1">
                  Estoque Inteligente
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Início</a>
              <a href="#funcionalidades" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Funcionalidades</a>
              <a href="#beneficios" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Vantagens</a>
              <a href="#contato" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Contato</a>
            </nav>

            {/* Client Area Button */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={handleClientAreaClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Área do Cliente
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 py-4 px-6 space-y-4 shadow-lg slide-in">
            <a
              href="#inicio"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-600 py-2"
            >
              Início
            </a>
            <a
              href="#funcionalidades"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-600 py-2"
            >
              Funcionalidades
            </a>
            <a
              href="#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-600 py-2"
            >
              Vantagens
            </a>
            <a
              href="#contato"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-slate-700 hover:text-indigo-600 py-2"
            >
              Contato
            </a>
            <div className="pt-4 border-t border-slate-100">
              <Button
                onClick={() => { setMobileMenuOpen(false); handleClientAreaClick(); }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                Área do Cliente
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="inicio" className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Content */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                Tecnologia Logística para sua Empresa
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Gestão de Cargas, Estoque e Entregas{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Sem Erros
                </span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                O Estoque Fácil é uma plataforma WMS e de conferência móvel projetada para eliminar erros de expedição, otimizar rotas de entrega e garantir 100% de acurácia no inventário. Tudo na palma da sua mão.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a href="#contato">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base px-8 py-6 rounded-2xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:-translate-y-0.5 cursor-pointer">
                    Solicitar Demonstração
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
                <a href="#funcionalidades">
                  <Button variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-base px-8 py-6 rounded-2xl cursor-pointer">
                    Ver Recursos
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="text-3xl font-extrabold text-indigo-600">99.8%</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Acurácia de Conferência</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-indigo-600">3x</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Mais Velocidade na Carga</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-indigo-600">Zero</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Papelada de Comprovante</p>
                </div>
              </div>
            </div>

            {/* Visual/Image Mockup (Sleek CSS Illustration) */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur-[30px] opacity-10" />
              <div className="relative bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xl space-y-6 max-w-md mx-auto">
                {/* Simulated App Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600/10 flex items-center justify-center">
                      <Truck className="h-4.5 w-4.5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Carga VZ-0412</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Em Transito
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded">
                    5/8 Clientes
                  </span>
                </div>

                {/* Simulated Delivery Status List */}
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">Supermercado Ponto Certo</p>
                      <p className="text-[10px] text-slate-500">Rua das Flores, 140</p>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      Entregue
                    </span>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between ring-1 ring-indigo-500/20">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Mercantil Alvorada Ltda</p>
                      <p className="text-[10px] text-slate-500">Av. Brasil, 2500</p>
                    </div>
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded animate-pulse">
                      Separando
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between opacity-60">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">Distribuidora Vale do Rio</p>
                      <p className="text-[10px] text-slate-500">Rodovia BR-101, Km 45</p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded">
                      Pendente
                    </span>
                  </div>
                </div>

                {/* Interactive Feature Preview Card */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">Conferência Inteligente</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">100% OK</span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    "O bipador móvel de código de barras identificou e registrou 24 volumes de detergente sem nenhuma divergência."
                  </p>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Recursos e Módulos</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Tudo o que sua Logística precisa em um só lugar
            </p>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Desenvolvemos ferramentas robustas de coleta de dados para otimizar toda a jornada de expedição e transporte da sua mercadoria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 - Conferência */}
            <div className="border border-slate-100 hover:border-indigo-100 rounded-3xl p-8 hover:bg-slate-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50 group relative overflow-hidden">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Conferência & Recebimento</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Faça a bipagem de códigos de barras (EAN-13, DUN-14) diretamente pela câmera do celular ou leitores acoplados. O sistema valida quantidades esperadas e bloqueia erros em tempo real.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Bipe de volumes e caixas fechadas
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Alerta visual e sonoro de divergências
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Validação de lotes e datas de validade
                </li>
              </ul>
            </div>

            {/* Feature 2 - Entregas */}
            <div className="border border-slate-100 hover:border-indigo-100 rounded-3xl p-8 hover:bg-slate-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50 group relative overflow-hidden">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <Truck className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Controle de Entregas & PDF</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Gerencie rotas de entrega para motoristas. Colete comprovantes de entrega digitais não editáveis contendo a assinatura na tela do celular, nome, documento do recebedor e geolocalização.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Coleta de assinatura digital na tela
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Exportação de PDF no WhatsApp ou Email
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Compartilhamento móvel nativo integrado
                </li>
              </ul>
            </div>

            {/* Feature 3 - Estoque */}
            <div className="border border-slate-100 hover:border-indigo-100 rounded-3xl p-8 hover:bg-slate-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-100/50 group relative overflow-hidden">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                <Package className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Estoque & Inventário</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Audite posições de estoque e faça contagens de inventário rotativas (avulsas ou planejadas) de forma rápida. O sistema gera relatórios automáticos de auditoria e ajuste de saldo.
              </p>
              <ul className="space-y-2.5 pt-2">
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Contagem rotativa ou total por coletor
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Ordenação e filtros avançados no estoque
                </li>
                <li className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Histórico detalhado de movimentações e logs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Visual element / Image */}
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="bg-indigo-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />

                <h4 className="font-extrabold text-2xl">Resultados Reais</h4>
                <p className="text-slate-200 text-sm leading-relaxed">
                  Distribuidoras e parceiros logísticos que implantaram o Estoque Fácil reduziram custos operacionais e aumentaram a velocidade das entregas.
                </p>

                <div className="space-y-4 border-t border-indigo-800/80 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 text-sm font-bold">✓</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Redução de Reclamações</p>
                      <p className="text-[11px] text-slate-400">Eliminação de faltas e mercadorias trocadas nas cargas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 text-sm font-bold">✓</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Digitalização Completa</p>
                      <p className="text-[11px] text-slate-400">Fim do arquivamento físico de canhotos de notas fiscais.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 text-sm font-bold">✓</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Aprovador de Divergências</p>
                      <p className="text-[11px] text-slate-400">Liberações de estoque controladas por senha gerencial.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Por que escolher o Estoque Fácil?</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                Acelere o fluxo de trabalho da sua equipe de expedição
              </p>
              <p className="text-slate-600">
                Nosso sistema foi feito para funcionar em cenários reais de galpões e estradas. A interface é rápida, intuitiva e pensada para quem trabalha em pé carregando caixas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Operação Híbrida/Offline</h4>
                    <p className="text-xs text-slate-500 mt-1">Conferência contínua mesmo em locais com pouca internet.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Relatórios e Painéis</h4>
                    <p className="text-xs text-slate-500 mt-1">Veja a velocidade de separação de cada operador em tempo real.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Boxes className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Suporte e Treinamento</h4>
                    <p className="text-xs text-slate-500 mt-1">Equipe de suporte pronta para auxiliar na implantação rápida.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Truck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Aplicativo Móvel Nativo</h4>
                    <p className="text-xs text-slate-500 mt-1">Compatível com Android e iOS, pronto para download rápido.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Contact Section */}
      <section id="contato" className="py-20 bg-white border-t border-slate-200 relative overflow-hidden">
        {/* Decorative grids */}
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">Contato Comercial</h2>
              <p className="text-3xl font-extrabold text-slate-900">
                Pronto para transformar sua gestão de estoque?
              </p>
              <p className="text-slate-600">
                Fale com um de nossos consultores de vendas, tire dúvidas ou agende uma demonstração personalizada do sistema para a sua distribuidora.
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Telefone / WhatsApp</p>
                    <p className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                      <a href="https://wa.me/5531986230171" target="_blank" rel="noreferrer">
                        (31) 98623-0171
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-semibold text-slate-800">rhprojetoia@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Localização</p>
                    <p className="text-sm font-semibold text-slate-800">Brasil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form / Success State */}
            {leadSubmitted ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50 flex flex-col items-center justify-center text-center py-12">
                <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 animate-bounce" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitação Enviada!</h3>
                <p className="text-slate-600 text-sm max-w-sm mb-6">
                  Recebemos o seu contato com sucesso. Um de nossos consultores de vendas entrará em contato o mais rápido possível no e-mail ou telefone informado.
                </p>
                <Button
                  variant="outline"
                  className="rounded-xl px-6 py-2 text-sm font-semibold border-slate-200 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setLeadSubmitted(false)}
                >
                  Enviar outra solicitação
                </Button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-100/50">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Envie uma mensagem</h3>
                <form className="space-y-4" onSubmit={handleSubmitLead}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Silva"
                        value={leadName}
                        onChange={e => setLeadName(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Telefone *</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (31) 98623-0171"
                        value={leadPhone}
                        onChange={e => setLeadPhone(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">E-mail Corporativo *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: joao@suaempresa.com"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Mensagem / Observação</label>
                    <textarea
                      rows={4}
                      placeholder="Conte-nos um pouco sobre a sua operação logística..."
                      value={leadMessage}
                      onChange={e => setLeadMessage(e.target.value)}
                      className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmittingLead}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 cursor-pointer"
                  >
                    {isSubmittingLead ? 'Enviando...' : 'Enviar Solicitação'}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 flex items-center justify-center">
                <img src="/logo.png" alt="Estoque Fácil Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-lg text-white">Estoque Fácil</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#inicio" className="hover:text-white transition-colors">Início</a>
              <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
              <a href="#beneficios" className="hover:text-white transition-colors">Vantagens</a>
              <a href="#contato" className="hover:text-white transition-colors">Contato</a>
              <button onClick={handleClientAreaClick} className="hover:text-white transition-colors cursor-pointer">
                Área do Cliente
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs">
            <p>© {new Date().getFullYear()} Estoque Fácil WMS. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">
              Desenvolvido com tecnologia de ponta para coletores móveis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
