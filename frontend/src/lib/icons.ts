import {
  Banknote, Briefcase, Bus, Clapperboard, CircleHelp, Gift,
  Landmark, ShoppingBag, Smartphone, Utensils, Wallet,
  type LucideIcon,
} from 'lucide-react'

const registry: Record<string, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Smartphone,
  default: Wallet,
  food: Utensils,
  transport: Bus,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  salary: Briefcase,
  bonus: Gift,
}

export function getIcon(key: string): LucideIcon {
  return registry[key] ?? CircleHelp
}

export const iconKeys = Object.keys(registry)