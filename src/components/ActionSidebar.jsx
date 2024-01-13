import { useState } from 'react'

import './ActionSidebar.css'
import { FaHandshake, FaRegFlag } from 'react-icons/fa'

export default function ActionSidebar({ state, setState, exitPlayState }) {
    const [clicked, setClicked] = useState({ resign: false, draw: false })
    
    const handleResign = () => {
        console.log('resign')
    }

    const handleDraw = () => {

    }

    const handleRematch = () => {   
        let { wp, wu, bp, bu, timer } = state.play

        state.request.push({
            timer: { format: timer.format },
            wp: bp, wu: bu, bp: wp, bu: wu
        })

        setState({...state})
    }

    return <div className='action-sidebar'>
        {state.play && !state.play.end ? <>
            <div>
                {!clicked.resign && 
                    <span onClick={() => {
                        setClicked({ draw: false, resign: true })
                    }}>
                        <FaRegFlag className='as-icon'></FaRegFlag>Resign</span>}
                {clicked.resign && <div className='as-popup'>
                    <div onClick={handleResign}>Yes</div>
                    <div onClick={() => setClicked({ draw: false, resign: false })}>No</div>
                </div>}
            </div>
            <div>
                {!clicked.draw && 
                    <span onClick={() => {
                        setClicked({ resign: false, draw: true })
                    }}><FaHandshake className='as-icon'></FaHandshake>Draw</span>}
                {clicked.draw && <div className='as-popup'>
                    <div onClick={handleDraw}>Yes</div>
                    <div onClick={() => setClicked({ draw: false, resign: false })}>No</div>
                </div>}
            </div>
        </> : <>
            <div onClick={handleRematch}><span>Rematch</span></div>
            <div onClick={exitPlayState}><span>New Game</span></div>
        </>}
    </div>
}