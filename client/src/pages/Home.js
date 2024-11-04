import axios from 'axios' 
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { logout, setOnlineUser, setSocketConnection, setUser, setGroups } from '../redux/userSlice'
import Sidebar from '../components/Sidebar' // Sidebar remains as the default
import logo from '../assets/nav-logo.png'
import io from 'socket.io-client'

const Home = () => {
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  
  const fetchUserDetails = async () => {
    try {
      const URL = `${process.env.REACT_APP_BACKEND_URL}/api/user-details`
      const response = await axios({
        url: URL,
        withCredentials: true
      })

      dispatch(setUser(response.data.data))

      // Fetch groups for the user
      const groupsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user-groups/${response.data.data._id}`);
      dispatch(setGroups(groupsResponse.data.groups)); // Store groups in Redux

      if (response.data.data.logout) {
        dispatch(logout())
        navigate("/email")
      }
    } catch (error) {
      console.log("error", error)
    }
  }

  useEffect(() => {
    fetchUserDetails()
  }, [])

  /***socket connection */
  useEffect(() => {
    const socketConnection = io(process.env.REACT_APP_BACKEND_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
    })

    socketConnection.on('onlineUser', (data) => {
      dispatch(setOnlineUser(data))
    })

    socketConnection.on('userDisconnected', (userId) => {
      dispatch(setOnlineUser((prevOnlineUsers) =>
        prevOnlineUsers.filter(id => id !== userId)
      ))
    })

    dispatch(setSocketConnection(socketConnection))

    return () => {
      socketConnection.disconnect()
    }
  }, [dispatch])

  const basePath = location.pathname === '/'

  return (
    <div className='grid lg:grid-cols-[300px,1fr] h-screen max-h-screen'>
      <section className={`bg-white ${!basePath && "hidden"} lg:block`}>
        {/* Sidebar component */}
        <Sidebar />
      </section>

      {/**message component */}
      <section className={`${basePath && "hidden"}`}>
        <Outlet />
      </section>

      {basePath && (
        <div className="flex flex-col justify-center items-center gap-4 lg:flex hidden">
          <img
            src={logo}
            width={150}
            alt='logo'
          />
          <h1 className='text-8xl font-extrabold text-gray-800 tracking-wider drop-shadow-md'>
            B.R.I.D.G.E
          </h1>
          <p className='text-base text-slate-500 mt-4'>
            (<span className='font-bold text-gray-900'>B</span>ilingual <span className='font-bold text-gray-900'>R</span>eal-time <span className='font-bold text-gray-900'>I</span>nterpretation & <span className='font-bold text-gray-900'>D</span>ata-driven <span className='font-bold text-gray-900'>G</span>lobal <span className='font-bold text-gray-900'>E</span>cosystem)
          </p>
          <p className='text-lg mt-2 text-slate-500'>Select user to send message</p>
        </div>
      )}
    </div>
  )
}

export default Home