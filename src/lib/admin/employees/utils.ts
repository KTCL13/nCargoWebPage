export const roleTranslations: Record<string, string> = {
  'ADMIN': 'Administrador',
  'EMPLOYEE': 'Empleado',
}

export function translateRole(role: string) {
  return roleTranslations[role] || role
}

export function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function avatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-pink-500']
  return colors[name.charCodeAt(0) % colors.length]
}

export function passwordStrength(pw: string) {
  const checks = {
    length:  { met: pw.length >= 8,          label: 'Mínimo 8 caracteres' },
    upper:   { met: /[A-Z]/.test(pw),         label: '1 letra mayúscula' },
    lower:   { met: /[a-z]/.test(pw),         label: '1 letra minúscula' },
    number:  { met: /[0-9]/.test(pw),         label: '1 número' },
    special: { met: /[^A-Za-z0-9]/.test(pw), label: '1 carácter especial' },
  }
  const score = Object.values(checks).filter(c => c.met).length
  const isValid = checks.length.met && checks.upper.met && checks.lower.met && checks.number.met
  const configs = [
    { label: 'Muy débil', color: 'bg-red-500',    text: 'text-red-600'    },
    { label: 'Débil',     color: 'bg-orange-400', text: 'text-orange-500' },
    { label: 'Regular',   color: 'bg-yellow-400', text: 'text-yellow-600' },
    { label: 'Buena',     color: 'bg-blue-500',   text: 'text-blue-600'   },
    { label: 'Fuerte',    color: 'bg-green-500',  text: 'text-green-600'  },
  ]
  const cfg = configs[Math.max(0, score - 1)] ?? configs[0]
  return { score, isValid, checks: Object.values(checks), ...cfg }
}
