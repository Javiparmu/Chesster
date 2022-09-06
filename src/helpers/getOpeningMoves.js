

export const getOpeningMoves = async( actualFEN ) => {
    const resp = await fetch(`https://explorer.lichess.ovh/masters?fen=${actualFEN}`, {method: 'GET'})
    const data = await resp.json()
    return data
}