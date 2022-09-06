import "./styles/index.scss";
import { pieces } from './pieces.js'
import { chessAI } from './chessAI.js'
import movesound from './sounds/movesound.mp3'
import capturesound from './sounds/capturesound.mp3'
import checksound from './sounds/checksound.mp3'
import castlesound from './sounds/castlesound.mp3'
import { getPieceToMove, getPiecePosition, getActualBoard, getMaterialInBoard, getCheck, getGridFromFen, getOneSidePossibleMoves } from "./helpers";


// Nav functions
const primaryNav = document.querySelector('.primary-navigation')
const navToggle = document.querySelector('.mobile-nav-toggle')

navToggle.addEventListener('click', () => {
    const visibility = primaryNav.getAttribute('data-visible')
    if (visibility === 'false') {
        primaryNav.setAttribute('data-visible', 'true')
        navToggle.setAttribute('aria-expanded', 'true')
    } else {
        primaryNav.setAttribute('data-visible', 'false')
        navToggle.setAttribute('aria-expanded', 'false')
    }

})

// Setting up initial variables
const initialFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w'

let isPieceSelected = false
let selectedPiece = null
let AISelectedPiece = null
let whitesCanCastleRight = true
let whitesCanCastleLeft = true
let blacksCanCastleRight = true
let blacksCanCastleLeft = true
let isCapture = false
let isDoubleMovePawn = false
let turn = 'white'
let isCheck = false
let mode = 'PvsP'
let lastPieceMovedByOpponent = null
let isBetterAI = false
let isEndGame = false

let whiteTimerIntervalId = null
let blackTimerIntervalId = null
let whiteTime = 300000
let blackTime = 300000

let halfClock = 0
let possibleMoves = []
let actualFEN = ''

const moveSound = new Audio(movesound)
const castleSound = new Audio(castlesound)
const captureSound = new Audio(capturesound)
const checkSound = new Audio(checksound)

// Play again button
const btn = document.getElementById("play-button")
btn.addEventListener("click", function () {
    startGame()
}, false);

window.onload = function () {
    startGame()
}

// Timers displays
let whitesDisplay = document.getElementsByClassName('white-timer-text'),
    blacksDisplay = document.getElementsByClassName('black-timer-text'),
    timerLine = document.getElementById('timer-line')

// Game start
const startGame = () => {
    setInitialStateVariables(initialFEN)

    stopTimer(whiteTimerIntervalId)
    stopTimer(blackTimerIntervalId)

    whitesDisplay = [...whitesDisplay]
    whitesDisplay.map((display) => display.innerHTML = '5:00')
    blacksDisplay = [...blacksDisplay]
    blacksDisplay.map((display) => display.innerHTML = '5:00')
    timerLine.classList.add('timer-line')

    turn = initialFEN.split(' ')[1] === 'w' ? 'white' : 'black'
    const lastGrid = document.getElementsByClassName('grid-container')[0]

    if (lastGrid != null) lastGrid.innerHTML = ''

    mode = createModeSelector().value
    let difficulty = 'AI'

    let displays = document.getElementsByClassName('timers')
    let mobileDisplays = document.getElementsByClassName('mobile-timer')
    if (mode === 'PvsAI') {
        difficulty = createDifficultySelector().value
        displays[0].classList.add('disabled')
        mobileDisplays[0].classList.add('disabled')
    }
    else {
        createDifficultySelector().parentElement.innerHTML = ' '
        displays[0].classList.remove('disabled')
        mobileDisplays[0].classList.remove('disabled')
    }

    isBetterAI = difficulty === 'Easy' ? false : true

    const grid = document.createElement('div')
    grid.classList.add('grid')
    lastGrid.appendChild(grid)

    const piecesInBoard = getGridFromFen(initialFEN)

    for (let i = 0; i < 8; i++) {
        const row = document.createElement('div')
        row.classList.add('grid-row')
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement('div')
            const cellType = piecesInBoard[i][j]
            const color = (j + i) % 2 === 0 ? 'white' : 'black'
            cell.classList.add('cell')
            placePiece(cell, cellType, color)
            cell.setAttribute('data-row', i)
            cell.setAttribute('data-col', j)
            cell.setAttribute('data-type', cellType)
            cell.setAttribute('color', color)
            row.appendChild(cell)
        }
        if (grid != null) grid.appendChild(row)
    }
}

const setInitialStateVariables = (initialFEN) => {
    whitesCanCastleLeft = true
    whitesCanCastleRight = true
    blacksCanCastleLeft = true
    blacksCanCastleRight = true
    const grid = getGridFromFen(initialFEN)
    if (grid[7][0] !== 'R') whitesCanCastleLeft = false
    if (grid[7][7] !== 'R') whitesCanCastleRight = false
    if (grid[0][0] !== 'r') blacksCanCastleLeft = false
    if (grid[0][7] !== 'r') blacksCanCastleRight = false

    isPieceSelected = false
    selectedPiece = null
    AISelectedPiece = null
    isCapture = false
    isDoubleMovePawn = false
    turn = 'white'
    isCheck = false
    lastPieceMovedByOpponent = null
    isEndGame = false

    whiteTime = 300000
    blackTime = 300000
}

