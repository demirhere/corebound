import { useEffect, useReducer, useState } from 'react'
import { Board } from './components/Board'
import { HowToPlayDialog } from './components/BoardDialogs'
import { PlaytestLog } from './components/PlaytestLog'
import { RealtimePanel } from './components/RealtimePanel'
import {
  createInitialGameState,
  gameReducer,
  type BoardUpdater,
} from './game/state'
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
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
  const { board, pendingSetupDeal, playtestLog, previousPlaytestLogSessions } = game
  const resetConsoleLog = usePlaytestLogConsole(playtestLog)
  const pendingSetupDealKey = pendingSetupDeal?.key ?? null
  const realtime = usePartyKitSync({
    config: realtimeConfig,
    game,
    isHowToPlayOpen,
    dispatchGame,
    setIsHowToPlayOpen,
  })
  const canControlBoard = !realtimeConfig.enabled || realtimeConfig.role === 'host'

  function setBoard(update: BoardUpdater) {
    if (!canControlBoard) {
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
    onSharedDragChange: realtime.sendSharedDrag,
  })

  useCardMovementAnimations({ board, boardRef: interactions.boardRef })

  useEffect(() => {
    if (!canControlBoard || !pendingSetupDealKey) {
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
  }, [canControlBoard, pendingSetupDealKey])

  function resetGame() {
    if (!canControlBoard) {
      return
    }

    interactions.resetInteractions()
    resetConsoleLog()
    dispatchGame({ type: 'reset-game', occurredAt: new Date().toISOString() })
  }

  return (
    <main className="app" aria-label="Corebound board prototype">
      <Board
        board={board}
        boardRef={interactions.boardRef}
        handRef={interactions.handRef}
        activeStackIds={interactions.activeStackIds}
        activeDeckIds={interactions.activeDeckIds}
        activeHandCardIds={interactions.activeHandCardIds}
        handInsertPreview={interactions.handInsertPreview}
        sharedDrag={canControlBoard ? null : realtime.remoteDrag}
        canInteract={canControlBoard}
        stackOffsetRatio={interactions.stackOffsetRatio}
        onPointerMove={canControlBoard ? interactions.onPointerMove : noop}
        onPointerUp={canControlBoard ? interactions.onPointerUp : noop}
        onPointerCancel={canControlBoard ? interactions.onPointerCancel : noop}
        onDeckPointerDown={canControlBoard ? interactions.onDeckPointerDown : noop}
        onDeckKeyDown={canControlBoard ? interactions.onDeckKeyDown : noop}
        onCardPointerDown={canControlBoard ? interactions.onCardPointerDown : noop}
        onCardKeyDown={canControlBoard ? interactions.onCardKeyDown : noop}
        onHandCardPointerDown={canControlBoard ? interactions.onHandCardPointerDown : noop}
        onHandCardKeyDown={canControlBoard ? interactions.onHandCardKeyDown : noop}
        onWakeCrewChoice={canControlBoard ? interactions.onWakeCrewChoice : noop}
        onScoutCardChoice={canControlBoard ? interactions.onScoutCardChoice : noop}
        onScoutChoiceConfirm={canControlBoard ? interactions.onScoutChoiceConfirm : noop}
        onStackAction={canControlBoard ? interactions.onStackAction : noop}
        onEndTurn={canControlBoard ? interactions.onEndTurn : noop}
        onResetGame={resetGame}
      />
      <PlaytestLog
        entries={playtestLog}
        previousSessions={previousPlaytestLogSessions}
        canControl={canControlBoard}
        onShowHowToPlay={() => setIsHowToPlayOpen(true)}
        onResetGame={resetGame}
      />
      {realtimeConfig.enabled ? (
        <RealtimePanel
          config={realtimeConfig}
          status={realtime.status}
          connectionCount={realtime.connectionCount}
        />
      ) : null}
      <HowToPlayDialog
        isOpen={isHowToPlayOpen}
        onClose={canControlBoard ? () => setIsHowToPlayOpen(false) : noop}
        canClose={canControlBoard}
      />
    </main>
  )
}

export default App
