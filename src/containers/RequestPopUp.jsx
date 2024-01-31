import { FaUserAlt, FaCheckSquare} from 'react-icons/fa'
import { FaSquareXmark } from 'react-icons/fa6'
import { requestActionHandler } from './RequestControl'
import { timerParser } from './Request'

export default function RequestPopUp(params) {
    const { receivedRequests } = params

    const popUpRequestRender = (req) => {
        if (req.rendered.popUp || req.actionClicked) return
        const oppUser = (req.receiver === req.wp) ? req.bu : req.wu
        const timer = req.timer
        
        setTimeout(() => {
            req.rendered.popUp = true
            const curElement = document.getElementById('pop-up-' + req.reqID)

            if (curElement) {
                curElement.style.display = 'none'
            }
        }, 5 * 1000)
        
        return (
            <div id={'pop-up-' + req.reqID} className="pop-up-request-component">
                <FaUserAlt className='pop-up-avatar'></FaUserAlt>
                <div className='pop-up-info'>
                    <div>{oppUser} (1500)</div>
                    <span>{timerParser(timer)}</span>
                </div>
                <div className='action-icon'>
                    <FaCheckSquare style={{color: '#769656'}} onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: true, DOMElement: 'pop-up'})}    
                    ></FaCheckSquare>
                    <FaSquareXmark onClick={(event) => 
                        requestActionHandler({...params, event, isAccepted: false, DOMElement: 'pop-up'})}
                    ></FaSquareXmark>
                </div>
            </div>
        )
    }

    return (
        <div className="request-pop-up-container">
            {receivedRequests.map(popUpRequestRender)}
        </div>
    )
}