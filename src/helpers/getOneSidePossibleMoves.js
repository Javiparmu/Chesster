import { getPossibleMoves } from '../index.js'
import { getCheck } from './getCheck.js'

export const getOneSidePossibleMoves = (color, board, checkForCheck) => {
    let piecesOfColorInBoard = []
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col]
            if (piece !== ' ' && piece === piece?.toUpperCase() && color === 'white') {
                piecesOfColorInBoard.push([row, col])
            }
            else if (piece !== ' ' && piece === piece?.toLowerCase() && color === 'black') {
                piecesOfColorInBoard.push([row, col])
            }
        }
    }
    let possibleMovesFromSide = []
    for (let i = 0; i < piecesOfColorInBoard.length; i++) {
        const piecePos = piecesOfColorInBoard[i]
        const row = Number(piecePos[0])
        const col = Number(piecePos[1])

        let boardCopy = []
        for (let k = 0; k < board.length; k++) {
            boardCopy[k] = []
            for (let l = 0; l < board[k].length; l++) {
                boardCopy[k][l] = board[k][l]
            }
        }
        if (boardCopy[row][col] !== ' ') {
            let possibleMovesToCheck = getPossibleMoves(row, col, boardCopy)

            if (checkForCheck) {
                let movesToRemove = []
                for (let i = 0; i < possibleMovesToCheck.length; i++) {
                    let boardToCheck = []
                    board.map((row, index) => boardToCheck[index] = [...row])

                    const nextMove = possibleMovesToCheck[i]
                    const piecePos = [Number(row), Number(col)]
                    boardToCheck[nextMove[0]][nextMove[1]] = boardToCheck[piecePos[0]][piecePos[1]]
                    boardToCheck[piecePos[0]][piecePos[1]] = ' '
                    if (getCheck(boardToCheck, color)) {
                        movesToRemove.push(nextMove)
                    }
                }

                for (let i = 0; i < movesToRemove.length; i++) {
                    possibleMovesToCheck.splice(possibleMovesToCheck.indexOf(movesToRemove[i]), 1)
                }
            }
            possibleMovesFromSide.push([piecePos, [...possibleMovesToCheck]])

        }
    }
    return possibleMovesFromSide
}