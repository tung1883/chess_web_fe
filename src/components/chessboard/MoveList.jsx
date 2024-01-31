import React, { useRef, useEffect } from "react";
import './MoveList.css';
import { FaBook } from 'react-icons/fa'
import { moveListParser } from "./BoardParser";
import BoardControl from "./BoardControl";
import ActionSidebar from "../ActionSidebar";

//moveList: [{ move, special, moveState }]
//move: { moveType, p1, i1, p2, i2 }
//special: { ep: null, wc: [true, true], bc: [true, true] } - en passant, white/black short/long castle
//moveState: { ep, check,  capture, castle, end: { result, method } }
//result: 0 (draw) - method: statlemate/repitition/no check after ... moves/offer 
//result: 1 (white wins) - method: checkmate/resign/no time
//result: 2 (black wins)

export default function MoveList(params) {
    const { boardInfo, setBoardInfo } = params
    const { board, moveList, curMove} = boardInfo
    const listEnd = useRef(null)
    const parsedList = moveListParser(moveList)

    const onClick = (e) => {
        const element = document.elementsFromPoint(e.clientX, e.clientY)
            .find((ele) => ele.classList.contains('white-move') || ele.classList.contains('black-move'))

        if (!element) return

        const moveNumber = element.parentNode.childNodes[0].firstChild.data
        const index = (element.classList.contains('white-move')) ? (moveNumber - 1) * 2 : moveNumber * 2 - 1
        if (index + 1 - curMove > 0) {
            setBoardInfo(BoardControl({ board, curMove, moveList, next: index + 1 - curMove}))
        }

        if (index + 1 - curMove < 0) {
            setBoardInfo(BoardControl({ board, curMove, moveList, back: curMove - (index + 1)}))
        }
    }

    useEffect(() => {
        if (curMove !== moveList.length) return
        listEnd.current?.scrollIntoView({ behavior: "smooth" })
    })

    return (
        <div className="upper move-list-container" onClick={(e) => onClick(e)}>
            <div className="upper-top opening"><FaBook className='book-icon'></FaBook>Opening Book</div>
            <div className="move-list">
                {parsedList.map((move) => <MoveComponent moveNumber={move.moveNumber} 
                    white={move.white} black={move.black}></MoveComponent>)}
                <div ref={listEnd}></div>
            </div>
            <ActionSidebar {...params}/>        
        </div>
    ) 
}

function MoveComponent({ moveNumber, white, black }) {
    return <>
        <div className={`move ${(moveNumber % 2 === 0) ? 'even' : 'odd'}`}>
            <div className="move-number">{moveNumber}.</div>   
            {white}
            {black}
        </div>
    </>
}