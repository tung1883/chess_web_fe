import React, { useState, useRef, useEffect } from "react";
import './Chessboard.css'
import Square, { squareClass } from "./Square";
import BoardControl, { posToIndex, rotateBoard } from "./BoardControl"

export function Chessboard({ boardInfo, setBoardInfo, state, setState, rotate }) {
    const activePiece = useRef(null) //piece that is being dragged
    const { board, curMove, moveList } = boardInfo

    if (!rotate) rotate = 0

    const clickPiece = (e) => {
        const squareSize = getBoardSize() / 8

        if (e.button !== 0) return

        const element = e.target
        
        if (element.classList.contains('piece')) {
            const x = e.clientX + window.scrollX
            const y = e.clientY + window.scrollY

            element.style.position = 'absolute'
            element.style.left = `${x - squareSize / 2}px`
            element.style.top = `${y - squareSize / 2}px`
            element.style.width = `${element.parentNode.clientWidth}px`
            element.style.height = `${element.parentNode.clientHeight}px`

            activePiece.current = element
        }
    }
    
    const movePiece = (e) => {
        const boardSize = getBoardSize()
        const squareSize = boardSize / 8

        if (e.button !== 0) return

        if (activePiece.current) {
            const x = e.clientX + window.scrollX
            const y = e.clientY + window.scrollY
            const boardX = activePiece.current.closest('#board').offsetLeft
            const boardY = activePiece.current.closest('#board').offsetTop
            activePiece.current.style.position = 'absolute'
            
            if (x - boardX <= 0) activePiece.current.style.left = `${boardX - squareSize / 2}px`
            else activePiece.current.style.left = (x - (boardX + boardSize) <= 0) ? `${x - squareSize / 2}px` : 
                `${boardX + boardSize - squareSize / 2}px`
            
            if (y - boardY <= 0) activePiece.current.style.top = `${boardY - squareSize / 2}px`
            else activePiece.current.style.top = (y - (boardY + boardSize) <= 0) ? `${y - squareSize / 2}px` : 
                `${boardY + boardSize - squareSize / 2}px`
        }
    }
    
    const dropPiece = (e) => {
        if (e.button !== 0) return

        const dropSquare = activePiece.current && 
            document.elementsFromPoint(e.clientX, e.clientY).find((ele) => ele.classList.contains('square'))
    
        if (dropSquare) {
            const curSquare = activePiece.current.parentNode
            let i1 = posToIndex(parseInt(curSquare.classList[1][0]), parseInt(curSquare.classList[1][1]))
            let i2 = posToIndex(parseInt(dropSquare.classList[1][0]), parseInt(dropSquare.classList[1][1]))

            if (rotate) {
                i1 = 63 - i1
                i2 = 63 - i2
            }

            update({ i1, i2 })
        } 

        if (activePiece.current) {
            activePiece.current.style.position = 'static'
            activePiece.current = null
        }
    }

    const update = ({i1, i2, back, next}) => {
        setBoardInfo(BoardControl({ board, i1, i2, curMove, moveList, back, next, state, setState }))
    }

    const moveBackHandler = () => update({back: 1})

    const moveNextHandler = () => update({next: 1})

    useEffect(() => {
        window.addEventListener('mousemove', movePiece)
        window.addEventListener('mouseup', dropPiece)
        return () => {
            window.removeEventListener('mousemove', movePiece)
            window.removeEventListener('mouseup', dropPiece)
        }
    })
    
    const getBoardSize = () => {
        const board = document.getElementsByClassName('chessboard')[0]
        return (board) ? board.clientHeight : 0
    }
    
    const getRenderBoard = () => {
        return (rotate) ? rotateBoard(board) : board
    }

    return <>
        <div id="board"
            onMouseDown={e => clickPiece(e)}
            onContextMenu={e => e.preventDefault()}
            style={{backgroundImage: `url(${process.env.PUBLIC_URL + '/assets/chessboard.png'}`}}
        >
            {getRenderBoard().map((square, i) => {
                if (rotate) i = 63 - i
                let cur = curMove !== 0 && moveList.length !== 0 && 
                    (i === moveList[curMove - 1].move.i1 || i === moveList[curMove - 1].move.i2)
                if (rotate) i = 63 - i

                return <Square className={squareClass(i, square, cur, rotate)} 
                index={i} id={square}></Square>})}
        </div>

        <div className='arrow-container'>
            <div className={'arrow left'} onMouseDown={moveBackHandler}></div>
            <div className={'arrow right'} onMouseDown={moveNextHandler}></div>
        </div>
    </>
}