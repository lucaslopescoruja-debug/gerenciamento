import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, ArrowRight, Map } from 'lucide-react'

export default function CountsMenu() {
  return (
    <div className="space-y-6 slide-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight gradient-text">Módulo de Contagens</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Selecione o tipo de contagem que deseja realizar
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Contagem Avulsa */}
        <Card className="border-primary/20 hover:border-primary/50 transition-colors glass-card overflow-hidden group">
          <CardContent className="p-0">
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Contagem Avulsa</h2>
              <p className="text-muted-foreground text-sm mb-8 flex-1">
                Faça contagens rápidas de produtos usando o leitor. 
                Ideal para conferência de prateleiras específicas ou verificações pontuais sem afetar o estoque geral.
              </p>
              <Link to="/contagens/avulsa">
                <Button className="w-full h-12 text-md group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all">
                  Iniciar Contagem
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>



        {/* Inventário Planejado */}
        <Card className="border-emerald-500/20 hover:border-emerald-500/50 transition-colors glass-card overflow-hidden group relative md:col-span-2 lg:col-span-1">
          <CardContent className="p-0">
            <div className="p-6 md:p-8 flex flex-col h-full">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Map className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Inventário Planejado (Por Áreas)</h2>
              <p className="text-muted-foreground text-sm mb-8 flex-1">
                Para grandes operações. Planeje o inventário dividindo o galpão em setores/áreas. 
                Os operadores coletam informando o local exato, garantindo total rastreabilidade.
              </p>
              <Link to="/contagens/planejados">
                <Button className="w-full h-12 text-md bg-emerald-600 hover:bg-emerald-700 text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                  Acessar Painel
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
