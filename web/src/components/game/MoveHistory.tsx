import type { MoveWithSan } from '../../hooks/useGame'

interface MoveHistoryProps {
  moves: MoveWithSan[]
  currentMoveIndex: number
  onMoveClick: (moveIndex: number) => void
}

export function MoveHistory({ moves, currentMoveIndex, onMoveClick }: MoveHistoryProps) {
  if (moves.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-4">
        No moves yet
      </div>
    )
  }

  const movePairs: { number: number; white?: { san: string; index: number }; black?: { san: string; index: number } }[] = []

  for (let i = 0; i < moves.length; i++) {
    const moveNum = Math.floor(i / 2) + 1
    const san = moves[i].san

    if (i % 2 === 0) {
      movePairs.push({ number: moveNum, white: { san, index: i } })
    } else {
      if (movePairs.length > 0) {
        movePairs[movePairs.length - 1].black = { san, index: i }
      }
    }
  }

  return (
    <div className="h-48 overflow-y-auto bg-gray-800 rounded p-2">
      <table className="w-full text-sm">
        <tbody>
          {movePairs.map((pair) => (
            <tr key={pair.number}>
              <td className="text-gray-500 w-8 text-right pr-2">{pair.number}.</td>
              <td className="w-16">
                {pair.white && (
                  <button
                    onClick={() => onMoveClick(pair.white!.index)}
                    className={`px-1 rounded hover:bg-gray-600 ${
                      currentMoveIndex === pair.white.index
                        ? 'bg-amber-600 text-white'
                        : 'text-white'
                    }`}
                  >
                    {pair.white.san}
                  </button>
                )}
              </td>
              <td className="w-16">
                {pair.black && (
                  <button
                    onClick={() => onMoveClick(pair.black!.index)}
                    className={`px-1 rounded hover:bg-gray-600 ${
                      currentMoveIndex === pair.black.index
                        ? 'bg-amber-600 text-white'
                        : 'text-white'
                    }`}
                  >
                    {pair.black.san}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