const createFEN = () => {
    const grid = document.getElementsByClassName('grid-container')[0]
    const rows = grid.getElementsByClassName('grid-row')
    let fen = ''
    for (let i = 0; i < 8; i++) {
        let row = ''
        let spaceCounter = 0
        const cells = rows[i].getElementsByClassName('cell')
        for (let j = 0; j < 8; j++) {
            const cell = cells[j]
            if (cell.getAttribute('data-type') === ' ') {
                spaceCounter++
            }
            else {
                if (spaceCounter != 0) {
                    row += String(spaceCounter)
                    spaceCounter = 0
                }
                row += cell.getAttribute('data-type')
            }
        }
        if (spaceCounter != 0) row += String(spaceCounter)
        fen += row + '/'
    }
    fen = fen.slice(0, -1)
    fen += ' ' + turn[0]
    return fen
}

// Placing pieces on board
const placePiece = (cell, cellType) => {
    const piece = document.createElement('img')
    if (cellType === ' ') {
        return
    }
    else if (cellType === cellType.toUpperCase()) {
        piece.src = pieces[`${cellType}`]['image']
        piece.addEventListener('click', handlePieceClick)
        piece.setAttribute('piece-color', 'white')
    }
    else {
        piece.src = pieces[`${cellType}`]['image']
        piece.addEventListener('click', handlePieceClick)
        piece.setAttribute('piece-color', 'black')
    }
    cell.appendChild(piece)
}

// Timers
function startTimer(duration, display, color) {
    let timer = Date.now(), minutes, seconds

    if (color === 'white') {
        whiteTimerIntervalId = setInterval(function () {
            let elapsedTime = Date.now() - timer
            whiteTime = duration - elapsedTime

            minutes = Math.floor(whiteTime / (1000 * 60))
            seconds = Math.floor(whiteTime % (1000 * 60) / 1000)

            if (seconds === 0) {
                if (minutes === 0) {
                    stopTimer(whiteTimerIntervalId)
                    alert('Black wins!')
                }
                else {
                    minutes--
                    seconds = 59
                }
            }

            if (seconds < 10) seconds = '0' + seconds

            display.map((display) => display.innerHTML = `${minutes}:${seconds}`)
        }, 100)
    }
    else {
        blackTimerIntervalId = setInterval(function () {
            let elapsedTime = Date.now() - timer
            blackTime = duration - elapsedTime

            minutes = Math.floor(blackTime / (1000 * 60))
            seconds = Math.floor(blackTime % (1000 * 60) / 1000)

            if (seconds === 0) {
                if (minutes === 0) {
                    stopTimer(blackTimerIntervalId)
                    alert('White wins!')
                }
                else {
                    minutes--
                    seconds = 59
                }
            }

            if (seconds < 10) seconds = '0' + seconds

            display.map((display) => display.innerHTML = `${minutes}:${seconds}`)
        }, 100)
    }
}

function stopTimer(timerIntervalId) {
    clearInterval(timerIntervalId)
}

