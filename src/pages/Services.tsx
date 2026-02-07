import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  ChatCircle,
  ShoppingCart,
  Article,
  Phone,
  Calendar,
  EnvelopeSimple,
  FileText,
  ChartBar,
  PresentationChart,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'
import { SEO, seoData } from '@/components/SEO'

export function Services() {
  const { t } = useTranslation();
  
  const serviceCategories = [
    {
      icon: <Briefcase className="text-accent" size={40} />,
      title: t('services.executive.title'),
      description: t('services.executive.description'),
      features: [
        t('services.executive.features.calendar'),
        t('services.executive.features.travel'),
        t('services.executive.features.meetings'),
        t('services.executive.features.inbox'),
        t('services.executive.features.documents'),
        t('services.executive.features.expenses'),
      ],
    },
    {
      icon: <ClipboardText className="text-accent" size={40} />,
      title: t('services.admin.title'),
      description: t('services.admin.description'),
      features: [
        t('services.admin.features.dataEntry'),
        t('services.admin.features.documents'),
        t('services.admin.features.spreadsheets'),
        t('services.admin.features.research'),
        t('services.admin.features.reports'),
        t('services.admin.features.correspondence'),
      ],
    },
    {
      icon: <ChatCircle className="text-accent" size={40} />,
      title: t('services.customer.title'),
      description: t('services.customer.description'),
      features: [
        t('services.customer.features.support'),
        t('services.customer.features.inquiries'),
        t('services.customer.features.orders'),
        t('services.customer.features.returns'),
        t('services.customer.features.onboarding'),
        t('services.customer.features.feedback'),
      ],
    },
    {
      icon: <ShoppingCart className="text-accent" size={40} />,
      title: t('services.ecommerce.title'),
      description: t('services.ecommerce.description'),
      features: [
        t('services.ecommerce.features.listing'),
        t('services.ecommerce.features.inventory'),
        t('services.ecommerce.features.fulfillment'),
        t('services.ecommerce.features.optimization'),
        t('services.ecommerce.features.reviews'),
        t('services.ecommerce.features.analysis'),
      ],
    },
    {
      icon: <Article className="text-accent" size={40} />,
      title: t('services.content.title'),
      description: t('services.content.description'),
      features: [
        t('services.content.features.scheduling'),
        t('services.content.features.calendar'),
        t('services.content.features.blog'),
        t('services.content.features.engagement'),
        t('services.content.features.graphics'),
        t('services.content.features.analytics'),
      ],
    },
    {
      icon: <ChartLineUp className="text-accent" size={40} />,
      title: t('services.insurance.title'),
      description: t('services.insurance.description'),
      features: [
        t('services.insurance.features.documentation'),
        t('services.insurance.features.claims'),
        t('services.insurance.features.communication'),
        t('services.insurance.features.quotes'),
        t('services.insurance.features.renewals'),
        t('services.insurance.features.database'),
      ],
    },
    {
      icon: <FileText className="text-accent" size={40} />,
      title: t('services.bookkeeping.title'),
      description: t('services.bookkeeping.description'),
      features: [
        t('services.bookkeeping.features.invoices'),
        t('services.bookkeeping.features.expenses'),
        t('services.bookkeeping.features.receipts'),
        t('services.bookkeeping.features.payments'),
        t('services.bookkeeping.features.dataEntry'),
        t('services.bookkeeping.features.reporting'),
      ],
    },
    {
      icon: <PresentationChart className="text-accent" size={40} />,
      title: t('services.realEstate.title'),
      description: t('services.realEstate.description'),
      features: [
        t('services.realEstate.features.commission'),
        t('services.realEstate.features.leads'),
        t('services.realEstate.features.pipeline'),
        t('services.realEstate.features.outreach'),
        t('services.realEstate.features.servicing'),
        t('services.realEstate.features.clientDatabase'),
      ],
    },
    {
      icon: <Phone className="text-accent" size={40} />,
      title: t('services.technology.title'),
      description: t('services.technology.description'),
      features: [
        t('services.technology.features.technical'),
        t('services.technology.features.scrum'),
        t('services.technology.features.projectManagement'),
        t('services.technology.features.webDev'),
        t('services.technology.features.database'),
        t('services.technology.features.qa'),
      ],
    },
  ]

  return (
    <>
      <SEO {...seoData.services} />
      <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <AnimatedBackground />
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
                {t('services.badge')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                {t('services.title').split(' ')[0]} <span className="text-accent">{t('services.title').split(' ')[1]}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('services.subtitle')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="service" size={200} animate={true} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="mb-4">{service.icon}</div>
                    <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle className="text-accent shrink-0 mt-0.5" size={18} weight="fill" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              {t('services.cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('services.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/contact">{t('services.cta.button')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">{t('pricing.title')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}
