import { useEffect, useState, useRef } from 'react'
import './Timer.css'

export function Timer({ endTime, isStopped }) {
    const [timer, setTimer] = useState(0)
    const timeouts = useRef([])

    useEffect(() => {
        getRemainingTime()
    }, [endTime, isStopped])

    const getRemainingTime = () => {
        const time = endTime - Date.now()
        const timeCorrection = (time % 1000 === 0) ? 1000 : time % 1000
        
        if (!endTime || time <= 0) {
            setTimer(0)
            timeouts.current.forEach((timeout) => clearTimeout(timeout))
            return 
        }

        if (isStopped) {
            setTimer(Math.round(time / 1000))
            timeouts.current.forEach((timeout) => clearTimeout(timeout))
            return
        } 

        setTimer(Math.round(time / 1000))
        timeouts.current.forEach((timeout) => clearTimeout(timeout))
        timeouts.current.push(setTimeout(getRemainingTime, timeCorrection))
    }

    return (
        <div className='game-timer'>{timeToText(timer)}</div>
    )
}

export function timeToText(seconds) {
    const getBiggerUnits = (smallUnits) => {
        let small = smallUnits % 60
        return [(smallUnits - small) / 60, small]
    }

    let minutes = getBiggerUnits(seconds)
    let hours = getBiggerUnits(minutes[0])
    let timeArray = [hours[0], hours[1], minutes[1]]
    let result = ''
    
    for (let i = 0; i < timeArray.length; i++) {
        if (i === 0 && timeArray[i] === 0) continue
        result += (timeArray[i] < 10) ? '0' + timeArray[i] : timeArray[i]
        if (i !== timeArray.length - 1) result += ' : '
    }

    return result
}