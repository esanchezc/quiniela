import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, RefreshCcw, TrendingUp, ChevronRight, Medal, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Player {
  id: string
  name: string
}

interface Team {
  id: number
  name: string
  flag_emoji: string
  picked_by_id: string | null
  is_picked: boolean
  status: string
}

interface ScoringConfig {
  rule_name: string
  points_value: number
}

interface WildcardPicks {
  player_id: string
  golden_boot_name: string
  golden_glove_name: string
  mvp_name: string
}

interface WildcardWinners {
  golden_boot: string | null
  golden_glove: string | null
  mvp: string | null
}

interface PlayerScore {
  player: Player
  totalPoints: number
  teamPoints: number
  teamBreakdown: {
    team: Team
    points: number
  }[]
  wildcardPoints: number
  wildcardBreakdown: {
    category: string
    pick: string
    winner: string | null
    points: number
  }[]
}

export function LeaderboardView() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<ScoringConfig[]>([])
  const [allWildcardPicks, setAllWildcardPicks] = useState<WildcardPicks[]>([])
  const [wildcardWinners, setWildcardWinners] = useState<WildcardWinners | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    
    // Unified refresh channel
    const channel = supabase.channel('leaderboard-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wildcard_winners' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wildcard_picks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_state' }, (payload: any) => {
          // If draft is reset to 1, force a clean refresh
          if (payload.new && payload.new.current_pick_number === 1) fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async () => {
    const { data: pData } = await supabase.from('players').select('id, name')
    // We fetch all teams then filter in useMemo to ensure stale IDs don't linger
    const { data: tData } = await supabase.from('teams').select('*')
    const { data: cData } = await supabase.from('scoring_config').select('rule_name, points_value')
    const { data: wpData } = await supabase.from('wildcard_picks').select('*')
    const { data: wwData } = await supabase.from('wildcard_winners').select('*').single()
    
    if (pData) setPlayers(pData)
    if (tData) setTeams(tData)
    if (cData) setConfig(cData)
    if (wpData) setAllWildcardPicks(wpData)
    if (wwData) setWildcardWinners(wwData)
    setLoading(false)
  }

  const scores: PlayerScore[] = useMemo(() => {
    if (!players.length || !config.length) return []

    const getPoints = (rule: string) => config.find(c => c.rule_name === rule)?.points_value || 0

    return players.map(player => {
        // FILTER: Only teams actually picked by this player
        const playerTeams = teams.filter(t => t.picked_by_id === player.id && t.is_picked)
        let teamPointsTotal = 0
        
        const teamBreakdown = playerTeams.map(team => {
            let teamPoints = 0
            const s = team.status || 'active'
            
            if (s === 'group_1st') teamPoints = getPoints('group_1st')
            if (s === 'group_2nd') teamPoints = getPoints('group_2nd')
            if (s === 'group_3rd_adv') teamPoints = getPoints('group_3rd_adv')
            if (s === 'not_advancing_3rd') teamPoints = getPoints('not_advancing_3rd')
            if (s === 'not_advancing_4th') teamPoints = getPoints('not_advancing_4th')
            
            if (s === 'r32_win') teamPoints = getPoints('group_1st') + getPoints('r32_win')
            if (s === 'r16_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win')
            if (s === 'qf_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win')
            if (s === 'sf_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win') + getPoints('sf_win')
            if (s === 'final_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win') + getPoints('sf_win') + getPoints('final_win')

            teamPointsTotal += teamPoints
            return { team, points: teamPoints }
        })

        // Wildcard Logic
        const playerPicks = allWildcardPicks.find(wp => wp.player_id === player.id)
        let playerWildcardPoints = 0
        const wildcardBreakdown: PlayerScore['wildcardBreakdown'] = []

        if (playerPicks && wildcardWinners) {
            const categories = [
                { id: 'golden_boot', name: 'Golden Boot', pick: playerPicks.golden_boot_name, winner: wildcardWinners.golden_boot },
                { id: 'golden_glove', name: 'Golden Glove', pick: playerPicks.golden_glove_name, winner: wildcardWinners.golden_glove },
                { id: 'mvp', name: 'MVP', pick: playerPicks.mvp_name, winner: wildcardWinners.mvp }
            ]

            categories.forEach(cat => {
                if (!cat.winner) {
                    wildcardBreakdown.push({ category: cat.name, pick: cat.pick, winner: null, points: 0 })
                    return
                }

                const isCorrect = cat.pick?.trim().toLowerCase() === cat.winner?.trim().toLowerCase()
                if (isCorrect) {
                    const othersCorrect = allWildcardPicks.filter(wp => 
                        wp.player_id !== player.id && 
                        (wp as any)[`${cat.id}_name`]?.trim().toLowerCase() === cat.winner?.trim().toLowerCase()
                    ).length

                    const pts = othersCorrect === 0 ? getPoints('wildcard_sole_winner') : getPoints('wildcard_correct')
                    playerWildcardPoints += pts
                    wildcardBreakdown.push({ category: cat.name, pick: cat.pick, winner: cat.winner, points: pts })
                } else {
                    wildcardBreakdown.push({ category: cat.name, pick: cat.pick, winner: cat.winner, points: 0 })
                }
            })
        }

        return {
            player,
            totalPoints: teamPointsTotal + playerWildcardPoints,
            teamPoints: teamPointsTotal,
            teamBreakdown,
            wildcardPoints: playerWildcardPoints,
            wildcardBreakdown
        }
    }).sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, teams, config, allWildcardPicks, wildcardWinners])

  if (loading) return <div className="flex items-center justify-center p-20 text-blue-500"><RefreshCcw className="animate-spin w-12 h-12" /></div>

  const podium = scores.slice(0, 3)

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-12 pb-32 text-white">
      
      {/* THE PODIUM */}
      <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-10 h-64 text-white">
        {podium[1] && (
            <div className="flex flex-col items-center">
                <div className="text-slate-500 font-black mb-2 text-xl italic">{podium[1].totalPoints}</div>
                <div className="w-full bg-slate-800 rounded-t-3xl border-x-2 border-t-2 border-slate-700 h-32 flex flex-col items-center justify-center p-4 relative">
                   <Medal className="text-slate-400 w-8 h-8 absolute -top-10" />
                   <p className="font-black uppercase text-[10px] tracking-widest text-slate-500">2nd</p>
                   <p className="font-bold text-sm text-center text-white">{podium[1].player.name}</p>
                </div>
            </div>
        )}
        {podium[0] && (
            <div className="flex flex-col items-center">
                <div className="text-wc-gold font-black mb-2 text-3xl italic drop-shadow-[0_0_10px_rgba(198,161,91,0.5)]">{podium[0].totalPoints}</div>
                <div className="w-full bg-gradient-to-b from-wc-gold/20 to-slate-900 rounded-t-[2.5rem] border-x-2 border-t-2 border-wc-gold/50 h-48 flex flex-col items-center justify-center p-4 relative shadow-[0_0_50px_rgba(198,161,91,0.15)]">
                   <Trophy className="text-wc-gold w-12 h-12 absolute -top-14 drop-shadow-lg" />
                   <p className="font-black uppercase text-xs tracking-[0.2em] text-wc-gold">Leader</p>
                   <p className="font-black text-xl text-center text-white italic">{podium[0].player.name}</p>
                </div>
            </div>
        )}
        {podium[2] && (
            <div className="flex flex-col items-center">
                <div className="text-amber-700 font-black mb-2 text-xl italic">{podium[2].totalPoints}</div>
                <div className="w-full bg-slate-800/50 rounded-t-3xl border-x-2 border-t-2 border-slate-700 h-24 flex flex-col items-center justify-center p-4 relative">
                   <Medal className="text-amber-700 w-8 h-8 absolute -top-10" />
                   <p className="font-black uppercase text-[10px] tracking-widest text-slate-600">3rd</p>
                   <p className="font-bold text-sm text-center text-white">{podium[2].player.name}</p>
                </div>
            </div>
        )}
      </div>

      <div className="grid gap-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Current Standings
        </h2>
        
        <div className="space-y-4">
          {scores.map((score, idx) => (
            <div key={score.player.id} className="bg-slate-900/50 rounded-[2rem] border border-slate-800 overflow-hidden transition-all hover:border-slate-700 shadow-xl">
               <button 
                 onClick={() => setExpandedPlayer(expandedPlayer === score.player.id ? null : score.player.id)}
                 className="w-full p-6 flex items-center justify-between group"
               >
                  <div className="flex items-center gap-6">
                    <span className="font-black text-slate-700 text-xl italic w-6">0{idx + 1}</span>
                    <div className="text-left">
                       <p className="font-black text-white uppercase tracking-tighter text-xl group-hover:text-blue-500 transition-colors">{score.player.name}</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{score.teamBreakdown.length} Teams Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-2xl font-black italic tracking-tighter text-white">{score.totalPoints}</p>
                       <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Total Score</p>
                    </div>
                    <ChevronRight className={cn("w-6 h-6 text-slate-700 transition-transform", expandedPlayer === score.player.id && "rotate-90 text-blue-500")} />
                  </div>
               </button>

               <AnimatePresence>
                 {expandedPlayer === score.player.id && (
                    <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="bg-slate-950/50 border-t border-slate-800 overflow-hidden"
                    >
                        <div className="p-8 space-y-10">
                            <section>
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Trophy className="w-3 h-3" /> Team Breakdown (+{score.teamPoints})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-white">
                                    {score.teamBreakdown.map(({ team, points }) => (
                                        <div key={team.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{team.flag_emoji}</span>
                                                <div>
                                                    <p className="text-[10px] font-black text-white uppercase truncate w-24">{team.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase truncate">{(team.status || 'active').replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <div className={cn("font-black text-sm italic", points > 0 ? "text-green-500" : points < 0 ? "text-red-500" : "text-slate-600")}>
                                                {points > 0 ? `+${points}` : points}
                                            </div>
                                        </div>
                                    ))}
                                    {score.teamBreakdown.length === 0 && <p className="col-span-full py-6 text-slate-700 font-bold italic text-[10px] uppercase tracking-widest opacity-50">No teams drafted in current session.</p>}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Star className="w-3 h-3 text-wc-gold" /> Prediction Bonuses (+{score.wildcardPoints})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {score.wildcardBreakdown.map((wc, i) => (
                                        <div key={i} className={cn(
                                            "p-4 rounded-2xl border flex flex-col gap-2 relative overflow-hidden shadow-lg",
                                            wc.points > 0 ? "bg-wc-gold/10 border-wc-gold/30" : "bg-slate-900 border-slate-800"
                                        )}>
                                            {wc.points > 0 && <div className="absolute top-0 right-0 p-1 bg-wc-gold text-wc-blue font-black text-[8px] rounded-bl-lg uppercase tracking-tighter">WINNER</div>}
                                            <p className="text-[8px] font-black text-slate-500 uppercase">{wc.category}</p>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase italic">{wc.pick || 'No Pick'}</p>
                                                    {wc.winner && !wc.points && <p className="text-[8px] text-red-500 font-black uppercase mt-1">Winner: {wc.winner}</p>}
                                                </div>
                                                <div className={cn("font-black italic text-lg", wc.points > 0 ? "text-wc-gold" : "text-slate-700")}>
                                                    +{wc.points}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </motion.div>
                 )}
               </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
