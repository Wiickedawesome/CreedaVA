import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Briefcase,
  ChartLineUp,
  ArrowRight,
  Star,
  ClipboardText,
  ChatCircle,
  ShoppingCart,
  Article,
  UserCircle,
  Quotes,
  Calendar,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { LazyAnimatedBackground } from '@/components/LazyAnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'
import { DynamicSEO } from '@/components/SEO'

export function Home() {
  const { t } = useTranslation();
  
  const services = [
    {
      icon: <Briefcase className="text-accent" size={32} />,
      title: t('home.servicesPreview.executive.title'),
      description: t('home.servicesPreview.executive.description'),
    },
    {
      icon: <ClipboardText className="text-accent" size={32} />,
      title: t('home.servicesPreview.administrative.title'),
      description: t('home.servicesPreview.administrative.description'),
    },
    {
      icon: <ChatCircle className="text-accent" size={32} />,
      title: t('home.servicesPreview.customerService.title'),
      description: t('home.servicesPreview.customerService.description'),
    },
    {
      icon: <ShoppingCart className="text-accent" size={32} />,
      title: t('home.servicesPreview.ecommerce.title'),
      description: t('home.servicesPreview.ecommerce.description'),
    },
    {
      icon: <Article className="text-accent" size={32} />,
      title: t('home.servicesPreview.content.title'),
      description: t('home.servicesPreview.content.description'),
    },
    {
      icon: <ChartLineUp className="text-accent" size={32} />,
      title: t('home.servicesPreview.insurance.title'),
      description: t('home.servicesPreview.insurance.description'),
    },
  ]

  const testimonials = [
    {
      quote: t('home.testimonials.testimonial1.quote'),
      author: t('home.testimonials.testimonial1.author'),
      role: t('home.testimonials.testimonial1.role'),
      rating: 5,
    },
    {
      quote: t('home.testimonials.testimonial2.quote'),
      author: t('home.testimonials.testimonial2.author'),
      role: t('home.testimonials.testimonial2.role'),
      rating: 5,
    },
    {
      quote: t('home.testimonials.testimonial3.quote'),
      author: t('home.testimonials.testimonial3.author'),
      role: t('home.testimonials.testimonial3.role'),
      rating: 5,
    },
  ]

  const stats = [
    { value: '5+', label: t('home.stats.experience') },
    { value: '98%', label: t('home.stats.satisfaction') },
    { value: '<24h', label: t('home.stats.response') },
    { value: '24/7', label: t('home.stats.support') },
  ]

  // FAQPage structured data for Google rich results
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      { '@type': 'Question', 'name': t('home.faq.question1.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question1.a') } },
      { '@type': 'Question', 'name': t('home.faq.question2.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question2.a') } },
      { '@type': 'Question', 'name': t('home.faq.question3.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question3.a') } },
      { '@type': 'Question', 'name': t('home.faq.question4.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question4.a') } },
      { '@type': 'Question', 'name': t('home.faq.question5.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question5.a') } },
      { '@type': 'Question', 'name': t('home.faq.question6.q'), 'acceptedAnswer': { '@type': 'Answer', 'text': t('home.faq.question6.a') } },
    ]
  }

  return (
    <>
      <DynamicSEO page="home" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <LazyAnimatedBackground />
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
                {t('home.hero.badge')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                {t('home.hero.title')}
                <br />
                <span className="text-accent">{t('home.hero.titleAccent')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl lg:max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t('home.hero.subtitle')}
                {' '}{t('home.hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center lg:items-start">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 group shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Link to="/contact">
                    {t('home.hero.ctaPrimary')}
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 transition-all duration-300 border-2 border-accent text-accent hover:text-accent-foreground hover:bg-accent"
                >
                  <Link to="/services">{t('home.hero.ctaSecondary')}</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative flex justify-center"
            >
              <CreedaLogo variant="main" size={420} animate={false} className="w-full max-w-[420px]" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 relative overflow-hidden">
  <div className="absolute inset-0 -z-10" style={{background: 'linear-gradient(to right, var(--green-600)/0.05, var(--navy-600)/0.05, var(--green-600)/0.05)'}} />
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                className="text-center p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-accent/20 shadow-lg hover:shadow-xl hover:border-accent/40 transition-all duration-300"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2 text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-accent font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('home.servicesPreview.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                {t('home.servicesPreview.subtitle')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="agent" size={128} animate={true} />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Card className="h-full hover:shadow-xl hover:border-accent/50 transition-all duration-300 border-border/50 cursor-pointer group">
                  <CardHeader>
                    <div className="mb-4 transition-transform group-hover:scale-110 duration-300">{service.icon}</div>
                    <CardTitle className="text-xl group-hover:text-accent transition-colors">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="hover:bg-accent/10 hover:border-accent transition-all duration-300">
              <Link to="/services">{t('home.servicesPreview.viewAll')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 relative overflow-hidden bg-linear-to-b from-background via-muted/20 to-background">
        {/* Subtle modern background pattern */}
        <div className="absolute inset-0 -z-10 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(20, 160, 133, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(44, 62, 80, 0.03) 0%, transparent 50%)'
        }} />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              {t('home.howItWorks.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.howItWorks.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-accent/30 to-transparent" />
            
            {[
              {
                step: '01',
                title: t('home.howItWorks.step1.title'),
                description: t('home.howItWorks.step1.description'),
              },
              {
                step: '02',
                title: t('home.howItWorks.step2.title'),
                description: t('home.howItWorks.step2.description'),
              },
              {
                step: '03',
                title: t('home.howItWorks.step3.title'),
                description: t('home.howItWorks.step3.description'),
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="relative"
              >
                <div className="text-8xl font-bold bg-linear-to-br from-accent/20 to-accent/5 bg-clip-text text-transparent absolute -top-6 -left-4 select-none">
                  {item.step}
                </div>
                <Card className="relative z-10 h-full bg-background/80 backdrop-blur-sm hover:shadow-2xl hover:border-accent/50 transition-all duration-300 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl hover:text-accent transition-colors">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <Link to="/contact">{t('home.howItWorks.cta')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          whileInView={{ opacity: 0.3, x: 0 }}
          viewport={{ once: true }}
          className="absolute left-8 top-24 hidden xl:block"
        >
          <CreedaLogo variant="compact" size={100} animate={false} className="opacity-20" />
        </motion.div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('home.testimonials.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.testimonials.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="text-accent" size={20} weight="fill" />
                      ))}
                    </div>
                    <Quotes className="text-accent/30" size={32} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-6 leading-relaxed italic">
                      "{testimonial.quote}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <UserCircle className="text-accent" size={32} />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t('home.faq.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('home.faq.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question1.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question1.a')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question2.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question2.a')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question3.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question3.a')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question4.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question4.a')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question5.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question5.a')}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-background border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-accent transition-colors text-base md:text-lg py-4">
                  {t('home.faq.question6.q')}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                  {t('home.faq.question6.a')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 relative overflow-hidden">
  <div className="absolute inset-0 -z-10" style={{background: 'linear-gradient(to right, var(--green-600)/0.05, var(--navy-600)/0.1, var(--green-600)/0.05)'}} />
        <div className="absolute inset-0 -z-10" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
        }} />
        <div className="container mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-[1fr_auto] items-center gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center lg:text-left"
            >
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                {t('home.finalCta.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                {t('home.finalCta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  <Link to="/contact">{t('home.finalCta.ctaPrimary')}</Link>
                </Button>
                <Button 
                  asChild 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                >
                  <a href="https://calendly.com/john-creedava" target="_blank" rel="noopener noreferrer">
                    <Calendar className="mr-2" size={20} />
                    {t('home.finalCta.ctaSecondary')}
                  </a>
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="service" size={200} animate={true} />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
    </>
  )
}
