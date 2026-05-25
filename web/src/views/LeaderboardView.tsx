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
  status: string
}

interface ScoringConfig {
  rule_name: string
  points_value: number
}

interface PlayerScore {
  player: Player
  totalPoints: number
  teamBreakdown: {
    team: Team
    points: number
  }[]
  wildcardPoints: number
}

export function LeaderboardView() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [config, setConfig] = useState<ScoringConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: pData } = await supabase.from('players').select('id, name')
    const { data: tData } = await supabase.from('teams').select('*').not('picked_by_id', 'is', null)
    const { data: cData } = await supabase.from('scoring_config').select('rule_name, points_value')
    
    if (pData) setPlayers(pData)
    if (tData) setTeams(tData)
    if (cData) setConfig(cData)
    setLoading(false)
  }

  const scores: PlayerScore[] = useMemo(() => {
    if (!players.length || !config.length) return []

    return players.map(player => {
        const playerTeams = teams.filter(t => t.picked_by_id === player.id)
        let totalPoints = 0
        const teamBreakdown = playerTeams.map(team => {
            // Logic for cumulative calculation
            let teamPoints = 0
            const statusList = ['group_1st', 'group_2nd', 'group_3rd_adv', 'not_advancing_3rd', 'not_advancing_4th', 'r32_win', 'r16_win', 'qf_win', 'sf_win', 'final_win']
            
            // For now, we assume status is the "highest achieved". 
            // In a more complex version we'd have a many-to-many, 
            // but we'll treat 'r16_win' as including all previous group points.
            
            // CUMULATIVE CALCULATION:
            const getPoints = (rule: string) => config.find(c => c.rule_name === rule)?.points_value || 0
            
            if (team.status === 'group_1st') teamPoints = getPoints('group_1st')
            if (team.status === 'group_2nd') teamPoints = getPoints('group_2nd')
            if (team.status === 'group_3rd_adv') teamPoints = getPoints('group_3rd_adv')
            if (team.status === 'not_advancing_3rd') teamPoints = getPoints('not_advancing_3rd')
            if (team.status === 'not_advancing_4th') teamPoints = getPoints('not_advancing_4th')
            
            if (team.status === 'r32_win') teamPoints = getPoints('group_1st') + getPoints('r32_win')
            if (team.status === 'r16_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win')
            if (team.status === 'qf_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win')
            if (team.status === 'sf_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win') + getPoints('sf_win')
            if (team.status === 'final_win') teamPoints = getPoints('group_1st') + getPoints('r32_win') + getPoints('r16_win') + getPoints('qf_win') + getPoints('sf_win') + getPoints('final_win')

            totalPoints += teamPoints
            return { team, points: teamPoints }
        })

        return {
            player,
            totalPoints,
            teamBreakdown,
            wildcardPoints: 0 // Will add later
        }
    }).sort((a, b) => b.totalPoints - a.totalPoints)
  }, [players, teams, config])

  if (loading) return <div className="flex items-center justify-center p-20 text-blue-500"><RefreshCcw className="animate-spin w-12 h-12" /></div>

  const podium = scores.slice(0, 3)
  const others = scores.slice(3)

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-12">
      
      {/* THE PODIUM */}
      <div className="grid grid-cols-3 gap-4 items-end max-w-2xl mx-auto pt-10 h-64">
        {/* 2nd Place */}
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
        {/* 1st Place */}
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
        {/* 3rd Place */}
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

      {/* FULL RANKINGS */}
      <div className="grid gap-6">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Current Standings
        </h2>
        
        <div className="space-y-4">
          {scores.map((score, idx) => (
            <div key={score.player.id} className="bg-slate-900/50 rounded-[2rem] border border-slate-800 overflow-hidden transition-all hover:border-slate-700">
               <button 
                 onClick={() => setExpandedPlayer(expandedPlayer === score.player.id ? null : score.player.id)}
                 className="w-full p-6 flex items-center justify-between group"
               >
                  <div className="flex items-center gap-6">
                    <span className="font-black text-slate-700 text-xl italic w-6">0{idx + 1}</span>
                    <div className="text-left">
                       <p className="font-black text-white uppercase tracking-tighter text-xl group-hover:text-blue-500 transition-colors">{score.player.name}</p>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{score.teamBreakdown.length} Teams Drafted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-2xl font-black italic tracking-tighter text-white">{score.totalPoints}</p>
                       <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Points</p>
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
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           {score.teamBreakdown.map(({ team, points }) => (
                             <div key={team.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
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
                           {score.teamBreakdown.length === 0 && <p className="col-span-full py-10 text-center text-slate-700 font-bold italic text-xs uppercase tracking-widest">No points accumulated yet</p>}
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
