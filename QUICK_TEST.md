# 🧪 Quick Test Instructions

## Test the Language Switcher (5 minutes)

### Option 1: Run Dev Server
```bash
# Increase file watcher limit (if needed)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start dev server
npm run dev
```

Then visit http://localhost:5173

### Option 2: Build and Preview
```bash
npm run build:production
npm run preview
```

Then visit http://localhost:4173

---

## ✅ What to Check

1. **Navbar should show language switcher**:
   - Desktop: Globe icon 🌐 + flag + "English" or "Español"
   - Mobile: Globe icon 🌐 + flag only

2. **Click the Globe icon**:
   - Dropdown shows: 🇺🇸 English, 🇪🇸 Español
   - Active language highlighted

3. **Switch to Spanish**:
   - Navigation links should change:
     - Home → Inicio
     - About → Nosotros
     - Services → Servicios
     - Pricing → Precios
     - News → Noticias
     - Contact → Contacto
   - "Get Started" button → "Comience Hoy"

4. **Reload page**:
   - Language should stay Spanish (saved to localStorage)

5. **Check browser console**:
   - Should see: "i18next: initialized" (no errors)

---

## 🎯 Expected Behavior

✅ Language switcher visible in navbar
✅ Dropdown menu works smoothly
✅ Navigation text changes instantly
✅ Language persists after page reload
✅ HTML lang attribute updates: `<html lang="es">`

---

## 📝 Next: Update Pages

Once navbar is working, update each page component:

1. Import useTranslation hook
2. Get `t` function
3. Replace hardcoded strings with `t('key')`
4. Test both languages

See `EXAMPLE_HOME_TRANSLATION.tsx` for reference!
