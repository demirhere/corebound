import { useEffect, useReducer, useState } from 'react'
import { BeginDialog } from './components/BeginDialog'
import { Board } from './components/Board'
import { HowToPlayDialog } from './components/BoardDialogs'
import { PlaytestLog } from './components/PlaytestLog'
import { RealtimePanel } from './components/RealtimePanel'
import {
  createInitialGameState,
  gameReducer,
  type BoardUpdater,
} from './game/state'
import { isMultiplayerBoard } from './game/players'
import type { GamePlayer } from './game/types'
import { useBoardInteractions } from './hooks/useBoardInteractions'
import { useCardMovementAnimations } from './hooks/useCardMovementAnimations'
import { usePlaytestLogConsole } from './hooks/usePlaytestLogConsole'
import { readRealtimeConfig } from './realtime/config'
import { usePartyKitSync } from './realtime/usePartyKitSync'
import './App.css'

function noop() {}

function App() {
  const [realtimeConfig] = useState(() => readRealtimeConfig())
  const [game, dispatchGame] = useReducer(gameReducer, undefined, createInitialGameState)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
  const { board, pendingSetupDeal, playtestLog, previousPlaytestLogSessions } = game
  const resetConsoleLog = usePlaytestLogConsole(playtestLog)
  const pendingSetupDealKey = pendingSetupDeal?.key ?? null
  const realtime = usePartyKitSync({
    config: realtimeConfig,
    game,
    isHowToPlayOpen,
    isGameStarted,
    dispatchGame,
    setIsHowToPlayOpen,
    setIsGameStarted,
  })
  const isRealtimeObserver = realtimeConfig.enabled && realtimeConfig.role === 'observer'
  const localPlayerId = realtimeConfig.enabled
    ? (isRealtimeObserver ? null : realtime.clientId)
    : board.currentPlayerId
  const isMultiplayer = isMultiplayerBoard(board)
  const isLocalPlayerInGame = !realtimeConfig.enabled ||
    Boolean(localPlayerId && board.players.some((player) => player.id === localPlayerId))
  const isLocalTurn = !isMultiplayer || board.currentPlayerId === localPlayerId
  const canApplyGameUpdates = !isRealtimeObserver && isLocalPlayerInGame
  const canMoveBoardFreely = canApplyGameUpdates && isLocalTurn
  const canUseOwnCrew = canApplyGameUpdates
  const canResetGame = canApplyGameUpdates

  function getLaunchPlayers(): GamePlayer[] {
    if (!realtimeConfig.enabled || isRealtimeObserver) {
      return board.players
    }

    return realtime.players.length > 0
      ? realtime.players.map(({ id, name }) => ({ id, name }))
      : [{ id: realtime.clientId, name: 'Player 1' }]
  }

  function setBoard(update: BoardUpdater) {
    if (!canApplyGameUpdates) {
      return
    }

    dispatchGame({
      type: 'apply-board-update',
      update,
      occurredAt: new Date().toISOString(),
    })
  }

  const interactions = useBoardInteractions({
    board,
    setBoard,
    localPlayerId,
    canMoveBoardFreely,
    canUseOwnCrew,
    onSharedDragChange: canApplyGameUpdates ? realtime.sendSharedDrag : undefined,
  })

  useCardMovementAnimations({ board, boardRef: interactions.boardRef })

  useEffect(() => {
    if (!isGameStarted || !canMoveBoardFreely || !pendingSetupDealKey) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      dispatchGame({
        type: 'complete-setup-deal',
        setupKey: pendingSetupDealKey,
        occurredAt: new Date().toISOString(),
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [canMoveBoardFreely, isGameStarted, pendingSetupDealKey])

  function resetGame() {
    if (!canResetGame) {
      return
    }

    interactions.resetInteractions()
    resetConsoleLog()
    dispatchGame({ type: 'reset-game', occurredAt: new Date().toISOString() })
  }

  function beginGame() {
    if (isRealtimeObserver) {
      return
    }

    interactions.resetInteractions()
    resetConsoleLog()
    dispatchGame({
      type: 'start-game',
      players: getLaunchPlayers(),
      occurredAt: new Date().toISOString(),
    })
    setIsGameStarted(true)
  }

  return (
    <main className="app" aria-label="Corebound board prototype">
      {isGameStarted ? (
        <>
          <Board
            board={board}
            boardRef={interactions.boardRef}
            handRef={interactions.handRef}
            activeStackIds={interactions.activeStackIds}
            activeDeckIds={interactions.activeDeckIds}
            activeHandCardIds={interactions.activeHandCardIds}
            handInsertPreview={interactions.handInsertPreview}
            endTurnAttentionKey={interactions.endTurnAttentionKey}
            sharedDrag={realtime.remoteDrag}
            localPlayerId={localPlayerId}
            canMoveBoardFreely={canMoveBoardFreely}
            canUseOwnCrew={canUseOwnCrew}
            isLocalTurn={isLocalTurn}
            stackOffsetRatio={interactions.stackOffsetRatio}
            onPointerMove={canUseOwnCrew ? interactions.onPointerMove : noop}
            onPointerUp={canUseOwnCrew ? interactions.onPointerUp : noop}
            onPointerCancel={canUseOwnCrew ? interactions.onPointerCancel : noop}
            onDeckPointerDown={canMoveBoardFreely ? interactions.onDeckPointerDown : noop}
            onDeckKeyDown={canMoveBoardFreely ? interactions.onDeckKeyDown : noop}
            onCardPointerDown={canUseOwnCrew ? interactions.onCardPointerDown : noop}
            onCardKeyDown={canUseOwnCrew ? interactions.onCardKeyDown : noop}
            onHandCardPointerDown={canUseOwnCrew ? interactions.onHandCardPointerDown : noop}
            onHandCardKeyDown={canUseOwnCrew ? interactions.onHandCardKeyDown : noop}
            onWakeCrewChoice={canMoveBoardFreely ? interactions.onWakeCrewChoice : noop}
            onScoutCardChoice={canMoveBoardFreely ? interactions.onScoutCardChoice : noop}
            onScoutChoiceConfirm={canMoveBoardFreely ? interactions.onScoutChoiceConfirm : noop}
            onStackAction={canMoveBoardFreely ? interactions.onStackAction : noop}
            onEndTurn={canMoveBoardFreely ? interactions.onEndTurn : noop}
            onResetGame={resetGame}
          />
          <PlaytestLog
            entries={playtestLog}
            previousSessions={previousPlaytestLogSessions}
            canControl={canResetGame}
            networkControl={realtimeConfig.enabled ? (
              <RealtimePanel
                config={realtimeConfig}
                status={realtime.status}
                connectionCount={realtime.connectionCount}
                players={realtime.players}
              />
            ) : null}
            onShowHowToPlay={() => {
              if (canApplyGameUpdates) {
                setIsHowToPlayOpen(true)
              }
            }}
            onResetGame={resetGame}
          />
          <HowToPlayDialog
            isOpen={isHowToPlayOpen}
            onClose={canApplyGameUpdates ? () => setIsHowToPlayOpen(false) : noop}
            canClose={canApplyGameUpdates}
          />
        </>
      ) : (
        <BeginDialog
          players={realtimeConfig.enabled ? realtime.players : []}
          canBegin={!isRealtimeObserver}
          invite={
            realtimeConfig.enabled && realtimeConfig.role === 'host'
              ? {
                  roomCode: realtimeConfig.room.toUpperCase(),
                  playerUrl: realtimeConfig.playerUrl,
                }
              : null
          }
          onBegin={beginGame}
        />
      )}
    </main>
  )
}

export default App
