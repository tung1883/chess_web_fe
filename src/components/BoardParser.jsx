import { FaChessPawn, FaChessKnight, FaChessBishop, 
    FaChessRook, FaChessKing, FaChessQueen } from 'react-icons/fa'
import { indexToPos } from './BoardControl';

//moveList: [{ move, special, moveState }]
//move: { moveType, p1, i1, p2, i2 }
//moveState: { ep, check, capture, castle, end: { result, method } }

//Back-end Parser
export function moveToText(moveList, i) {
    const { i1, i2 } = moveList[i].move
    return `${i1},${i2}`
}

export function textParser(record) {
    if (!record) return []
    let list =  record.split(' ')
    for (let i = 0; i < list.length; i++) {
        list[i] = list[i].split(',')
        list[i][0] = parseInt(list[i][0])
        list[i][1] = parseInt(list[i][1])
    }
    return list
}

//Front-end Parser
export function moveListParser(moveList) {
    let parsedMoveList = []

    for (let i = 0; i < moveList.length; i++) {
        const { moveNumber, move } = moveParser(i, moveList)

        if (i % 2 === 0) {
            parsedMoveList.push({moveNumber, white: move})
        } else {
            parsedMoveList[moveNumber - 1].black = move
        }
    }

    return parsedMoveList
}

function moveParser(moveIndex, moveList) {
    const side = (moveIndex % 2 === 0) ? 'white-move' : 'black-move'
    let logo = null
    let text = ''
    const moveNumber = Math.floor(moveIndex / 2 + 1)
    const { p1, i2 } = moveList[moveIndex].move;
    const { ep, check, capture, castle } = moveList[moveIndex].moveState

    if (castle) {
        text = 'O-O' //short castle: O-O
        if (castle === 2) text += '-O' //long castle: O-O-O
    } else {
        logo =  <PieceIcon piece={p1}></PieceIcon>
        if (capture || ep) text += 'x'    
        const horizontal = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const vertical = [8, 7, 6, 5, 4, 3, 2, 1]
        const [x, y] = indexToPos(i2)
        text += horizontal[x] + vertical[y]
    }
    
    if (check) text += '+'
    return { moveNumber, move: <div className={side}>{logo}{text}</div> }

}

function PieceIcon({ piece }) {
    switch(piece[1]) {
        case 'p': 
            return <FaChessPawn></FaChessPawn>
        case 'n': 
            return <FaChessKnight></FaChessKnight>
        case 'b': 
            return <FaChessBishop></FaChessBishop>
        case 'r': 
            return <FaChessRook></FaChessRook>
        case 'q': 
            return <FaChessQueen></FaChessQueen>
        case 'k': 
            return <FaChessKing></FaChessKing>
        default: return null
    }
}