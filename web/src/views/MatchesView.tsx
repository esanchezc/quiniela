import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, MapPin, Clock, RefreshCcw, Bell, Edit2, Check, X, Filter, Zap, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Team {
  id: number
  name: string
  flag_emoji: string
}

interface Match {
  id: number
  team_a_id: number | null
  team_b_id: number | null
  team_a_placeholder: string | null
  team_b_placeholder: string | null
  stage: string
  round: number | null
  kickoff_time: string
  venue_city: string
  status: string
  score_a: number
  score_b: number
  team_a?: Team
  team_b?: Team
}

interface MatchesViewProps {
  isAdmin: boolean
}

const STAGES = ['Today', 'Round 1', 'Round 2', 'Round 3', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']

export function MatchesView({ isAdmin }: MatchesViewProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStage, setActiveStage] = useState('Round 1')
  
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null)
  const [editScoreA, setEditScoreA] = useState(0)
  const [editScoreB, setEditScoreB] = useState(0)
  const [editStatus, setEditStatus] = useState('')

  useEffect(() => {
    const init = async () => {
        await fetchMatches()
        const wcStart = new Date('2026-06-11')
        const today = new Date()
        if (today >= wcStart) setActiveStage('Today')
    }
    init()

    const channel = supabase.channel('matches-view-live-final-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchMatches())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:team_a_id(id, name, flag_emoji),
        team_b:team_b_id(id, name, flag_emoji)
      `)
      .order('kickoff_time', { ascending: true })

    if (data) setMatches(data as any)
    setLoading(false)
  }

  const startEditing = (match: Match) => {
    setEditingMatchId(match.id)
    setEditScoreA(match.score_a)
    setEditScoreB(match.score_b)
    setEditStatus(match.status)
  }

  const saveMatchUpdate = async () => {
    if (editingMatchId === null) return
    const { error } = await supabase
      .from('matches')
      .update({ score_a: editScoreA, score_b: editScoreB, status: editStatus })
      .eq('id', editingMatchId)
    
    if (!error) {
      setEditingMatchId(null)
      fetchMatches()
    }
  }

  const filteredMatches = useMemo(() => {
    if (activeStage === 'Today') {
        const todayStr = new Date().toDateString()
        return matches.filter(m => new Date(m.kickoff_time).toDateString() === todayStr)
    }
    if (activeStage === 'Round 1') return matches.filter(m => m.round === 1)
    if (activeStage === 'Round 2') return matches.filter(m => m.round === 2)
    if (activeStage === 'Round 3') return matches.filter(m => m.round === 3)
    return matches.filter(m => m.stage === activeStage)
  }, [matches, activeStage])

  if (loading) return <div className="flex items-center justify-center p-20 text-blue-500 text-white"><RefreshCcw className="animate-spin w-12 h-12" /></div>

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10 pb-32 text-white">
      
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-slate-800 pb-8 text-white">
        <div className="flex items-center gap-4 text-white text-center">
           <Calendar className="text-blue-500 w-8 h-8 text-white" />
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic text-white text-center">Match Center</h2>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-white">
           <Filter className="w-4 h-4 text-slate-600 mr-2 flex-shrink-0 text-white" />
           {STAGES.map((stage) => (
             <button
               key={stage}
               onClick={() => setActiveStage(stage)}
               className={cn(
                 "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                 activeStage === stage 
                   ? "bg-blue-600 border-blue-400 text-white shadow-lg" 
                   : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
               )}
             >
               {stage}
             </button>
           ))}
        </div>
      </div>

      <div className="grid gap-10 text-white">
        {filteredMatches.length === 0 ? (
            <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-20 text-center text-slate-600 font-bold uppercase tracking-widest italic opacity-40 text-white flex flex-col items-center gap-4 text-white text-center">
               {activeStage === 'Today' ? (
                   <>
                     <Clock className="w-12 h-12 text-slate-800 text-white" />
                     <span className="text-white">No matches scheduled for today.</span>
                   </>
               ) : (
                   <span className="text-white">No matches found for {activeStage}.</span>
               )}
            </div>
        ) : (
            filteredMatches.map((match) => {
                const isEditing = editingMatchId === match.id
                const matchDate = new Date(match.kickoff_time)
                
                return (
                    <div key={match.id} className={cn(
                        "bg-slate-900/40 rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-2xl relative group text-white",
                        isEditing ? "border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10" : "border-slate-800 hover:border-slate-700"
                    )}>
                        {isAdmin && !isEditing && (
                            <button onClick={() => startEditing(match)} className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-blue-600 rounded-xl text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20 shadow-xl text-white">
                                <Edit2 className="w-4 h-4 text-white" />
                            </button>
                        )}

                        <div className="bg-slate-800/40 px-8 py-4 border-b border-slate-800 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-white">
                           <span className="flex items-center gap-2 text-white text-white">
                               <Bell className="w-3.5 h-3.5 text-blue-500 text-white" /> 
                               {match.stage} {match.round ? `• Round ${match.round}` : ''}
                           </span>
                           <span className="flex items-center gap-2 text-white text-white text-white"><MapPin className="w-3.5 h-3.5 text-white" /> {match.venue_city}</span>
                        </div>

                        <div className="p-8 md:p-12 grid grid-cols-12 items-center gap-6 text-white text-center">
                            {/* Team A */}
                            <div className="col-span-4 flex flex-col items-center gap-4 text-white">
                                {match.team_a ? (
                                    <>
                                        <span className="text-6xl md:text-8xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white">{match.team_a.flag_emoji}</span>
                                        <span className="font-black text-xs md:text-base uppercase tracking-tighter text-center text-white">{match.team_a.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-slate-700 text-white">
                                            <HelpCircle className="w-8 h-8 md:w-12 md:h-12 text-slate-600 text-white" />
                                        </div>
                                        <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-500 text-center text-white">{match.team_a_placeholder || 'TBD'}</span>
                                    </>
                                )}
                            </div>

                            {/* Center Area */}
                            <div className="col-span-4 flex flex-col items-center justify-center text-white">
                                <AnimatePresence mode="wait">
                                    {isEditing ? (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-4 text-white">
                                            <div className="flex items-center gap-4 text-white text-white">
                                                <input type="number" value={editScoreA} onChange={(e) => setEditScoreA(parseInt(e.target.value) || 0)} className="w-16 bg-slate-950 border border-blue-500/50 rounded-xl p-3 text-center font-black text-3xl text-white shadow-inner text-white" />
                                                <span className="font-black text-slate-700 text-2xl italic text-white">-</span>
                                                <input type="number" value={editScoreB} onChange={(e) => setEditScoreB(parseInt(e.target.value) || 0)} className="w-16 bg-slate-950 border border-blue-500/50 rounded-xl p-3 text-center font-black text-3xl text-white shadow-inner text-white" />
                                            </div>
                                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg text-[10px] font-black uppercase p-2 text-white">
                                                <option value="scheduled">Scheduled</option>
                                                <option value="live">Live</option>
                                                <option value="finished">Finished</option>
                                            </select>
                                            <div className="flex gap-2 text-white">
                                                <button onClick={saveMatchUpdate} className="p-2.5 bg-green-600 rounded-xl text-white"><Check className="w-5 h-5 text-white"/></button>
                                                <button onClick={() => setEditingMatchId(null)} className="p-2.5 bg-slate-800 rounded-xl text-white"><X className="w-5 h-5 text-white"/></button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-white">
                                            {match.status === 'scheduled' ? (
                                                <div className="text-center space-y-4 text-white">
                                                    <div className="text-2xl font-black italic text-blue-500 uppercase tracking-tighter opacity-50 text-white">VS</div>
                                                    <div className="space-y-1 text-white text-center">
                                                       <div className="flex items-center gap-2 text-slate-100 text-sm font-black uppercase text-white justify-center">
                                                           <Clock className="w-4 h-4 text-blue-400 text-white" />
                                                           {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                       </div>
                                                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-white text-center">
                                                           {matchDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                                       </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-6 text-white text-center">
                                                    <div className="flex items-center gap-6 md:gap-12 text-white text-center">
                                                        <span className="text-5xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-xl text-center">{match.score_a}</span>
                                                        <span className="text-xl md:text-3xl font-black text-slate-800 italic text-white">-</span>
                                                        <span className="text-5xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-xl text-center">{match.score_b}</span>
                                                    </div>
                                                    {match.status === 'live' ? (
                                                        <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-4 py-1.5 rounded-full text-white">
                                                            <Zap className="w-3 h-3 text-red-600 animate-pulse text-white" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Now</span>
                                                        </div>
                                                    ) : (
                                                        <span className="bg-slate-800/80 text-[10px] font-black px-4 py-1.5 rounded-full uppercase text-slate-500 border border-slate-700 text-white text-center">Finished</span>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Team B */}
                            <div className="col-span-4 flex flex-col items-center gap-4 text-white text-center">
                                {match.team_b ? (
                                    <>
                                        <span className="text-6xl md:text-8xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white text-white">{match.team_b.flag_emoji}</span>
                                        <span className="font-black text-xs md:text-base uppercase tracking-tighter text-center text-white text-white">{match.team_b.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 md:w-32 md:h-32 bg-slate-800 rounded-full flex items-center justify-center border-2 border-dashed border-slate-700 text-white">
                                            <HelpCircle className="w-8 h-8 md:w-12 md:h-12 text-slate-600 text-white text-white" />
                                        </div>
                                        <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-slate-500 text-center text-white text-white">{match.team_b_placeholder || 'TBD'}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })
        )}
      </div>
    </div>
  )
}
