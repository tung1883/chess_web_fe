import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChessBoard, FaRunning, FaGlasses, FaNewspaper, 
  FaGlobeAmericas, FaStream, FaLanguage, FaQuestion, FaUserAlt } from 'react-icons/fa'

import { Timer } from "./components/Timer";
import SubMenu from "./components/SubMenu";
import { deleteMessages, getMessages, sendMessage } from "./components/Message";

import { Chessboard } from './components/chessboard/Chessboard';
import BoardControl, { setUpBoard } from "./components/chessboard/BoardControl";
import MoveList from './components/chessboard/MoveList';
import { textParser } from "./components/chessboard/BoardParser";

import RequestPopUp from "./containers/RequestPopUp";
import Request from "./containers/Request";
import { ResultPopUp } from "./containers/ResultPopUp";
import { setGameEnd, acceptRequest, getOppMove, playMove, requestReceiver, sendRequest, sentRequestListener, 
    parsedTimeRecord, sendGameResult} from "./containers/StateControl";

export default function Main({ userState }) {
    //4 states: (1) listen -> request, (2) accept request, (3) request, (4) play
    const [state, setState] = useState({
        play: null,
        listen: {
            requestList: []
        },
        accept: null,
        request: []
    })
    const stateSetUp = useRef(0) //use to set up state at first

    //request format: userID, username, elo (not yet), time format (eg: "(15:10)")
    const [requestList, setRequestList] = useState([])
    const [boardInfo, setBoardInfo] = useState({
        board: setUpBoard(),
        curMove: 0,
        moveList: []
    })
    const [messages, setMessages] = useState([])
    const timeouts = useRef([])
    
    const navigate = useNavigate()
    
    //navigate and handle state
    useEffect(() => {
        if (!userState) {
            timeouts.current.forEach((timer) => clearTimeout(timer))
            navigate('/')
        }
    }, [userState])
    
    useEffect(() => {
        if (userState && !stateSetUp.current) {
            setUpState()
            stateSetUp.current = 1
        }
    }, [userState])

    useEffect(() => { 
        stateHandler('play')
        stateHandler('listen')
        stateHandler('accept')
        stateHandler('request')

        return () => {
            timeouts.current.forEach((timer) => clearTimeout(timer))
        }
    }, [state])

    useEffect(() => {
        updateMessage()
    }, [state.play])

    const subMenuRender = (e) => {
        const subMenu = document.getElementsByClassName('sub-menu')[0]

        if (e.type === 'mouseover') {
            subMenu.style.display = 'block'
        }
        
        if (e.type === 'mouseout' && 
            !document.elementsFromPoint(e.clientX, e.clientY).find((ele) => ele === subMenu)) {
            subMenu.style.display = 'none'
        }
    }

    const addMessage = (e) => {
        if (e.key !== 'Enter' || e.target.value === '') return

        setMessages([...messages, {
            userID: userState[0],
            message: e.target.value
        }])

        if (state.play) {
            sendMessage(state.play.gameID, e.target.value)
        }
        
        e.target.value = null
    }

    const updateMessage = async () => {
        if (!state.play) return

        let messageList = await getMessages(state.play.gameID)

        if (messageList) {
            setMessages(messageList)
        }

        timeouts.current.push(setTimeout(updateMessage, 1000))
    }

    const getOppUsername = () => {
        if (!userState || !state.play || !state.play.oppUser) return 'Player'
        return state.play.oppUser
    }
    
    const getSide = (notUser) => {
        let result = 0
        if (userState && state.play && userState[0] == state.play.bp) result = 1
        return (notUser) ? !result : result
    }

    const getSideID = (isUser) => {
        if (!userState || !state.play) return
        if (isUser) return userState[0]
        return (state.play.wp == userState[0]) ? state.play.bp : state.play.wp
    }

    //get the start date of the player's current move
    const getStartDate = (startedTime, timer) => {
        if (!startedTime || !timer) return 0

        let { record } = timer
        let startDate = parseInt(startedTime)

        if (record) {
            for (let i = 0; i < record.length; i++) {
                startDate += parseInt(record[i])
            }
        }

        return startDate
    }

    //get the end date of a player
    const getEndDate = (startedTime, timer, side) => {
        if (!startedTime || !timer) return 0

        let { format: { time, incre }, record } = timer
        let endDate = startedTime + time * 1000

        if (record) {
            for (let i = 0; i < record.length; i++) {
                if (i % 2 != side) {
                    endDate += parseInt(record[i])
                } else {
                    endDate += parseInt(incre) * 1000
                }
            }

            if (stateSetUp.current && side % 2 != record.length % 2) {
                endDate = endDate + Date.now() - getStartDate(startedTime, timer)
            }
        }

        if (endDate <= Date.now() && !state.play.end && !state.play.waiting) {
            //set the game to end when one's timer has run out of time
            let end = { result: !side + 1, method: 1 }
            setState({ ...state, play: { ...state.play, ...setGameEnd(end) }})
        }

        return endDate
    }

    const timerStop = (sideID) => {
        if (!userState || !state.play || state.play.end || (sideID == userState[0] && state.play.waiting) || 
            sideID != userState[0] && !state.play.waiting) {
            return true
        }
        
        return false
    }

    const setUpState = () => {
        axios({
            method: 'get',
            url: '/game/request/send'
        })
        .then(async (res) => {
            const getGameRequest = await axios({
                method: 'get',
                url: '/game/new/active'
            })

            const gameInfo = getGameRequest.data.game

            if (!gameInfo) {
                let requestList = res.data.requestList
                requestList.forEach((request) => {
                    request.waiting = true
                    request.timer = parsedTimeRecord(request.timer)
                })
                setState({...state, request: requestList})
            } else {
                const { gameID, wp, bp, timer, time_spent : time, turn, 
                    started_time: startedTime, result } = gameInfo
                let oppUsernameRequest = await axios({
                    method: 'post',
                    url: '/users',
                    data: { userID: (userState[0] == wp) ? bp : wp }
                })
                let positionList = textParser(gameInfo.record) //List contains (i1, i2) position of each move
                let newBoardInfo = { board: setUpBoard(), curMove: 0, moveList: [] }
                
                for (let i = 0; i < positionList.length; i++) {
                    newBoardInfo = BoardControl({ ...newBoardInfo, 
                        i1: positionList[i][0], i2: positionList[i][1]})
                }
                
                let end = null
                if (result) {
                    end = {
                        result: parseInt(result.split(',')[0]),
                        method: parseInt(result.split(',')[1])
                    }
                }
                
                setRequestList([])
                setBoardInfo(newBoardInfo)
                setState({
                    ...state, 
                    play: {
                        waiting: !(turn == userState[0]),
                        oppUser: oppUsernameRequest.data.user,
                        time: (time) ? parseInt(time) : 0,
                        timer: parsedTimeRecord(timer),
                        result, end, gameID, wp, bp, startedTime
                    },
                    accept: null})
            }
        })
        .catch((err) => console.log(err))
    }

    const stateHandler = async (stateType) => {
        //play state
        if (stateType === 'play' && state.play) {
            //game ended
            if (state.play.end) {
                if (!state.play.end.received) {
                    let { gameID, wp, bp, result } = state.play
                    let resultSender = await sendGameResult(gameID, wp, bp, result)

                    if (!resultSender) {
                        timeouts.current.push(setTimeout(() => stateHandler('play'), 1000))
                    }
                }
                
                //handle game end
            }
            
            //waiting for opponent move
            if (state.play.waiting) {
                let oppMove = await getOppMove(state.play.gameID, boardInfo.moveList.length - 1)

                if (!oppMove) return timeouts.current.push(setTimeout(() => stateHandler('play'), 500))

                if (oppMove.move) {
                    setBoardInfo(BoardControl({ ...boardInfo, ...oppMove.move, state, setState, waiting: true }))
                    if (state.play.timer.record) state.play.timer.record.push(oppMove.timeSpent)
                    else state.play.timer.record = [oppMove.timeSpent]
                }

                if (oppMove.result) {
                    state.play.end = { ...oppMove.end, received: true }
                    state.play.result = oppMove.result
                }

                return setState({...state, play: { ...state.play, waiting: false }})
            } 
            
            if (!state.play.move || !state.play.i1 || !state.play.i2) return

            const moveTime = Date.now() - getStartDate(state.play.startedTime, state.play.timer, getSide(false))

            if (await playMove({ ...state.play, time: moveTime})) {
                if (state.play.timer.record) {
                    state.play.timer.record.push(moveTime)
                } else {
                    state.play.timer.record = [moveTime]
                }

                setState({...state, play: { ...state.play, move: null, waiting: true }})
            }
        }

        if (state.play && !state.play.end) return
        
        //listen state
        if (stateType === 'listen' && state.listen) { 
            setRequestList([...await requestReceiver(requestList)])
            timeouts.current.push(setTimeout(() => stateHandler('listen'), 5 * 1000))
        }

        //accept state
        if (stateType === 'accept' && state.accept) {
            let newGame = await acceptRequest(userState[0], state.accept)
            if (!newGame) return 

            setRequestList([])
            setBoardInfo({ board: setUpBoard(), curMove: 0, moveList: []})
            setState({...state, play: newGame, accept: null})  
        }

        //request state
        if (stateType === 'request' && state.request.length !== 0) {
            state.request.forEach(async (request, index) => {
                if (!request.waiting) return sendRequest(request)

                const listener = await sentRequestListener(userState[0], index, state.request)

                if (listener.playState) {
                    setState({ ...state, play: listener.playState })
                    setBoardInfo({ board: setUpBoard(), curMove: 0, moveList: [] })
                } 
            })

            timeouts.current.push(setTimeout(() => stateHandler('request'), 1000))
        }
    }

    const exitPlayState = () => {
        deleteMessages(state.play.gameID)
        setState({ ...state, play: null })
        setBoardInfo({ board: setUpBoard(), curMove: 0, moveList: []})
    }

    return (<>
        <nav className='navigation-bar'>
            <header>
            <center>
                <img className='logo' src={process.env.PUBLIC_URL + '/assets/logo.png'} alt='logo'></img>
                <div className='username'>{(userState) ? userState[1] : 'Guest'}</div>
            </center>
            </header>
            <li className='menu-bar'>
                <ul onMouseOver={(e) => subMenuRender(e)}
                    onMouseOut={(e) => subMenuRender(e)}>
                    <FaChessBoard className='menu-icon'></FaChessBoard>Game</ul>
                <ul><FaRunning className='menu-icon'></FaRunning>Training</ul>
                <ul><FaGlasses className='menu-icon'></FaGlasses>Watch</ul>
                <ul ><FaNewspaper className='menu-icon'></FaNewspaper>News</ul>
                <ul ><FaGlobeAmericas className='menu-icon'></FaGlobeAmericas>Social</ul>
                <ul ><FaStream className='menu-icon'></FaStream>More</ul>
            </li>
            <footer>
            <li>
                <ul><FaLanguage className='menu-icon'></FaLanguage>Language</ul>
                <ul><FaQuestion className='menu-icon'></FaQuestion>Help</ul>
            </li>
            </footer>
            <div className="sub-menu" onMouseOut={(e) => subMenuRender(e)}>
                <SubMenu requestList={requestList} setRequestList={setRequestList}
                    state={state} setState={setState}
                ></SubMenu>
            </div>
        </nav>

        <div className="main-component">
            <div id='board-container'>
                <div className="user-container top-user">
                    <FaUserAlt className="user-icon"></FaUserAlt>
                    {getOppUsername()}
                    <Timer endTime={getEndDate(state?.play?.startedTime, state?.play?.timer, getSide(true))} 
                        isStopped={timerStop(getSideID(false))}></Timer>
                </div>
                <div className="chessboard">
                    <Chessboard boardInfo={boardInfo} setBoardInfo={setBoardInfo} 
                        state={state} setState={setState} rotate={getSide()}></Chessboard>
                </div>
                <div className="user-container bottom-user"> 
                    <FaUserAlt className="user-icon"></FaUserAlt>
                    {userState && userState[1]}
                    <Timer endTime={getEndDate(state?.play?.startedTime, state?.play?.timer, getSide(false))} 
                        isStopped={timerStop(getSideID(true))}></Timer>
                </div>
                {state?.play?.end && <ResultPopUp end={state.play.end} userSide={getSide(false)}></ResultPopUp>} 
            </div>

            <div id='sidebar'>
                {(state.play) ? <MoveList className='move-list-container' 
                    boardInfo={boardInfo} setBoardInfo={setBoardInfo} playState={state.play}
                    exitPlayState={exitPlayState}    
                ></MoveList>
                : <Request userState={userState} state={state} setState={setState}></Request>}
                <div className="chat">
                    <div className="chat-output">
                        <div className="message-container">
                            {messages.map((msg) => 
                                <div> 
                                    {(msg.userID != userState[0]) && 
                                        <span style={{fontWeight: 'bold'}}>{state.play.oppUser}</span>}
                                    {(msg.userID == userState[0]) ? msg.message : (': ' + msg.message)}
                                </div>)}
                        </div>
                        <div className='dummy-div'></div> {/* div to keep scrolling to the bottom*/}
                        <div className="game-info">
                            <div>NEW GAME</div>
                            <div>{userState && userState[1]} - {getOppUsername()}</div>
                        </div>  
                    </div>
                    <div className="chat-input">
                    <input type="text" placeholder={'Message here!'} onKeyDown={addMessage}/>
                    </div>
                </div>
            </div>
        </div>

        <RequestPopUp requestList={requestList} setRequestList={setRequestList} 
            state={state} setState={setState}></RequestPopUp>
    </>)
}