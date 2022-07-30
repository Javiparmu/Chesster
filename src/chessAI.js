import { pieces } from './pieces.js'
import { checkIfCastleAndPlaceRook, checkPossibleMoves, getOneSidePossibleMoves, checkIfCheck } from './index.js'
import movesound from './sounds/movesound.mp3'
import checksound from './sounds/checksound.mp3'
import capturesound from './sounds/capturesound.mp3'
 
const moveSound = new Audio(movesound)
const captureSound = new Audio(capturesound)
const checkSound = new Audio(checksound)

let values = 'mg_values'

let numberOfMoves = 1

export const chessAI = {
    // make a move
    makeMove: function(nextMove, pieceToMovePos, board, isDoubleMovePawn, blacksCanCastleRight, blacksCanCastleLeft) {
        const pieceToMoveCell = document.querySelector(`[data-row="${pieceToMovePos[0]}"][data-col="${pieceToMovePos[1]}"]`)
        const pieceToMoveType = board[pieceToMovePos[0]][pieceToMovePos[1]]
        const nextCell = document.querySelector(`[data-row="${nextMove[0]}"][data-col="${nextMove[1]}"]`)
        const nextCellType = board[nextMove[0]][nextMove[1]]
        let isCapture = false
        let canCastleRight = blacksCanCastleRight
        let canCastleLeft = blacksCanCastleLeft
        
        if (nextCellType !== ' ') {
            isCapture = true
        }

        checkIfCastleAndPlaceRook(nextMove, pieceToMovePos, board)

        if (pieceToMoveType === 'k') {
            canCastleRight = false
            canCastleLeft = false
        }

        if (isCapture) {
            captureSound.play()
            nextCell.firstChild.remove()
        }
        else {
            if (pieceToMoveType === 'P') {
                const row = Number(pieceToMoveCell.getAttribute('data-row'))
                if (Number(nextCell.getAttribute('data-row')) === row-2) {
                    isDoubleMovePawn = true
                }
            }
            else if (pieceToMoveType === 'p') {
                const row = Number(pieceToMoveCell.getAttribute('data-row'))
                if (Number(nextCell.getAttribute('data-row')) === row+2) {
                    isDoubleMovePawn = true
                }
            }
            if (isDoubleMovePawn) nextCell.setAttribute('isDoubleMovePawn', 'true')
        }
        if (pieceToMoveCell.getAttribute('isdoublemovepawn') === 'true') pieceToMoveCell.removeAttribute('isdoublemovepawn')
        if (pieceToMoveCell.getAttribute('enpassantcapture') === 'true') pieceToMoveCell.removeAttribute('enpassantcapture') 
        moveSound.play()
        nextCell.setAttribute('data-type', pieceToMoveCell.getAttribute('data-type'))
        nextCell.appendChild(pieceToMoveCell.firstChild)
        pieceToMoveCell.setAttribute('data-type', ' ')
        numberOfMoves++

        const dataArray = [pieceToMoveCell, nextCell, pieceToMoveCell.firstChild, isDoubleMovePawn, canCastleRight, canCastleLeft]

        return dataArray
    }
   , getPieceToMove: function(isCheck, isEndGame) {
        let bestMoveValue = -99999
        let bestMove = null
        let pieceToMove = null
        let bestMovesWithSameValue = []

        if (isEndGame) values = 'eg_values'
        else values = 'mg_values'

        const cells = document.querySelectorAll('.cell')
        const actualBoard = this.getActualBoard()
        const possibleMovesOfWhites = getOneSidePossibleMoves('white', actualBoard, true)

        // Check best moves of every black piece and compare
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i]
            const row = cell.getAttribute('data-row')
            const col = cell.getAttribute('data-col')
            const cellType = cell.getAttribute('data-type')

            if (cellType !== ' ' && cell.firstChild.getAttribute('piece-color') === 'black') {
                let possibleMoves = []
                const pieceInCell = cell.firstChild
                let board = this.getActualBoard()
                let newMoveValue = 0

                const pieceValue = pieces[cellType][values][1] + pieces[cellType][values][0][Number(row) * 8 + Number(col)]
                possibleMovesOfWhites.map(moves => {
                    const whitePieceToMoveRow = moves[0][0]
                    const whitePieceToMoveCol = moves[0][1]
                    const whitePieceToMoveValue = pieces[board[whitePieceToMoveRow][whitePieceToMoveCol]][values][1] + pieces[board[whitePieceToMoveRow][whitePieceToMoveCol]][values][0][Number(row) * 8 + Number(col)]
                    let boardToCheck = []
                    if (moves[1].some(cell => cell[0] === Number(row) && cell[1] === Number(col))) {
                        let nextMoveRow = 0
                        let nextMoveCol = 0
                        for (let i = 0; i < moves[1].length; i++) {
                            const cell = moves[1][i]
                            if (cell[0] ===  Number(row) && cell[1] ===  Number(col)) {
                                nextMoveRow = cell[0]
                                nextMoveCol = cell[1]
                            }
                        }
                        actualBoard.map((row, index) => boardToCheck[index] = [...row])
                        boardToCheck[nextMoveRow][nextMoveCol] = boardToCheck[whitePieceToMoveRow][whitePieceToMoveCol]
                        boardToCheck[whitePieceToMoveRow][whitePieceToMoveCol] = ' '
                        const possibleMovesOfBlacks = getOneSidePossibleMoves('black', boardToCheck, true)
                        possibleMovesOfBlacks.map(moves => {
                            const blackPieceToMoveRow = moves[0][0]
                            const blackPieceToMoveCol = moves[0][1]
                            const blackPieceToMovePosValue = pieces[boardToCheck[blackPieceToMoveRow][blackPieceToMoveCol]][values][0][Number(row) * 8 + Number(col)]
                            if (moves[1].some(cell => cell[0] === Number(row) && cell[1] === Number(col))) {
                                newMoveValue = whitePieceToMoveValue - pieceValue + blackPieceToMovePosValue
                                return
                            }
                            else {
                                newMoveValue = pieceValue
                            }
                        })
                    }
                })

                possibleMoves = checkPossibleMoves(row, col, board)

                let movesToRemove = []
                for (let i = 0; i < possibleMoves.length; i++) {
                    let boardToCheck = this.getActualBoard()
                    const nextMove = possibleMoves[i]
                    const piecePos = [Number(row), Number(col)]
                    boardToCheck[nextMove[0]][nextMove[1]] = boardToCheck[piecePos[0]][piecePos[1]]
                    boardToCheck[piecePos[0]][piecePos[1]] = ' '
                    if(checkIfCheck(nextMove, boardToCheck, 'black')) {
                        movesToRemove.push(nextMove)
                    }
                }

                for (let i = 0; i < movesToRemove.length; i++) {
                    possibleMoves.splice(possibleMoves.indexOf(movesToRemove[i]), 1)
                }
                
                if (isCheck) {
                    checkSound.play()
                }
                
                if (possibleMoves.length > 0) {
                    const newMoveData = this.getBestMove(possibleMoves, [row, col])
                    newMoveValue += newMoveData[1]

                    if (newMoveValue > bestMoveValue) {
                        bestMove = newMoveData[0]
                        pieceToMove = pieceInCell
                        bestMoveValue = newMoveValue
                        bestMovesWithSameValue = []
                        bestMovesWithSameValue.push([bestMove, pieceInCell])
                    }
                    else if (newMoveValue === bestMoveValue) {
                        bestMove = newMoveData[0]
                        bestMovesWithSameValue.push([bestMove, pieceInCell])
                    }
                }
            }
        }
        if (bestMovesWithSameValue.length > 0) {
            const randomIndex = Math.floor(Math.random() * bestMovesWithSameValue.length)
            bestMove = bestMovesWithSameValue[randomIndex][0]
            pieceToMove = bestMovesWithSameValue[randomIndex][1]
        }
        return [pieceToMove, bestMove]
   }, 
   // Check best move of a single piece
   getBestMove: function(moves, pieceToMovePos) {
        let bestMove = null
        let bestMoveValue = -1
        let actualBoard = this.getActualBoard()

        const pieceToMoveRow = Number(pieceToMovePos[0])
        const pieceToMoveCol = Number(pieceToMovePos[1])
        const pieceToMoveType = actualBoard[pieceToMoveRow][pieceToMoveCol]

        for (let i = 0; i < moves.length; i++) {
            const move = moves[i]
            const moveCellType = actualBoard[move[0]][move[1]]

            let boardCopy = []
            actualBoard.map((row, index) => boardCopy[index] = [...row])
            boardCopy[move[0]][move[1]] = boardCopy[pieceToMoveRow][pieceToMoveCol]
            boardCopy[pieceToMoveRow][pieceToMoveCol] = ' '

            const possibleMovesOfWhites = getOneSidePossibleMoves('white', boardCopy, true)
            
            // Check the value of the move (if capture check two more moves)
            const totalMoveValue = Math.min(...possibleMovesOfWhites.map(cellMoves => {
                let totalMoveValue = 0
                const moveRow = Number(move[0])
                const moveCol = Number(move[1])
                const whitePieceToMoveRow = Number(cellMoves[0][0])
                const whitePieceToMoveCol = Number(cellMoves[0][1])
                const pieceToMoveValue = pieces[pieceToMoveType][values][1] + pieces[pieceToMoveType][values][0][moveRow * 8 + moveCol]
                
                let moveValue = 0
                if (moveCellType !== ' ') moveValue = pieces[moveCellType][values][1] + pieces[moveCellType][values][0][moveRow * 8 + moveCol]
                if (cellMoves[1].some(cell => cell[0] === moveRow && cell[1] === moveCol)) {
                    let nextMoveRow = 0
                    let nextMoveCol = 0
                    for (let i = 0; i < cellMoves[1].length; i++) {
                        const cell = cellMoves[1][i]
                        if (cell[0] === moveRow && cell[1] === moveCol) {
                            nextMoveRow = cell[0]
                            nextMoveCol = cell[1]
                        }
                    }
                    let boardToCheck = []
                    boardCopy.map((row, index) => boardToCheck[index] = [...row])
                    
                    boardToCheck[nextMoveRow][nextMoveCol] = boardToCheck[whitePieceToMoveRow][whitePieceToMoveCol]
                    boardToCheck[whitePieceToMoveRow][whitePieceToMoveCol] = ' '

                    let possibleMovesOfBlacks = getOneSidePossibleMoves('black', boardToCheck, true)        
                    possibleMovesOfBlacks.map(move => move.splice(0, 1))
                    if (possibleMovesOfBlacks.some(cell => cell[0].some(cell => cell[0] === moveRow && cell[1] === moveCol))) {
                        const pieceToCaptureAfterCapture = cellMoves[1].find(cell => cell[0] === moveRow && cell[1] === moveCol)
                        const pieceToCaptureAfterCaptureType = boardToCheck[pieceToCaptureAfterCapture[0]][pieceToCaptureAfterCapture[1]]
                        let pieceToCaptureAfterCaptureValue = 0
                        if (pieceToCaptureAfterCaptureType !== ' ') {
                            pieceToCaptureAfterCaptureValue = pieces[pieceToCaptureAfterCaptureType][values][1] + pieces[pieceToCaptureAfterCaptureType][values][0][moveRow * 8 + moveCol]
                        }
                        totalMoveValue = moveValue - pieceToMoveValue + pieceToCaptureAfterCaptureValue
                    }
                    else {
                        totalMoveValue = moveValue - pieceToMoveValue
                    }
                }
                else {
                    totalMoveValue = pieces[pieceToMoveType][values][0][moveRow * 8 + moveCol] + moveValue
                }
                return totalMoveValue
            }))
            
            const valueToBeat = bestMove === null ? -1 : bestMoveValue

            if (totalMoveValue >= valueToBeat) {
                bestMove = move
                bestMoveValue = totalMoveValue
            }
        }
        if (bestMove === null || bestMove === undefined) {
            bestMove = moves[Math.floor(Math.random() * moves.length)]
            bestMoveValue = -1
        }
        return [bestMove, bestMoveValue]
    },
    // Evaluate board for Easy AI
    evaluateBoard: function(board, color) {
        const wp = this.getNumberOfPieces('white', 'P')
        const wn = this.getNumberOfPieces('white', 'N')
        const wb = this.getNumberOfPieces('white', 'B')
        const wr = this.getNumberOfPieces('white', 'R')
        const wq = this.getNumberOfPieces('white', 'Q')
        const bp = this.getNumberOfPieces('black', 'p')
        const bn = this.getNumberOfPieces('black', 'n')
        const bb = this.getNumberOfPieces('black', 'b')
        const br = this.getNumberOfPieces('black', 'r')
        const bq = this.getNumberOfPieces('black', 'q')

        const material = 100 * (wp - bp) + 320 * (wn - bn) + 330 * (wb - bb) + 500 * (wr - br) + 900 * (wq - bq)

        let boardCopy = []
        boardCopy = board.map((row, index) => boardCopy[index] = [...row])

        let pawnsq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'P') {
                    pawnsq += pieces['P'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'p') {
                    pawnsq -= pieces['p'][values][0][i * 8 + j]
                }
            }
        }

        let knightsq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'N') {
                    knightsq += pieces['N'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'n') {
                    knightsq -= pieces['n'][values][0][i * 8 + j]
                }
            }
        }

        let bishopsq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'B') {
                    bishopsq += pieces['B'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'b') {
                    bishopsq -= pieces['b'][values][0][i * 8 + j]
                }
            }
        }

        let rooksq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'R') {
                    rooksq += pieces['R'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'r') {
                    rooksq -= pieces['r'][values][0][i * 8 + j]
                }
            }
        }
        
        let queensq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'Q') {
                    queensq += pieces['Q'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'q') {
                    queensq -= pieces['q'][values][0][i * 8 + j]
                }
            }
        }

        let kingsq = 0
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (boardCopy[i][j] === 'K') {
                    kingsq += pieces['K'][values][0][i * 8 + j]
                }
                else if (boardCopy[i][j] === 'k') {
                    kingsq -= pieces['k'][values][0][i * 8 + j]
                }
            }
        }
        const evaluation = material + pawnsq + knightsq + bishopsq + rooksq + queensq + kingsq
        if (color === 'white') {
            return evaluation
        }
        else {
            return -evaluation
        }
    },
    getNumberOfPieces: function(color, pieceType) {
        let numberOfPieces = 0
        const cells = document.querySelectorAll('.cell')
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i]
            const cellType = cell.getAttribute('data-type')
            if (cellType !== ' ') {
                const cellPiece = cell.firstChild
                if (cellPiece.getAttribute('piece-color') === color && cellType === pieceType) {
                    numberOfPieces++
                }
            }
        }
        return numberOfPieces
    },
    getActualBoard: function() {
        let board = []
        for (let i = 0; i < 8; i++) {
            board[i] = []
            for (let j = 0; j < 8; j++) {
                const cellType = document.querySelector(`[data-row="${i}"][data-col="${j}"]`).getAttribute('data-type')
                if (cellType !== ' ') {
                    board[i][j] = cellType
                }
                else {
                    board[i][j] = ' '
                }
            }
        }
        return board
    },
    getFenFromBoard: function(board, halfClock, cK, cQ, ck, cq) {
        let fen = ''
        for (let i = 0; i < 8; i++) {
            let emptyCells = 0
            for (let j = 0; j < 8; j++) {
                if (board[i][j] === ' ') {
                    emptyCells++
                }
                else {
                    if (emptyCells > 0) {
                        fen += emptyCells
                        emptyCells = 0
                    }
                    fen += board[i][j]
                }
            }
            if (emptyCells > 0) {
                fen += emptyCells
            }
            if (i !== 7) {
                fen += '/'
            }
        }
        let castles = ''
        if (cK) castles += 'K'
        if (cQ) castles += 'Q'
        if (ck) castles += 'k'
        if (cq) castles += 'q'
        if (castles === '') castles = '-'
        
        fen += ' b ' + castles + ' - '+ halfClock + ' ' + numberOfMoves
        return fen
    }
}