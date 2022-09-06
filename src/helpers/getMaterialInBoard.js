import { chessAI } from "../chessAI"

export const getMaterialInBoard = () => {
    const wp = chessAI.getNumberOfPieces('white', 'P')
    const wn = chessAI.getNumberOfPieces('white', 'N')
    const wb = chessAI.getNumberOfPieces('white', 'B')
    const wr = chessAI.getNumberOfPieces('white', 'R')
    const wq = chessAI.getNumberOfPieces('white', 'Q')
    const bp = chessAI.getNumberOfPieces('black', 'p')
    const bn = chessAI.getNumberOfPieces('black', 'n')
    const bb = chessAI.getNumberOfPieces('black', 'b')
    const br = chessAI.getNumberOfPieces('black', 'r')
    const bq = chessAI.getNumberOfPieces('black', 'q')

    const blackMaterial = 100 * bp + 300 * bn + 330 * bb + 500 * br + 900 * bq
    const whiteMaterial = 100 * wp + 300 * wn + 330 * wb + 500 * wr + 900 * wq
    return [whiteMaterial, blackMaterial]
}