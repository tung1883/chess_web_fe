import { posToIndex, indexToPos } from "./BoardControl"

export default function getMoveType(board, i1, i2, ep, castle) {
    const [x1, y1] = indexToPos(i1), [x2, y2] = indexToPos(i2)
    const p1 = board[i1], p2 = board[i2]

    //move -> square of piece w/ the same side or not the side to move -> return
    if (p2 && p1[0] === p2[0]) return 0

    switch(board[i1]) {
        case 'wp':
        case 'bp': return pawnMove(board, x1, y1, x2, y2, ep)
        case 'wn':
        case 'bn': return knightMove(x1, y1, x2, y2)
        case 'wb':
        case 'bb': return bishopMove(board, x1, y1, x2, y2)
        case 'wr':
        case 'br': return rookMove(board, x1, y1, x2, y2)
        case 'wq':
        case 'bq': return bishopMove(board, x1, y1, x2, y2) || rookMove(board, x1, y1, x2, y2)
        case 'wk':
        case 'bk': return kingMove(board, x1, y1, x2, y2, castle)
        default: return 0
    }
}

function pawnMove (board, x1, y1, x2, y2, ep) {
    const p1 = board[posToIndex(x1, y1)]
    const p2 = board[posToIndex(x2, y2)]
    const [first, dir] = (p1[0] === 'w') ? [6, 1] : [1, -1]
    
    //move straight or capture
    if ((!p2 && x1 === x2 && (y1 === y2 + dir || 
        (y1 === first && y2 === first - 2 * dir && !board[posToIndex(x1, first - dir)]))) ||
        (p2 && y1 === y2 + dir && (x1 === x2 + 1 || x1 === x2 - 1))) return 1

    //en passant
    if (ep && y1 === first - 3 * dir && Math.abs(x2 - x1) === 1 && x2 === ep[0] && 
        y2 === ep[1] - dir) return 4

    return 0
}

function bishopMove(board, x1, y1, x2, y2) {
    if (x1 - x2 === 0 || Math.abs(x1 - x2) !== Math.abs(y1 - y2)) return 0

    //check the direction of the move
    const left = (x1 - x2 > 0) ? true : false
    const up = (y1 - y2 > 0) ? true : false

    if (board.find((square, i) => {
        if (!square) return false

        const [x, y] = indexToPos(i)

        if ((x - x1)/(x1 - x2) !== (y - y1)/(y1 - y2)) return false 
        if ((left && !(x > x2 && x < x1)) || (!left && !(x < x2 && x > x1))) return false
        if ((up && !(y > y2 && y < y1)) || (!up && !(y < y2 && y > y1))) return false

        return true
    })) {
        return 0
    }

    return 1
}

function rookMove(board, x1, y1, x2, y2) {
    if (x2 - x1 === 0 && !board.find((square, i) => {
        const [x, y] = indexToPos(i)
        return x === x1 && square && ((y > y1 && y < y2) || (y < y1 && y > y2))
    })) {
        return 1
    }

    if (y2 - y1 === 0 && !board.find((square, i) => {
        const [x, y] = indexToPos(i)
        return y === y1 && square && ((x > x1 && x < x2) || (x < x1 && x > x2))
    })) {
        return 1
    }

    return 0
}

function knightMove(x1, y1, x2, y2) {
    if ((Math.abs(x1 - x2) === 1 && Math.abs(y1 - y2) === 2) 
        || (Math.abs(x1 - x2) === 2 && Math.abs(y1 - y2) === 1)) {
        return 1
    }

    return 0
}

function kingMove(board, x1, y1, x2, y2, castle) {
    const side = board[posToIndex(x1, y1)][0]

    //kings can not move close to each other
    if (board.find((square, i) => {
        const otherSide = (side === 'w') ? 'b' : 'w'
        if (square !== otherSide + 'k') return false
        const [x, y] = indexToPos(i)
        return Math.abs(x - x2) <= 1 && Math.abs(y - y2) <= 1
    })) return 0

    if (Math.abs(x1 - x2) <= 1 && Math.abs(y1 - y2) <= 1 && !(x1 - x2 === 0 && y1 - y2 === 0)) return 1

    const y = (side === 'w') ? 7 : 0 //starting vertical pos. of the king

    //short castle
    if (x1 === 4 && y1 === y && x2 === 6 && y2 === y && castle && castle[0] && 
        !board.find((square, i) => {
            let [curX, curY] = indexToPos(i)
            return (curX === 5 || curX === 6) && curY === y && square
    })) {
        return 2
    }

    //long castle
    if (x1 === 4 && y1 === y && x2 === 2 && y2 === y && castle && castle[1] && 
        !board.find((square, i) => {
            let [curX, curY] = indexToPos(i)
            return square && (curX === 1 || curX === 2 || curX === 3) && curY === y
    })) {
        return 3
    }

    return 0
}
