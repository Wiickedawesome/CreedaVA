import { Link } from 'react-router-dom'
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

export function Services() {
  const serviceCategories = [
    {
      icon: <Briefcase className="text-accent" size={40} />,
      title: 'Executive Support',
      description: 'Comprehensive support for busy executives and entrepreneurs',
      features: [
        'Calendar management and scheduling',
        'Travel planning and coordination',
        'Meeting preparation and follow-up',
        'Inbox organization and email management',
        'Document preparation and formatting',
        'Expense tracking and reporting',
      ],
    },
    {
      icon: <ClipboardText className="text-accent" size={40} />,
      title: 'Administrative Tasks',
      description: 'General administrative support to keep your business running smoothly',
      features: [
        'Data entry and database management',
        'Document organization and filing',
        'Spreadsheet creation and maintenance',
        'Research and data compilation',
        'Report generation',
        'General correspondence handling',
      ],
    },
    {
      icon: <ChatCircle className="text-accent" size={40} />,
      title: 'Customer Service',
      description: 'Professional customer support to delight your clients',
      features: [
        'Email and live chat support',
        'Customer inquiry management',
        'Order processing and tracking',
        'Returns and refunds handling',
        'Client onboarding',
        'Feedback collection and analysis',
      ],
    },
    {
      icon: <ShoppingCart className="text-accent" size={40} />,
      title: 'E-commerce Support',
      description: 'Complete e-commerce operations management',
      features: [
        'Product listing and descriptions',
        'Inventory management',
        'Order fulfillment coordination',
        'Marketplace optimization',
        'Customer review management',
        'Competitor analysis',
      ],
    },
    {
      icon: <Article className="text-accent" size={40} />,
      title: 'Content & Social Media',
      description: 'Engage your audience with consistent, quality content',
      features: [
        'Social media scheduling and posting',
        'Content calendar management',
        'Blog post preparation',
        'Community engagement',
        'Basic graphic design coordination',
        'Analytics monitoring',
      ],
    },
    {
      icon: <ChartLineUp className="text-accent" size={40} />,
      title: 'Insurance Support',
      description: 'Professional assistance for insurance operations',
      features: [
        'Policy documentation and filing',
        'Claims processing assistance',
        'Client communication management',
        'Quote preparation and follow-up',
        'Renewal tracking and reminders',
        'Database management and updates',
      ],
    },
    {
      icon: <FileText className="text-accent" size={40} />,
      title: 'Bookkeeping Support',
      description: 'Financial administrative support for your business',
      features: [
        'Invoice preparation and tracking',
        'Expense categorization',
        'Receipt organization',
        'Payment follow-ups',
        'Financial data entry',
        'Basic reporting assistance',
      ],
    },
    {
      icon: <PresentationChart className="text-accent" size={40} />,
      title: 'Real Estate Support',
      description: 'Comprehensive administrative support for real estate professionals',
      features: [
        'Commission reconciliation and tracking',
        'Qualify and manage leads',
        'Transaction pipeline management',
        'Sales outreach and follow-up coordination',
        'Servicing and maintaining book of business',
        'Client database management and updates',
      ],
    },
    {
      icon: <Phone className="text-accent" size={40} />,
      title: 'Technology Support',
      description: 'Comprehensive technical support and IT solutions for your business',
      features: [
        'Tier 1 and Tier 2 technical support',
        'Scrum and agile product development',
        'IT project management and coordination',
        'Website development and maintenance',
        'Database management and optimization',
        'Product testing and quality assurance',
      ],
    },
  ]

  return (
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
                Comprehensive Support Solutions
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Our <span className="text-accent">Services</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                From administrative tasks to specialized support, our virtual assistants are trained to handle
                your unique business needs with professionalism and expertise. Bilingual support available.
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
                          <CheckCircle className="text-accent flex-shrink-0 mt-0.5" size={18} weight="fill" />
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
              Need a Custom Solution?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Don't see exactly what you're looking for? We specialize in creating custom support packages
              tailored to your specific business needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/contact">Discuss Your Needs</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">View Pricing Plans</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
