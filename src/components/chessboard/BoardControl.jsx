import getMoveType from './MoveControl'
import { moveToText } from './BoardParser'
import { setGameEnd } from '../../containers/StateControl'
import { copyObject } from '../../functionalities/copyObject'
import { FaCediSign } from 'react-icons/fa6'

const defaultSpecial = {ep: null, wc: [true, true], bc: [true, true]}

export function indexToPos(index) {return [index % 8, (index - index % 8) / 8]}
export function posToIndex(x, y) {return x + 8 * y}

//improvement
//1. change move list -> tree DS
//2. add more game ending rules: 3-fold rep., 50 moves

//moveList: [{ move, special, moveState }]
//move: { moveType, p1, i1, p2, i2 }
//special: { ep: null, wc: [true, true], bc: [true, true] } - en passant, white/black short/long castle
//moveState: { ep, capture, check, castle, end: { result, method } }
//result: 0 (draw) - method: statlemate/repitition/no check after ... moves/offer 
//result: 1 (white wins) - method: checkmate/resign/no time
//result: 2 (black wins)

//decide if piece from i1 can move to i2 -> update + provide info about moveState of the game
export default function BoardControl({ board, i1, i2, curMove, moveList, back, next, waiting, end, state, setState }) {
    // if (end) { 
    //     if (moveList.length !== 0) {
    //         moveList[moveList.length - 1].moveState.end = end
    //     } else {
    //         let move = {
    //             moveState: { end }
    //         }
    //         moveList.push(move)
    //     }

    //     console.log(moveList)

    //     return { board, curMove, moveList }
    // }

    const noUpdate = { board, curMove, moveList }
    const side = (curMove % 2 === 0) ? 'w' : 'b'
    const other = getOtherSide(side)

    //handle move back/move next
    if ((back && curMove === 0) || (next && curMove === moveList.length)) return noUpdate
    while (back) {
        let { moveType: curMoveType, p1: curP1, i1: curI1, p2: curP2, i2: curI2 } = moveList[curMove - 1].move
        board = takeBack(board, curMoveType, curP1, curI1, curP2, curI2)
        curMove--
        back--

        if (back === 0 || curMove === 0) return { board, curMove, moveList}
    }

    while (next) {
        let { moveType: curMoveType, i1: curI1, i2: curI2 } = moveList[curMove].move
        board = updateBoard(board, curMoveType, curI1, curI2)
        curMove++
        next--
        
        if (next === 0 || curMove === moveList.length) return { board, curMove, moveList}
    }

    const [x1, y1] = indexToPos(i1), [x2, y2] = indexToPos(i2)
    const p1 = board[i1], p2 = board[i2]
    let moveState = { check: null, end: null }
    let special = (curMove !== 0) ? copyObject(moveList[curMove - 1].special) : defaultSpecial
    const castle = (p1[0] === 'w') ? special.wc : special.bc
    let moveType = getMoveType(board, i1, i2, special.ep, castle)

    //no update if: game ended, not the side to move, invalid move
    if ((curMove > 1 && moveList[curMove - 1].moveState.end) || side !== p1[0] || !moveType || 
        (state && state.play && state.play.waiting && !waiting)) return noUpdate

    board = updateBoard(copyObject(board), moveType, i1, i2) 

    if (attackedAfterMove(board, side, i1, i2, getKingPos(board, side))) return noUpdate
    
    //update game moveState
    const otherKPos = getKingPos(board, other)
    moveState.check = attack(board, side, otherKPos, special.ep, castle)
    moveState.capture = (p2) ? true : false
    moveState.ep = isEnPassant(special.ep, p1, i2)
    moveState.castle = isCastling(side, i1, i2)
    if (curMove > 1) moveState = checkGameEnd(board, moveState, other, otherKPos, special.ep, castle)

    //update special moves
    //1. en passant
    special.ep = epUpdate(p1, x1, y1, p2, x2, y2)
    
    //2. castle
    special = castleUpdate(i1, i2, special)

    //delete old moves + add new move
    const move = { moveType, p1, i1, p2, i2 }
    if (curMove !== moveList.length && moveList[curMove].move !== move) moveList.splice(curMove)
    moveList.push({ move, special, moveState })

    curMove = moveList.length

    if (state && state.play && !state.play.waiting && !waiting) {
        state.play.move = moveToText(moveList, moveList.length - 1)
        state.play.i1 = i1
        state.play.i2 = i2
        setState({ ...state , play: { ...state.play, ...setGameEnd(moveState.end)}})
    }

    return { board, curMove, moveList }
}

//check for: checkmate, stalemate, repitition
export function setUpBoard() {
    let board = []
    let w = ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    let b = ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br']

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            switch (i) {
                case 0:
                    board.push(b[j])
                    break
                case 1:
                    board.push('bp')
                    break
                case 6:
                    board.push('wp')
                    break
                case 7:
                    board.push(w[j])
                    break
                default:
                    board.push(null)
            }
        }
    }
    
    return board
}

function updateBoard(board, moveType, i1, i2) {
    const [x2, y2] = indexToPos(i2) 
    const p1 = board[i1]

    if (moveType !== 0) {
        board[i1] = null
        board[i2] = p1
    }
    
    switch (moveType) {
        //case 1 - normal move
        case 2: //short castle
        case 3: //long castle
            const rY = (p1[0] === 'w') ? 7 : 0
            const rX = (moveType === 2) ? [7, 5] : [0, 3] //check whether it is short or long castle
            board[posToIndex(rX[0], rY)] = null
            board[rX[1] + 8 * rY] = p1[0] + 'r'
            break
        case 4: //en passant
            const pPos = (p1 === 'wp') ? [x2, y2 + 1] : [x2, y2 - 1]
            board[pPos[0] + 8 * pPos[1]] = null
            break
        default:
            break
    }

    return board
}

