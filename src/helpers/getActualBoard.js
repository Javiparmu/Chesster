
export const getActualBoard = () => {
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
}