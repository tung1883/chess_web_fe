import { useContext } from "react";
import { FaUserAlt, FaChessPawn, FaRobot, FaAward, FaShapes, FaEnvelope, FaCheckSquare, FaArrowLeft, FaPuzzlePiece} from 'react-icons/fa'
import { FaSquareXmark, FaMagnifyingGlass } from 'react-icons/fa6'

import { hasRequestToRender, requestActionHandler } from "../containers/RequestControl";
import { timerParser } from "../containers/Request";
import { logOut } from "../App";
import { CurrentUserContext } from "../Contexts";

export default function SubMenu(params) {
    const { setUser } = useContext(CurrentUserContext)

    switch (params.parent) {
        case 'game':
            return <GameSubMenu {...params}/>
        case 'user':
            return <UserSubMenu setUser={setUser}/>  
        case 'training':
            return <TrainingSubMenu/>  
        default:
            return <></>
    }
}

const GameSubMenu = (params) => {
    const { receivedRequests } = params

    const requestRender = (req) => {
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
                <FaUserAlt/>
                <div>
                    <div>{oppUser} (1500)</div>
                    <span>{timerParser(timer)}</span>
                </div>
                <div className='sub-menu-request-icon'>
                    <FaCheckSquare style={{color: '#769656'}} onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: true, DOMElement: 'sub-menu'})}/>
                    <FaSquareXmark onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: false, DOMElement: 'sub-menu'})}/>
                </div>      
            </div>   
        )
    }

    return (
        <div className="sub-menu-component sub-menu-game">
            {hasRequestToRender(receivedRequests, 'sub-menu') && 
                <div className='sub-menu-request'>
                    <div className='sub-menu-request-header'>
                        <FaEnvelope/>Pending Request</div>
                    <div className='sub-menu-request-body'>
                        {receivedRequests.map(requestRender)}
                    </div>
                    <div className='horizontal-line'></div>
                </div>}
            <div><FaChessPawn/>New Game</div>
            <div><FaRobot/>Computer</div>
            <div><FaAward/>Tournament</div>
            <div><FaShapes/>Special Variants</div>
        </div>
    )
}

const UserSubMenu = (params) => {
    const { setUser } = params
    return (
        <div className="sub-menu-component sub-menu-user">
            <div><FaUserAlt></FaUserAlt>Profile</div>
            <div onClick={() => logOut(setUser)}><FaArrowLeft ></FaArrowLeft >Log Out</div>
        </div>
    )
}

const TrainingSubMenu = (params) => {
    return (
        <div className="sub-menu-component sub-menu-user">
            <div><FaPuzzlePiece></FaPuzzlePiece>Puzzles</div>
            <div><FaMagnifyingGlass ></FaMagnifyingGlass >Game Analysis</div>
        </div>
    )
}