// Piece click event
const handlePieceClick = (e) => {
    if (isPieceSelected) {
        if (selectedPiece.getAttribute('piece-color') === e.target.getAttribute('piece-color')) {
            removeHighlightCells()
        } else {
            // Capture piece
            const nextMove = [Number(e.target.parentElement.getAttribute('data-row')), Number(e.target.parentElement.getAttribute('data-col'))]
            const row = Number(selectedPiece.parentElement.getAttribute('data-row'))
            const col = Number(selectedPiece.parentElement.getAttribute('data-col'))
            let actualBoard = getActualBoard()
            let possibleNextMoves = getPossibleMoves(row, col, actualBoard)
            possibleMoves = [...possibleNextMoves]

            let movesToRemove = []
            for (let i = 0; i < possibleNextMoves.length; i++) {
                let boardToCheck = getActualBoard()
                const nextMove = possibleNextMoves[i]
                const piecePos = [Number(row), Number(col)]
                boardToCheck[nextMove[0]][nextMove[1]] = boardToCheck[piecePos[0]][piecePos[1]]
                boardToCheck[piecePos[0]][piecePos[1]] = ' '
                if (getCheck(boardToCheck, 'white')) {
                    movesToRemove.push(nextMove)
                }
            }

            for (let i = 0; i < movesToRemove.length; i++) {
                possibleNextMoves.splice(possibleNextMoves.indexOf(movesToRemove[i]), 1)
            }

            const nextMoveIncluded = possibleNextMoves.some(move => move[0] === nextMove[0] && move[1] === nextMove[1])
            if (nextMoveIncluded) {
                isCapture = true
                captureSound.play()

                removeHighlightCells()

                const pieceMoved = selectedPiece.cloneNode(true)
                const nextCell = e.target.parentElement
                pieceMoved.addEventListener('click', handlePieceClick)
                e.target.parentElement.appendChild(pieceMoved)
                e.target.parentElement.setAttribute('data-type', selectedPiece.parentElement.getAttribute('data-type'))
                e.target.parentElement.removeChild(e.target)
                selectedPiece.parentElement.setAttribute('data-type', ' ')
                selectedPiece.parentElement.removeChild(selectedPiece)
                selectedPiece = null
                isPieceSelected = false

                checkIfPromotion(e.target.parentElement, pieceMoved.parentElement)

                // Start and stop timers
                if (turn === 'white') {
                    stopTimer(whiteTimerIntervalId)
                    if (mode === 'PvsP') startTimer(blackTime, blacksDisplay, 'black')
                }
                else {
                    stopTimer(blackTimerIntervalId)
                    startTimer(whiteTime, whitesDisplay, 'white')
                }

                halfClock = 0

                lastPieceMovedByOpponent = nextCell.firstChild
                changeTurn()

                // AI moves
                if (mode === 'PvsAI' && turn === 'black') {
                    let bestMove = null
                    let pieceToMove = null
                    if (!isBetterAI) {
                        actualBoard = getActualBoard()
                        const bestMoveData = chessAI.getPieceToMove(isCheck, isEndGame)
                        pieceToMove = bestMoveData[0]
                        bestMove = bestMoveData[1]
                        AISelectedPiece = pieceToMove

                        if (pieceToMove === null) {
                            showCheckMessage()
                            return
                        }

                        makeMove(pieceToMove, bestMove)
                        startTimer(whiteTime, whitesDisplay, 'white')
                        changeTurn()
                    }
                    else {
                        const boardToCheck = getActualBoard()
                        let actualFEN = chessAI.getFenFromBoard(boardToCheck, halfClock, whitesCanCastleRight, whitesCanCastleLeft, blacksCanCastleRight, blacksCanCastleLeft)

                        // Fetch for opening moves and get piece to move
                        getPieceToMove(actualFEN, isEndGame, isCheck).then(pieceToMoveData => {
                            const bestMove = pieceToMoveData[1]
                            const pieceToMove = pieceToMoveData[0].firstChild

                            makeMove(pieceToMove, bestMove)
                            changeTurn()
                        })
                    }
                }
                return
            }
            removeHighlightCells()
        }
    }

    isPieceSelected = true
    selectedPiece = e.target
    const cell = e.target.parentElement
    const row = cell.getAttribute('data-row')
    const col = cell.getAttribute('data-col')
    const type = cell.getAttribute('data-type')
    const color = type === type.toUpperCase() ? 'white' : 'black'

    // Highlight possible moves if it's your turn 
    if (color === turn) {
        const actualBoard = getActualBoard()
        let pieceThatCheckedPos = []
        if (lastPieceMovedByOpponent !== null) pieceThatCheckedPos = [Number(lastPieceMovedByOpponent.parentElement.getAttribute('data-row')), Number(lastPieceMovedByOpponent.parentElement.getAttribute('data-col'))]
        let possibleMovesOfPiece = []
        possibleMovesOfPiece = getPossibleMoves(row, col, actualBoard)
        possibleMoves = [...possibleMovesOfPiece]

        let movesToRemove = []
        for (let i = 0; i < possibleMovesOfPiece.length; i++) {
            let boardToCheck = getActualBoard()
            const nextMove = possibleMovesOfPiece[i]
            const piecePos = [Number(row), Number(col)]
            boardToCheck[nextMove[0]][nextMove[1]] = boardToCheck[piecePos[0]][piecePos[1]]
            boardToCheck[piecePos[0]][piecePos[1]] = ' '
            if (getCheck(boardToCheck, 'white')) {
                movesToRemove.push(nextMove)
            }
        }

        for (let i = 0; i < movesToRemove.length; i++) {
            possibleMovesOfPiece.splice(possibleMovesOfPiece.indexOf(movesToRemove[i]), 1)
        }

        if (possibleMovesOfPiece.length === 0) {
            showCheckMessage()
            return
        }

        if (possibleMovesOfPiece != undefined && possibleMovesOfPiece.length > 0) {
            for (let i = 0; i < possibleMovesOfPiece.length; i++) {
                if (mode === 'PvsP' || (mode === 'PvsAI' && turn === 'white')) {
                    const cell = document.getElementsByClassName('cell')[possibleMovesOfPiece[i][0] * 8 + possibleMovesOfPiece[i][1]]
                    cell.classList.add('highlight')
                    cell.addEventListener('click', handleSquareClick)
                }
            }
        }
        possibleMoves = [...possibleMovesOfPiece]
    }
    else possibleMoves = []
}

