import { useState } from 'react'

import './ActionSidebar.css'
import { FaHandshake, FaRegFlag } from 'react-icons/fa'

export default function ActionSidebar({ playState, exitPlayState }) {
    const [clicked, setClicked] = useState({ resign: false, draw: false })
    
    const resignHandler = () => {
        console.log('resign')
    }

    const drawHandler = () => {

    }

    return <div className='action-sidebar'>
        {playState && !playState.end ? <>
            <div>
                {!clicked.resign && 
                    <span onClick={() => {
                        setClicked({ draw: false, resign: true })
                    }}>
                        <FaRegFlag className='as-icon'></FaRegFlag>Resign</span>}
                {clicked.resign && <div className='as-popup'>
                    <div onClick={resignHandler}>Yes</div>
                    <div onClick={() => setClicked({ draw: false, resign: false })}>No</div>
                </div>}
            </div>
            <div>
                {!clicked.draw && 
                    <span onClick={() => {
                        setClicked({ resign: false, draw: true })
                    }}><FaHandshake className='as-icon'></FaHandshake>Draw</span>}
                {clicked.draw && <div className='as-popup'>
                    <div onClick={drawHandler}>Yes</div>
                    <div onClick={() => setClicked({ draw: false, resign: false })}>No</div>
                </div>}
            </div>
        </> : <>
            <div><span>Rematch</span></div>
            <div onClick={exitPlayState}><span>New Game</span></div>
        </>}
    </div>
}