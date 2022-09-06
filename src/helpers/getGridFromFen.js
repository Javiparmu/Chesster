
export const getGridFromFen = (fen) => {
    let rows = fen.split(' ')[0].split('/')
    let pieces = []
    for (let i = 0; i < 8; i++) {
        pieces[i] = []
        const row = rows[i].split('')
        for (let j = 0; j < row.length; j++) {
            if (!isNaN(Number(row[j]))) {
                for (let k = 0; k < row[j]; k++) {
                    pieces[i].push(' ')
                }
            }
            else pieces[i].push(row[j])
        }
    }
    return pieces
}