import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Phone, UsersThree, ChartLineUp } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export function Pricing() {
  const plans = [
    {
      name: 'Starter',
      hours: '20 hours/month',
      price: 'Starting at $600',
      description: 'Perfect for individuals and small teams getting started with virtual assistance',
      features: [
        'Dedicated virtual assistant',
        'Email & chat support',
        'Basic task management',
        'Monthly reporting',
        'Flexible scheduling',
      ],
      popular: false,
    },
    {
      name: 'Business',
      hours: '160 hours/month',
      price: '$1,499/month',
      description: 'Full-time dedicated support for businesses that need consistent assistance',
      features: [
        'Dedicated full-time VA',
        'Bilingual support available',
        'Priority response',
        'Advanced task management',
        'Weekly progress reports',
        'Process documentation',
        'Team collaboration tools',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      hours: '160 hours/month',
      price: '$1,799/month',
      description: 'Premium full-time support with senior VAs and specialized expertise',
      features: [
        'Dedicated senior VA',
        'Bilingual support available',
        'Priority support 24/7',
        'Weekly sync meetings',
        'Advanced reporting & analytics',
        'Process optimization',
        'Specialized skills & training',
        'Account manager',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      hours: 'Custom hours',
      price: 'Custom pricing',
      description: 'Tailored solutions for organizations with complex needs',
      features: [
        'Multiple VAs & specialists',
        'Bilingual & multilingual support',
        '24/7 priority support',
        'Dedicated account manager',
        'Custom workflows & integrations',
        'Team lead coordination',
        'SLA guarantees',
        'Onboarding & training support',
      ],
      popular: false,
    },
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Discovery Call',
      description: 'We discuss your needs, challenges, and goals to find the perfect match for your business.',
      icon: <Phone size={32} className="text-accent" />,
    },
    {
      step: '02',
      title: 'Meet Your VA',
      description: 'Get introduced to your carefully selected virtual assistant and establish workflows.',
      icon: <UsersThree size={32} className="text-accent" />,
    },
    {
      step: '03',
      title: 'Scale & Succeed',
      description: 'Focus on high-value work while your VA handles tasks efficiently and professionally.',
      icon: <ChartLineUp size={32} className="text-accent" />,
    },
  ]

  const faqs = [
    {
      question: 'What types of tasks can a virtual assistant handle?',
      answer: 'Our VAs handle a wide range of tasks including administrative work, customer service, scheduling, email management, data entry, social media, e-commerce support, and much more.',
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Absolutely! We offer flexible plans that can be adjusted based on your changing needs. You can scale up or down at any time.',
    },
    {
      question: 'How do you ensure quality and security?',
      answer: 'All our VAs undergo rigorous vetting and training. We use secure communication channels and sign NDAs to protect your sensitive information.',
    },
    {
      question: 'What if I need specialized skills?',
      answer: 'We have VAs with specialized skills across various industries and functions. During our discovery call, we\'ll match you with the best fit for your specific needs.',
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
              Transparent Pricing
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Flexible <span className="text-accent">Pricing Plans</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your needs. All plans include a dedicated VA and can be customized
              to match your specific requirements.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                      <Badge className="bg-accent text-white">Most Popular</Badge>
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
                          <CheckCircle className="text-accent flex-shrink-0 mt-0.5" size={20} weight="fill" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className={`w-full mt-6 ${
                        plan.popular
                          ? 'bg-accent hover:bg-accent/90 text-white'
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      <Link to="/contact">Get Started</Link>
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
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with your dedicated virtual assistant in three simple steps
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
              Frequently Asked Questions
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
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Schedule your free consultation today and discover how CreedaVA can transform your business.
            </p>
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white px-8">
              <Link to="/contact">Schedule Free Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
