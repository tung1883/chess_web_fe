import { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { FaUserAlt , FaQuestion} from 'react-icons/fa'
import { FaArrowLeft, FaChessBoard, FaChessKing, FaRegChessKing} from 'react-icons/fa6'
import { ImCross } from "react-icons/im";

import * as Timer from "../components/Timer";
import LoadingSpinner from '../components/LoadingSpinner'
import './Request.css'
import { CurrentUserContext } from "../Contexts";
import { randomInteger } from "../functionalities/randomInteger";
import { deleteRequest, sendRequest } from "./StateControl";

const DEFAULT_TIME = {
    min: '0',
    sec: '1',
    incre: '0'
}

const DEFAULT_RAW_REQUEST = {
    oppID: null,
    oppName: null,
    side: 'random',
    timer: null
}

export default function Request({ userRequest, setUserRequest }) {
    const { user } = useContext(CurrentUserContext)
    const [friendList, setFriendList] = useState([])
    const [rawRequest, setRawRequest] = useState(DEFAULT_RAW_REQUEST)
    const timeouts = useRef([])
    const currentRequestID = useRef(null)
    const [mouseOverBttn, setMouseOverBttn] = useState(false)

    const getFriendList = () => {
        axios({
            method: 'get',
            url: 'http://localhost:8000/users',
        }).then((res) => {
            const tempFriendList = []
            res.data.map((userObj) => tempFriendList.push({id: userObj.userID, name: userObj.user}))
            setFriendList(tempFriendList.filter((friend) => {
                if (user) return friend.name !== user.name
            }))
        })
        
        timeouts.current.push(setTimeout(getFriendList, 20 * 1000))
    }

    useEffect(() => {
        getFriendList()   
        return () => {
            timeouts.current.forEach((timer) => clearTimeout(timer))
        }
    }, [])

    //if request is declined, stop the spinner
    useEffect(() => {
        // console.log(userRequest, currentRequestID.current)
        if (!userRequest && currentRequestID.current) {
            currentRequestID.current = null
        }
    }, [userRequest])
    
    const isNumber = (e) => {
        var charCode = (e.which) ? e.which : e.keyCode
        if ((48 <= charCode && charCode <= 57) || charCode === 37 || 
            charCode === 39 || charCode === 8 || charCode === 9 || charCode === 46) {
            return
        }

        e.preventDefault()
    }
    
    const requestSubmit = async () => {
        const timerChild = document.getElementsByClassName('timer')[0].childNodes
        let wp = null, wu = null, bp = null, bu = null
        switch (rawRequest.side) {
            case 'white':
                wp = parseInt(user.id)
                wu = user.name
                bp = parseInt(rawRequest.oppID)
                bu = rawRequest.oppName
                break
            case 'black':
                bp = user.id
                bu = user.name
                wp = parseInt(rawRequest.oppID)
                wu = rawRequest.oppName
                break
            default: //random
                if (randomInteger(0, 1)) {
                    //1 -> white
                    wp = parseInt(user.id)
                    wu = user.name
                    bp = parseInt(rawRequest.oppID)
                    bu = rawRequest.oppName
                } else {
                    bp = parseInt(user.id)
                    bu = user.name
                    wp = parseInt(rawRequest.oppID)
                    wu = rawRequest.oppName
                }
        }

        const sentRequest = await sendRequest({request: { wp, wu, bp, bu,
            timer: {
                format: getTimeFormat(timerChild[0].value, timerChild[2].value, timerChild[4].value)
            }
        }})
        
        currentRequestID.current = sentRequest?.reqID
        setUserRequest(sentRequest)
    }

    const getTimeFormat = (min, sec, incre) => {
        if (!min) min = DEFAULT_TIME.min
        if (!sec) sec = DEFAULT_TIME.sec
        if (!incre) incre = DEFAULT_TIME.incre

        return {
            time: parseInt(min) * 60 + parseInt(sec),
            incre: parseInt(incre)
        }
    }

    const chooseSide = (e) => {
        document.elementsFromPoint(e.clientX, e.clientY).map((ele) => {
            if (ele.tagName === 'svg') {
                rawRequest.side = ele.classList[0] 
                const parent = e.target.closest('.choose-side')
                for (let i = 0; i < parent.childNodes.length; i++) {
                    if (parent.childNodes[i] === ele) {
                        ele.style.filter = 'brightness(150%)'
                        ele.style.fontSize = '120%'
                    } else {
                        parent.childNodes[i].style.filter = 'brightness(50%)'
                        parent.childNodes[i].style.fontSize = '110%'
                    }
                }
            }
        })
    }

    const declineRequest = () => {
        deleteRequest({reqID: currentRequestID.current})
        setRawRequest(DEFAULT_RAW_REQUEST)
        setUserRequest(null)
        currentRequestID.current = null
    }

    return (
        <div className="upper">
            <div className="upper-top">
                <FaChessBoard style={{paddingRight: '0.5em'}}></FaChessBoard>
                Play with Your Friends
            </div>
            {!rawRequest.oppName && 
                <FriendList friendList={friendList} setRawRequest={setRawRequest}/>}
            {rawRequest.oppName && 
                <div className='requesting-component'>
                    <div className='requesting-header'>
                        <div className="back-button-container">
                            <FaArrowLeft className='back-button' onClick={declineRequest}/>
                        </div>
                        <div className='requesting-text'>Play</div>
                        <div className="dummyFlexBox"/>
                    </div>
                    <div className="requesting-body">
                        <FaUserAlt className='requesting-avatar'></FaUserAlt>
                        <div className='requesting-user'>{rawRequest.oppName}</div>
                        <div className='timer'>
                            <input type="text" onKeyDown={isNumber} placeholder="min"/>
                            <text>:</text> 
                            <input type="text" onKeyDown={isNumber} placeholder="sec"/>
                            <text>:</text>
                            <input type="text" onKeyDown={isNumber} placeholder="incre"/>
                        </div>
                        <div className="choose-side" onClick={chooseSide}>
                            <FaChessKing className='white'></FaChessKing>
                            <FaQuestion className='random'></FaQuestion>
                            <FaRegChessKing className='black'></FaRegChessKing>
                        </div>
                        <button
                            onClick={(currentRequestID.current) ? () => {
                                setUserRequest(null)
                                deleteRequest({reqID: currentRequestID.current})
                                currentRequestID.current = null
                            } : requestSubmit}
                            onMouseOver={() => setMouseOverBttn(true)}
                            onMouseOut={() => setMouseOverBttn(false)}
                        >
                            {(currentRequestID.current) ? 
                                <span>
                                    {(mouseOverBttn) ? <ImCross style={{fontWeight: "bold"}} 
                                        onClick={declineRequest}/> 
                                        : <LoadingSpinner width={15} height={15}/>}
                                </span>
                                : <span>Request</span>
                            }
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}

function FriendList({ friendList, setRawRequest }) {
    return (
        <div className='friend-list'>
            <div className='friend-list-header'>Friends <span>{friendList.length}</span></div>
            <div className="friend-list-main">
                {friendList.map((friend, index) => {
                    let componentClass = 'friend-component '
                    if (index % 2 === 0) componentClass += 'friend-even'    

                    return (    
                        <div className={componentClass}
                            onClick={() => {
                                setRawRequest({oppName: friend.name, oppID: friend.id})
                            }}>
                            <span className='friend-index'>{index + 1}.</span>
                            <text className='friend-name'>{friend.name}</text>
                            <span className='friend-elo'>(1500)</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function timerParser(timer) {
    let { time, incre } = timer.format

    if (incre) return Timer.timeToText(time) + ` (+${incre})`
    return Timer.timeToText(time)
}