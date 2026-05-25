import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Target, UserCheck, Star, RefreshCcw, Trophy, Edit2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ScoringConfig {
  rule_name: string
  points_value: number
  description: string
}

interface WildcardPicks {
  golden_boot_name: string
  golden_glove_name: string
  mvp_name: string
}

interface RulesViewProps {
  player: { id: string, name: string } | null
  isAdmin: boolean
}

export function RulesView({ player, isAdmin }: RulesViewProps) {
  const [config, setConfig] = useState<ScoringConfig[]>([])
  const [picks, setPicks] = useState<WildcardPicks>({
    golden_boot_name: '',
    golden_glove_name: '',
    mvp_name: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: configData } = await supabase.from('scoring_config').select('*').order('id')
    if (configData) setConfig(configData)

    if (player) {
      const { data: pickData } = await supabase
        .from('wildcard_picks')
        .select('*')
        .eq('player_id', player.id)
        .maybeSingle()
      if (pickData) setPicks(pickData)
    }
    setLoading(false)
  }

  const handleSavePicks = async () => {
    if (!player) return
    setSaving(true)
    const { error } = await supabase
      .from('wildcard_picks')
      .upsert({ 
        player_id: player.id,
        ...picks
      })
    if (error) alert("Failed to save picks")
    setSaving(false)
  }

  const startEditing = (rule: ScoringConfig) => {
    setEditingRule(rule.rule_name)
    setEditValue(rule.points_value)
  }

  const saveRule = async (ruleName: string) => {
    const { error } = await supabase
      .from('scoring_config')
      .update({ points_value: editValue })
      .eq('rule_name', ruleName)
    
    if (!error) {
        setEditingRule(null)
        fetchData()
    }
  }

  if (loading) return <div className="flex items-center justify-center p-20 text-blue-500"><RefreshCcw className="animate-spin w-10 h-10" /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32 text-white">
      <section className="space-y-6 text-white text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4 border-b border-slate-800 pb-4 text-white">
           <Shield className="text-blue-500 w-8 h-8 text-white" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">The Points System</h2>
        </div>
        <div className="grid gap-4 text-white">
          {config.map((rule) => {
            const isEditing = editingRule === rule.rule_name
            return (
              <div key={rule.rule_name} className={cn(
                "bg-slate-900/50 p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group text-white",
                isEditing ? "border-blue-500 bg-blue-500/5 shadow-lg text-white" : "border-slate-800 hover:border-slate-700 text-white"
              )}>
                <div className="flex-1 text-white text-left">
                  <h3 className="font-black text-sm uppercase text-slate-300 group-hover:text-white transition-colors tracking-tight text-white">{rule.description}</h3>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1 text-white">Rule ID: {rule.rule_name}</p>
                </div>
                
                <div className="flex items-center gap-4 text-white">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2 text-white">
                        <input type="number" autoFocus value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} className="w-16 bg-slate-950 border border-blue-500/50 rounded-xl px-2 py-2 text-center font-black text-white focus:outline-none no-spinner" />
                        <button onClick={() => saveRule(rule.rule_name)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-white"><Check className="w-4 h-4 text-white" /></button>
                        <button onClick={() => setEditingRule(null)} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-white"><X className="w-4 h-4 text-white" /></button>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-6 text-white">
                        <span className={cn("text-2xl font-black italic tracking-tighter text-white", rule.points_value > 0 ? "text-green-500 text-white" : rule.points_value < 0 ? "text-red-500 text-white" : "text-slate-500 text-white")}>
                          {rule.points_value > 0 ? `+${rule.points_value}` : rule.points_value}
                        </span>
                        {isAdmin && (
                          <button onClick={() => startEditing(rule)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all text-white">
                            <Edit2 className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-6 text-white text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4 border-b border-slate-800 pb-4 text-white">
           <Star className="text-wc-gold w-8 h-8 text-white" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Wildcard Predictions</h2>
        </div>
        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10 space-y-10 shadow-2xl relative overflow-hidden text-white">
          <div className="grid gap-10 text-white">
            {[
                { label: 'Golden Boot (Top Scorer)', icon: Target, key: 'golden_boot_name' },
                { label: 'Golden Glove (Best Keeper)', icon: UserCheck, key: 'golden_glove_name' },
                { label: 'Tournament MVP', icon: Trophy, key: 'mvp_name' }
            ].map((item) => {
                const Icon = item.icon
                return (
                    <div key={item.key} className="space-y-4 text-white text-left">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-white">
                            <Icon className="w-4 h-4 text-white" /> {item.label}
                        </label>
                        <input value={(picks as any)[item.key]} onChange={(e) => setPicks({...picks, [item.key]: e.target.value})} placeholder="Enter player name..." className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] p-6 font-bold text-lg text-white placeholder:text-slate-800 focus:outline-none focus:border-wc-gold/50 focus:ring-4 focus:ring-wc-gold/5 transition-all shadow-inner text-white" />
                    </div>
                )
            })}
          </div>
          <div className="pt-4 text-white text-center">
            <button onClick={handleSavePicks} disabled={saving || !player} className="w-full py-6 bg-wc-gold text-wc-blue font-black rounded-3xl flex items-center justify-center gap-4 shadow-2xl shadow-wc-gold/10 hover:scale-[1.01] active:scale-95 disabled:opacity-30 transition-all uppercase tracking-[0.2em] text-sm italic text-wc-blue">
              {saving ? <RefreshCcw className="animate-spin w-6 h-6 text-wc-blue" /> : <Trophy className="w-6 h-6 text-wc-blue" />}
              {saving ? 'Validating Picks...' : 'Lock In Choices'}
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
      `}</style>
    </div>
  )
}
