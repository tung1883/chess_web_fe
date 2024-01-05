import { useEffect } from 'react';
import './ResultPopUp.css'
import { BsTrophy } from 'react-icons/bs';
import { FaSkullCrossbones, FaChess } from 'react-icons/fa';
import { ImCross } from 'react-icons/im'

export function ResultPopUp({ userSide, end }) {
    const getIcon = (result) => {
        result = parseInt(result)

        if (result === 0) {
            return <FaChess className="rpuh-icon"></FaChess>
        } else if (result === userSide + 1) {
            return <BsTrophy className='rpuh-icon'></BsTrophy>
        } else return <FaSkullCrossbones className="rpuh-icon"></FaSkullCrossbones>
    }

    const getResultText = (result, method) => {
        result = parseInt(result)
        method = parseInt(method)

        let text = "You "
        
        if (result === 0) text += 'drew '
        else {
            if (result === userSide + 1) text += 'won '
            else text += 'lost '
        }
    
        if (!method && method !== 0) return text;
        
        return (method === 1) ? text + 'on' : text + 'by'
    }
    
    const getMethodText = (method) => {
        method = parseInt(method)

        switch (method) {
            case 0: return 'Checkmate'
            case 1: return 'Time'
            case 2: return 'Stalemate'
            default: return ''
        }
    }

    const close = () => {
        let resultPopUp = document.getElementsByClassName('result-pop-up')[0]
        resultPopUp.style.visibility = 'hidden'
    }

    return <div className='result-pop-up'>
        <div className='rpu-header'>
            {getIcon(end.result)}
            <div className='rpuh-result'> 
                <div>{getResultText(end.result, end.method)}</div>
                <div>{getMethodText(end.method)}</div>
            </div>
            <ImCross onClick={close} className='rpuh-close'></ImCross>
        </div>
        <div className='rpu-body'>
            <button><span>Rematch</span></button>
            <button><span>New Game</span></button>
            <button><span>Training</span></button>
        </div>
    </div>
}