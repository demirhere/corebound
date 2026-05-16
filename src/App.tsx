import { useEffect, useReducer, useState } from 'react'
import { BeginDialog } from './components/BeginDialog'
import { Board } from './components/Board'
import { CardCatalogDialog } from './components/CardCatalogDialog'
import { CrewGuideDialog } from './components/CrewGuideDialog'
import { HowToPlayDialog } from './components/HowToPlayDialog'
import { PlaytestLog } from './components/PlaytestLog'
import { RealtimePanel } from './components/RealtimePanel'
import { resolvePendingDriftUpdate, sortHandCrewUpdate } from './board/boardUpdaters'
import type { HandCrewSortKind } from './board/handState'
import {
  createInitialGameState,
  gameReducer,
  type BoardUpdater,
} from './game/state'
import { isMultiplayerBoard } from './game/players'
import type { GamePlayer } from './game/types'
import { useBoardInteractions } from './hooks/useBoardInteractions'
import {
  CARD_DRAW_DURATION_MS,
  useCardMovementAnimations,
} from './hooks/useCardMovementAnimations'
import { usePlaytestLogConsole } from './hooks/usePlaytestLogConsole'
import { readRealtimeConfig } from './realtime/config'
import { usePartyKitSync } from './realtime/usePartyKitSync'
import './App.css'

function noop() {}

const DRIFT_RESOLVE_AFTER_REVEAL_DELAY_MS = 1500
const DRIFT_RESOLVE_DELAY_MS = CARD_DRAW_DURATION_MS + DRIFT_RESOLVE_AFTER_REVEAL_DELAY_MS

function App() {
  const [realtimeConfig] = useState(() => readRealtimeConfig())
  const [game, dispatchGame] = useReducer(gameReducer, undefined, createInitialGameState)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false)
  const [isCardCatalogOpen, setIsCardCatalogOpen] = useState(false)
  const [isCrewGuideOpen, setIsCrewGuideOpen] = useState(false)
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
  const isResolvingDrift = board.pendingDrift !== null
  const canUseTurnControls = canApplyGameUpdates && isLocalTurn && !isResolvingDrift
  const canMoveBoardFreely = canUseTurnControls && !board.isRunEnding
  const canUseOwnCrew = canApplyGameUpdates && !isResolvingDrift && !board.isRunEnding
  const canResetGame = canApplyGameUpdates
  const shouldResolveDrift = isGameStarted && canApplyGameUpdates && isLocalTurn && isResolvingDrift

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
    canEndTurn: canUseTurnControls,
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

  useEffect(() => {
    if (!shouldResolveDrift) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dispatchGame({
        type: 'apply-board-update',
        update: resolvePendingDriftUpdate,
        occurredAt: new Date().toISOString(),
      })
    }, DRIFT_RESOLVE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [board.pendingDrift?.cardId, shouldResolveDrift])

  function resetGame() {
    if (!canResetGame) {
      return
    }

    interactions.resetInteractions()
    resetConsoleLog()
    dispatchGame({ type: 'reset-game', occurredAt: new Date().toISOString() })
  }

  function returnToMainMenu() {
    if (!canResetGame) {
      return
    }

    interactions.resetInteractions()
    setIsHowToPlayOpen(false)
    setIsCardCatalogOpen(false)
    setIsCrewGuideOpen(false)
    setIsGameStarted(false)
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

  function sortCrewHand(sortKind: HandCrewSortKind) {
    if (!canUseOwnCrew) {
      return
    }

    setBoard(sortHandCrewUpdate(sortKind, localPlayerId))
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
            canEndTurn={canUseTurnControls}
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
            onShipPartChoice={canMoveBoardFreely ? interactions.onShipPartChoice : noop}
            onPurchaseShipPart={canMoveBoardFreely ? interactions.onPurchaseShipPart : noop}
            onPurchaseCrewQuartersUpgrade={canMoveBoardFreely ? interactions.onPurchaseCrewQuartersUpgrade : noop}
            onRedrawResearchOffers={canMoveBoardFreely ? interactions.onRedrawResearchOffers : noop}
            onCloseResearchDialog={canMoveBoardFreely ? interactions.onCloseResearchDialog : noop}
            onDiscardActiveShipPart={canMoveBoardFreely ? interactions.onDiscardActiveShipPart : noop}
            onStackAction={canMoveBoardFreely ? interactions.onStackAction : noop}
            onEndTurn={canUseTurnControls ? interactions.onEndTurn : noop}
            onShowCrewGuide={() => setIsCrewGuideOpen(true)}
            onSortCrew={canUseOwnCrew ? sortCrewHand : noop}
            onResetGame={resetGame}
            onReturnToMainMenu={returnToMainMenu}
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
            onShowCardCatalog={() => {
              if (canApplyGameUpdates) {
                setIsCardCatalogOpen(true)
              }
            }}
            onResetGame={resetGame}
          />
          <HowToPlayDialog
            isOpen={isHowToPlayOpen}
            onClose={canApplyGameUpdates ? () => setIsHowToPlayOpen(false) : noop}
            canClose={canApplyGameUpdates}
          />
          <CardCatalogDialog
            isOpen={isCardCatalogOpen}
            onClose={canApplyGameUpdates ? () => setIsCardCatalogOpen(false) : noop}
          />
          <CrewGuideDialog
            isOpen={isCrewGuideOpen}
            onClose={() => setIsCrewGuideOpen(false)}
            patternUsageCounts={board.patternUsageCounts}
            activeShipParts={board.activeShipParts}
            activeCrewQuarters={board.activeCrewQuarters}
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
