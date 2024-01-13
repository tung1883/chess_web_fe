import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaUserAlt , FaQuestion} from 'react-icons/fa'
import { FaArrowLeft, FaChessBoard, FaChessKing, FaRegChessKing} from 'react-icons/fa6'
import { timeToText } from "../components/Timer";
import LoadingSpinner from '../components/LoadingSpinner'

import './Request.css'

const DEFAULT_TIME = {
    min: '0',
    sec: '1',
    incre: '0'
}

export default function Request({ userState, state, setState }) {
    const [friendList, setFriendList] = useState([])
    const [requestData, setRequestData] = useState({
        oppID: null,
        oppUsername: null,
        side: 'random',
        timer: null
    })
    const timeouts = useRef([])
    const isRequesting = useRef(false)

    const getUserList = () => {
        axios({
            method: 'get',
            url: 'http://localhost:8000/users',
        }).then((res) => {
            const tempFriendList = []
            res.data.map((userObj) => tempFriendList.push({id: userObj.userID, username: userObj.user}))
            setFriendList(tempFriendList.filter((friend) => {
                if (userState) return friend.username !== userState[1]
            }))
        })
        
        timeouts.current.push(setTimeout(getUserList, 20 * 1000))
    }

    useEffect(() => {
        getUserList()   
        return () => {
            timeouts.current.forEach((timer) => clearTimeout(timer))
        }
    }, [])
    
    const isNumber = (e) => {
        var charCode = (e.which) ? e.which : e.keyCode
        if ((48 <= charCode && charCode <= 57) || charCode === 37 || 
            charCode === 39 || charCode === 8 || charCode === 9 || charCode === 46) {
            return
        }

        e.preventDefault()
    }
    
    const requestSubmit = () => {
        const timerChild = document.getElementsByClassName('timer')[0].childNodes
        isRequesting.current = true
        let wp = null, wu = null, bp = null, bu = null
        switch (requestData.side) {
            case 'white':
                wp = parseInt(userState[0])
                wu = userState[1]
                bp = parseInt(requestData.oppID)
                bu = requestData.oppUsername
                break
            case 'black':
                bp = userState[0]
                bu = userState[1]
                wp = parseInt(requestData.oppID)
                wu = requestData.oppUsername
                break
            default: //random
                if (randomInteger(0, 1)) {
                    //1 -> white
                    wp = parseInt(userState[0])
                    wu = userState[1]
                    bp = parseInt(requestData.oppID)
                    bu = requestData.oppUsername
                } else {
                    bp = parseInt(userState[0])
                    bu = userState[1]
                    wp = parseInt(requestData.oppID)
                    wu = requestData.oppUsername
                }
        }

        state.request.push({ wp, wu, bp, bu,
            timer: {
                format: getTimeFormat(timerChild[0].value, timerChild[2].value, timerChild[4].value)
            }
        })
        
        setState({...state})
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
                requestData.side = ele.classList[0] 
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

    return (
        <div className="upper">
            <div className="upper-top">
                <FaChessBoard style={{paddingRight: '0.5em'}}></FaChessBoard>
                Play with Your Friends
            </div>
            {!requestData.oppUsername && 
                <FriendList friendList={friendList} requestData={requestData} 
                    setRequestData={setRequestData}></FriendList>}
            {requestData.oppUsername && 
                <div className='requesting-component'>
                    <div className='requesting-header'>
                        <div className="back-button-container">
                            <FaArrowLeft className='back-button' 
                                onClick={() => {
                                    requestData.oppID = null
                                    requestData.oppUsername = null
                                    setRequestData({...requestData})
                                }}></FaArrowLeft>
                        </div>
                        <div className='requesting-text'>Play</div>
                        <div className="dummyFlexBox"></div>
                    </div>
                    <div className="requesting-body">
                        <FaUserAlt className='requesting-avatar'></FaUserAlt>
                        <div className='requesting-user'>{requestData.oppUsername}</div>
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
                            onClick={requestSubmit}
                        >
                            {(isRequesting.current === false) ? <span>Request</span>
                                : <span><LoadingSpinner width={15} height={15}></LoadingSpinner></span>
                            }
                        </button>
                    </div>
                </div>
            }
        </div>
    )
}

function FriendList({ friendList, requestData, setRequestData }) {
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
                                requestData.oppUsername = friend.username
                                requestData.oppID = friend.id
                                setRequestData({...requestData})
                            }}>
                            <span className='friend-index'>{index + 1}.</span>
                            <text className='friend-name'>{friend.username}</text>
                            <span className='friend-elo'>(1500)</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function timerParser(timer) {
    let { time, incre } = timer.format

    if (incre) return timeToText(time) + ` (+${incre})`
    return timeToText(time)
}