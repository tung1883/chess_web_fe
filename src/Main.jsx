import { useState, useEffect, useRef, useContext } from "react";
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
import { CurrentUserContext, DocumentTitleContext } from "./Contexts";

export default function Main() {
    const { user, setUser } = useContext(CurrentUserContext)
    useContext(DocumentTitleContext).setTitle('Home')

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

    //request format: user ID, username, elo (not yet), time format (eg: "(15:10)")
    const [subMenuParams, setSubMenuParams] = useState(null) 
    const [requestList, setRequestList] = useState([])
    const [boardInfo, setBoardInfo] = useState({
        board: setUpBoard(),
        curMove: 0,
        moveList: []
    })
    const [messages, setMessages] = useState([])
    const timeouts = useRef([])
    
    useEffect(() => {
        if (user && !stateSetUp.current) {
            setUpState()
            stateSetUp.current = 1
        }
    }, [user])

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

    const addMessage = (e) => {
        if (e.key !== 'Enter' || e.target.value === '') return

        setMessages([...messages, {
            userID: user.id,
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
        if (!user || !state.play || !state.play.oppUser) return 'Player'
        return state.play.oppUser
    }
    
    const getSide = (notUser) => {
        let result = 0
        if (user && state.play && user.id == state.play.bp) result = 1
        return (notUser) ? !result : result
    }

    const getSideID = (isUser) => {
        if (!user || !state.play) return
        if (isUser) return user.id
        return (state.play.wp == user.id) ? state.play.bp : state.play.wp
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

        if (endDate <= Date.now() && !state.play.end) {
            //set the game to end when one's timer has run out of time
            let end = { result: !side + 1, method: 1 }
            setState({ ...state, play: { ...state.play, ...setGameEnd(end) }})
        }

        return endDate
    }

    const timerStop = (sideID) => {
        if (!user || !state.play || state.play.end || (sideID == user.id && state.play.waiting) || 
            sideID != user.id && !state.play.waiting) {
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
                    data: { userID: (user.id == wp) ? bp : wp }
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
                        waiting: !(turn == user.id),
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
        if (stateType === 'play' && state.play) {
            if (state.play.end) {
                if (!state.play.waiting) {
                    let { gameID, wp, bp, result } = state.play
                    let errorCounter = 0
                    let resultSender = await sendGameResult(gameID, wp, bp, result)

                    while (!resultSender && errorCounter < 5) {
                        resultSender = await sendGameResult(gameID, wp, bp, result)
                    }
                }
                
                return
            }
            
            // wait for opponent's move
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

            console.log(state.play)
        }

        if (state.play && !state.play.end) return

        if (stateType === 'listen' && state.listen) { 
            setRequestList([...await requestReceiver(requestList)])
            timeouts.current.push(setTimeout(() => stateHandler('listen'), 5 * 1000))
        }

        if (stateType === 'accept' && state.accept) {
            let newGame = await acceptRequest(user.id, state.accept)

            if (!newGame) { 
                state.accept = null
                return 
            } 

            setRequestList([])
            setBoardInfo({ board: setUpBoard(), curMove: 0, moveList: []})
            setState({...state, play: newGame, accept: null})  
        }

        if (stateType === 'request' && state.request.length !== 0) {
            state.request.forEach(async (request, index) => {
                if (!request.waiting) {
                    const updatedRequest = await sendRequest(request)
                    if (!updatedRequest) return

                    return state.request[index] = updatedRequest
                }

                const listener = await sentRequestListener(user.id, index, state.request)
                
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

    const subMenuHandler = (e, parent) => {
        const subMenu = document.getElementsByClassName('sub-menu')[0]
        
        if (e.type === 'mouseover') {
            switch (parent) {
                case 'game':
                    setSubMenuParams({requestList, parent})
                    break;
                case 'user':
                    setSubMenuParams({setUser, parent})
                    break;
                default:
                    setSubMenuParams({parent})
            }
            
            subMenu.style.display = 'block'
        }
        
        if (e.type === 'mouseout' && 
            !document.elementsFromPoint(e.clientX, e.clientY).find((ele) => ele === subMenu)) {
            setSubMenuParams(null)
            subMenu.style.display = 'none'
        }
    }

    return (<>
        <nav className='navigation-bar'>
            <header>
            <center onMouseOver={(e) => {subMenuHandler(e, 'user')}} onMouseOut={(e) => subMenuHandler(e)}>
                <img className='logo' src={process.env.PUBLIC_URL + '/assets/logo.png'} alt='logo'></img>
                <div className='username'>{(user) ? user.name : 'Guest'}</div>
            </center>
            </header>
            <li className='menu-bar'>
                <ul onMouseOver={(e) => subMenuHandler(e, 'game')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaChessBoard className='menu-icon'/>Game</ul>
                <ul onMouseOver={(e) => subMenuHandler(e, 'training')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaRunning className='menu-icon'/>Training</ul>
                <ul onMouseOver={(e) => subMenuHandler(e, 'watch')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaGlasses className='menu-icon'/>Watch</ul>
                <ul onMouseOver={(e) => subMenuHandler(e, 'news')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaNewspaper className='menu-icon'/>News</ul>
                <ul onMouseOver={(e) => subMenuHandler(e, 'social')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaGlobeAmericas className='menu-icon'/>Social</ul>
                <ul onMouseOver={(e) => subMenuHandler(e, 'more')} onMouseOut={(e) => subMenuHandler(e)}>
                    <FaStream className='menu-icon'/>More</ul>
            </li>
            <footer>
            <li>
                <ul><FaLanguage className='menu-icon'></FaLanguage>Language</ul>
                <ul><FaQuestion className='menu-icon'></FaQuestion>Help</ul>
            </li>
            </footer>
            <div className="sub-menu" onMouseOut={(e) => subMenuHandler(e)}>
                <SubMenu {...subMenuParams}/>
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
                    {user && user.name}
                    <Timer endTime={getEndDate(state?.play?.startedTime, state?.play?.timer, getSide(false))} 
                        isStopped={timerStop(getSideID(true))}/>
                </div>
                {state?.play?.end && 
                    <ResultPopUp userSide={getSide(false)} state={state} setState={setState} exitPlayState={exitPlayState}/>} 
            </div>

            <div id='sidebar'>
                {(state.play) ? <MoveList className='move-list-container' 
                    boardInfo={boardInfo} setBoardInfo={setBoardInfo} state={state} setState={setState}
                    exitPlayState={exitPlayState}    
                ></MoveList>
                : <Request user={user} state={state} setState={setState}></Request>}
                <div className="chat">
                    <div className="chat-output">
                        <div className="message-container">
                            {messages.map((msg) => 
                                <div> 
                                    {(msg.userID != user.id) && 
                                        <span style={{fontWeight: 'bold'}}>{state.play.oppUser}</span>}
                                    {(msg.userID == user.id) ? msg.message : (': ' + msg.message)}
                                </div>)}
                        </div>
                        <div className='dummy-div'></div> {/* div to keep scrolling to the bottom*/}
                        <div className="game-info">
                            <div>NEW GAME</div>
                            <div>{user && user.name} - {getOppUsername()}</div>
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

