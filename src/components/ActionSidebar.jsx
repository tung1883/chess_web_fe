import { useState, useRef, useEffect } from 'react'
import { FaHandshake, FaRegFlag } from 'react-icons/fa'
import { ImCross } from 'react-icons/im'
import './ActionSidebar.css'

import { sendRequest, deleteRequest } from '../containers/StateControl'
import LoadingSpinner from './LoadingSpinner'

export default function ActionSidebar({ state, exitPlayState, userRequest, setUserRequest }) {
    const [clicked, setClicked] = useState({ resign: false, draw: false })
    const [currentRequestID, setCurrentRequestID] = useState(null)
    const [mouseOverBttn, setMouseOverBttn] = useState(false)
    
    //if request is declined, stop the spinner
    useEffect(() => {
        if (!userRequest && currentRequestID) {
            setCurrentRequestID(null)
        }

        if (userRequest) {
            setCurrentRequestID(userRequest.reqID)
        }
    }, [userRequest])

    const handleResign = () => {
        console.log('resign')
    }

    const handleDraw = () => {

    }

    const sendRematch = async () => {   
        let { wp, wu, bp, bu, timer } = state.play
        const rematchRequest = {
            timer: { format: timer.format },
            wp: bp, wu: bu, bp: wp, bu: wu
        }

        const sentRequest = await sendRequest({request: rematchRequest})
        setUserRequest(sentRequest)
        setCurrentRequestID(sentRequest.reqID)
    }

    const declineRequest = () => {
        deleteRequest({reqID: currentRequestID})
        setUserRequest(null)
        setCurrentRequestID(null)
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
            <div 
                onClick={(currentRequestID) ? () => {
                        setUserRequest(null)
                        deleteRequest({reqID: currentRequestID})
                        setCurrentRequestID(null)
                    } : sendRematch}
                    onMouseOver={() => setMouseOverBttn(true)}
                    onMouseOut={() => setMouseOverBttn(false)}
            >
                {(currentRequestID) ? 
                    <span>
                        {(mouseOverBttn) ? <ImCross style={{fontWeight: "bold", width: '0.7em', height: '0.7em'}} 
                            onClick={declineRequest}/> 
                            : <center><LoadingSpinner width={12} height={12}/></center>}
                    </span>
                    : <span>Rematch</span>
                }
            </div>
            <div onClick={exitPlayState}><span>New Game</span></div>
        </>}
    </div>
}