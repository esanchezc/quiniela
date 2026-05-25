import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Target, UserCheck, Star, Save, RefreshCcw, Trophy, Edit2, Check, X } from 'lucide-react'
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      
      {/* POINTS BREAKDOWN */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
           <Shield className="text-blue-500 w-8 h-8" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">The Points System</h2>
        </div>
        <div className="grid gap-4">
          {config.map((rule) => {
            const isEditing = editingRule === rule.rule_name
            return (
              <div key={rule.rule_name} className={cn(
                "bg-slate-900/50 p-6 rounded-[2rem] border transition-all duration-300 flex items-center justify-between group",
                isEditing ? "border-blue-500 bg-blue-500/5 shadow-lg" : "border-slate-800 hover:border-slate-700"
              )}>
                <div className="flex-1">
                  <h3 className="font-black text-sm uppercase text-slate-300 group-hover:text-white transition-colors tracking-tight">{rule.description}</h3>
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Rule ID: {rule.rule_name}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2"
                      >
                        <input 
                          type="number" 
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-950 border border-blue-500/50 rounded-xl px-2 py-2 text-center font-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 no-spinner"
                        />
                        <button onClick={() => saveRule(rule.rule_name)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingRule(null)} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"><X className="w-4 h-4" /></button>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="flex items-center gap-6"
                      >
                        <span className={cn(
                          "text-2xl font-black italic tracking-tighter", 
                          rule.points_value > 0 ? "text-green-500" : rule.points_value < 0 ? "text-red-500" : "text-slate-500"
                        )}>
                          {rule.points_value > 0 ? `+${rule.points_value}` : rule.points_value}
                        </span>
                        {isAdmin && (
                          <button 
                            onClick={() => startEditing(rule)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
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

      {/* WILDCARDS */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
           <Star className="text-wc-gold w-8 h-8" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">Wildcard Predictions</h2>
        </div>

        <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-10 space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-wc-gold/5 blur-[100px] rounded-full" />
          
          <div className="grid gap-10">
            {[
                { label: 'Golden Boot (Top Scorer)', icon: Target, key: 'golden_boot_name' },
                { label: 'Golden Glove (Best Keeper)', icon: UserCheck, key: 'golden_glove_name' },
                { label: 'Tournament MVP', icon: Trophy, key: 'mvp_name' }
            ].map((item) => {
                const Icon = item.icon
                return (
                    <div key={item.key} className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                            <Icon className="w-4 h-4" /> {item.label}
                        </label>
                        <input 
                            value={(picks as any)[item.key]}
                            onChange={(e) => setPicks({...picks, [item.key]: e.target.value})}
                            placeholder="Enter player name..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-[1.5rem] p-6 font-bold text-lg text-white placeholder:text-slate-800 focus:outline-none focus:border-wc-gold/50 focus:ring-4 focus:ring-wc-gold/5 transition-all shadow-inner"
                        />
                    </div>
                )
            })}
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSavePicks}
              disabled={saving || !player}
              className="w-full py-6 bg-wc-gold text-wc-blue font-black rounded-3xl flex items-center justify-center gap-4 shadow-2xl shadow-wc-gold/10 hover:scale-[1.01] active:scale-95 disabled:opacity-30 transition-all uppercase tracking-[0.2em] text-sm italic"
            >
              {saving ? <RefreshCcw className="animate-spin w-6 h-6" /> : <Shield className="w-6 h-6" />}
              {saving ? 'Validating Picks...' : 'Lock In Choices'}
            </button>
            {!player && (
              <div className="flex items-center justify-center gap-2 mt-6 text-red-500 bg-red-500/10 py-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Access via your secret link to save picks</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/50 max-w-2xl mx-auto">
            <p className="text-slate-600 text-center text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                <span className="text-wc-gold">Rules:</span> Predictions lock before kickoff. 
                <br/>Correct: <span className="text-green-500">+20 pts</span> | Sole Winner: <span className="text-green-500">+40 pts</span>
            </p>
        </div>
      </section>

      <style>{`
        .no-spinner::-webkit-inner-spin-button, 
        .no-spinner::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}

function AlertCircle({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
