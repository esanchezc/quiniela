import { LayoutDashboard, Trophy, Calendar, Settings } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  showDraft: boolean
}

export function Navigation({ activeTab, setActiveTab, showDraft }: NavigationProps) {
  const tabs = [
    { id: 'leaderboard', label: 'Rankings', icon: LayoutDashboard },
    ...(showDraft ? [{ id: 'draft', label: 'The Field', icon: Trophy }] : []),
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'rules', label: 'Rules & Extras', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-[90] pb-safe">
      <div className="max-w-[1600px] mx-auto flex justify-around items-center h-20 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all relative group py-2 px-6 rounded-2xl",
                isActive ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl animate-in fade-in zoom-in duration-300" />
              )}
              <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
