
export const getPiecePosition = (piece) => {
    const row = piece.getAttribute('data-row')
    const col = piece.getAttribute('data-col')
    return [row, col]
}