// Example: How to update Home.tsx with translations
import { useTranslation } from 'react-i18next'

export function Home() {
  const { t } = useTranslation()
  
  return (
    <>
      <SEO {...seoData.home} />
      <div className="min-h-screen bg-background">
        {/* Hero Section Example */}
        <section className="relative py-32 px-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {t('hero.title')}
            <br />
            <span className="text-accent">{t('hero.subtitle')}</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('hero.description')}
          </p>
          <Button asChild size="lg">
            <Link to="/contact">{t('hero.cta')}</Link>
          </Button>
        </section>

        {/* Services Section Example */}
        <section className="py-24 px-4">
          <h2 className="text-4xl font-bold mb-4">{t('services.title')}</h2>
          <p className="text-xl text-muted-foreground">{t('services.subtitle')}</p>
          
          {/* Service Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <Card>
              <CardHeader>
                <CardTitle>{t('services.executive.title')}</CardTitle>
                <CardDescription>
                  {t('services.executive.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('services.admin.title')}</CardTitle>
                <CardDescription>
                  {t('services.admin.description')}
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('services.customer.title')}</CardTitle>
                <CardDescription>
                  {t('services.customer.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <Button asChild className="mt-8">
            <Link to="/services">{t('services.viewAll')}</Link>
          </Button>
        </section>

        {/* Footer CTAs */}
        <section className="py-16 px-4 bg-accent/10">
          <Button asChild size="lg">
            <Link to="/contact">{t('common.contactUs')}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/about">{t('common.learnMore')}</Link>
          </Button>
        </section>
      </div>
    </>
  )
}

// That's it! When user switches language, all text automatically updates
// English: "Professional Virtual Assistants from Belize"
// Spanish: "Asistentes Virtuales Profesionales desde Belice"
