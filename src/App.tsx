import { useReducer } from 'react'
import { Board } from './components/Board'
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
  const { board, playtestLog, previousPlaytestLogSessions } = game
  const resetConsoleLog = usePlaytestLogConsole(playtestLog)

  function setBoard(update: BoardUpdater) {
    dispatchGame({
      type: 'apply-board-update',
      update,
      occurredAt: new Date().toISOString(),
    })
  }

  const interactions = useBoardInteractions({ board, setBoard })

  useCardMovementAnimations({ board, boardRef: interactions.boardRef })

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
        onScoutChoiceReset={interactions.onScoutChoiceReset}
        onScoutChoiceConfirm={interactions.onScoutChoiceConfirm}
        onResetGame={resetGame}
      />
      <PlaytestLog
        entries={playtestLog}
        previousSessions={previousPlaytestLogSessions}
        onResetGame={resetGame}
      />
    </main>
  )
}

export default App