// Square click event
const handleSquareClick = (e) => {
    moveSound.play()
    isPieceSelected = false
    isCapture = false
    if (mode === 'PvsAI' && turn === 'black') selectedPiece = AISelectedPiece

    removeHighlightCells()

    const nextCell = e.target
    const nextMove = [nextCell.getAttribute('data-row'), nextCell.getAttribute('data-col')]
    const selectedPiecePos = [selectedPiece.parentElement.getAttribute('data-row'), selectedPiece.parentElement.getAttribute('data-col')]
    let actualBoard = getActualBoard()
    checkIfCastleAndPlaceRook(nextMove, selectedPiecePos, actualBoard)

    const selectedPieceType = selectedPiece.parentElement.getAttribute('data-type')
    const selectedPieceRow = selectedPiecePos[0]
    const selectedPieceCol = selectedPiecePos[1]
    if (selectedPieceType === 'K' || (selectedPieceType === 'R' && selectedPieceRow === '7' && selectedPieceCol === '0')) {
        whitesCanCastleLeft = false
    }
    if (selectedPieceType === 'K' || (selectedPieceType === 'R' && selectedPieceRow === '7' && selectedPieceCol === '7')) {
        whitesCanCastleRight = false
    }
    if (selectedPieceType === 'k' || (selectedPieceType === 'r' && selectedPieceRow === '0' && selectedPieceCol === '0')) {
        blacksCanCastleLeft = false
    }
    if (selectedPieceType === 'k' || (selectedPieceType === 'r' && selectedPieceRow === '0' && selectedPieceCol === '7')) {
        blacksCanCastleRight = false
    }

    halfClock++
    const cell = e.target
    if (selectedPiece.parentElement.getAttribute('data-type') === 'P') {
        halfClock = 0
        const row = Number(selectedPiece.parentElement.getAttribute('data-row'))
        if (Number(cell.getAttribute('data-row')) === row - 2) {
            isDoubleMovePawn = true
        }
    }
    else if (selectedPiece.parentElement.getAttribute('data-type') === 'p') {
        halfClock = 0
        const row = Number(selectedPiece.parentElement.getAttribute('data-row'))
        if (Number(cell.getAttribute('data-row')) === row + 2) {
            isDoubleMovePawn = true
        }
    }

    const lastCell = selectedPiece.parentElement.cloneNode(true)
    const pieceImg = selectedPiece.src
    const pieceColor = selectedPiece.getAttribute('piece-color')
    cell.setAttribute('data-type', selectedPiece.parentElement.getAttribute('data-type'))

    if (isDoubleMovePawn) cell.setAttribute('isDoubleMovePawn', 'true')
    isDoubleMovePawn = false

    selectedPiece.parentElement.setAttribute('data-type', ' ')
    if (selectedPiece.parentElement.getAttribute('isdoublemovepawn') === 'true') selectedPiece.parentElement.removeAttribute('isdoublemovepawn')
    if (selectedPiece.parentElement.getAttribute('enpassantcapture') === 'true') selectedPiece.parentElement.removeAttribute('enpassantcapture')
    selectedPiece.parentElement.removeChild(selectedPiece)

    const pieceElement = document.createElement('img')
    pieceElement.src = pieceImg
    pieceElement.addEventListener('click', handlePieceClick)
    pieceElement.setAttribute('piece-color', pieceColor)
    cell.appendChild(pieceElement)

    const nextMoveCell = e.target
    checkIfPromotion(nextMoveCell, lastCell)
    checkIfPawnCaptureEnPassant(nextMoveCell)

    if (turn === 'white') {
        stopTimer(whiteTimerIntervalId)
        if (mode === 'PvsP') startTimer(blackTime, blacksDisplay, 'black')
    }
    else {
        stopTimer(blackTimerIntervalId)
        startTimer(whiteTime, whitesDisplay, 'white')
    }

    lastPieceMovedByOpponent = e.target.firstChild

    changeTurn()

    // AI moves
    if (mode === 'PvsAI' && turn === 'black') {
        if (!isBetterAI) {
            actualBoard = getActualBoard()
            const bestMoveData = chessAI.getPieceToMove(isCheck, isEndGame)
            const pieceToMove = bestMoveData[0]
            const bestMove = bestMoveData[1]
            AISelectedPiece = pieceToMove

            if (pieceToMove === null) {
                showCheckMessage()
                return
            }

            makeMove(pieceToMove, bestMove)
            changeTurn()
        }
        else {
            const boardToCheck = getActualBoard()
            let actualFEN = chessAI.getFenFromBoard(boardToCheck, halfClock, whitesCanCastleRight, whitesCanCastleLeft, blacksCanCastleRight, blacksCanCastleLeft)

            // Fetch for opening moves
            getPieceToMove(actualFEN, isEndGame, isCheck).then(pieceToMoveData => {
                const bestMove = pieceToMoveData[1]
                const pieceToMove = pieceToMoveData[0].firstChild

                makeMove(pieceToMove, bestMove)
                changeTurn()
            })
        }
    }
}

