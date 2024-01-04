import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegUserCircle, FaKeycdn, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

import './css/Login.css'
import getCookie from "./functionalities/GetCookie";

export default function Login({ userState, setUserState }) {
    const [seePwd, setSeePwd] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (userState) { 
            navigate('/main')
        }
    }, [userState])

    const submitHandler = async (e) => {
        e.preventDefault();
        
        axios({
            method: 'post',
            url: '/users/sign_in',
            data: {
                user: e.target.elements[0].value,
                pwd: e.target.elements[1].value,
            }, 
        }).then(() => {
            setUserState([getCookie('userID'), getCookie('user')])
            navigate('/main')
        }).catch((err) => console.log(err))
    }

    return <>
        <div className='background'>
            <form 
                className="login-form"
                onSubmit={(e) => submitHandler(e)}
            >
                <center>
                    <img className='chess-logo' src={process.env.PUBLIC_URL + '/assets/logo.png'} alt='logo'></img>
                </center>
                <div className="input-container">
                    <FaRegUserCircle className='logo'></FaRegUserCircle>
                    <input type="text" placeholder='Enter your username'/>
                </div>
                <div className="input-container">
                    <FaKeycdn className='logo'></FaKeycdn>
                    <input type={seePwd ? 'text' : 'password'} placeholder='Enter your password'/>
                    {seePwd ? 
                        <FaEyeSlash id='see-pwd-logo' onClick={() => setSeePwd(!seePwd)}></FaEyeSlash> :
                        <FaEye id='see-pwd-logo' onClick={() => setSeePwd(!seePwd)}></FaEye>
                    }
                </div>
                <div className='other-actions'>
                    <div id='rmb-me'>
                        <input className='checkbox' type='checkbox' style={{cursor: 'pointer'}}></input>
                        Remember me
                    </div>
                    <div id='forgot-pwd' style={{cursor: 'pointer'}}>Forgot your password?</div>
                </div>

                <button type='submit'>
                    <span>Log In</span>
                </button>

                <div className='sign-up'>Don't have an account? Sign up <span>here!</span></div>
            </form>
        </div>
    </>
}