import { uciBoard } from "../uciBoard"
import { getOpeningMoves } from "./getOpeningMoves"

export const getBestMoveToOpen = async( actualFEN ) => {

    let bestOpeningMove = null
    let averageBlackWin = 0
    let openingMoves = null

    const data = await getOpeningMoves( actualFEN )

    if (data.black === 0) {
        return null
    }
    else {
        openingMoves = data.moves
        for (let i = 0; i < openingMoves.length; i++) {
            const sum = openingMoves[i].white + openingMoves[i].black + openingMoves[i].draws
            const blackPercentage = openingMoves[i].black / sum
            if (blackPercentage > averageBlackWin) {
                averageBlackWin = blackPercentage
                bestOpeningMove = openingMoves[i].uci
            }
        }

        let startingPos = []
        let endingPos = []
        for (let i = 0; i < uciBoard.length; i++) {
            for (let j = 0; j < uciBoard[i].length; j++) {
                if (uciBoard[i][j] === bestOpeningMove.slice(0, 2)) {
                    startingPos = [i, j]
                }
                else if (uciBoard[i][j] === bestOpeningMove.slice(2, 5)) {
                    endingPos = [i, j]
                }
            }
        }
        
        const bestMoveToOpen = [startingPos, endingPos]
        return bestMoveToOpen
    }
}