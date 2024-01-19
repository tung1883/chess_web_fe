import React, { useContext, useState } from "react";
import { FaRegUserCircle, FaKeycdn, FaEye, FaEyeSlash, FaArrowLeft  } from 'react-icons/fa';
import axios from 'axios';

import './css/Auth.css'
import { getCookie } from "./functionalities/cookie";
import { CurrentUserContext, DocumentTitleContext } from "./Contexts";

const AUTH_MODES = ['LOG_IN', 'SIGN_UP', 'RESET_PWD']

const MSG_COLOR = {
    green: 'greenyellow',
    red: 'rgba(255, 0, 0, 0.589)',
}

export default function Login() {
    useContext(DocumentTitleContext).setTitle('Login')

    const { setUser } = useContext(CurrentUserContext)
    const [authMode, setAuthMode] = useState('LOG_IN')
    const [pwdVisibility, setPwdVisibility] = useState(false)
    const [secondPwdVisibility, setSecondPwdVisibility] = useState(false)
    const [msg, setMsg] = useState({text: null, visibility: 'collapse', color: null})

    const resetForm = () => {
        setPwdVisibility(false)
        setSecondPwdVisibility(false)
        setMsg({text: null, visibility: 'collapse', color: null})

        document.getElementsByClassName('auth-form')[0].reset()    
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        
        const user = e.target.elements[0].value
        const pwd = e.target.elements[1].value
        const secondPwd = e.target.elements[2].value
        
        if (!user || !pwd || (authMode !== 'LOG_IN' && !secondPwd)) {
            return setMsg({
                text: 'Username and password can not be empty',
                visibility: 'visible',
                color: MSG_COLOR.red
            })
        }  

        if (authMode !== 'LOG_IN' && pwd !== secondPwd) {
            return setMsg({
                text: 'Passwords do not match',
                visibility: 'visible',
                color: MSG_COLOR.red
            })
        }

        if (authMode === 'LOG_IN') {
            axios({
                method: 'post',
                url: '/users/sign_in',
                data: {
                    user: user,
                    pwd: pwd,
                }
            }).then(() => {
                setUser({id: getCookie('userID'), name: getCookie('user')})
            }).catch((err) => {
                return setMsg({
                    text: (err?.response?.data) ? err.response.data : 'Error when logging in. Please try again later...',
                    visibility: 'visible',
                    color: MSG_COLOR.red
                })
            })
            
            return
        }

        if (authMode === 'SIGN_UP') {
            axios({
                method: 'post',
                url: '/users/sign_up',
                data: {
                    user: user,
                    pwd: pwd,
                },
            }).then(() => {
                setMsg({
                    text: 'Sign up successfully!',
                    visibility: 'visible',
                    color: MSG_COLOR.green
                })
            }).catch((err) => {
                return setMsg({
                    text: (err?.response?.data) ? err.response.data : 'Error when signing up. Please try again later...',
                    visibility: 'visible',
                    color: MSG_COLOR.red
                })
            })
        }

        if (authMode === 'RESET_PWD') {
            axios({
                method: 'post',
                url: '/users/reset_pwd',
                data: {
                    user: user,
                    pwd: pwd,
                },
            }).then(() => {
                setMsg({
                    text: 'Reset password successfully!',
                    visibility: 'visible',
                    color: MSG_COLOR.green
                })
            }).catch((err) => {
                return setMsg({
                    text: (err?.respones?.data) ? err.response.data : 'Error when resetting password. Please try again later...',
                    visibility: 'visible',
                    color: MSG_COLOR.red
                })
            })
        }
    }

    return <>
        <div className='background'>
            <form 
                className="auth-form"
                onSubmit={(e) => submitHandler(e)}
                onChange={() => {setMsg({text: null, visibility: 'collapse', color: null})}}
                autoComplete="off"
            >
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {authMode !== 'LOG_IN' && 
                        <div style={{flex: 1, cursor: 'pointer'}}><FaArrowLeft 
                        onClick={() => {
                          setAuthMode('LOG_IN')  
                          resetForm()
                    }}/></div>}
                    <div>
                        <img className='chess-logo' src={process.env.PUBLIC_URL + '/assets/logo.png'} alt='logo'/>
                    </div>
                    {authMode !== 'LOG_IN' && <div style={{flex: 1}}></div>}
                </div>
                <div className="input-container">
                    <FaRegUserCircle className='logo'/>
                    <input type="text" placeholder='Enter your username'/>
                </div>
                <div className="input-container">
                    <FaKeycdn className='logo'></FaKeycdn>
                    <input type={pwdVisibility ? 'text' : 'password'} placeholder='Enter new password'/>
                    {pwdVisibility ? 
                        <FaEyeSlash id='see-pwd-logo' onClick={() => setPwdVisibility(!pwdVisibility)}></FaEyeSlash> :
                        <FaEye id='see-pwd-logo' onClick={() => setPwdVisibility(!pwdVisibility)}></FaEye>
                    }
                </div>
                {authMode !== 'LOG_IN' &&
                    <div className="input-container">
                        <FaKeycdn className='logo'></FaKeycdn>
                        <input type={secondPwdVisibility ? 'text' : 'password'} placeholder='Re-enter your password'/>
                        {secondPwdVisibility ? 
                            <FaEyeSlash id='see-pwd-logo' onClick={() => setSecondPwdVisibility(!secondPwdVisibility)}></FaEyeSlash> :
                            <FaEye id='see-pwd-logo' onClick={() => setSecondPwdVisibility(!secondPwdVisibility)}></FaEye>
                        }
                    </div>
                }
                
                {authMode === 'LOG_IN' && <div className='other-actions'>
                    <div id='rmb-me'>
                        <input className='checkbox' type='checkbox' style={{cursor: 'pointer'}}></input>
                        Remember me
                    </div>
                    <div id='forgot-pwd' style={{cursor: 'pointer'}} 
                        onClick={() => {
                            setAuthMode('RESET_PWD')
                            resetForm()
                    }} >Forgot your password?</div>
                </div>}

                <button type='submit'>
                    <span>{getButton(authMode)}</span>
                </button>

                <div id='footer'>
                    <center id='msg' style={{visibility: msg.visibility, color: msg.color}}>{msg.text}</center>
                    {authMode === 'LOG_IN' && 
                        <div className='sign-up'>Don't have an account? Sign up  
                            <span onClick={() => {
                                setAuthMode('SIGN_UP')
                                resetForm()
                            }}> here!</span>
                        </div>
                    }
                </div>
            </form>
        </div>
    </>
}

const getButton = (authMode) => {
    if (authMode === 'LOG_IN') return 'Log In'
    if (authMode === 'SIGN_UP') return 'Sign Up'
    if (authMode === 'RESET_PWD') return 'Reset Password'
}