const isValidMove = (pieceToMovePos, nextMove, board) => {
    const pieceToMoveType = board[Number(pieceToMovePos[0])][Number(pieceToMovePos[1])]
    const pieceToMoveColor = pieceToMoveType.toUpperCase() === pieceToMoveType ? 'white' : 'black'
    if (nextMove[0] > 7 || nextMove[0] < 0 || nextMove[1] > 7 || nextMove[1] < 0) return false
    const pieceType = board[Number(nextMove[0])][Number(nextMove[1])]

    const color = pieceType === pieceType.toUpperCase() ? 'white' : 'black'
    if (pieceType === ' ') return true
    if (nextMove === pieceToMovePos) return true
    if (color === pieceToMoveColor) return false
    if (pieceToMoveType.toUpperCase() !== 'P') return 'capture'

    else return false
}

// Mode selector
const createModeSelector = () => {
    const modeSelector = document.getElementsByClassName('mode-selector')[0]
    if (modeSelector) return modeSelector

    const modeSelect = document.createElement('select')
    modeSelect.classList.add('mode-selector')

    const modeLabel = document.createElement('label')
    modeLabel.innerHTML = 'Mode: '
    modeLabel.id = 'mode-msg'

    const pvp = document.createElement('option')
    pvp.value = 'PvsP'
    pvp.selected = true
    pvp.innerHTML = 'PvsP'

    const pvai = document.createElement('option')
    pvai.value = 'PvsAI'
    pvai.innerHTML = 'PvsAI'

    modeSelect.appendChild(pvp)
    modeSelect.appendChild(pvai)
    modeSelect.addEventListener('change', startGame)
    const modeDiv = document.getElementsByClassName('mode')[0]
    modeDiv.appendChild(modeLabel)
    modeDiv.appendChild(modeSelect)

    return modeSelect
}

// Difficulty selector
const createDifficultySelector = () => {
    const diffSelector = document.getElementsByClassName('difficulty-selector')[0]
    if (diffSelector) return diffSelector

    const diffSelect = document.createElement('select')
    diffSelect.classList.add('difficulty-selector')

    const diffLabel = document.createElement('label')
    diffLabel.innerHTML = 'Difficulty: '
    diffLabel.id = 'diff-msg'

    const Easy = document.createElement('option')
    Easy.value = 'Easy'
    Easy.selected = true
    Easy.innerHTML = 'Easy'

    const Normal = document.createElement('option')
    Normal.value = 'Normal'
    Normal.innerHTML = 'Normal'

    diffSelect.appendChild(Easy)
    diffSelect.appendChild(Normal)
    diffSelect.addEventListener('change', startGame)
    const diffDiv = document.getElementsByClassName('difficulty')[0]
    diffDiv.appendChild(diffLabel)
    diffDiv.appendChild(diffSelect)

    return diffSelect
}

// Place rook when castle
export const checkIfCastleAndPlaceRook = (nextMove, pieceToMovePos, board) => {
    const pieceToMoveType = board[Number(pieceToMovePos[0])][Number(pieceToMovePos[1])]
    const nextCellRow = Number(nextMove[0])
    const nextCellCol = Number(nextMove[1])
    const nextCellType = board[nextCellRow][nextCellCol]

    if (pieceToMoveType === 'K' && nextCellType === ' ') {
        let whiteRook = null
        let whiteRookCastleSquare = null
        let rookMoved = null
        if (whitesCanCastleLeft && nextCellRow === 7 && nextCellCol === 2) {
            whiteRook = document.querySelector('[data-row="7"][data-col="0"]').firstChild
            whiteRookCastleSquare = document.querySelector('[data-row="7"][data-col="3"]')
            rookMoved = whiteRook.cloneNode(true)
        }
        else if (whitesCanCastleRight && nextCellRow === 7 && nextCellCol === 6) {
            whiteRook = document.querySelector('[data-row="7"][data-col="7"]').firstChild
            whiteRookCastleSquare = document.querySelector('[data-row="7"][data-col="5"]')
            rookMoved = whiteRook.cloneNode(true)
        }
        if (whiteRook != null && whiteRookCastleSquare != null && rookMoved != null) {
            rookMoved.addEventListener('click', handlePieceClick)
            whiteRookCastleSquare.appendChild(rookMoved)
            whiteRookCastleSquare.setAttribute('data-type', 'R')
            whiteRook.parentElement.setAttribute('data-type', ' ')
            whiteRook.parentElement.removeChild(whiteRook)
            castleSound.play()
        }
    }
    else if (pieceToMoveType === 'k' && nextCellType === ' ') {
        let blackRook = null
        let blackRookCastleSquare = null
        let rookMoved = null
        if (blacksCanCastleRight && nextCellRow === 0 && nextCellCol === 6) {
            blackRook = document.querySelector('[data-row="0"][data-col="7"]').firstChild
            blackRookCastleSquare = document.querySelector('[data-row="0"][data-col="5"]')
            rookMoved = blackRook.cloneNode(true)
        }
        else if (blacksCanCastleLeft && nextCellRow === 0 && nextCellCol === 2) {
            blackRook = document.querySelector('[data-row="0"][data-col="0"]').firstChild
            blackRookCastleSquare = document.querySelector('[data-row="0"][data-col="3"]')
            rookMoved = blackRook.cloneNode(true)
        }
        if (blackRook != null && blackRookCastleSquare != null && rookMoved != null) {
            rookMoved.addEventListener('click', handlePieceClick)
            blackRookCastleSquare.appendChild(rookMoved)
            blackRookCastleSquare.setAttribute('data-type', 'r')
            blackRook.parentElement.setAttribute('data-type', ' ')
            blackRook.parentElement.removeChild(blackRook)
            castleSound.play()
        }
    }
}

