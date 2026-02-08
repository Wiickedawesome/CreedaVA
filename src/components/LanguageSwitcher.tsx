import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Español', nativeName: 'Español' }
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  // i18n.language can be a full locale like "en-US"; extract the base code
  const resolvedLang = (i18n.language || 'en').split('-')[0]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    // Update HTML lang attribute for SEO
    document.documentElement.lang = lng
  }

  const currentLanguage = languages.find(lang => lang.code === resolvedLang) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-sm">{currentLanguage.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${resolvedLang === language.code ? 'bg-accent font-medium' : ''}`}
          >
            <span className="flex items-center justify-between w-full">
              <span>{language.nativeName}</span>
              {resolvedLang === language.code && (
                <span className="ml-2 text-xs">✓</span>
              )}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
