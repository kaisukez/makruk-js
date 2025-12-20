import { Color, CountType } from '@kaisukez/makruk-js'

interface Countdown {
  countColor: Color
  countType: CountType
  count: number
  countFrom: number
  countTo: number
}

interface Status {
  isCheck: boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw: boolean
  isGameOver: boolean
  isInsufficientMaterial: boolean
  isThreefoldRepetition: boolean
  isCountdownExpired: boolean
}

interface GameStatusProps {
  turn: Color
  status: Status
  countdown: Countdown | null
  isThinking?: boolean
}

function getDrawReason(status: Status): string {
  if (status.isStalemate) return 'Stalemate'
  if (status.isCountdownExpired) return 'Countdown Expired'
  if (status.isInsufficientMaterial) return 'Insufficient Material'
  if (status.isThreefoldRepetition) return 'Threefold Repetition'
  return 'Draw'
}

function getCountTypeLabel(countType: CountType): string {
  return countType === CountType.PIECE_POWER_COUNTDOWN
    ? 'Piece Power'
    : 'Board Power'
}

export function GameStatus({
  turn,
  status,
  countdown,
  isThinking,
}: GameStatusProps) {
  let statusText = ''
  let statusClass = ''

  if (status.isCheckmate) {
    const winner = turn === Color.WHITE ? 'Black' : 'White'
    statusText = `Checkmate! ${winner} wins!`
    statusClass = 'text-red-400'
  } else if (status.isDraw) {
    statusText = `Draw - ${getDrawReason(status)}`
    statusClass = 'text-yellow-400'
  } else if (isThinking) {
    statusText = 'Bot is thinking...'
    statusClass = 'text-blue-400'
  } else if (status.isCheck) {
    statusText = 'Check!'
    statusClass = 'text-orange-400'
  } else {
    statusText = `${turn === Color.WHITE ? 'White' : 'Black'} to move`
    statusClass = 'text-gray-300'
  }

  return (
    <div className="text-center py-2">
      <div className="flex items-center justify-center gap-2">
        <div
          className={`w-4 h-4 rounded-full ${
            turn === Color.WHITE ? 'bg-white' : 'bg-gray-800 border border-gray-600'
          }`}
        />
        <span className={`font-medium ${statusClass}`}>{statusText}</span>
      </div>
      {countdown && !status.isGameOver && (
        <div className="mt-1 text-sm text-amber-400">
          Counting ({getCountTypeLabel(countdown.countType)}): {countdown.count}/{countdown.countTo}
        </div>
      )}
    </div>
  )
}
