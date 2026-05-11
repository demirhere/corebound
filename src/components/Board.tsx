import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import {
  ArrivalDialog,
  LossDialog,
  ResearchDialog,
  ScoutChoiceDialog,
  ShipPartChoiceDialog,
  WakeChoiceDialog,
} from './dialogs'
import { getNextGateFuelDiscount, getNextStopFuelDiscount } from '../game/effects'
import { getDestinationFuelSurcharge, getMissionAnyIconSurcharge } from '../game/damage'
import { getGateExtraCrewSlots } from '../game/blueprints/sectorGates'
import { countFuelCardsInSupply } from '../game/boardQueries'
import { getWaterPairFuelAmount } from '../game/shipParts'
import type { BoardState, ShipPartKind } from '../game/types'
import {
  PlayerCrewPanel,
} from './BoardPanels'
import {
  getPlayerCrewStats,
  getOwnedHandCardOwnerId,
  getVisibleHandCardIds,
  getVisibleTiredCardIds,
  isMultiplayerBoard,
} from '../game/players'
import { CardStack } from './CardStack'
import { getStackActions } from '../game/stackActions'
import {
  type CardKeyDownHandler,
  type CardPointerDownHandler,
} from './BoardCard'
import {
  DeckCard,
  type DeckKeyDownHandler,
  type DeckPointerDownHandler,
} from './DeckCard'
import {
  Hand,
  type HandCrewSortKind,
  type HandInsertPreview,
  type HandKeyDownHandler,
  type HandPointerDownHandler,
} from './Hand'
import { TiredCrewDeck } from './TiredCrewDeck'
import type { SharedDragPreview } from '../realtime/types'
import { CRYO_DECK_ID, DRIFT_DECK_ID } from '../game/decks'

type BoardView = BoardState

function countSpentShipParts(board: BoardView, shipPart: ShipPartKind) {
  return board.shipPartSlots.reduce((count, slot) => (
    slot.shipPart === shipPart && slot.status === 'spent' && slot.spentSector === board.currentSector
      ? count + 1
      : count
  ), 0)
}

type BoardProps = {
  board: BoardView
  boardRef: Ref<HTMLDivElement>
  handRef: Ref<HTMLElement>
  activeStackIds: readonly string[]
  activeDeckIds: readonly string[]
  activeHandCardIds: readonly string[]
  handInsertPreview: HandInsertPreview | null
  endTurnAttentionKey: number
  sharedDrag: SharedDragPreview | null
  localPlayerId: string | null
  canMoveBoardFreely: boolean
  canUseOwnCrew: boolean
  canEndTurn: boolean
  isLocalTurn: boolean
  stackOffsetRatio: number
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onDeckPointerDown: DeckPointerDownHandler
  onDeckKeyDown: DeckKeyDownHandler
  onCardPointerDown: CardPointerDownHandler
  onCardKeyDown: CardKeyDownHandler
  onHandCardPointerDown: HandPointerDownHandler
  onHandCardKeyDown: HandKeyDownHandler
  onWakeCrewChoice: (cardId: string) => void
  onScoutCardChoice: (cardId: string) => void
  onScoutChoiceConfirm: () => void
  onShipPartChoice: (cardId: string) => void
  onPurchaseShipPart: (shipPartId: string) => void
  onRedrawResearchOffers: () => void
  onCloseResearchDialog: () => void
  onDiscardActiveShipPart: (instanceId: string) => void
  onStackAction: (stackId: string, actionId: string) => void
  onEndTurn: () => void
  onShowCrewGuide: () => void
  onSortCrew: (sortKind: HandCrewSortKind) => void
  onResetGame: () => void
  onReturnToMainMenu: () => void
}

