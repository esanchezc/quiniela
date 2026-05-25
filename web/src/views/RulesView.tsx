import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Target, UserCheck, Star, Save, RefreshCcw, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: configData } = await supabase.from('scoring_config').select('*')
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

  const updatePoints = async (ruleName: string, value: number) => {
    await supabase
      .from('scoring_config')
      .update({ points_value: value })
      .eq('rule_name', ruleName)
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center p-20 text-blue-500"><RefreshCcw className="animate-spin w-10 h-10" /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      
      {/* POINTS BREAKDOWN */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
           <Shield className="text-blue-500 w-8 h-8" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Scoring Rules</h2>
        </div>
        <div className="grid gap-3">
          {config.map((rule) => (
            <div key={rule.rule_name} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
              <div>
                <h3 className="font-black text-sm uppercase text-slate-300 group-hover:text-white transition-colors">{rule.description}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Rule ID: {rule.rule_name}</p>
              </div>
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <input 
                    type="number" 
                    defaultValue={rule.points_value}
                    onBlur={(e) => updatePoints(rule.rule_name, parseInt(e.target.value))}
                    className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center font-black text-blue-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                ) : (
                  <span className={cn("text-2xl font-black", rule.points_value > 0 ? "text-green-500" : "text-red-500")}>
                    {rule.points_value > 0 ? `+${rule.points_value}` : rule.points_value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WILDCARDS */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
           <Star className="text-wc-gold w-8 h-8" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Wildcard Predictions</h2>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-wc-gold/5 blur-3xl rounded-full" />
          
          <div className="grid gap-8">
            <div className="space-y-3">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                 <Target className="w-3 h-3" /> Golden Boot (Top Scorer)
               </label>
               <input 
                 value={picks.golden_boot_name}
                 onChange={(e) => setPicks({...picks, golden_boot_name: e.target.value})}
                 placeholder="Enter player name..."
                 className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl p-4 font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-wc-gold/20 transition-all"
               />
            </div>

            <div className="space-y-3">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                 <UserCheck className="w-3 h-3" /> Golden Glove (Best Keeper)
               </label>
               <input 
                 value={picks.golden_glove_name}
                 onChange={(e) => setPicks({...picks, golden_glove_name: e.target.value})}
                 placeholder="Enter player name..."
                 className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl p-4 font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-wc-gold/20 transition-all"
               />
            </div>

            <div className="space-y-3">
               <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                 <Trophy className="w-3 h-3" /> Tournament MVP
               </label>
               <input 
                 value={picks.mvp_name}
                 onChange={(e) => setPicks({...picks, mvp_name: e.target.value})}
                 placeholder="Enter player name..."
                 className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl p-4 font-bold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-wc-gold/20 transition-all"
               />
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSavePicks}
              disabled={saving || !player}
              className="w-full py-5 bg-wc-gold text-wc-blue font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-wc-gold/10 hover:scale-[1.02] active:scale-95 disabled:opacity-30 transition-all uppercase tracking-widest text-sm"
            >
              {saving ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving Choices...' : 'Lock In Predictions'}
            </button>
            {!player && <p className="text-center text-red-500 text-[10px] font-black uppercase mt-4">Access via your secret link to save picks!</p>}
          </div>
        </div>
        
        <p className="text-slate-600 text-center text-xs font-medium max-w-lg mx-auto">
          Predictions must be saved before the opening match starts. Correct guess: <span className="text-green-500 font-bold">+20 pts</span>. Sole correct guess: <span className="text-green-500 font-bold">+40 pts</span>.
        </p>
      </section>
    </div>
  )
}
