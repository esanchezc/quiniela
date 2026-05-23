import { useEffect, useState, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { Trophy, Timer, RefreshCcw, X, Bell, Zap, Settings, Pause, Play, Lock, UserPlus, PlayCircle, ShieldCheck } from 'lucide-react'
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
}

interface DraftState {
  current_pick_number: number
  is_draft_active: boolean
  is_paused: boolean
  is_finished: boolean
  is_started: boolean
}

function App() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    const init = async () => {
      try {
        if (token) {
          const { data } = await supabase.from('players').select('*').eq('secret_token', token).single()
          if (data) setPlayer(data)
        }
        await fetchPlayers()
        await refreshData()
        
        if ("Notification" in window && Notification.permission === "default") {
          Notification.requestPermission()
        }
      } finally {
        setLoading(false)
      }
    }

    init()

    const channel = supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_state' }, () => refreshData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchPlayers())
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

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

  const updateDraftState = async (updates: Partial<DraftState>) => {
    const { error: updateError } = await supabase.from('draft_state').update(updates).eq('id', 1)
    if (updateError) {
        console.error("Update failed:", updateError)
    }
    refreshData()
  }

  const setPlayerOrder = async (playerId: string, newOrder: number) => {
    if (draftState?.is_started) return
    await supabase.from('players').update({ draft_order: newOrder }).eq('id', playerId)
    await fetchPlayers()
  }

  const resetDraft = async () => {
    if (!window.confirm('🚨 RESET EVERYTHING?')) return
    await supabase.from('teams').update({ is_picked: false, picked_by_id: null, pick_number: null }).neq('id', 0)
    await supabase.from('draft_state').update({ current_pick_number: 1, is_paused: false, is_finished: false, is_started: false }).eq('id', 1)
    refreshData()
  }

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true'
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

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><RefreshCcw className="w-12 h-12 animate-spin text-blue-500" /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32">
      <AnimatePresence mode="wait">
        {!draftState?.is_started ? (
          <motion.div key="setup" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-blue-600 text-white font-black text-center py-4 uppercase tracking-[0.2em] flex items-center justify-center gap-4 relative z-[60] shadow-xl">
             <Timer className="w-5 h-5 animate-pulse" /> DRAFT NOT STARTED <Timer className="w-5 h-5 animate-pulse" />
          </motion.div>
        ) : draftState.is_finished ? (
          <motion.div key="finished" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-green-600 text-white relative z-[60] font-black text-center py-4 uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl">
             <Trophy className="w-6 h-6" /> DRAFT COMPLETE <Trophy className="w-6 h-6" />
          </motion.div>
        ) : draftState.is_paused ? (
          <motion.div key="paused" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-red-600 text-white relative z-[60] font-black text-center py-3 uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">
             <Pause className="w-5 h-5 fill-current" /> DRAFT PAUSED <Pause className="w-5 h-5 fill-current" />
          </motion.div>
        ) : isMyTurn ? (
          <motion.div key="turn" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-wc-gold text-wc-blue relative z-[60] font-black text-center py-3 uppercase italic tracking-tighter flex items-center justify-center gap-3 shadow-lg">
             <Zap className="w-5 h-5 animate-pulse" /> IT'S YOUR TURN, {player?.name}! <Zap className="w-5 h-5 animate-pulse" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Trophy className="text-blue-500 w-8 h-8" />
            <h1 className="text-xl font-black tracking-tighter uppercase text-white">Quiniela 2026</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black border", isConnected ? "text-green-500 border-green-500/20 bg-green-500/5" : "text-red-500 border-red-500/20 bg-red-500/5")}>
               {isConnected ? "LIVE" : "OFFLINE"}
            </div>
            {player && <div className="bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700 font-bold text-sm text-white">👤 {player.name}</div>}
            {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="bg-blue-600 hover:bg-blue-700 p-2.5 rounded-xl transition-all shadow-lg active:scale-95 text-white"><Settings className="w-5 h-5" /></button>}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showAdminPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdminPanel(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-slate-800 z-[120] p-8 overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Commissioner</h2>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">League Control</p>
                </div>
                <button onClick={() => setShowAdminPanel(false)} className="p-3 hover:bg-slate-900 rounded-2xl border border-slate-800 text-white"><X/></button>
              </div>

              <div className="space-y-10 text-white">
                {!draftState?.is_started ? (
                  <section className="bg-blue-600/10 border-2 border-dashed border-blue-500/30 p-8 rounded-[2.5rem] text-center">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-6">Setup Complete?</h3>
                    {!isOrderValid && <p className="text-red-500 text-[10px] font-black uppercase mb-4">❌ Assign unique orders 1-4</p>}
                    <button 
                      disabled={!isOrderValid}
                      onClick={() => updateDraftState({ is_started: true })} 
                      className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white font-black rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/20 transition-all uppercase tracking-widest active:scale-95"
                    >
                      <PlayCircle className="w-8 h-8" /> Start Draft
                    </button>
                  </section>
                ) : (
                  <section className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Live Controls</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {!draftState.is_finished ? (
                         <button onClick={() => updateDraftState({ is_paused: !draftState?.is_paused })} className={cn("flex flex-col items-center justify-center gap-2 p-6 rounded-3xl font-black border uppercase text-[10px] transition-all", draftState?.is_paused ? "bg-green-600/10 border-green-500 text-green-500" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500")}>
                          {draftState?.is_paused ? <><Play className="w-6 h-6 mb-1"/> Resume</> : <><Pause className="w-6 h-6 mb-1"/> Pause</>}
                        </button>
                      ) : (
                        <div className="bg-green-600/10 border border-green-500/30 rounded-3xl p-4 flex flex-col items-center justify-center text-green-500 font-black text-[10px] uppercase col-span-2 py-8">
                           <Trophy className="w-8 h-8 mb-2" /> Draft Finished
                        </div>
                      )}
                      {!draftState.is_finished && (
                        <button 
                          disabled={draftState.current_pick_number <= 32}
                          onClick={() => updateDraftState({ is_finished: true })} 
                          className="relative flex flex-col items-center justify-center gap-2 p-6 rounded-3xl font-black border border-slate-700 bg-slate-800 text-slate-300 hover:border-blue-500 uppercase text-[10px] transition-all disabled:opacity-20 disabled:cursor-not-allowed group/end"
                        >
                          <Lock className="w-6 h-6 mb-1"/> 
                          <span>End Draft</span>
                          {draftState.current_pick_number <= 32 && (
                            <span className="absolute -bottom-2 text-[8px] text-amber-500/60 lowercase font-bold">32 picks required</span>
                          )}
                        </button>
                      )}
                    </div>
                  </section>
                )}

                {!draftState?.is_started && (
                  <section>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Set Draft Order</h3>
                    <div className="space-y-3">
                      {players.map(p => {
                        const isDuplicate = players.filter(other => other.draft_order === p.draft_order).length > 1 && p.draft_order !== 0
                        return (
                          <div key={p.id} className={cn("flex items-center gap-4 bg-slate-900 p-5 rounded-3xl border transition-all", isDuplicate ? "border-red-500 bg-red-500/5 shadow-lg shadow-red-900/10" : "border-slate-800")}>
                            <span className="font-bold flex-1 text-white">{p.name}</span>
                            <div className="flex gap-1.5">
                              {[1,2,3,4].map(num => (
                                <button key={num} onClick={() => setPlayerOrder(p.id, num)} className={cn("w-9 h-9 rounded-xl text-xs font-black transition-all shadow-sm", p.draft_order === num ? "bg-blue-600 text-white ring-2 ring-blue-400" : "bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-white")}>{num}</button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section className="pt-10 border-t border-slate-800">
                  <button onClick={resetDraft} className="w-full p-5 bg-red-600/5 text-red-500 hover:bg-red-600 hover:text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] border border-red-500/20 transition-all flex items-center justify-center gap-3">
                    <RefreshCcw className="w-4 h-4" /> Hard Reset
                  </button>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-12 gap-8 mt-4">
        {/* LEFT COLUMN */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Pick Sequence <span className="text-blue-500">#{draftState?.current_pick_number}</span></div>
             <div className="space-y-4">
              {players.map(p => {
                const isCurrent = activePlayer?.id === p.id && draftState?.is_started && !draftState.is_finished
                const isMe = player?.id === p.id
                return (
                  <div key={p.id} className={cn(
                    "flex items-center justify-between p-5 rounded-3xl border transition-all duration-700",
                    isCurrent ? (isMe ? "bg-wc-gold border-wc-gold shadow-2xl shadow-wc-gold/20 scale-105" : "bg-blue-600 border-blue-400 shadow-2xl shadow-blue-600/20 scale-105") : "bg-slate-800/30 border-slate-800 opacity-40"
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
          
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
             <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 uppercase">My Roster ({myRoster.length}/8)</h2>
             <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 text-white">
                {myRoster.map(t => (
                  <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-800/40 rounded-2xl border border-slate-800/50 font-black text-xs uppercase tracking-tight">
                    <span className="text-3xl">{t.flag_emoji}</span>
                    <span className="flex-1">{t.name}</span>
                  </div>
                ))}
                {myRoster.length === 0 && <div className="text-center py-10 text-slate-600 font-bold italic text-xs uppercase tracking-widest opacity-30">Awaiting picks...</div>}
             </div>
          </div>
        </div>

        {/* CENTER COLUMN */}
        <div className="col-span-12 lg:col-span-6 space-y-8">
           {!draftState?.is_started ? (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 rounded-[3rem] border border-slate-800 p-16 text-center space-y-8 shadow-2xl">
                <div className="w-32 h-32 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-blue-500/30">
                  <Timer className="w-12 h-12 text-blue-500 animate-pulse" />
                </div>
                <div className="text-white">
                  <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">Waiting for Draft</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-sm mx-auto leading-loose">The Commissioner is finalizing the draft order. Please stay on this page for the live start.</p>
                </div>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '200ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
             </motion.div>
           ) : draftState.is_finished ? (
             <div className="space-y-8">
                <div className="bg-slate-900 rounded-[3rem] border border-slate-800 p-12 text-center shadow-2xl text-white">
                   <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
                   <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase italic text-white">Draft Concluded</h2>
                   <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Official 2026 World Cup Rosters Set</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {players.map(p => {
                     const pRoster = teams.filter(t => t.picked_by_id === p.id)
                     return (
                       <div key={p.id} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6 shadow-xl text-white">
                          <h3 className="font-black text-blue-500 uppercase tracking-widest text-[10px] mb-6 pb-4 border-b border-slate-800 flex justify-between items-center">
                            {p.name} <span>{pRoster.length}/8 Teams</span>
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                             {pRoster.map(t => (
                               <div key={t.id} className="flex items-center gap-2 p-2 bg-slate-800/40 rounded-xl border border-slate-800">
                                 <span className="text-xl">{t.flag_emoji}</span>
                                 <span className="text-[9px] font-black uppercase truncate">{t.name}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                     )
                   })}
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {groupedTeams.map(([letter, groupTeams]) => (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={letter} className="bg-slate-900 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-lg group hover:border-blue-500/30 transition-all">
                   <div className="bg-slate-800/50 px-8 py-5 border-b border-slate-800 font-black text-blue-500 uppercase tracking-widest flex justify-between items-center text-[10px]">
                      Group {letter}
                      <div className="flex gap-1">
                        {groupTeams.map(t => <div key={t.id} className={cn("w-1.5 h-1.5 rounded-full", t.is_picked ? "bg-slate-700" : "bg-blue-500")} />)}
                      </div>
                   </div>
                   <div className="p-6 grid grid-cols-2 gap-4">
                     {groupTeams.map(team => {
                       const pickedBy = players.find(p => p.id === team.picked_by_id)
                       const isSelected = selectedTeam?.id === team.id
                       return (
                         <button key={team.id} onClick={() => !team.is_picked && isMyTurn && setSelectedTeam(team)} disabled={team.is_picked || !isMyTurn} className={cn("relative p-5 rounded-[1.5rem] border transition-all flex flex-col items-center gap-2 group/btn", team.is_picked ? "bg-slate-950 border-slate-900 opacity-40 grayscale pointer-events-none" : isSelected ? "bg-blue-600 border-blue-400 scale-105 z-10 shadow-2xl" : isMyTurn ? "bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-700 active:scale-95" : "bg-slate-800/30 border-slate-800 opacity-80")}>
                           <span className="text-4xl filter drop-shadow-lg">{team.flag_emoji}</span>
                           <span className="text-[9px] font-black uppercase truncate w-full tracking-tighter text-slate-400">{team.name}</span>
                           {team.is_picked && <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center font-black text-[9px] text-white p-2 text-center uppercase leading-tight italic">{pickedBy?.name}</div>}
                         </button>
                       )
                     })}
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl sticky top-24">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8 flex justify-between items-center">Live Feed <Bell className="w-3 h-3 text-blue-500 animate-pulse"/></div>
             <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3 custom-scrollbar text-white">
               {pickHistory.map(t => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={t.id} className="flex items-center gap-4 p-5 bg-slate-800/30 rounded-3xl border border-slate-800/50 text-white">
                    <span className="text-3xl">{t.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-blue-500 uppercase mb-1.5">{players.find(p => p.id === t.picked_by_id)?.name}</p>
                      <p className="text-xs font-black uppercase tracking-tighter truncate text-white">{t.name}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-slate-950 w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-800">#{t.pick_number}</span>
                 </motion.div>
               ))}
             </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedTeam && isMyTurn && (
          <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-[100] p-10 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
            <div className="max-w-3xl mx-auto bg-blue-600 rounded-[3rem] p-10 shadow-2xl flex items-center justify-between border-2 border-blue-400">
              <div className="flex items-center gap-8 text-white">
                <span className="text-7xl">{selectedTeam.flag_emoji}</span>
                <div>
                  <p className="text-xs font-black uppercase text-blue-200 tracking-[0.3em] mb-2">Ready to Draft?</p>
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase">{selectedTeam.name}</h3>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setSelectedTeam(null)} className="w-20 h-20 bg-blue-800 rounded-[1.5rem] text-white flex items-center justify-center hover:bg-blue-900 transition-all text-white"><X className="w-8 h-8"/></button>
                <button onClick={confirmPick} disabled={isConfirming} className="px-14 h-20 bg-white text-blue-600 font-black rounded-[1.5rem] flex items-center gap-4 active:scale-95 disabled:opacity-50 transition-all shadow-2xl text-xl uppercase tracking-tighter">
                  {isConfirming ? <RefreshCcw className="animate-spin w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />} Confirm Pick
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  )
}

export default App