// Check if pawn can capture
const checkIfPawnCapture = (pos, board) => {
    const row = Number(pos[0])
    const col = Number(pos[1])
    let possibleCaptures = []
    if (board[row][col] === 'P') {
        if (row - 1 < 0 || col + 1 > 7 || col - 1 < 0) return false
        const pieceToCapture1 = board[row - 1][col + 1]
        const pieceToCapture2 = board[row - 1][col - 1]
        const pawnEnPassant1 = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`)
        const pawnEnPassant2 = document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`)

        if (pieceToCapture1 !== ' ' && pieceToCapture1 === pieceToCapture1?.toLowerCase()) {
            possibleCaptures.push([row - 1, col + 1])
        }

        if (pieceToCapture2 !== ' ' && pieceToCapture2 === pieceToCapture2?.toLowerCase()) {
            possibleCaptures.push([row - 1, col - 1])
        }

        if (pawnEnPassant1?.getAttribute('isdoublemovepawn') === 'true' && pawnEnPassant1?.getAttribute('data-type') === 'p') {
            const enPassantSquare = document.querySelector(`[data-row="${row - 1}"][data-col="${col + 1}"]`)
            enPassantSquare.setAttribute('enpassantcapture', 'true')
            possibleMoves.push(enPassantSquare)
        }

        if (pawnEnPassant2?.getAttribute('isdoublemovepawn') === 'true' && pawnEnPassant2?.getAttribute('data-type') === 'p') {
            const enPassantSquare = document.querySelector(`[data-row="${row - 1}"][data-col="${col - 1}"]`)
            enPassantSquare.setAttribute('enpassantcapture', 'true')
            possibleMoves.push(enPassantSquare)
        }
    }
    else if (board[row][col] === 'p') {
        if (row + 1 > 7 || col + 1 > 7 || col - 1 < 0) return false
        const pieceToCapture1 = board[row + 1][col + 1]
        const pieceToCapture2 = board[row + 1][col - 1]
        const pawnEnPassant1 = document.querySelector(`[data-row="${row}"][data-col="${col + 1}"]`)
        const pawnEnPassant2 = document.querySelector(`[data-row="${row}"][data-col="${col - 1}"]`)

        if (pieceToCapture1 !== ' ' && pieceToCapture1 === pieceToCapture1?.toUpperCase()) {
            possibleCaptures.push([row + 1, col + 1])
        }

        if (pieceToCapture2 !== ' ' && pieceToCapture2 === pieceToCapture2?.toUpperCase()) {
            possibleCaptures.push([row + 1, col - 1])
        }

        if (pawnEnPassant1?.getAttribute('isdoublemovepawn') === 'true' && pawnEnPassant1?.getAttribute('data-type') === 'P') {
            const enPassantSquare = document.querySelector(`[data-row="${row + 1}"][data-col="${col + 1}"]`)
            enPassantSquare.setAttribute('enpassantcapture', 'true')
            possibleMoves.push(enPassantSquare)
        }

        if (pawnEnPassant2?.getAttribute('isdoublemovepawn') === 'true' && pawnEnPassant2?.getAttribute('data-type') === 'P') {
            const enPassantSquare = document.querySelector(`[data-row="${row + 1}"][data-col="${col - 1}"]`)
            enPassantSquare.setAttribute('enpassantcapture', 'true')
            possibleMoves.push(enPassantSquare)
        }
    }
    if (possibleCaptures.length > 0) return possibleCaptures
    return false
}

