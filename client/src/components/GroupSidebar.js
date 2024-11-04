import React, { useEffect, useState } from 'react'; 
import { NavLink, useNavigate } from 'react-router-dom';
import { BiLogOut } from "react-icons/bi";
import Avatar from './Avatar';
import { useDispatch, useSelector } from 'react-redux';
import EditUserDetails from './EditUserDetails';
import { FiArrowUpLeft } from "react-icons/fi";
import SearchUser from './SearchUser';
import CreateGroup from './CreateGroup';
import { logout } from '../redux/userSlice';

const GroupSidebar = () => {
  const user = useSelector(state => state.user);
  const allUser = useSelector(state => state.user.groups);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [openSearchUser, setOpenSearchUser] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [AllUser, setAllUser] = useState('');
  const socketConnection = useSelector(state => state?.user?.socketConnection);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (socketConnection) {
      socketConnection.emit('groupsidebar', user._id);
      socketConnection.emit('checkOfflineIndividualGroupMessages', user._id);

      const handleGroupConversations = (data) => {
        const groupUserData = data.map((group) => ({
          _id: group._id,
          groupName: group.groupName,
          admin: group.admin,
          unseenMsg: group.unseenMsg,
          groupPhoto: group.groupPhoto,
          messages: group.messages,
          participants: group.participants,
        }));
        setAllUser(groupUserData);
      };

      const handleNewGroupMessage = (newMessage) => {
        setAllUser((prevGroups) => {
          return prevGroups.map(group => {
            if (group._id === newMessage.groupId) {
              return {
                ...group,
                messages: [...group.messages, newMessage],
                unseenMsg: group.unseenMsg + 1
              };
            }
            return group;
          });
        });
      };

      socketConnection.on('groupConversations', handleGroupConversations);
      socketConnection.on('newGroupMessage', handleNewGroupMessage);

      return () => {
        socketConnection.off('groupConversations', handleGroupConversations);
        socketConnection.off('newGroupMessage', handleNewGroupMessage);
      };
    }
  }, [socketConnection, user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/email");
    localStorage.clear();
  };

  const handleGroupCreated = (newGroup) => {
    setAllUser((prevGroups) => [...prevGroups, newGroup]);
    navigate(`/group/${newGroup._id}`);
  };

  const getLastMessageText = (messages) => {
    if (messages.length === 0) return "No messages yet";

    const lastMessage = messages[0];
    
    if (lastMessage.sender._id === user._id) {
      return lastMessage.text;
    } else {
      const translatedText = lastMessage.translatedText.find(t => t.receiver_id === user._id);
      return translatedText ? translatedText.text : lastMessage.text;
    }
  };

  return (
    <div className='w-full h-full bg-white'>
      <div className='h-[calc(100vh-65px)] overflow-x-hidden overflow-y-auto scrollbar'>
        {(!AllUser || AllUser.length === 0) && (
          <div className='mt-12 flex flex-col items-center'>
            <FiArrowUpLeft size={50} />
            <p className='text-lg text-center text-slate-400'>Explore groups to start a conversation with.</p>
          </div>
        )}

        {AllUser && AllUser.map((group) => (
          <NavLink to={"/group/" + group._id} key={group._id} className='flex items-center gap-2 py-3 px-2 border border-transparent hover:border-primary rounded hover:bg-slate-100 cursor-pointer'>
            <Avatar
              imageUrl={group.groupPhoto}
              name={group.groupName}
              width={40}
              height={40}
            />
            <div className='flex flex-col'>
              <h3 className='text-ellipsis line-clamp-1 font-semibold text-base'>{group.groupName}</h3>
              {group.admin._id === user._id && (
                <span className='text-xs text-green-500'>Admin</span>
              )}
              <div className='text-slate-500 text-xs flex items-center gap-1'>
                <p className='text-ellipsis line-clamp-1'>
                  {getLastMessageText(group.messages)}
                </p>
              </div>
            </div>
          </NavLink>
        ))}
      </div>

      {editUserOpen && (
        <EditUserDetails onClose={() => setEditUserOpen(false)} user={user} />
      )}

      {openSearchUser && (
        <SearchUser onClose={() => setOpenSearchUser(false)} />
      )}

      {openCreateGroup && (
        <CreateGroup onClose={() => setOpenCreateGroup(false)} onGroupCreated={handleGroupCreated} />
      )}
    </div>
  );
};

export default GroupSidebar;