import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Trophy, User, Timer } from 'lucide-react'

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
}

interface DraftState {
  current_pick_number: number
  is_draft_active: boolean
}

function App() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')

    const init = async () => {
      // Fetch current player if token exists
      if (token) {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('secret_token', token)
          .single()
        if (data) setPlayer(data)
      }

      // Fetch all players
      const { data: allPlayers } = await supabase.from('players').select('*').order('draft_order')
      if (allPlayers) setPlayers(allPlayers)

      // Fetch teams and draft state
      fetchTeams()
      fetchDraftState()
      setLoading(false)
    }

    init()

    // Real-time subscriptions
    const teamsSubscription = supabase
      .channel('teams-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchTeams())
      .subscribe()

    const draftSubscription = supabase
      .channel('draft-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_state' }, () => fetchDraftState())
      .subscribe()

    return () => {
      supabase.removeChannel(teamsSubscription)
      supabase.removeChannel(draftSubscription)
    }
  }, [])

  const fetchTeams = async () => {
    const { data } = await supabase.from('teams').select('*').order('name')
    if (data) setTeams(data)
  }

  const fetchDraftState = async () => {
    const { data } = await supabase.from('draft_state').select('*').single()
    if (data) setDraftState(data)
  }

  const getActivePlayer = () => {
    if (!draftState) return null
    const pickNum = draftState.current_pick_number
    const roundNum = Math.floor((pickNum - 1) / 4) + 1
    const positionInRound = ((pickNum - 1) % 4) + 1
    
    let targetOrder = positionInRound
    if (roundNum % 2 === 0) {
      targetOrder = 5 - positionInRound
    }
    
    return players.find(p => p.draft_order === targetOrder)
  }

  const handlePick = async (teamId: number) => {
    const activePlayer = getActivePlayer()
    if (!player || !activePlayer || player.id !== activePlayer.id || !draftState) return

    const { error } = await supabase
      .from('teams')
      .update({ 
        is_picked: true, 
        picked_by_id: player.id,
        pick_number: draftState.current_pick_number 
      })
      .eq('id', teamId)

    if (!error) {
      await supabase
        .from('draft_state')
        .update({ current_pick_number: draftState.current_pick_number + 1 })
        .eq('id', 1)
    }
  }

  const activePlayer = getActivePlayer()
  const isMyTurn = player && activePlayer && player.id === activePlayer.id

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <Trophy className="text-yellow-400 w-10 h-10" />
            QUINIELA 2026
          </h1>
          <p className="text-slate-400 mt-2 font-medium">World Cup Snake Draft</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl min-w-[300px]">
          {player ? (
            <div className="flex items-center gap-4">
              <div className="bg-blue-500/20 p-3 rounded-full">
                <User className="text-blue-400 w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Logged in as</p>
                <p className="text-xl font-bold text-white">{player.name}</p>
              </div>
            </div>
          ) : (
            <p className="text-amber-400 font-bold flex items-center gap-2">
              ⚠️ Access with your secret link
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Leaderboard/Draft Order */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-300">
            <Timer className="w-5 h-5" />
            Draft Status
          </h2>
          <div className="space-y-3">
            {players.map((p) => (
              <div 
                key={p.id}
                className={`p-4 rounded-xl border transition-all duration-300 ${
                  activePlayer?.id === p.id 
                    ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-105' 
                    : 'bg-slate-800/50 border-slate-700 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">{p.name}</span>
                  {activePlayer?.id === p.id && (
                    <span className="text-xs bg-blue-500 px-2 py-1 rounded-full text-white font-black animate-pulse">
                      PICKING...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-slate-800/30 p-4 rounded-xl border border-slate-700">
            <p className="text-sm text-slate-400 leading-relaxed">
              <strong>Pick #{draftState?.current_pick_number}</strong> of 32.<br/>
              Round {Math.floor(((draftState?.current_pick_number || 1) - 1) / 4) + 1}
            </p>
          </div>
        </div>

        {/* Team Selection */}
        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-black">Available Teams</h2>
            {isMyTurn && (
              <span className="text-green-400 font-bold animate-bounce flex items-center gap-2">
                It's your turn! Pick a team below.
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {teams.map((team) => {
              const pickedBy = players.find(p => p.id === team.picked_by_id)
              return (
                <button
                  key={team.id}
                  disabled={team.is_picked || !isMyTurn}
                  onClick={() => handlePick(team.id)}
                  className={`relative group p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 h-32 ${
                    team.is_picked 
                      ? 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'
                      : isMyTurn
                        ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-700 cursor-pointer hover:scale-105'
                        : 'bg-slate-800 border-slate-700 opacity-80'
                  }`}
                >
                  <span className="text-4xl">{team.flag_emoji}</span>
                  <span className="font-bold text-center text-sm leading-tight">{team.name}</span>
                  
                  {team.is_picked && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center flex-col p-2">
                      <span className="text-[10px] uppercase font-black text-slate-400">Picked by</span>
                      <span className="font-black text-white text-xs text-center">{pickedBy?.name}</span>
                    </div>
                  )}
                  
                  {!team.is_picked && isMyTurn && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-blue-500 w-4 h-4 rounded-full" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