const checkIfPawnCaptureEnPassant = (nextMoveCell) => {
    const row = Number(nextMoveCell.getAttribute('data-row'))
    const col = Number(nextMoveCell.getAttribute('data-col'))
    if (nextMoveCell?.getAttribute('enpassantcapture') === 'true' && nextMoveCell?.getAttribute('data-type') === 'P') {
        captureSound.play()
        const pieceToCapture = document.querySelector(`[data-row="${row + 1}"][data-col="${col}"]`)
        pieceToCapture.removeChild(pieceToCapture.firstChild)
    }
    if (nextMoveCell?.getAttribute('enpassantcapture') === 'true' && nextMoveCell?.getAttribute('data-type') === 'p') {
        captureSound.play()
        const pieceToCapture = document.querySelector(`[data-row="${row - 1}"][data-col="${col}"]`)
        pieceToCapture.removeChild(pieceToCapture.firstChild)
    }
}

// Add double move pawn if possible
const checkIfPawnsInitialMove = (pos, board) => {
    if (board[pos[0]][pos[1]].toUpperCase() === 'P') {
        const row = pos[0]
        const col = pos[1]
        const pieceColor = board[row][col] === board[row][col].toLowerCase() ? 'black' : 'white'
        if (pieceColor === 'black' && row !== 1) {
            return
        }
        else if (pieceColor === 'white' && row !== 6) {
            return
        }
        const doubleMoveSquare = pieceColor === 'black' ? board[row + 2][col] : board[row - 2][col]
        const isPieceBetweenWhiteMove = board[row - 1][col] !== ' '
        const isPieceBetweenBlackMove = board[row + 1][col] !== ' '

        if (board[row][col] === 'P' && doubleMoveSquare === ' ' && !isPieceBetweenWhiteMove) {
            return true
        }
        else if (board[row][col] === 'p' && doubleMoveSquare === ' ' && !isPieceBetweenBlackMove) {
            return true
        }
        return false
    }
    else return false
}

// Queen promotion
const checkIfPromotion = (nextMoveCell, lastCell) => {
    const squareToCheck = isCapture ? lastCell : nextMoveCell.cloneNode(true)
    const targetSquare = isCapture ? lastCell : nextMoveCell

    const row = isCapture ? Number(lastCell.getAttribute('data-row')) : Number(nextMoveCell.getAttribute('data-row'))

    if (squareToCheck?.getAttribute('data-type') === 'P' && row === 0) {
        targetSquare.removeChild(targetSquare.firstChild)
        const promotedPiece = document.createElement('img')
        promotedPiece.src = pieces['Q']['image']
        promotedPiece.setAttribute('piece-color', 'white')
        promotedPiece.addEventListener('click', handlePieceClick)
        targetSquare.setAttribute('data-type', 'Q')
        targetSquare.appendChild(promotedPiece)
    }
    else if (targetSquare?.getAttribute('data-type') === 'p' && row === 7) {
        targetSquare.removeChild(targetSquare.firstChild)
        const promotedPiece = document.createElement('img')
        promotedPiece.src = pieces['q']['image']
        promotedPiece.setAttribute('piece-color', 'black')
        promotedPiece.addEventListener('click', handlePieceClick)
        targetSquare.setAttribute('data-type', 'q')
        targetSquare.appendChild(promotedPiece)
    }
}

