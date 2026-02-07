import { useTranslation } from 'react-i18next'
import { Globe, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', name: 'English', shortCode: 'EN' },
  { code: 'es', name: 'Español', shortCode: 'ES' }
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    // Update HTML lang attribute for SEO
    document.documentElement.lang = lng
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages size={16} />
          <span className="hidden sm:inline font-medium">{currentLanguage.shortCode}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={i18n.language === language.code ? 'bg-accent' : ''}
          >
            <span className="inline-flex items-center justify-center w-8 h-5 mr-2 text-xs font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {language.shortCode}
            </span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