export function Board({
  board,
  boardRef,
  handRef,
  activeStackIds,
  activeDeckIds,
  activeHandCardIds,
  handInsertPreview,
  endTurnAttentionKey,
  sharedDrag,
  localPlayerId,
  canMoveBoardFreely,
  canUseOwnCrew,
  canEndTurn,
  isLocalTurn,
  stackOffsetRatio,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDeckPointerDown,
  onDeckKeyDown,
  onCardPointerDown,
  onCardKeyDown,
  onHandCardPointerDown,
  onHandCardKeyDown,
  onWakeCrewChoice,
  onScoutCardChoice,
  onScoutChoiceConfirm,
  onShipPartChoice,
  onPurchaseShipPart,
  onRedrawResearchOffers,
  onCloseResearchDialog,
  onDiscardActiveShipPart,
  onStackAction,
  onEndTurn,
  onShowCrewGuide,
  onSortCrew,
  onResetGame,
  onReturnToMainMenu,
}: BoardProps) {
  const isGameOver = board.hasArrived || Boolean(board.lossReason)
  const canEndTurnNow = canEndTurn &&
    !board.hasArrived &&
    !board.lossReason &&
    !board.pendingWakeChoice &&
    !board.pendingScoutChoice &&
    !board.pendingShipPartChoice &&
    !board.pendingResearchChoice &&
    !board.pendingDrift
  const playerStats = getPlayerCrewStats(board)
  const isMultiplayer = isMultiplayerBoard(board)
  const visibleHandCardIds = getVisibleHandCardIds(board, localPlayerId)
  const visibleTiredCardIds = getVisibleTiredCardIds(board, localPlayerId)
  const endTurnLabel = board.pendingDrift
    ? 'Resolving drift'
    : !isLocalTurn
      ? 'Waiting for other player'
      : board.isRunEnding
        ? 'End run'
        : 'End turn'
  const endTurnSublabel = null
  const fuelDiscount = getNextStopFuelDiscount(board.pendingEffects)
  const gateCrewSlotDiscount = countSpentShipParts(board, 'service-drone-bay')
  const gateFuelShipPartDiscount = countSpentShipParts(board, 'adaptive-control-console')
  const gateIconDiscount = 0
  const gateFuelDiscount = getNextGateFuelDiscount(board.pendingEffects) + gateFuelShipPartDiscount
  const waterPairFuelAmount = getWaterPairFuelAmount(board.shipPartSlots)
  const missionAnyIconSurcharge = getMissionAnyIconSurcharge(board.cards, board.routeSlots)
  const gateDetails = Object.values(board.cards).find((card) => card.kind === 'gate' && card.gate)?.gate
  const gateExtraCrewCount = gateDetails ? getGateExtraCrewSlots(gateDetails, board.stressCount) : 0
  const traveledStopCardIds = new Set([
    ...board.routeSlots.flatMap((routeSlot) => routeSlot ? [routeSlot.cardId] : []),
  ])
  const acquiredShipPartCardIds = new Set(board.shipPartSlots.map((slot) => slot.cardId))

  function canInteractWithStackCard(cardId: string) {
    return Boolean(
      canMoveBoardFreely ||
        (
          canUseOwnCrew &&
          localPlayerId &&
          getOwnedHandCardOwnerId(board, cardId) === localPlayerId
        ),
    )
  }

  return (
    <section
      ref={boardRef}
      className="board"
      style={{
        '--drag-z-index': String(board.topZ + 1000),
        '--hand-z-index': String(board.topZ + 1),
      } as CSSProperties}
      aria-label="Galaxy card board"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {isMultiplayer ? (
        <div className="board-status-area" aria-label="Board status">
          <PlayerCrewPanel
            players={playerStats}
            currentPlayerId={board.currentPlayerId}
            localPlayerId={localPlayerId}
          />
        </div>
      ) : null}
      {board.decks
        .filter((deck) => deck.cards.length > 0 || deck.id === DRIFT_DECK_ID)
        .map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            isActive={activeDeckIds.includes(deck.id)}
            isDropTarget={board.dropTargetDeckId === deck.id}
            canInteract={canMoveBoardFreely && deck.id !== CRYO_DECK_ID}
            sharedPosition={
              sharedDrag?.kind === 'deck' && sharedDrag.deckId === deck.id
                ? { x: sharedDrag.x, y: sharedDrag.y }
                : null
            }
            onPointerDown={onDeckPointerDown}
            onKeyDown={onDeckKeyDown}
          />
        ))}

      {board.stacks.map((stack) => (
        <CardStack
          key={stack.id}
          stack={stack}
          cards={board.cards}
          isDropTarget={board.dropTargetStackId === stack.id}
          isActive={activeStackIds.includes(stack.id)}
          canInteractWithCard={canInteractWithStackCard}
          sharedPosition={
            sharedDrag?.kind === 'stack' && sharedDrag.stackId === stack.id
              ? { x: sharedDrag.x, y: sharedDrag.y }
              : null
          }
          stackOffsetRatio={stackOffsetRatio}
          fuelDiscount={fuelDiscount}
          getFuelSurcharge={(card) => getDestinationFuelSurcharge(board.cards, card.mission)}
          getMissionAnyIconSurcharge={(card) => card.mission ? missionAnyIconSurcharge : 0}
          stressCount={board.stressCount}
          gateExtraCrewCount={gateExtraCrewCount}
          gateCrewSlotDiscount={gateCrewSlotDiscount}
          gateIconDiscount={gateIconDiscount}
          gateFuelDiscount={gateFuelDiscount}
          waterPairFuelAmount={waterPairFuelAmount}
          traveledStopCardIds={traveledStopCardIds}
          acquiredShipPartCardIds={acquiredShipPartCardIds}
          actions={canMoveBoardFreely ? getStackActions(board, stack) : []}
          onStackAction={onStackAction}
          onCardPointerDown={onCardPointerDown}
          onCardKeyDown={onCardKeyDown}
        />
      ))}

      <TiredCrewDeck
        cardIds={visibleTiredCardIds}
        cards={board.cards}
      />

      <Hand
        handRef={handRef}
        crewCardIds={visibleHandCardIds}
        cards={board.cards}
        activeCardIds={activeHandCardIds}
        insertPreview={handInsertPreview}
        currentSector={board.currentSector}
        totalSectors={board.totalSectors}
        missionsCompleted={board.completedStarSummaries.length}
        turnNumber={board.turnNumber}
        fuel={countFuelCardsInSupply(board)}
        scraps={board.scraps}
        waterPairFuelAmount={waterPairFuelAmount}
        endTurnAttentionKey={endTurnAttentionKey}
        canInteract={canUseOwnCrew}
        canEndTurn={canEndTurnNow}
        endTurnLabel={endTurnLabel}
        endTurnSublabel={endTurnSublabel}
        onEndTurn={onEndTurn}
        onShowCrewGuide={onShowCrewGuide}
        onSortCrew={onSortCrew}
        onCardPointerDown={onHandCardPointerDown}
        onCardKeyDown={onHandCardKeyDown}
      />

      <ArrivalDialog
        hasArrived={board.hasArrived}
        board={board}
        onResetGame={onResetGame}
        canReset={canUseOwnCrew}
      />
      <LossDialog
        board={board}
        onResetGame={onResetGame}
        onReturnToMainMenu={onReturnToMainMenu}
        canReset={canUseOwnCrew}
      />
      <WakeChoiceDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canMoveBoardFreely}
        onWakeCrewChoice={onWakeCrewChoice}
      />
      <ScoutChoiceDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canMoveBoardFreely}
        onScoutCardChoice={onScoutCardChoice}
        onScoutChoiceConfirm={onScoutChoiceConfirm}
      />
      <ShipPartChoiceDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canMoveBoardFreely}
        onShipPartChoice={onShipPartChoice}
      />
      <ResearchDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canMoveBoardFreely}
        onPurchaseShipPart={onPurchaseShipPart}
        onRedrawResearchOffers={onRedrawResearchOffers}
        onCloseResearchDialog={onCloseResearchDialog}
        onDiscardActiveShipPart={onDiscardActiveShipPart}
      />
    </section>
  )
}
