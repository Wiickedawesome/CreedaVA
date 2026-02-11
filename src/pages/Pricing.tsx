import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Phone, UsersThree, ChartLineUp } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'
import { DynamicSEO } from '@/components/SEO'

export function Pricing() {
  const { t } = useTranslation();
  
  const plans = [
    {
      name: t('pricing.starter.name'),
      hours: t('pricing.starter.hours'),
      price: t('pricing.starter.price'),
      description: t('pricing.starter.description'),
      features: [
        t('pricing.starter.features.va'),
        t('pricing.starter.features.bilingual'),
        t('pricing.starter.features.priority'),
        t('pricing.starter.features.taskManagement'),
        t('pricing.starter.features.reports'),
        t('pricing.starter.features.documentation'),
        t('pricing.starter.features.collaboration'),
      ],
      popular: false,
    },
    {
      name: t('pricing.professional.name'),
      hours: t('pricing.professional.hours'),
      price: t('pricing.professional.price'),
      description: t('pricing.professional.description'),
      features: [
        t('pricing.professional.features.seniorVa'),
        t('pricing.professional.features.bilingual'),
        t('pricing.professional.features.support247'),
        t('pricing.professional.features.meetings'),
        t('pricing.professional.features.analytics'),
        t('pricing.professional.features.optimization'),
        t('pricing.professional.features.skills'),
        t('pricing.professional.features.manager'),
      ],
      popular: true,
    },
    {
      name: t('pricing.enterprise.name'),
      hours: t('pricing.enterprise.hours'),
      price: t('pricing.enterprise.price'),
      description: t('pricing.enterprise.description'),
      features: [
        t('pricing.enterprise.features.multipleVas'),
        t('pricing.enterprise.features.multilingual'),
        t('pricing.enterprise.features.support247'),
        t('pricing.enterprise.features.accountManager'),
        t('pricing.enterprise.features.customWorkflows'),
        t('pricing.enterprise.features.teamLead'),
        t('pricing.enterprise.features.sla'),
        t('pricing.enterprise.features.onboarding'),
      ],
      popular: false,
    },
  ]

  const howItWorks = [
    {
      step: t('pricing.howItWorks.step1.number'),
      title: t('pricing.howItWorks.step1.title'),
      description: t('pricing.howItWorks.step1.description'),
      icon: <Phone size={32} className="text-accent" />,
    },
    {
      step: t('pricing.howItWorks.step2.number'),
      title: t('pricing.howItWorks.step2.title'),
      description: t('pricing.howItWorks.step2.description'),
      icon: <UsersThree size={32} className="text-accent" />,
    },
    {
      step: t('pricing.howItWorks.step3.number'),
      title: t('pricing.howItWorks.step3.title'),
      description: t('pricing.howItWorks.step3.description'),
      icon: <ChartLineUp size={32} className="text-accent" />,
    },
  ]

  const faqs = [
    {
      question: t('pricing.faq.question1'),
      answer: t('pricing.faq.answer1'),
    },
    {
      question: t('pricing.faq.question2'),
      answer: t('pricing.faq.answer2'),
    },
    {
      question: t('pricing.faq.question3'),
      answer: t('pricing.faq.answer3'),
    },
    {
      question: t('pricing.faq.question4'),
      answer: t('pricing.faq.answer4'),
    },
  ]

  // FAQPage structured data for Google rich results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer }
    }))
  }

  return (
    <>
      <DynamicSEO page="pricing" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
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
                {t('pricing.badge')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                {t('pricing.title').split(' ').slice(0, -2).join(' ')} <span className="text-accent">{t('pricing.title').split(' ').slice(-2).join(' ')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('pricing.subtitle')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="service" size={250} animate={true} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-accent shadow-lg scale-105' : 'border-border/50'}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-white">{t('pricing.professional.popular')}</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground mt-2">
                      {plan.hours}
                    </CardDescription>
                    <div className="text-3xl font-bold text-accent mt-4">{plan.price}</div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-6" />
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <CheckCircle className="text-accent shrink-0 mt-0.5" size={20} weight="fill" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Link to="/contact">{t('pricing.getStarted')}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('pricing.howItWorks.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('pricing.howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <Card className="h-full border-border/50">
                  <CardHeader>
                    <div className="text-6xl font-bold text-accent/20 mb-4">{item.step}</div>
                    <div className="mb-4">{item.icon}</div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t('pricing.faq.title')}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              {t('pricing.cta.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('pricing.cta.subtitle')}
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              <Link to="/contact">{t('pricing.cta.button')}</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}
