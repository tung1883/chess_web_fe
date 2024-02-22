import { useState, useEffect, useRef } from "react";
import { Routes, Route, HashRouter, BrowserRouter } from 'react-router-dom';
import axios from "axios";
import { CurrentUserContext, DocumentTitleContext } from "./Contexts";

import './css/App.css';
import Auth from './Auth';
import Main from './Main';
import { getCookie, deleteCookie } from "./functionalities/cookie";

export default function App() {
  axios.defaults.withCredentials = true;
  axios.defaults.baseURL = "https://kqth8v9b-8000.asse.devtunnels.ms/"

  const [user, setUser] = useState(null)
  const [title, setTitle] = useState('Play Chess') //set document title
  const EXPIRE_CHECK_GAP = 5 * 1000 //gap time between each cookie expiration check

  useEffect(() => {
    console.log(user)
    //set up user intially and also check for expiration periodically
    const checkUser = () => {
      const currentUser = getUserFromCookies()
      if (user !== currentUser) setUser(currentUser)

      return setTimeout(() => checkUser(), EXPIRE_CHECK_GAP)
    }

    checkUser() 
  }, [])

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <DocumentTitleContext.Provider value={{title: title, setTitle: setTitle}}>
      <CurrentUserContext.Provider value={{user: user, setUser: setUser}}>
        <BrowserRouter>
          <Routes path='/'>
            <Route path='/' element ={(user) ? <Main/> : <Auth/>}/>
          </Routes>
        </BrowserRouter>
      </CurrentUserContext.Provider>
    </DocumentTitleContext.Provider>
  )
}

const getUserFromCookies = () => {
  //each of these cookies expires in 15 min.
  if (getCookie('token_payload') && getCookie('user') && getCookie('userID')) {
    return {
      id: getCookie('userID'), 
      name: getCookie('user')
    }
  }

  return null
}

export const logOut = (setUser) => {
  deleteCookie('token_payload')
  deleteCookie('user')
  deleteCookie('userID')

  setUser(null)
}