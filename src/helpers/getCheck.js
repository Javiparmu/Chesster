import { getOneSidePossibleMoves } from "./getOneSidePossibleMoves"

export const getCheck = (board, colorToCheck) => {

    let possibleOppositeColorMoves = []
    if (colorToCheck === 'white') {
        possibleOppositeColorMoves = getOneSidePossibleMoves('black', board, false)
        possibleOppositeColorMoves.map(move => move.splice(0, 1))
    }
    else if (colorToCheck === 'black') {
        possibleOppositeColorMoves = getOneSidePossibleMoves('white', board, false)
        possibleOppositeColorMoves.map(move => move.splice(0, 1))
    }

    let king = null
    if (colorToCheck === 'white') king = 'K'
    else king = 'k'

    let kingPos = []
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] === king) {
                kingPos = [i, j]
            }
        }
    }

    let isThereACheck = false
    for (let i = 0; i < possibleOppositeColorMoves.length; i++) {
        if (possibleOppositeColorMoves.some(cell => cell[0].some(cell => cell[0] === kingPos[0] && cell[1] === kingPos[1]))) {
            isThereACheck = true
        }
    }
    if (isThereACheck) {
        return true
    }
    return false
}