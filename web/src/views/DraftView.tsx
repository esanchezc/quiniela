import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Timer, RefreshCcw, X, Bell, Zap, Settings, Pause, ShieldCheck, PlayCircle, Lock, UserPlus, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface Player {
  id: string
  name: string
  draft_order: number
  secret_token: string
}

interface Team {
  id: number
  name: string
  flag_emoji: string
  is_picked: boolean
  picked_by_id: string | null
  group_letter: string
  pick_number: number | null
  status: string
}

interface DraftState {
  current_pick_number: number
  is_draft_active: boolean
  is_paused: boolean
  is_finished: boolean
  is_started: boolean
}

interface DraftViewProps {
  player: Player | null
  isAdmin: boolean
}

export function DraftView({ player, isAdmin }: DraftViewProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await fetchPlayers()
        await refreshData()
      } finally {
        setLoading(false)
      }
    }
    init()

    const channel = supabase.channel('draft-view-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_state' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPlayers = async () => {
    const { data } = await supabase.from('players').select('*').order('draft_order')
    if (data) setPlayers(data)
  }

  const refreshData = async () => {
    const { data: teamData } = await supabase.from('teams').select('*').order('name')
    if (teamData) setTeams(teamData)
    const { data: stateData } = await supabase.from('draft_state').select('*').single()
    if (stateData) setDraftState(stateData)
  }

  const getActivePlayer = (pickNum: number) => {
    if (players.length === 0) return null
    if (pickNum > 32) return null
    const roundNum = Math.floor((pickNum - 1) / 4) + 1
    const positionInRound = ((pickNum - 1) % 4) + 1
    let targetOrder = roundNum % 2 === 1 ? positionInRound : 5 - positionInRound
    return players.find(p => p.draft_order === targetOrder) || null
  }

  const activePlayer = draftState ? getActivePlayer(draftState.current_pick_number) : null
  const isMyTurn = player && activePlayer && player.id === activePlayer.id && !draftState?.is_paused && !draftState?.is_finished && draftState?.is_started

  const confirmPick = async () => {
    if (!selectedTeam || !player || !draftState) return
    setIsConfirming(true)
    const nextPickNum = draftState.current_pick_number + 1
    const isFinished = nextPickNum > 32

    const { error: pickError } = await supabase
      .from('teams')
      .update({ is_picked: true, picked_by_id: player.id, pick_number: draftState.current_pick_number })
      .eq('id', selectedTeam.id)

    if (!pickError) {
      await supabase.from('draft_state').update({ 
        current_pick_number: nextPickNum,
        is_finished: isFinished
      }).eq('id', 1)
      setSelectedTeam(null)
      refreshData()
    }
    setIsConfirming(false)
  }

  // ADMIN
  const updateDraftState = async (updates: Partial<DraftState>) => {
    await supabase.from('draft_state').update(updates).eq('id', 1)
    refreshData()
  }

  const setPlayerOrder = async (playerId: string, newOrder: number) => {
    if (draftState?.is_started) return
    await supabase.from('players').update({ draft_order: newOrder }).eq('id', playerId)
    await fetchPlayers()
  }

  const setTeamStatus = async (teamId: number, status: string) => {
    await supabase.from('teams').update({ status }).eq('id', teamId)
    refreshData()
  }

  const resetDraft = async () => {
    if (!window.confirm('🚨 RESET EVERYTHING?')) return
    await supabase.from('teams').update({ is_picked: false, picked_by_id: null, pick_number: null, status: 'active' }).neq('id', 0)
    await supabase.from('draft_state').update({ current_pick_number: 1, is_paused: false, is_finished: false, is_started: false }).eq('id', 1)
    refreshData()
  }

  const groupedTeams = useMemo(() => {
    const groups: Record<string, Team[]> = {}
    teams.forEach(t => {
      if (!groups[t.group_letter]) groups[t.group_letter] = []
      groups[t.group_letter].push(t)
    })
    return Object.entries(groups).sort()
  }, [teams])

  const isOrderValid = useMemo(() => {
    const orders = players.map(p => p.draft_order)
    const uniqueOrders = new Set(orders)
    return uniqueOrders.size === 4 && !orders.includes(0)
  }, [players])

  const myRoster = teams.filter(t => t.picked_by_id === player?.id).sort((a,b) => (a.pick_number || 0) - (b.pick_number || 0))
  const pickHistory = teams.filter(t => t.is_picked).sort((a,b) => (b.pick_number || 0) - (a.pick_number || 0))

  if (loading) return <div className="flex items-center justify-center p-20"><RefreshCcw className="w-12 h-12 animate-spin text-blue-500" /></div>

  return (
    <div className="relative text-white">
      {isAdmin && (
        <button 
          onClick={() => setShowAdminPanel(true)} 
          className="fixed top-24 right-6 bg-blue-600 hover:bg-blue-700 p-4 rounded-2xl shadow-2xl transition-all active:scale-95 z-40 text-white"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {!draftState?.is_started ? (
          <motion.div key="setup" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-blue-600 text-white font-black text-center py-4 uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl mb-6">
             <Timer className="w-5 h-5 animate-pulse" /> DRAFT NOT STARTED <Timer className="w-5 h-5 animate-pulse" />
          </motion.div>
        ) : draftState.is_finished ? (
          <motion.div key="finished" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-green-600 text-white font-black text-center py-4 uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl mb-6">
             <Trophy className="w-6 h-6" /> DRAFT COMPLETE <Trophy className="w-6 h-6" />
          </motion.div>
        ) : draftState.is_paused ? (
          <motion.div key="paused" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-red-600 text-white font-black text-center py-3 uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl mb-6 text-white">
             <Pause className="w-5 h-5 fill-current" /> DRAFT PAUSED <Pause className="w-5 h-5 fill-current" />
          </motion.div>
        ) : isMyTurn ? (
          <motion.div key="turn" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-wc-gold text-wc-blue font-black text-center py-3 uppercase italic tracking-tighter flex items-center justify-center gap-3 shadow-lg mb-6">
             <Zap className="w-5 h-5 animate-pulse text-wc-blue" /> IT'S YOUR TURN, {player?.name}! <Zap className="w-5 h-5 animate-pulse text-wc-blue" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-12 gap-8 text-white">
        <div className="col-span-12 lg:col-span-3 space-y-8 text-white text-center">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl text-white">
             <div className="flex justify-between items-center mb-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Sequence <span className="text-blue-500">#{draftState?.current_pick_number}</span></div>
             <div className="space-y-4">
              {players.map(p => {
                const isCurrent = activePlayer?.id === p.id && draftState?.is_started && !draftState.is_finished
                const isMe = player?.id === p.id
                return (
                  <div key={p.id} className={cn(
                    "flex items-center justify-between p-5 rounded-3xl border transition-all duration-700",
                    isCurrent ? (isMe ? "bg-wc-gold border-wc-gold shadow-2xl scale-105" : "bg-blue-600 border-blue-400 shadow-2xl scale-105") : "bg-slate-800/30 border-slate-800 opacity-40"
                  )}>
                    <div className="flex items-center gap-4">
                       <span className={cn("text-xs font-black w-8 h-8 flex items-center justify-center rounded-xl", isCurrent ? "bg-white text-blue-600" : "bg-slate-800 text-slate-500")}>{p.draft_order}</span>
                       <span className={cn("font-black tracking-tight", isCurrent ? (isMe ? "text-wc-blue" : "text-white") : "text-slate-300")}>{p.name}</span>
                    </div>
                    {isCurrent && <div className={cn("w-3 h-3 rounded-full animate-ping", isMe ? "bg-wc-blue" : "bg-white")} />}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl text-white text-center">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 uppercase">My Roster ({myRoster.length}/8)</h2>
             <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 text-white">
                {myRoster.map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800/50 font-black text-xs uppercase tracking-tight text-white">
                    <span className="text-3xl">{t.flag_emoji}</span>
                    <span className="flex-1 text-white">{t.name}</span>
                  </div>
                ))}
                {myRoster.length === 0 && <div className="text-center py-10 text-slate-600 font-bold italic text-xs uppercase tracking-widest opacity-30">Awaiting picks...</div>}
             </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-8 text-white">
           {!draftState?.is_started ? (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-[3rem] border border-slate-800 p-16 text-center space-y-8 shadow-2xl text-white">
                <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-blue-500/30 text-white text-center">
                  <Timer className="w-12 h-12 text-blue-500 animate-pulse" />
                </div>
                <div className="text-white text-center">
                  <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic text-white text-center">Waiting for Draft</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-sm mx-auto leading-loose text-white text-center">The Commissioner is finalizing the draft order. Please stay on this page for the live start.</p>
                </div>
             </motion.div>
           ) : draftState.is_finished ? (
             <div className="space-y-8 text-white text-center">
                <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-12 text-center shadow-2xl text-white">
                   <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                   <h2 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase italic text-white text-center">Draft Concluded</h2>
                   <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] text-white text-center">Official 2026 World Cup Rosters Set</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white text-center">
                   {players.map(p => {
                     const pRoster = teams.filter(t => t.picked_by_id === p.id)
                     return (
                       <div key={p.id} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 shadow-xl text-white text-center">
                          <h3 className="font-black text-blue-500 uppercase tracking-widest text-[10px] mb-6 pb-4 border-b border-slate-800 flex justify-between items-center text-white">
                            {p.name} <span className="text-white">{pRoster.length}/8 Teams</span>
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-white text-center">
                             {pRoster.map(t => (
                               <div key={t.id} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-xl border border-slate-800 text-white">
                                 <span className="text-xl">{t.flag_emoji}</span>
                                 <span className="text-[9px] font-black uppercase truncate text-white">{t.name}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                     )
                   })}
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 text-white text-center">
               {groupedTeams.map(([letter, groupTeams]) => (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={letter} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-lg group hover:border-blue-500/30 transition-all text-white text-center">
                   <div className="bg-slate-800/50 px-8 py-5 border-b border-slate-800 font-black text-blue-500 uppercase tracking-widest flex justify-between items-center text-[10px] text-white">
                      Group {letter}
                   </div>
                   <div className="p-6 grid grid-cols-2 gap-4 text-white text-center">
                     {groupTeams.map(team => {
                       const pickedBy = players.find(p => p.id === team.picked_by_id)
                       const isSelected = selectedTeam?.id === team.id
                       return (
                         <button key={team.id} onClick={() => !team.is_picked && isMyTurn && setSelectedTeam(team)} disabled={team.is_picked || !isMyTurn} className={cn("relative p-5 rounded-[1.5rem] border transition-all flex flex-col items-center gap-2 group/btn", team.is_picked ? "bg-slate-950 border-slate-900 opacity-40 grayscale pointer-events-none" : isSelected ? "bg-blue-600 border-blue-400 scale-105 z-10 shadow-2xl" : isMyTurn ? "bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-700 active:scale-95" : "bg-slate-800/30 border-slate-800 opacity-80")}>
                           <span className="text-4xl filter drop-shadow-lg text-white">{team.flag_emoji}</span>
                           <span className="text-[9px] font-black uppercase truncate w-full tracking-tighter text-slate-400 text-white">{team.name}</span>
                           {team.is_picked && <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center font-black text-[9px] text-white p-2 text-center uppercase leading-tight italic text-white">{pickedBy?.name}</div>}
                         </button>
                       )
                     })}
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

        <div className="col-span-12 lg:col-span-3 text-white text-center">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl sticky top-24 text-white">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex justify-between items-center text-white">Live Feed <Bell className="w-3 h-3 text-blue-500 animate-pulse text-white"/></div>
             <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar text-white">
               {pickHistory.map(t => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={t.id} className="flex items-center gap-4 p-5 bg-slate-800/30 rounded-3xl border border-slate-800/50 text-white">
                    <span className="text-3xl">{t.flag_emoji}</span>
                    <div className="flex-1 min-w-0 text-white text-left">
                      <p className="text-[9px] font-black text-blue-500 uppercase mb-1.5 text-white">{players.find(p => p.id === t.picked_by_id)?.name}</p>
                      <p className="text-xs font-black uppercase tracking-tighter truncate text-white">{t.name}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-950 w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-800 text-white">#{t.pick_number}</span>
                 </motion.div>
               ))}
             </div>
          </div>
        </div>
      </main>

      {/* ADMIN PANEL */}
      <AnimatePresence>
        {showAdminPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdminPanel(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-slate-800 z-[120] p-8 overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Commissioner</h2>
                <button onClick={() => setShowAdminPanel(false)} className="p-3 hover:bg-slate-900 rounded-2xl border border-slate-800 text-white text-center"><X/></button>
              </div>

              <div className="space-y-10 text-white">
                {!draftState?.is_started ? (
                  <section className="bg-blue-600/10 border-2 border-dashed border-blue-500/30 p-8 rounded-[2.5rem] text-center">
                    <button onClick={() => updateDraftState({ is_started: true })} disabled={!isOrderValid} className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-2xl uppercase tracking-widest transition-all">
                      <PlayCircle className="w-8 h-8" /> Start Draft
                    </button>
                  </section>
                ) : (
                  <section className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 text-center">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => updateDraftState({ is_paused: !draftState?.is_paused })} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 font-bold uppercase text-xs">
                        {draftState?.is_paused ? <Play className="mx-auto mb-1" /> : <Pause className="mx-auto mb-1" />} {draftState?.is_paused ? "Resume" : "Pause"}
                      </button>
                      <button onClick={() => updateDraftState({ is_finished: !draftState?.is_finished })} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 font-bold uppercase text-xs">
                        <Lock className="mx-auto mb-1" /> {draftState?.is_finished ? "Unlock" : "End Draft"}
                      </button>
                    </div>
                  </section>
                )}

                {/* STATUS MANAGER */}
                <section>
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Set Team Status</h3>
                   <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {teams.filter(t => t.is_picked).sort((a,b) => (a.pick_number || 0) - (b.pick_number || 0)).map(t => (
                        <div key={t.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                           <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xl">{t.flag_emoji}</span>
                              <span className="text-[10px] font-black uppercase truncate">{t.name}</span>
                           </div>
                           <select 
                             value={t.status}
                             onChange={(e) => setTeamStatus(t.id, e.target.value)}
                             className="bg-slate-950 border border-slate-700 rounded-lg text-[10px] font-black uppercase p-2 focus:outline-none focus:border-blue-500 text-white"
                           >
                              <option value="active">Active</option>
                              <option value="group_1st">1st Place</option>
                              <option value="group_2nd">2nd Place</option>
                              <option value="group_3rd_adv">3rd (Adv)</option>
                              <option value="not_advancing_3rd">3rd (Fails)</option>
                              <option value="not_advancing_4th">4th Place</option>
                              <option value="r32_win">R32 Win</option>
                              <option value="r16_win">R16 Win</option>
                              <option value="qf_win">QF Win</option>
                              <option value="sf_win">SF Win</option>
                              <option value="final_win">Champion</option>
                           </select>
                        </div>
                      ))}
                   </div>
                </section>

                {!draftState?.is_started && (
                  <section>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Set Draft Order</h3>
                    <div className="space-y-3 text-center">
                      {players.map(p => (
                        <div key={p.id} className="flex items-center gap-4 bg-slate-900 p-5 rounded-3xl border border-slate-800 text-center">
                          <span className="font-bold flex-1 text-white text-left">{p.name}</span>
                          <div className="flex gap-1.5">
                            {[1,2,3,4].map(num => (
                              <button key={num} onClick={() => setPlayerOrder(p.id, num)} className={cn("w-9 h-9 rounded-xl text-xs font-black", p.draft_order === num ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-500")}>{num}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="pt-10 border-t border-slate-800 text-center">
                  <button onClick={resetDraft} className="w-full p-5 bg-red-600/5 text-red-500 hover:bg-red-600 hover:text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] border border-red-500/20 transition-all flex items-center justify-center gap-3">
                    <RefreshCcw className="w-4 h-4" /> Hard Reset
                  </button>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {selectedTeam && isMyTurn && (
          <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-10 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent text-white">
            <div className="max-w-3xl mx-auto bg-blue-600 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between border-2 border-blue-400 gap-6 md:gap-8 text-white">
              <div className="flex items-center gap-4 md:gap-8 text-white w-full md:w-auto text-white">
                <span className="text-5xl md:text-7xl text-white">{selectedTeam.flag_emoji}</span>
                <div className="text-white">
                  <p className="text-[10px] md:text-xs font-black uppercase text-blue-200 tracking-[0.3em] mb-1 md:mb-2 text-white">Ready to Draft?</p>
                  <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none text-white text-left">{selectedTeam.name}</h3>
                </div>
              </div>
              <div className="flex gap-3 md:gap-4 w-full md:w-auto text-white">
                <button onClick={() => setSelectedTeam(null)} className="flex-1 md:flex-none w-auto md:w-20 h-14 md:h-20 bg-blue-800 rounded-[1rem] md:rounded-[1.5rem] text-white flex items-center justify-center hover:bg-blue-900 transition-all text-white"><X className="w-6 h-6 md:w-8 h-8 text-white"/></button>
                <button onClick={confirmPick} disabled={isConfirming} className="flex-[3] md:flex-none px-6 md:px-14 h-14 md:h-20 bg-white text-blue-600 font-black rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center gap-2 md:gap-4 active:scale-95 disabled:opacity-50 transition-all shadow-2xl text-sm md:text-xl uppercase tracking-tighter">
                  {isConfirming ? <RefreshCcw className="animate-spin w-5 h-5 md:w-8 h-8" /> : <ShieldCheck className="w-5 h-5 md:w-8 h-8" />} 
                  <span>Confirm Pick</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
