import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  Heart,
  Users,
  ShieldCheck,
  TrendUp,
  Handshake,
  CheckCircle,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { CreedaLogo } from '@/components/CreedaLogo'
import { SEO, seoData } from '@/components/SEO'

export function About() {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: <ShieldCheck className="text-accent" size={32} />,
      title: t('about.values.reliability.title'),
      description: t('about.values.reliability.description'),
    },
    {
      icon: <Heart className="text-accent" size={32} />,
      title: t('about.values.excellence.title'),
      description: t('about.values.excellence.description'),
    },
    {
      icon: <Users className="text-accent" size={32} />,
      title: t('about.values.partnership.title'),
      description: t('about.values.partnership.description'),
    },
    {
      icon: <TrendUp className="text-accent" size={32} />,
      title: t('about.values.growth.title'),
      description: t('about.values.growth.description'),
    },
  ]

  const differentiators = [
    t('about.whyChoose.item1'),
    t('about.whyChoose.item2'),
    t('about.whyChoose.item3'),
    t('about.whyChoose.item4'),
    t('about.whyChoose.item5'),
    t('about.whyChoose.item6'),
    t('about.whyChoose.item7'),
  ]

  const stats = [
    { value: '2023', label: t('about.stats.founded') },
    { value: '100%', label: t('about.stats.speaking') },
    { value: 'Belize', label: t('about.stats.based') },
    { value: '98%', label: t('about.stats.satisfaction') },
  ]

  const belizeAdvantages = [
    {
      title: t('about.belizeAdvantage.bilingual.title'),
      description: t('about.belizeAdvantage.bilingual.description'),
    },
    {
      title: t('about.belizeAdvantage.cultural.title'),
      description: t('about.belizeAdvantage.cultural.description'),
    },
    {
      title: t('about.belizeAdvantage.timezone.title'),
      description: t('about.belizeAdvantage.timezone.description'),
    },
    {
      title: t('about.belizeAdvantage.workforce.title'),
      description: t('about.belizeAdvantage.workforce.description'),
    },
  ]

  return (
    <>
      <SEO {...seoData.about} />
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
                {t('about.hero.badge')}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                {t('about.hero.title')} <span className="text-accent">{t('about.hero.titleAccent')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t('about.hero.subtitle')}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <CreedaLogo variant="agent" size={200} animate={true} />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-accent mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
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
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">{t('about.storyTitle')}</h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p dangerouslySetInnerHTML={{ __html: t('about.storyParagraph1').replace('CreedaVA', '<span class="text-accent font-semibold">CreedaVA</span>') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.storyParagraph2').replace(/CreedaVA/g, '<span class="text-accent font-semibold">CreedaVA</span>') }} />
                <p dangerouslySetInnerHTML={{ __html: t('about.storyParagraph3').replace('CreedaVA is more than a service; it\'s a movement', '<span class="text-accent font-semibold">CreedaVA is more than a service; it\'s a movement</span>').replace('CreedaVA', '<span class="text-accent font-semibold">CreedaVA</span>') }} />
              </div>
            </div>

            <div className="flex items-start gap-4 pt-8">
              <Target className="text-accent shrink-0 mt-1" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('about.missionTitle')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('about.missionText')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Handshake className="text-accent shrink-0 mt-1" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">{t('about.approachTitle')}</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t('about.approachText')}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

  <section className="py-24 px-4 bg-accent/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              {t('about.belizeAdvantage.badge')}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('about.belizeAdvantage.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('about.belizeAdvantage.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {belizeAdvantages.map((advantage, index) => (
              <motion.div
                key={advantage.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl hover:border-accent/50 transition-all duration-300 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-xl text-accent">{advantage.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {advantage.description}
                    </p>
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
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t('about.valuesTitle')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('about.valuesSubtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center hover:shadow-lg transition-shadow border-border/50">
                  <CardHeader>
                    <div className="flex justify-center mb-4">{value.icon}</div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {value.description}
                    </p>
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
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {t('about.whyChoose.title')}
            </h2>
            <Card className="border-border/50">
              <CardContent className="pt-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {differentiators.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="text-accent shrink-0 mt-0.5" size={24} weight="fill" />
                      <span className="text-foreground">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
              {t('about.finalCta.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('about.finalCta.subtitle')}
            </p>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
              <Link to="/contact">{t('about.finalCta.cta')}</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  )
}
