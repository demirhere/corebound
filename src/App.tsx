import { useEffect, useReducer, useState } from 'react'
import { Board } from './components/Board'
import { HowToPlayDialog } from './components/BoardDialogs'
import { PlaytestLog } from './components/PlaytestLog'
import {
  createInitialGameState,
  gameReducer,
  type BoardUpdater,
} from './game/state'
import { useBoardInteractions } from './hooks/useBoardInteractions'
import { useCardMovementAnimations } from './hooks/useCardMovementAnimations'
import { usePlaytestLogConsole } from './hooks/usePlaytestLogConsole'
import './App.css'

function App() {
  const [game, dispatchGame] = useReducer(gameReducer, undefined, createInitialGameState)
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
  const { board, pendingSetupDeal, playtestLog, previousPlaytestLogSessions } = game
  const resetConsoleLog = usePlaytestLogConsole(playtestLog)
  const pendingSetupDealKey = pendingSetupDeal?.key ?? null

  function setBoard(update: BoardUpdater) {
    dispatchGame({
      type: 'apply-board-update',
      update,
      occurredAt: new Date().toISOString(),
    })
  }

  const interactions = useBoardInteractions({ board, setBoard })

  useCardMovementAnimations({ board, boardRef: interactions.boardRef })

  useEffect(() => {
    if (!pendingSetupDealKey) {
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
  }, [pendingSetupDealKey])

  function resetGame() {
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
        stackOffsetRatio={interactions.stackOffsetRatio}
        onPointerMove={interactions.onPointerMove}
        onPointerUp={interactions.onPointerUp}
        onPointerCancel={interactions.onPointerCancel}
        onDeckPointerDown={interactions.onDeckPointerDown}
        onDeckKeyDown={interactions.onDeckKeyDown}
        onCardPointerDown={interactions.onCardPointerDown}
        onCardKeyDown={interactions.onCardKeyDown}
        onHandCardPointerDown={interactions.onHandCardPointerDown}
        onHandCardKeyDown={interactions.onHandCardKeyDown}
        onWakeCrewChoice={interactions.onWakeCrewChoice}
        onScoutCardChoice={interactions.onScoutCardChoice}
        onScoutChoiceConfirm={interactions.onScoutChoiceConfirm}
        onRouteShipPartUse={interactions.onRouteShipPartUse}
        onResetGame={resetGame}
      />
      <PlaytestLog
        entries={playtestLog}
        previousSessions={previousPlaytestLogSessions}
        onShowHowToPlay={() => setIsHowToPlayOpen(true)}
        onResetGame={resetGame}
      />
      <HowToPlayDialog
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
    </main>
  )
}

export default App
