import React, { useEffect } from "react";
import { FaUserAlt, FaChessPawn, FaRobot, FaAward, FaShapes, FaEnvelope, FaCheckSquare } from 'react-icons/fa'
import { FaSquareXmark } from 'react-icons/fa6'

import { hasRequestToRender, requestActionHandler } from "../containers/RequestControl";
import { timerParser } from "../containers/Request";

export default function SubMenu(params) {
    const { requestList } = params

    //set the request list container to invisble if there are no request
    useEffect(() => {
        const requestListComp = document.getElementsByClassName('sub-menu-request')[0]

        if (!hasRequestToRender(requestList, 'sub-menu')) {
            requestListComp.style.display = 'none'
        } else {
            requestListComp.style.display = 'block'    
        } 
    }, [requestList])

    const subMenuRequestRender = (req) => {
        if (req.rendered.subMenu || req.declined) return

        const oppUser = (req.receiver === req.wp) ? req.bu : req.wu
        const timer = req.timer

        setTimeout(() => {
            req.rendered.subMenu = true
            const curElement = document.getElementById('sub-menu-request-' + req.reqID)
            if (curElement) curElement.style.display = 'none'
        }, 45 * 1000)

        return (
            <div id={'sub-menu-request-' + req.reqID} className="sub-menu-request-component">
                <FaUserAlt></FaUserAlt>
                <div>
                    <div>{oppUser} (1500)</div>
                    <span>{timerParser(timer)}</span>
                </div>
                <div className='sub-menu-request-icon'>
                    <FaCheckSquare style={{color: '#769656'}} onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: true, DOMElement: 'sub-menu'})}
                    ></FaCheckSquare>
                    <FaSquareXmark onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: false, DOMElement: 'sub-menu'})}
                    ></FaSquareXmark>
                </div>      
            </div>   
        )
    }

    return (
        <div className="sub-menu-component sub-menu-game">
            <div className='sub-menu-request'>
                <div className='sub-menu-request-header'>
                    <FaEnvelope></FaEnvelope>Pending Request</div>
                <div className='sub-menu-request-body'>
                    {requestList.map(subMenuRequestRender)}
                </div>
                <div className='horizontal-line'></div>
            </div>
            <div><FaChessPawn></FaChessPawn>New Game</div>
            <div><FaRobot></FaRobot>Computer</div>
            <div><FaAward></FaAward>Tournament</div>
            <div><FaShapes></FaShapes>Special Variants</div>
        </div>
    )
}