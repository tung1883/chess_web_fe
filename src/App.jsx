import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter, 
  Routes,
  Route,
} from 'react-router-dom';
import { io } from "socket.io-client";
import axios from "axios";

import './css/App.css';
import Login from './Login';
import Main from './Main';
import getCookieValue from "./functionalities/GetCookie";

export default function App() {
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = "http://localhost:8000/"
  
  const socket = io('http://localhost:8000', {
    autoConnect: false
  })

  const getUser = () => {
    //each of these cookies expires in 15 min.
    if (getCookieValue('token_payload') && getCookieValue('user') && getCookieValue('userID')) {
      return [getCookieValue('userID'), getCookieValue('user')]
    }

    return null
  }

  const [userState, setUserState] = useState(null) 

  const setUser = () => {
    setUserState(getUser())
    return setTimeout(() => setUser(), 5 * 1000)
  }
   
  useEffect(() => {
    setUser() 
  }, [])
  
  useEffect(() => {
    if (!socket.connected) socket.connect()
  }, [socket.connected])

  return (
    <BrowserRouter>
      <Routes path='/'>
        <Route path='/' element ={<Login userState={userState} setUserState={setUserState}></Login>}></Route>
        <Route path='/main' element={<Main userState={userState}></Main>}></Route>
      </Routes>
    </BrowserRouter>
  )
}