// get possible moves for a piece
export const getPossibleMoves = (row, col, board) => {
    let possibleNextMoves = []

    const pieceType = board[Number(row)][Number(col)]
    const moves = pieces[pieceType]['moves']

    if (whitesCanCastleLeft && pieceType === 'K' && row === '7' && col === '4') {
        const castleSquare1 = board[7][1]
        const castleSquare2 = board[7][2]
        const castleSquare3 = board[7][3]

        if (castleSquare1 === ' ' && castleSquare2 === ' ' && castleSquare3 === ' ') {
            possibleNextMoves.push([7, 2])
        }
    }
    if (whitesCanCastleRight && pieceType === 'K' && row === '7' && col === '4') {
        const castleSquare1 = board[7][5]
        const castleSquare2 = board[7][6]

        if (castleSquare1 === ' ' && castleSquare2 === ' ') {
            possibleNextMoves.push([7, 6])
        }
    }
    if (blacksCanCastleLeft && pieceType === 'k' && row === '0' && col === '4') {
        const castleSquare1 = board[0][1]
        const castleSquare2 = board[0][2]
        const castleSquare3 = board[0][3]

        if (castleSquare1 === ' ' && castleSquare2 === ' ' && castleSquare3 === ' ') {
            possibleNextMoves.push([0, 2])
        }
    }
    if (blacksCanCastleRight && pieceType === 'k' && row === '0' && col === '4') {
        const castleSquare1 = board[0][5]
        const castleSquare2 = board[0][6]

        if (castleSquare1 === ' ' && castleSquare2 === ' ') {
            possibleNextMoves.push([0, 6])
        }
    }

    if (pieceType.toUpperCase() === 'P') {
        const position = [Number(row), Number(col)]
        const pawnCaptures = checkIfPawnCapture(position, board)
        if (pawnCaptures !== false) {
            for (let i = 0; i < pawnCaptures.length; i++) {
                possibleNextMoves.push(pawnCaptures[i])
            }
        }
        if (checkIfPawnsInitialMove(position, board)) {
            if (pieceType === 'p') {
                possibleNextMoves.push([Number(row) + 2, Number(col)])
            }
            else {
                possibleNextMoves.push([Number(row) - 2, Number(col)])
            }
        }
    }

    for (let i = 0; i < moves.length; i++) {
        let newRows = []
        let newCols = []
        if (pieceType.toUpperCase() === 'P' || pieceType.toUpperCase() === 'N' || pieceType.toUpperCase() === 'K') {
            newRows.push(Number(row) + moves[i][0])
            newCols.push(Number(col) + moves[i][1])
        }
        else {
            for (let j = 0; j < 7; j++) {
                if (moves[i][0] > 0) {
                    newRows.push(Number(row) + moves[i][0] + j)
                }
                else if (moves[i][0] < 0) {
                    newRows.push(Number(row) + moves[i][0] - j)
                }
                else if (moves[i][0] === 0) {
                    newRows.push(Number(row))
                }
                if (moves[i][1] > 0) {
                    newCols.push(Number(col) + moves[i][1] + j)
                }
                else if (moves[i][1] < 0) {
                    newCols.push(Number(col) + moves[i][1] - j)
                }
                else if (moves[i][1] === 0) {
                    newCols.push(Number(col))
                }
            }
        }

        let nextMove = []
        for (let j = 0; j < newRows.length; j++) {
            nextMove = [newRows[j], newCols[j]]
            if (isValidMove([Number(row), Number(col)], nextMove, board) === false) {
                newRows.splice(j, newRows.length - j)
                newCols.splice(j, newCols.length - j)
                break
            }
            else if (isValidMove([Number(row), Number(col)], nextMove, board) === 'capture') {
                newRows.splice(j + 1, newRows.length - j)
            }
        }
        if (newRows.length > 0) {
            for (let j = 0; j < newRows.length; j++) {
                nextMove = [newRows[j], newCols[j]]
                const newCell = board[newRows[j]][newCols[j]]
                const newCellColor = newCell.toUpperCase() === newCell ? 'white' : 'black'
                const pieceToMoveColor = pieceType.toUpperCase() === pieceType ? 'white' : 'black'
                if (newCell === ' ') {
                    possibleNextMoves.push(nextMove)
                }
                else if (newCellColor !== pieceToMoveColor) {
                    possibleNextMoves.push(nextMove)
                }
            }
        }
    }

    possibleMoves = [...possibleNextMoves]
    return possibleNextMoves
}

const showCheckMessage = () => {
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
}

const makeMove = (pieceToMove, bestMove) => {

    let actualBoard = getActualBoard()

    if (pieceToMove.parentElement.getAttribute('data-type').toUpperCase() === 'P' || actualBoard[bestMove[0]][bestMove[1]] !== ' ') {
        halfClock = 0
    }
    else halfClock++

    const pieceToMovePos = [Number(pieceToMove.parentElement.getAttribute('data-row')), Number(pieceToMove.parentElement.getAttribute('data-col'))]
    const dataArray = chessAI.makeMove(bestMove, pieceToMovePos, actualBoard, isDoubleMovePawn, blacksCanCastleRight, blacksCanCastleLeft)

    const materialLeft = getMaterialInBoard()
    if (materialLeft[0] < 1400 && materialLeft[1] < 1400) {
        isEndGame = true
    }

    const lastAICell = dataArray[0]
    const nextMoveAICell = dataArray[1]
    lastPieceMovedByOpponent = dataArray[2]

    isDoubleMovePawn = dataArray[3]

    blacksCanCastleRight = dataArray[4]
    blacksCanCastleLeft = dataArray[5]

    checkIfPromotion(nextMoveAICell, lastAICell)
    checkIfPawnCaptureEnPassant(nextMoveAICell)

    actualBoard = getActualBoard()
    const possibleWhiteMoves = getOneSidePossibleMoves('white', actualBoard, true)
    if (possibleWhiteMoves.length === 0) {
        showCheckMessage()
        return
    }
}

const changeTurn = () => {
    let actualBoard = getActualBoard()

    turn = turn === 'white' ? 'black' : 'white'

    actualFEN = createFEN()
    isCheck = getCheck(actualBoard, 'white')
    if (isCheck) checkSound.play()
}

const removeHighlightCells = () => {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const cell = document.getElementsByClassName('cell')[i * 8 + j]
            cell.classList.remove('highlight')
            cell.removeEventListener('click', handleSquareClick)
        }
    }
}