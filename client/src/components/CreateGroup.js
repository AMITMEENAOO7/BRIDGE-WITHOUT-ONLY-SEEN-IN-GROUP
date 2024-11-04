import React, { useEffect, useState, useRef } from 'react';
import { IoSearchOutline, IoClose } from "react-icons/io5";
import { FaUserPlus } from 'react-icons/fa';
import Loading from './Loading';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useSelector } from 'react-redux'; // Import useSelector
import uploadFile from '../helpers/uploadFile'; // Import uploadFile function

const CreateGroup = ({ onClose, onGroupCreated }) => {
    const [searchUser, setSearchUser] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [groupPhoto, setGroupPhoto] = useState(null); // New state for group photo
    const [photoPreview, setPhotoPreview] = useState(null); // New state for photo preview
    const uploadPhotoRef = useRef(); // Ref for file input
    const [participantDetails, setParticipantDetails] = useState([]); // New state for participant details

    // Get user and adminId from the Redux store
    const user = useSelector((state) => state.user); // Get the user object
    const adminId = user._id; // Assuming the user slice is set up correctly

    const fetchUsers = async () => {
        const URL = `${process.env.REACT_APP_BACKEND_URL}/api/search-user`;
        try {
            setLoading(true);
            const response = await axios.post(URL, { search: "" }); // Fetch all users by default
            setLoading(false);
            setSearchUser(response.data.data);
        } catch (error) {
            setLoading(false);
            toast.error(error?.response?.data?.message);
        }
    };

    useEffect(() => {
        fetchUsers(); // Fetch users on mount
    }, []);

    useEffect(() => {
        if (search) {
            handleSearchUser();
        } else {
            fetchUsers(); // Reset to all users if search input is cleared
        }
    }, [search]);

    const handleSearchUser = async () => {
        const URL = `${process.env.REACT_APP_BACKEND_URL}/api/search-user`;
        try {
            setLoading(true);
            const response = await axios.post(URL, { search });
            setLoading(false);
            setSearchUser(response.data.data);
        } catch (error) {
            setLoading(false);
            toast.error(error?.response?.data?.message);
        }
    };

    const toggleUserSelection = (user) => {
        if (selectedUsers.find((u) => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleOpenUploadPhoto = (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadPhotoRef.current.click(); // Trigger file input click
    };

    const handleUploadPhoto = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            toast.error("No file selected.");
            return;
        }

        try {
            const uploadPhoto = await uploadFile(file); // Upload the photo
            console.log("Uploaded Photo URL:", uploadPhoto?.url); // Debugging log
            setGroupPhoto(uploadPhoto?.url); // Set the uploaded photo URL

            // Create a preview URL for the uploaded photo
            const previewUrl = URL.createObjectURL(file);
            setPhotoPreview(previewUrl); // Set the preview URL
        } catch (error) {
            console.error("Error uploading photo:", error); // Debugging log
            toast.error("Failed to upload photo.");
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length === 0) {
            toast.error("Please enter a group name and select at least one user.");
            return;
        }
        // Include admin in the participants list
        const participants = selectedUsers.map(user => ({
            userId: user._id,
            name: user.name,
            language: user.language // Assuming you have this in your user object
        }));
        participants.push({ userId: adminId, name: user.name, language: user.language }); // Add admin details

        const URL = `${process.env.REACT_APP_BACKEND_URL}/api/create-group`;
        try {
            const response = await axios.post(URL, {
                groupName,
                adminId,
                participants,
                groupPhoto // Include the uploaded group photo
            });
            toast.success("Group created successfully!");
            onGroupCreated(response.data.group);
            resetForm(); // Reset the form after successful group creation
            onClose();
        } catch (error) {
            console.error("Error creating group:", error); // Debugging log
            toast.error("Failed to create group.");
        }
    };

    // Function to reset the form
    const resetForm = () => {
        setGroupName("");
        setSelectedUsers([]);
        setSearch("");
        setSearchUser([]); // Optionally reset the search results
        setGroupPhoto(null); // Reset group photo
        setPhotoPreview(null); // Reset photo preview
    };
    console.log('participent details',participantDetails)
    return (
        <div className='fixed inset-0 bg-slate-700 bg-opacity-60 flex justify-center items-center z-20'>
            {/* Modal Container */}
            <div className='w-full max-w-md bg-white rounded-lg shadow-lg p-4'>
                {/* Header with Group Name */}
                <div className='flex items-center justify-between mb-4'>
                    <input
                        type='text'
                        placeholder='Name your group'
                        className='w-full text-lg font-medium outline-none px-2 py-1 border-b border-gray-300'
                        onChange={(e) => setGroupName(e.target.value)}
                        value={groupName}
                    />
                    <button onClick={onClose} className='text-gray-600 hover:text-black ml-2'>
                        <IoClose size={24} />
                    </button>
                </div>

                {/* Upload Group Photo */}
                <div className='flex flex-col mb-4'>
                    <label className='text-sm'>Upload Group Photo:</label>
                    <button onClick={handleOpenUploadPhoto} className='border border-gray-300 rounded p-2 text-gray-600'>
                        Choose Photo
                    </button>
                    <input
                        type='file'
                        ref={uploadPhotoRef}
                        className='hidden'
                        onChange={handleUploadPhoto}
                    />
                    {/* Preview of the uploaded photo */}
                    {photoPreview && (
                        <img
                            src={photoPreview}
                            alt="Group Preview"
                            className='mt-2 w-full h-32 object-cover rounded'
                        />
                    )}
                </div>

                {/* Selected Users */}
                <div className='flex overflow-x-auto space-x-2 p-2 bg-gray-100 rounded mb-2'>
                    {selectedUsers.map((user) => (
                        <div key={user._id} className='flex items-center space-x-1 p-1 rounded-full bg-slate-200'>
                            <p className='text-sm'>{user.name}</p>
                            <button
                                className='text-red-500'
                                onClick={() => toggleUserSelection(user)}
                            >
                                <IoClose size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Search Bar */}
                <div className='flex items-center px-3 py-2 bg-gray-100 rounded'>
                    <IoSearchOutline size={20} className='text-gray-500' />
                    <input
                        type='text'
                        placeholder='Search contacts...'
                        className='w-full outline-none ml-2 text-sm'
                        onChange={(e) => setSearch(e.target.value)}
                        value={search}
                    />
                </div>

                {/* User List */}
                <div className='max-h-64 overflow-y-auto mt-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200'>
                    {loading ? (
                        <Loading />
                    ) : (
                        searchUser.length > 0 ? (
                            searchUser.map((user) => {
                                
                                return (
                                    <div
                                        key={user._id}
                                        className={`p-2 flex items-center cursor-pointer ${selectedUsers.find((u) => u._id === user._id) ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                                        onClick={() => {
                                            toggleUserSelection(user);
                                            
                                            
                                            setParticipantDetails(prev => [
                                                ...prev,
                                                { userId: user._id, name: user.name, language: user.language }
                                            ]);
                                        }}
                                    >
                                        <FaUserPlus className='text-gray-600 mr-3' size={16} />
                                        <p className='text-sm'>{user.name}</p>
                                        {selectedUsers.find((u) => u._id === user._id) && (
                                            <span className='ml-auto text-green-500 text-sm'>Selected</span>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className='text-center text-gray-500 mt-2'>No contacts found</p>
                        )
                    )}
                </div>

                {/* Create Group Button */}
                <button
                    onClick={handleCreateGroup}
                    className='w-full bg-green-500 text-white font-semibold py-2 mt-4 rounded hover:bg-green-600 transition'
                >
                    Create Group
                </button>
            </div>
        </div>
    );
};

export default CreateGroup;