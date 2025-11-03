import { Link } from 'react-router-dom'
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

export function About() {
  const values = [
    {
      icon: <ShieldCheck className="text-accent" size={32} />,
      title: 'Reliability',
      description: 'We deliver consistent, dependable support you can count on every single day.',
    },
    {
      icon: <Heart className="text-accent" size={32} />,
      title: 'Excellence',
      description: 'We maintain the highest standards in every task, treating your business as our own.',
    },
    {
      icon: <Users className="text-accent" size={32} />,
      title: 'Partnership',
      description: 'We work alongside you as an extension of your team, not just a service provider.',
    },
    {
      icon: <TrendUp className="text-accent" size={32} />,
      title: 'Growth',
      description: 'We continuously improve our skills and processes to support your evolving needs.',
    },
  ]

  const differentiators = [
    'Rigorously vetted and trained virtual assistants',
    'Bilingual support available',
    'Dedicated account management and support',
    'Flexible, scalable solutions that grow with you',
    'Transparent communication and regular reporting',
    'Industry-specific expertise and specializations',
    'Secure, confidential handling of all information',
  ]

  const stats = [
    { value: '2023', label: 'Founded' },
    { value: '100%', label: 'English-Speaking' },
    { value: 'Belize', label: 'Based' },
    { value: '98%', label: 'Client Satisfaction' },
  ]

  const belizeAdvantages = [
    {
      title: 'Bilingual Excellence',
      description: 'Only English-speaking country in Central America. Our team is fluent in both English and Spanish, serving diverse global markets.',
    },
    {
      title: 'Cultural Adaptability',
      description: 'At the crossroads of cultures, Belizeans bring unique versatility, adaptability, and cross-cultural communication skills.',
    },
    {
      title: 'Time Zone Advantage',
      description: 'Central Standard Time (CST) aligns perfectly with North American business hours for real-time collaboration.',
    },
    {
      title: 'Professional Workforce',
      description: 'Rising education standards combined with limited local opportunities create a pool of highly motivated, skilled professionals.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background -z-10" />
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              Our Story
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              About <span className="text-accent">CreedaVA</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              We're more than a virtual assistant service—we're your strategic partner in growth,
              dedicated to helping ambitious businesses achieve more.
            </p>
          </motion.div>
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
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">Our Story</h2>
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Founded in 2023, <span className="text-accent font-semibold">CreedaVA</span> is a Belize-based virtual assistant 
                  agency with a mission to bridge opportunity and talent. In a nation where education continues to rise but employment 
                  remains scarce, CreedaVA stands as a digital bridge — connecting Belize's highly skilled, English-speaking professionals 
                  with global businesses in need of dedicated, reliable, and growth-minded virtual assistants.
                </p>
                <p>
                  Belize, the only English-speaking country in Central America, is uniquely positioned at the crossroads of cultures, 
                  making Belizeans fluent in English and Spanish, and rich in adaptability, communication, and professionalism. CreedaVA 
                  harnesses that cultural versatility to deliver world-class virtual support across industries, from administration and 
                  marketing to customer success and executive assistance.
                </p>
                <p>
                  At its core, <span className="text-accent font-semibold">CreedaVA is more than a service; it's a movement</span> to 
                  empower Belize's workforce, foster remote career growth, and create sustainable pathways for global collaboration. 
                  By hiring through CreedaVA, companies don't just get exceptional talent — they invest in a vision of progress, purpose, 
                  and partnership.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-8">
              <Target className="text-accent flex-shrink-0 mt-1" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  To bridge opportunity and talent by connecting Belize's highly skilled workforce with global businesses, 
                  creating sustainable remote career pathways while delivering exceptional virtual assistant services that 
                  empower companies to achieve more.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Handshake className="text-accent flex-shrink-0 mt-1" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Our Approach</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  We take a partnership approach with every client. From our initial discovery call through
                  ongoing support, we invest time in understanding your business, your challenges, and your goals.
                  This allows us to match you with the perfect virtual assistant and create workflows that
                  truly enhance your productivity. We're not just completing tasks—we're helping you build
                  systems that scale.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 bg-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-accent/10 text-accent border-accent/20" variant="outline">
              The Belize Advantage
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Why Belize?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover what makes Belizean virtual assistants uniquely positioned to serve global businesses
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
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at CreedaVA
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
              Why Choose CreedaVA?
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
                      <CheckCircle className="text-accent flex-shrink-0 mt-0.5" size={24} weight="fill" />
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
              Ready to Work Together?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Let's discuss how CreedaVA can become your trusted partner in growth.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
              <Link to="/contact">Get Started Today</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