function takeBack(board, moveType, p1, i1, p2, i2) {
    //p1 from i1 moved to i2 -> p2 was removed
    const [x1, y1] = indexToPos(i1)
    const [x2, y2] = indexToPos(i2) 
    
    if (moveType !== 0) {
        board[x1 + 8 * y1] = p1
        board[x2 + 8 * y2] = p2
    }
    
    switch (moveType) {
        //case 1 - normal move
        case 2: //short castle
        case 3: //long castle
            const rX = (moveType === 2) ? [7, 5] : [0, 3] //check whether it is short or long castle
            const rY = (p1 === 'wk') ? 7 : 0
            board[posToIndex(rX[0], rY)] = p1[0] + 'r'
            board[posToIndex(rX[1], rY)] = null
            break
        case 4: //en passant
            const pPos = (p1 === 'wp') ? [x2, y2 + 1] : [x2, y2 - 1]
            const other = (p1[0] === 'w') ? 'b' : 'w'
            board[pPos[0] + 8 * pPos[1]] = other + 'p'
            break
        default:
            break
    }

    return board
}

function checkGameEnd(board, moveState, other, otherKPos, ep, castle) {
    //get method index from table end_method

    //check for checkmate
    if (moveState.check && noMove(board, other, ep, castle)) {
        const sideWin = (other === 'b') ? 1 : 2 //1 - white wins, 2 - black wins
        moveState.end = { result: sideWin, method: 0 }
    }

    //check for stalemate
    if (stalemate(board, other, otherKPos, ep, castle)) {
        moveState.end = { result: 0, method: 2 }
    }

    return moveState
}

//check if one side can attack a square
function attack(board, side, [x, y], ep, castle) {  
    if (board.find((square, i) => {
        if (!square || square[0] !== side) return false
        if (getMoveType(board, i, posToIndex(x, y), ep, castle) !== 0) return true
        return false
    })) return true
    
    return false
}

//if king is checked/rook is attacked after castling -> the move is not valid
function attackedAfterMove(board, side, i1, i2, kPos, ep, castle) {
    //king is checked
    if (attack(board, getOtherSide(side), kPos, ep, castle)) return true

    //rook is attacked after castling
    const defaultKPos = (side === 'w') ? 60 : 4
    const dir = (i2 > i1) ? 1 : -1 //direction of castling: 1 -> short, -1 -> long

    if (i1 === defaultKPos && i2 === defaultKPos + 2 * dir && 
        attack(board, getOtherSide(side), indexToPos(defaultKPos + dir))) return true

    return false
}

function stalemate(board, side, kPos, ep, castle) {
    //stalemate = king is not checked + no possible moves
    if (!attack(board, getOtherSide(side), kPos, ep, castle) && 
        noMove(board, side, kPos, ep, castle)) return true

    return false
}

//check if one side has any possible moves
function noMove(board, side, ep, castle) {
    if (!board.find((square, index) => {
        if (!square || square[0] !== side) return false
        const [x1, y1] = indexToPos(index)
        for (let i = 0; i < board.length; i++) {
            if ((board[i] && board[i][0] === side) || i === posToIndex(x1, y1)) continue
            const moveType = getMoveType(board, index, i)
            const newBoard = updateBoard(copyObject(board), moveType, index, i)
            const kPos = getKingPos(newBoard, side)

            if (moveType !== 0 && !attack(newBoard, getOtherSide(side), kPos, ep, castle)) return true
        }

        return false
    })) return true

    return false
}

function getKingPos(board, side) {
    for (let i = 0; i < board.length; i++) {
        if (board[i] === side + 'k') return indexToPos(i)
    }

    return null
}

function epUpdate(p1, x1, y1, p2, x2, y2) {
    if (p1[1] === 'p') {
        const [first, dir] = (p1[0] === 'w') ? [6, 1] : [1, -1]
        if ((!p2 && x1 === x2 && y1 === first && y2 === first - 2 * dir)) return [x2, y2]
    }

    return null
}

function castleUpdate(i1, i2, special) {
    //WK: 60, LR: 56, RR: 63
    //BK: 4, LR: 0, RR: 7
    const noWSC = (i1 === 60 || i1 === 63 || i2 === 60 || i2 === 63)
    const noWLC = (i1 === 60 || i1 === 56 || i2 === 60 || i2 === 56)
    const noBSC = (i1 === 4 || i1 === 7 || i2 === 4 || i2 === 7)
    const noBLC = (i1 === 4 || i1 === 0 || i2 === 0 || i2 === 0)

    if (special.wc[0] && noWSC) special.wc[0] = false
    if (special.wc[1] && noWLC) special.wc[1] = false
    if (special.bc[0] && noBSC) special.bc[0] = false
    if (special.bc[1] && noBLC) special.bc[1] = false

    return special
}

function isCastling(side, i1, i2) {
    if ((side === 'w' && i1 === 60) || (side === 'b' && i1 === 4)) {
        if (i2 === i1 + 2) return 1
        if (i2 === i1 - 2 ) return 2
    }

    return 0
}

function isEnPassant(ep, p1, i2) {
    if (p1[1] !== 'p' || !ep) return false

    const dir = (p1[0] === 'w') ? -1 : 1
    if (i2 === posToIndex(ep) + 8 * dir) return true

    return false
}

function getOtherSide(side) { return (side === 'w') ? 'b' : 'w'}

export function rotateBoard(board) {
    let newBoard = []
    for (let i = 0; i < board.length; i++) {
        newBoard[i] = board[63 - i]
    }

    return newBoard
}