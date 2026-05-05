import {
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'
import { getNextStopFuelDiscount } from '../game/effects'
import type { BoardState, ShipPartKind } from '../game/types'
import {
  ArrivalDialog,
  LossDialog,
  ScoutChoiceDialog,
  WakeChoiceDialog,
} from './BoardDialogs'
import {
  InstructionsPanel,
  ShipPartsPanel,
  StressTracker,
} from './BoardPanels'
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
  type HandInsertPreview,
  type HandKeyDownHandler,
  type HandPointerDownHandler,
} from './Hand'
import type { SharedDragPreview } from '../realtime/types'

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
  canInteract: boolean
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
  onStackAction: (stackId: string, actionId: string) => void
  onEndTurn: () => void
  onResetGame: () => void
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
  canInteract,
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
  onStackAction,
  onEndTurn,
  onResetGame,
}: BoardProps) {
  const isGameOver = board.hasArrived || Boolean(board.lossReason)
  const canEndTurn = canInteract &&
    !board.hasArrived &&
    !board.lossReason &&
    !board.pendingWakeChoice &&
    !board.pendingScoutChoice
  const fuelDiscount = getNextStopFuelDiscount(board.pendingEffects)
  const gateCrewSlotDiscount = countSpentShipParts(board, 'service-drone-bay')
  const gateIconDiscount = countSpentShipParts(board, 'adaptive-control-console')
  const traveledStopCardIds = new Set([
    ...board.routeSlots.flatMap((routeSlot) => routeSlot ? [routeSlot.cardId] : []),
    ...board.shipPartSlots.map((slot) => slot.cardId),
  ])

  return (
    <section
      ref={boardRef}
      className="board"
      aria-label="Galaxy card board"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <InstructionsPanel totalSectors={board.totalSectors} />
      <div className="board-status-area" aria-label="Board status">
        <StressTracker stressCount={board.stressCount} />
        <ShipPartsPanel board={board} />
      </div>
      {board.decks
        .filter((deck) => deck.cards.length > 0)
        .map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            isActive={activeDeckIds.includes(deck.id)}
            isDropTarget={board.dropTargetDeckId === deck.id}
            canInteract={canInteract}
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
          canInteract={canInteract}
          sharedPosition={
            sharedDrag?.kind === 'stack' && sharedDrag.stackId === stack.id
              ? { x: sharedDrag.x, y: sharedDrag.y }
              : null
          }
          stackOffsetRatio={stackOffsetRatio}
          fuelDiscount={fuelDiscount}
          stressCount={board.stressCount}
          gateCrewSlotDiscount={gateCrewSlotDiscount}
          gateIconDiscount={gateIconDiscount}
          traveledStopCardIds={traveledStopCardIds}
          actions={canInteract ? getStackActions(board, stack) : []}
          onStackAction={onStackAction}
          onCardPointerDown={onCardPointerDown}
          onCardKeyDown={onCardKeyDown}
        />
      ))}

      <Hand
        handRef={handRef}
        crewCardIds={board.handCardIds}
        tiredCardIds={board.tiredCardIds}
        cards={board.cards}
        activeCardIds={activeHandCardIds}
        insertPreview={handInsertPreview}
        endTurnAttentionKey={endTurnAttentionKey}
        canInteract={canInteract}
        canEndTurn={canEndTurn}
        onEndTurn={onEndTurn}
        onCardPointerDown={onHandCardPointerDown}
        onCardKeyDown={onHandCardKeyDown}
      />

      <ArrivalDialog
        hasArrived={board.hasArrived}
        onResetGame={onResetGame}
        canReset={canInteract}
      />
      <LossDialog board={board} onResetGame={onResetGame} canReset={canInteract} />
      <WakeChoiceDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canInteract}
        onWakeCrewChoice={onWakeCrewChoice}
      />
      <ScoutChoiceDialog
        board={board}
        isGameOver={isGameOver}
        canInteract={canInteract}
        onScoutCardChoice={onScoutCardChoice}
        onScoutChoiceConfirm={onScoutChoiceConfirm}
      />
    </section>
  )
}
