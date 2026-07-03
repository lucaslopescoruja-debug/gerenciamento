import { HelpCircle, Mail, MessageCircle, FileQuestion, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function HelpAndSupport() {
  const handleWhatsApp = () => {
    window.open('https://wa.me/5573999476822', '_blank') 
  }

  const handleEmail = () => {
    window.open('mailto:comercial.sl.stock@gmail.com', '_blank')
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          Ajuda e Suporte
        </h1>
        <p className="text-muted-foreground mt-2">
          Encontre respostas para suas dúvidas ou entre em contato com nossa equipe.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contato Direto */}
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              Fale com a gente
            </CardTitle>
            <CardDescription>
              Precisa de ajuda urgente ou tem alguma dúvida? Nossa equipe está pronta para te atender.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleWhatsApp} 
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center gap-2 h-12 text-md"
            >
              <MessageCircle className="h-5 w-5" />
              Chamar no WhatsApp
            </Button>
            
            <Button 
              onClick={handleEmail}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-12 text-md hover:bg-primary/5"
            >
              <Mail className="h-5 w-5" />
              Enviar E-mail
            </Button>
          </CardContent>
        </Card>

        {/* FAQ Preview (Para futuro) */}
        <Card className="border-border/50 shadow-sm opacity-70 relative overflow-hidden group">
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-center transition-opacity group-hover:opacity-80">
            <span className="bg-background/80 px-4 py-2 rounded-full text-sm font-medium border border-border/50 shadow-sm">
              Em breve
            </span>
          </div>
          
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Base de Conhecimento
            </CardTitle>
            <CardDescription>
              Tutoriais passo a passo e respostas para as perguntas mais frequentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border/50 bg-card">
                <FileQuestion className="h-4 w-4 shrink-0" />
                Como cadastrar um novo cliente?
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border/50 bg-card">
                <FileQuestion className="h-4 w-4 shrink-0" />
                Como funciona a aprovação de cargas?
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-border/50 bg-card">
                <FileQuestion className="h-4 w-4 shrink-0" />
                Dicas para usar o App de Vendas
              </div>
            </div>
            <Button variant="link" className="mt-4 w-full justify-start text-muted-foreground p-0" disabled>
              Ver todas as perguntas...
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
