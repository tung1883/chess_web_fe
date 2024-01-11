import axios from "axios"
import { declineRequest } from "./RequestControl"

export async function getOppMove(gameID, curMoveNumber) {
    try {
        const { move_number: newMoveNumber, time_spent: timeSpent, i1, i2, result } = (await axios({
            method: 'get',
            url: `/game/new/active/${gameID}`,
        })).data

        if (newMoveNumber == null || newMoveNumber <= curMoveNumber) {
            if (!result) return

            return parsedResult(result)
        }

        return { move: { i1, i2 }, timeSpent, ...parsedResult(result) }
    } catch (err) {
        console.log(err)
        return null
    }
}

export function playMove(moveInfo) {
    if (!moveInfo.move || !moveInfo.time || !moveInfo.i1 || !moveInfo.i2) return false

    return axios({
        method: 'post',
        url: `/game/new/active/${moveInfo.gameID}`,
        data: moveInfo
    })
    .then(() => { return true })
    .catch((err) => {
        console.log(err) 
        return false
    })
}

export function sendGameResult(gameID, wp, bp, result) {
    return axios({
        method: 'post',
        url: `/game/new/active/${gameID}`,
        data: { gameID, wp, bp, result }
    })
    .then(() => { return true })
    .catch((err) => {
        console.log(err) 
        return false
    })
}

export function setGameEnd(end) {
    if (!end) return {}

    return {
        end,
        result: end.result + ',' + end.method
    }
}

//listen state
export async function requestReceiver(requestList) {
    try {
        const getRequestList = await axios({
            method: 'get',
            url: '/game/request/receive'
        })
        const { requestList: newList } = getRequestList.data
        
        //only add new request to the request list
        newList.forEach((newReq) => {
            if (requestList.find((oldReq) => oldReq.reqID === newReq.reqID)) { return }
            newReq.timer = parsedTimeRecord(newReq.timer)
            requestList.push({ ...newReq, rendered: { subMenu: false, popUp: false } })
        })
        
        return [ ...requestList ]
    } catch (err) {
        console.log(err)
        return requestList
    }
}

//accept state
export async function acceptRequest(userID, gameInfo) {
    try {
        const startedTime = Date.now()
        const createNewGame = await axios({
            method: 'post',
            url: '/game/new/active',
            data: { ...gameInfo, timer: getTimerFormat(gameInfo.timer), startedTime }
        })

        const updateRequest = await axios({
            method: 'post',
            url: '/game/request/res',
            data: { gameID: createNewGame.data.gameID, reqID: gameInfo.reqID, action: 1 }
        })
        
        console.log(updateRequest.data)

        return setPlayState(userID, { ...gameInfo, startedTime, gameID: updateRequest.data.gameID })
    } catch (err) {
        console.log(err)
        return null
    }
}

//request state
export async function sentRequestListener(userID, requestIndex, requestList) {
    try {
        const request = requestList[requestIndex]
        const updatedRequest = (await axios({
            method: 'get',
            url: '/game/request/' + request.reqID
        })).data

        //check if request is deleted, then delete it from the request list
        if (!updatedRequest) return { requestList: requestList.splice(requestIndex, 1) }
        if (!updatedRequest.gameID) return { requestList }

        const { wp, wu, bp, bu, timer } = request        

        //when a request is accepted, decline all requests
        requestList.forEach((declinedRequest) => { declineRequest(declinedRequest.reqID) })

        return {
            requestList: [],
            playState: setPlayState(userID, { wp, wu, bp, bu, timer, 
                gameID: updatedRequest.gameID, startedTime: updatedRequest.startedTime })
        }
    } catch (err) {
        console.log(err)
        return { requestList: requestList.splice(requestIndex, 1) }
    }
}

export function sendRequest(request) {
     axios({
        method: 'post',
        url: '/game/request',
        data: {
            ...request, timer: getTimerFormat(request.timer)
        }
    }).then((res) => {
        request.waiting = true
        request.reqID = res.data.reqID
    }).catch((err) => console.log(err))
}

//other functionalities
export function setPlayState(userID, gameInfo) {
    // eslint-disable-next-line
    let waiting = !(userID == gameInfo.wp)

    return {
        ...gameInfo, waiting,
        // eslint-disable-next-line
        oppUser: (userID == gameInfo.wp) ? gameInfo.bu : gameInfo.wu,
        time: 0
    }
}

function getTimerFormat(timer) {
    return timer.format.time + '+' + timer.format.incre
}

export function parsedTimeRecord(timeRecord) {
    let timeArray = timeRecord.split(' ')
    let format = timeArray[0].split('+')
    timeArray.shift()

    return {
        format: {
            time: parseInt(format[0]),
            incre: parseInt(format[1])
        }, 
        record: timeArray
    }
}

export function parsedResult(result) {
    if (!result) return { }

    return {
        end: {
            result: parseInt(result.split(',')[0]),
            method: parseInt(result.split(',')[1])
        }, 
        result: result   
    }
}