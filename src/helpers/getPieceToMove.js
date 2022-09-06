import { minimaxAI } from "../minimaxAI"
import { uciBoard } from "../uciBoard"
import { getBestMoveToOpen } from "./getBestMoveToOpen"

export const getPieceToMove = async( actualFEN, isEndGame, isCheck ) => {

    let pieceToMove
    let pieceToMovePos
    let bestMove

    await getBestMoveToOpen( actualFEN ).then(data => {
        if (data === null) {
            data = minimaxAI.minimaxRoot(3, actualFEN, true, isEndGame)
            if (data === null) {
                if (!isCheck) {
                    setTimeout(() => {
                        alert('Stalemate!')
                    }, 100)
                }
                else {
                    setTimeout(() => {
                        alert('Checkmate!')
                    }, 100)
                }
                return
            }
            bestMove = data.to
            pieceToMovePos = data.from
        }
        else {
            pieceToMovePos = data[0]
            bestMove = data[1]
        }
        for (let i = 0; i < uciBoard.length; i++) {
            for (let j = 0; j < uciBoard[i].length; j++) {
                if (uciBoard[i][j] === pieceToMovePos) {
                    pieceToMovePos = [i, j]
                }
                if (uciBoard[i][j] === bestMove) {
                    bestMove = [i, j]
                }
            }
        }

        pieceToMove = document.querySelector(`[data-row="${pieceToMovePos[0]}"][data-col="${pieceToMovePos[1]}"]`)

    })

    return [pieceToMove, bestMove]
}