import { Chess } from 'chess.js'
import { pieces } from './pieces.js'

let game = null

let values = 'mg_values'

export const minimaxAI = {
    minimaxRoot: function(depth, fen, isMaximisingPlayer, isEndGame) {
        game = new Chess(fen)
        let newGameMoves = game.moves()
        let bestMove = -9999
        let bestMoveFound = null

        if (isEndGame) values = 'eg_values'
        else values = 'mg_values'
    
        for(let i = 0; i < newGameMoves.length; i++) {
            let newGameMove = newGameMoves[i]
            game.move(newGameMove)
            let value = this.minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer)
            game.undo()
            if(value >= bestMove) {
                bestMove = value
                bestMoveFound = newGameMove;
            }
        }

        return game.move(bestMoveFound, {sloppy: true})
    },
    minimax: function (depth, game, alpha, beta, isMaximisingPlayer) {
        if (depth === 0) {
            return -this.betterEvaluateBoard(game.board());
        }
    
        let newGameMoves = game.moves();
    
        if (isMaximisingPlayer) {
            let bestMove = -9999;
            for (let i = 0; i < newGameMoves.length; i++) {
                game.move(newGameMoves[i]);
                bestMove = Math.max(bestMove, this.minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
                game.undo();
                alpha = Math.max(alpha, bestMove);
                if (beta <= alpha) {
                    return bestMove;
                }
            }
            return bestMove;
        } else {
            let bestMove = 9999;
            for (let i = 0; i < newGameMoves.length; i++) {
                game.move(newGameMoves[i]);
                bestMove = Math.min(bestMove, this.minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
                game.undo();
                beta = Math.min(beta, bestMove);
                if (beta <= alpha) {
                    return bestMove;
                }
            }
            return bestMove;
        }
    },
    betterEvaluateBoard: function() {
        let wp = 0
        let bp = 0
        let wn = 0
        let bn = 0
        let wb = 0
        let bb = 0
        let wr = 0
        let br = 0
        let wq = 0
        let bq = 0
        let pawnsq = 0
        let knightsq = 0
        let bishopsq = 0
        let rooksq = 0
        let queensq = 0
        let kingsq = 0

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (game.board()[i][j] === null) {
                    continue
                }
                const pieceType = game.board()[i][j].type
                const pieceColor = game.board()[i][j].color
                if (pieceColor === 'w') pieceType = pieceType.toUpperCase()
                else pieceType = pieceType.toLowerCase()

                if (pieceType === 'P') {
                    wp++
                    pawnsq += pieces['P'][values][0][i * 8 + j]
                }
                else if (pieceType === 'p') {
                    bp++
                    pawnsq -= pieces['p'][values][0][i * 8 + j]
                }
                else if (pieceType === 'N') {
                    wn++
                    knightsq += pieces['N'][values][0][i * 8 + j]
                }
                else if (pieceType === 'n') {
                    bn++
                    knightsq -= pieces['n'][values][0][i * 8 + j]
                }
                else if (pieceType === 'B') {
                    wb++
                    bishopsq += pieces['B'][values][0][i * 8 + j]
                }
                else if (pieceType === 'b') {
                    bb++
                    bishopsq -= pieces['b'][values][0][i * 8 + j]
                }
                else if (pieceType === 'R') {
                    wr++
                    rooksq += pieces['R'][values][0][i * 8 + j]
                }
                else if (pieceType === 'r') {
                    br++
                    rooksq -= pieces['r'][values][0][i * 8 + j]
                }
                else if (pieceType === 'Q') {
                    wq++
                    queensq += pieces['Q'][values][0][i * 8 + j]
                }
                else if (pieceType === 'q') {
                    bq++
                    queensq -= pieces['q'][values][0][i * 8 + j]
                }
                else if (pieceType === 'K') {
                    kingsq += pieces['K'][values][0][i * 8 + j]
                }
                else if (pieceType === 'k') {
                    kingsq -= pieces['k'][values][0][i * 8 + j]
                }
            }
        }

        const material = 100 * (wp - bp) + 320 * (wn - bn) + 330 * (wb - bb) + 500 * (wr - br) + 900 * (wq - bq)

        const evaluation = material + pawnsq + knightsq + bishopsq + rooksq + queensq + kingsq
        if (game.turn() === 'w') {
            return evaluation
        }
        else {
            return -evaluation
        }
    }

}