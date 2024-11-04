import React, { useEffect, useState } from 'react'; 
import { IoChatbubbleEllipses } from "react-icons/io5";
import { FaUserPlus } from "react-icons/fa";
import { NavLink, useNavigate } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import Avatar from './Avatar';
import { useDispatch, useSelector } from 'react-redux';
import EditUserDetails from './EditUserDetails';
import Divider from './Divider';
import { FiArrowUpLeft } from "react-icons/fi";
import SearchUser from './SearchUser';
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import { logout } from '../redux/userSlice';
import GroupSidebar from './GroupSidebar'; // Import GroupSidebar
import { FaUsers } from "react-icons/fa"; // Import Create Group icon
import CreateGroup from './CreateGroup'; // Import CreateGroup component

const Sidebar = () => {
    const user = useSelector(state => state?.user);
    const [editUserOpen, setEditUserOpen] = useState(false);
    const [allUser, setAllUser] = useState([]);
    const [openSearchUser, setOpenSearchUser] = useState(false);
    const [openCreateGroup, setOpenCreateGroup] = useState(false); // State for Create Group modal
    const socketConnection = useSelector(state => state?.user?.socketConnection);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // State to manage which sidebar to show
    const [showGroupSidebar, setShowGroupSidebar] = useState(false);

    useEffect(() => {
        if (socketConnection) {
            socketConnection.emit('sidebar', user._id);
            socketConnection.emit('checkOfflineMessages', user._id);

            socketConnection.on('conversation', (data) => {
                const conversationUserData = data.map((conversationUser) => {
                    const otherUser = conversationUser?.sender?._id === user?._id
                        ? conversationUser.receiver
                        : conversationUser.sender;

                    return {
                        ...conversationUser,
                        userDetails: otherUser
                    };
                });

                const uniqueUsers = conversationUserData.filter(
                    (conv, index, self) =>
                        index === self.findIndex((c) => c.userDetails?._id === conv.userDetails?._id)
                );

                setAllUser(uniqueUsers);
            });

            return () => {
                socketConnection.off('conversation');
            };
        }
    }, [socketConnection, user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/email");
        localStorage.clear();
    };

    const handleGroupCreated = (newGroup) => {
        console.log('New Group Created:', newGroup);
        setOpenCreateGroup(false);
    };

    return (
        <div className='w-full h-full grid grid-cols-[48px,1fr] bg-white'>
            <div className='bg-slate-100 w-12 h-full rounded-tr-lg rounded-br-lg py-5 text-slate-600 flex flex-col justify-between'>
                <div>
                    <NavLink className={({ isActive }) => `w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded ${isActive && "bg-slate-200"}`} title='chat'>
                        <IoChatbubbleEllipses size={20} />
                    </NavLink>

                    <div title='add friend' onClick={() => setOpenSearchUser(true)} className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded'>
                        <FaUserPlus size={20} />
                    </div>

                    <div title='Create a group' onClick={() => setOpenCreateGroup(true)} className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded'>
                        <FaUsers size={20} />
                    </div>

                    {openCreateGroup && (
                        <CreateGroup onClose={() => setOpenCreateGroup(false)} onGroupCreated={handleGroupCreated} />
                    )}
                </div>

                <div className='flex flex-col items-center'>
                    <button className='mx-auto' title={user?.name} onClick={() => setEditUserOpen(true)}>
                        <Avatar
                            width={40}
                            height={40}
                            name={user?.name}
                            imageUrl={user?.profile_pic}
                            userId={user?._id}
                        />
                    </button>
                    <button title='logout' className='w-12 h-12 flex justify-center items-center cursor-pointer hover:bg-slate-200 rounded' onClick={handleLogout}>
                        <span className='-ml-2'>
                            <BiLogOut size={20} />
                        </span>
                    </button>
                </div>
            </div>

            <div className='w-full'>
                {/* Implicit Toggle between Messages and Group Chats */}
                <div className='flex justify-center items-center bg-slate-100 p-4'>
                    <button
                        onClick={() => setShowGroupSidebar(false)}
                        className={`px-4 py-2 rounded ${!showGroupSidebar ? 'bg-blue-500 text-white' : 'text-slate-800'}`}
                    >
                        Message
                    </button>
                    <button
                        onClick={() => setShowGroupSidebar(true)}
                        className={`px-4 py-2 rounded ${showGroupSidebar ? 'bg-blue-500 text-white' : 'text-slate-800'}`}
                    >
                        Group Chat
                    </button>
                </div>

                {showGroupSidebar ? <GroupSidebar /> : (
                    <>
                        <div className='bg-slate-200 p-[0.5px]'></div>

                        <div className='h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar'>
                            {
                                allUser.length === 0 && (
                                    <div className='mt-12'>
                                        <div className='flex justify-center items-center my-4 text-slate-500'>
                                            <FiArrowUpLeft size={50} />
                                        </div>
                                        <p className='text-lg text-center text-slate-400'>Explore users to start a conversation with.</p>
                                    </div>
                                )
                            }

                            {
                                allUser.map((conv, index) => {
                                    return (
                                        <NavLink to={"/" + conv?.userDetails?._id} key={conv?._id} className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
                                            <div>
                                                <Avatar
                                                    imageUrl={conv?.userDetails?.profile_pic}
                                                    name={conv?.userDetails?.name}
                                                    width={40}
                                                    height={40}
                                                />
                                            </div>
                                            <div>
                                                <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>{conv?.userDetails?.name}</h3>
                                                <div className='text-slate-500 text-xs flex items-center gap-1'>
                                                    <div className='flex items-center gap-1'>
                                                        {
                                                            conv?.lastMsg?.imageUrl && (
                                                                <div className='flex items-center gap-1'>
                                                                    <span><FaImage /></span>
                                                                    {!conv?.lastMsg?.text && <span>Image</span>}
                                                                </div>
                                                            )
                                                        }
                                                        {
                                                            conv?.lastMsg?.videoUrl && (
                                                                <div className='flex items-center gap-1'>
                                                                    <span><FaVideo /></span>
                                                                    {!conv?.lastMsg?.text && <span>Video</span>}
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                    <p className='text-ellipsis line-clamp-1'>{conv?.lastMsg?.text}</p>
                                                </div>
                                            </div>
                                            {
                                                Boolean(conv?.unseenMsg) && (
                                                    <p className='text-xs w-6 h-6 flex justify-center items-center ml-auto p-1 bg-primary text-white font-semibold rounded-full'>{conv?.unseenMsg}</p>
                                                )
                                            }
                                        </NavLink>
                                    )
                                })
                            }
                        </div>
                    </>
                )}
            </div>

            {/**edit user details */}
            {
                editUserOpen && (
                    <EditUserDetails onClose={() => setEditUserOpen(false)} user={user} />
                )
            }

            {/**search user */}
            {
                openSearchUser && (
                    <SearchUser onClose={() => setOpenSearchUser(false)} />
                )
            }
        </div>
    );
}

export default Sidebar;