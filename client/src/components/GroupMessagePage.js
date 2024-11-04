import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { HiDotsVertical } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import uploadFile from '../helpers/uploadFile';
import { IoClose } from "react-icons/io5";
import Loading from './Loading';
import backgroundImage from '../assets/wallapaper.jpeg';
import { IoMdSend } from "react-icons/io";
import moment from 'moment';
import notificationAudio from "../assets/notificationaudio.m4a";
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import speakMessage from './speakMessage';
import { FaMicrophone } from "react-icons/fa6";
import { FaInfo } from "react-icons/fa6";
import { FaInfoCircle } from "react-icons/fa";


const SpeakerIcon = ({isSpeaking}) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-volume-2"
      style={{ color: isSpeaking ? 'red' : 'currentColor' }}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  );

  const GroupMessagePage = () => {
    const params = useParams();
    const socketConnection = useSelector(state => state?.user?.socketConnection);
    const user = useSelector(state => state?.user);
    const audioRef = useRef(null);
    const onlineUser = useSelector(state => state?.user?.onlineUser)
    const [groupDetails, setGroupDetails] = useState(null);
    const [allMessages, setAllMessages] = useState([]);
    const [message, setMessage] = useState({ text: "", imageUrl: "", videoUrl: "" });
    const [loading, setLoading] = useState(false);
    const [allMessage, setAllMessage] = useState([]);
    const currentMessage = useRef(null);
    const allUser = useSelector(state => state.user.groups);
    
    // New states for options menu and modal
    const [showOptions, setShowOptions] = useState(false);
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  
  const toggleOptions = () => setShowOptions(!showOptions);

  const handleGroupInfo = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/group/${params.groupId}/details`);
      if (response.ok) {
        const data = await response.json();
        setGroupDetails(data);
        setShowGroupInfoModal(true);
      } else {
        console.error("Failed to fetch group details");
      }
    } catch (error) {
      console.error("Error fetching group details:", error);
    }
    setShowOptions(false);
  };
  
  const closeModal = () => setShowGroupInfoModal(false);

  useEffect(() => {
    if (socketConnection) {
      socketConnection.emit('getGroupDetails', params.groupId);
      socketConnection.on('groupDetails', (data) => {
        if (!data.error) {
          setGroupDetails(data);
        }
      });

      return () => {
        socketConnection.off('groupDetails');
      };
    }
  }, [socketConnection, params.groupId]);
  
  
  const micRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [transText, settransText] = useState("");
  const [textMessage,setTextMessage]=useState("")
  const navigate = useNavigate(); 
  const [statusModal, setStatusModal] = useState(null); // State to manage the status modal

  useEffect(()=>{
    if(currentMessage.current){
        currentMessage.current.scrollIntoView({behavior : 'smooth', block : 'end'})
    }
  },[allMessages])

  useEffect(() => {
    if (socketConnection) {
        // Emit fetch request for previous messages
        socketConnection.emit('getGroupDetails', params.groupId );
        
        // Listen for previous messages
        socketConnection.on('groupDetails', (data) => {
            setGroupDetails(data);
            setAllMessages(data.messages);
            console.log('All messages:', data.messages); // Log all messages received
            console.log('Socket connection:', socketConnection); // Log socket connection status

            // Check if allMessages is populated
            if (data.messages && data.messages.length > 0) {
                data.messages.forEach(message => {
                    console.log('message', message);
                    console.log(user._id);
                    if (message.ind_status.some(status => status.receiver_id === user._id && status.status !== 'seen')) {
                        console.log('Marking previous message as seen:', message._id);
                        //socketConnection.emit('groupMessageIndividualSeen', { messageId: message._id, userId: user._id });
                    }
                });
            } else {
                console.log('No messages to mark as seen.'); // Log if no messages are available
            }
        });

        // Listen for new group messages
        const handleNewGroupMessage = (message) => {
            if (message.groupId === params.groupId) {
                setAllMessages((prevMessages) => [...prevMessages, message]);
                console.log('New message received:', message);
                // Emit seen status for the new message
                if (message.sender !== user._id && message.ind_status.some(status => status.receiver_id === user._id && status.status !== 'seen')) {
                    //socketConnection.emit('groupMessageIndividualSeen', { messageId: message._id, userId: user._id });
                }
            }
        };

        socketConnection.on('newGroupMessage', handleNewGroupMessage);

        // Listen for message status updates
        socketConnection.on('messageStatusUpdated', (data) => {
            console.log('Message status updated for group message',data.messageId,'and',data.status,'for',user.name);
            setAllMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === data.messageId
                        ? {
                            ...msg,
                            ind_status: msg.ind_status.map((status) =>
                                status.receiver_id === data.receiver_id
                                    ? { ...status, status: data.status } // Update the status for the specific receiver
                                    : status
                            ),
                            status: data.status // Update overall status if needed
                        }
                        : msg
                )
            );
        });

        // Cleanup function to remove listeners
        return () => {
            socketConnection.off('previousGroupMessages');
            socketConnection.off('newGroupMessage', handleNewGroupMessage);
            socketConnection.off('messageStatusUpdated');
        };
    }
}, [socketConnection, params.groupId, user._id]);

  console.log('g details',groupDetails)

  const handleSendMessage = async (e) => {
    if (e) {
        e.preventDefault(); // Prevent default form submission
    }

    if (textMessage.trim() || message.imageUrl || message.videoUrl) {
        const newMessage = {
            groupId: params.groupId,
            sender: user._id,
            senderName: user.name,
            text: textMessage,
            translatedText: [], // Initialize translatedText as an empty array
            imageUrl: message.imageUrl,
            videoUrl: message.videoUrl,
            status: [], // Initialize status as an empty array
            ind_status: [] // Initialize individual status as an empty array
        };

        // Temporary storage for translations
        const translationCache = {};

        // Iterate through all languages in the group to translate the message
        await Promise.all(groupDetails.participants.map(async (participant) => {
            if (participant.userId.toString() === user._id.toString()) {
                // If the userId matches the sender, push the original textMessage
                newMessage.translatedText.push({
                    receiver_id: participant.userId,
                    languageCode: participant.language,
                    text: textMessage, // Push the original message
                });
            } else {
                // For other participants, perform translation
                const lang = participant.language; // Get the language code
                if (!translationCache[lang]) { // Check if translation already exists
                    const translatedText = await translateMessage(textMessage, lang);
                    translationCache[lang] = translatedText; // Store the translation
                }
                newMessage.translatedText.push({
                    receiver_id: participant.userId,
                    languageCode: lang,
                    text: translationCache[lang],
                });
            }
        }));

        // Populate the status and ind_status arrays
        let allOnline = true; // Flag to check if all participants are online
        groupDetails.participants.forEach(participant => {
            const isOnline = onlineUser.includes(participant.userId.toString()); // Check if the participant is online
            newMessage.ind_status.push({
                receiver_id: participant.userId,
                status: isOnline ? 'delivered' : 'sent', // Set individual status based on online status
                receiver_name: participant.name // Add receiver name
            });

            if (!isOnline) {
                allOnline = false; // If any participant is offline, set the flag to false
            }
        });

        // Set the overall status based on individual statuses
        newMessage.status = allOnline ? 'delivered' : 'sent'; // Set status to delivered only if all are online

        // Emit the new message to the socket
        socketConnection.emit('new group message', newMessage);
        console.log('New message sending:', newMessage); // Log the message details

        // Clear the message input
        setMessage({ text: "", imageUrl: "", videoUrl: "" }); // Clear message input
        setTextMessage(""); // Clear textMessage state
    }
  };

     // Handle microphone recording for sending voice messages
  const toggleRecording = async () => {
        console.log("Mic button clicked");
        if (isRecording) {
          if (recognizer) {
            recognizer.stopContinuousRecognitionAsync(() => {
              console.log("Stopped recording");
              setIsRecording(false);
              handleSendMessage(); // Automatically send the message when recording stops
            });
          }
        } else {
          console.log("Starting to import Azure SDK");
    
          const {
            SpeechConfig,
            AudioConfig,
            SpeechRecognizer,
          } = await import("microsoft-cognitiveservices-speech-sdk");
    
          console.log("SDK imported successfully");
    
          const speechConfig = SpeechConfig.fromSubscription(
            "7d50303122394b1895f30959285ca290", // Replace with your Azure key
            "southeastasia" // Replace with your Azure region
          );
          
          // Fetch the user’s language
          let userLanguageCode = 'en-US';
          try {
            console.log("speech lan :",user.language)
            userLanguageCode = user.language || 'en-US';  // Default to 'en-US' if no language is found
            console.log("User language:", userLanguageCode);
          } catch (error) {
            console.error("Error fetching user language:", error);
            userLanguageCode = 'en-US';  // Fallback to English in case of error
          }
    
          // Set the language for speech recognition
  
          speechConfig.speechRecognitionLanguage = userLanguageCode; // Use sender's language
          console.log("Speech recognition language set to:", userLanguageCode); // Log the language
    
          const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
          console.log("AudioConfig:", audioConfig);
    
          const recognizerInstance = new SpeechRecognizer(speechConfig, audioConfig);
    
          // Text accumulator to store results across multiple recognitions
          let accumulatedText = '';
    
          recognizerInstance.recognizing = (s, e) => {
            console.log("Recognizing: ", e.result.text);
            setTextMessage(accumulatedText + e.result.text); // Append recognized text
          };
    
          recognizerInstance.recognized = (s, e) => {
            if (e.result.text) {
              console.log("Recognized: ", e.result.text);
              accumulatedText += e.result.text + ' '; // Accumulate recognized text
              setTextMessage(accumulatedText); // Update the message with accumulated text
            }
          };
    
          recognizerInstance.canceled = (s, e) => {
            console.error(`Recognition canceled: ${e.errorDetails}`);
          };
    
          recognizerInstance.sessionStopped = (s, e) => {
            console.log("Recognition session stopped due to silence or other reasons.");
            if (isRecording) {
              // Automatically restart recognition due to pause
              console.log("Restarting recognition due to pause");
              recognizerInstance.startContinuousRecognitionAsync(() => {
                console.log("Resumed recording after pause");
              });
            }
          };
    
          setRecognizer(recognizerInstance);
          recognizerInstance.startContinuousRecognitionAsync(() => {
            console.log("Started recording");
            setIsRecording(true);
          });
        }
  };
  const translateMessage = async (text, targetLang) => {
    const subscriptionKey = "f14a3a47b0cc403aa31da18f496d4e48";
    const region = "southeastasia";
    const endpoint = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;

    const body = JSON.stringify([{ Text: text }]);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const data = await response.json();
      return data[0].translations[0].text; // Extract translated text
    } catch (error) {
      console.error("Error translating message:", error);
      return text;
    }
  };

  const getMessageText = (message) => {
    // If the sender is not the current user, find the translated text for the current user
    const translatedText = message.translatedText.find(t => t.receiver_id === user._id);
    return translatedText ? translatedText.text : message.text; // Show translated text or fallback to original
  };

  const handleStatusClick = (message) => {
    setStatusModal({
        status: message.ind_status // Set the ind_status array for the modal
    }); // Set the current message to show its status
  };

  const closeStatusModal = () => {
    setStatusModal(null); // Close the status modal
  };

  const getMessageStatusIcon = (msg) => {
     // Find the status for the current user
    if (user._id ===msg.sender) {
        if (msg.status === 'seen') {
            return <DoneAllIcon fontSize='small' className='text-blue-500'/>; // Blue double tick for seen
        } else if (msg.status === 'delivered') {
            return <DoneAllIcon fontSize='small'/>; // Grey double tick for delivered
        } else {
            return <CheckIcon fontSize='small'/>; // Grey single tick for sent
        }
    }
    return null; // No icon for received messages
  };

  return (
    <div style={{ backgroundImage: `url(${backgroundImage})` }} className='bg-no-repeat bg-cover'>
      <header className='sticky top-0 h-16 bg-white flex justify-between items-center px-4'>
        <div className='flex items-center gap-4'>
          <Link to={"/"} className='lg:hidden'>
            <FaAngleLeft size={25} />
          </Link>
          <div>
            <Avatar
              width={50}
              height={50}
              imageUrl={groupDetails?.groupPhoto}
              name={groupDetails?.groupName}
              userId={groupDetails?._id}
            />
          </div>
          <div>
            <h3 className='font-semibold text-lg my-0 text-ellipsis line-clamp-1'>{groupDetails?.groupName}</h3>
          </div>
        </div>
        <div className="relative">
  <button className="cursor-pointer hover:text-primary" onClick={toggleOptions}>
    <HiDotsVertical />
  </button>
  {showOptions && (
    <div
      className="absolute flex bg-white border rounded shadow-lg"
      style={{
        zIndex: 1000, // Ensure it appears on top
        position: "absolute",
        top: "50%", // Adjust vertically
        right: "100%", // Position to the left of the button
        transform: "translateY(-50%)", // Center vertically
        padding: "2px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        pointerEvents: "auto",
      }}
    >
      <button
        className="px-2 py-1 text-sm hover:bg-gray-100"
        style={{ fontSize: "0.85rem", minWidth: "80px" }} // Adjusted font and width
        onClick={handleGroupInfo}
      >
        Group Info
      </button>
      <button
        className={`px-2 py-1 text-sm ${user._id === groupDetails?.admin._id ? 'hover:bg-gray-100 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
        style={{ fontSize: "0.85rem", minWidth: "80px" }} // Adjusted font and width
        onClick={() => {
          if (user._id === groupDetails?.admin._id) {
            // Add Member Logic
          } else {
            alert("You don't have permission to add members.");
          }
        }}
        disabled={user._id !== groupDetails?.admin._id}
      >
        Add Member
      </button>
      <button
        className={`px-2 py-1 text-sm ${user._id === groupDetails?.admin._id ? 'hover:bg-gray-100 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
        style={{ fontSize: "0.85rem", minWidth: "80px" }} // Adjusted font and width
        onClick={() => {
          if (user._id === groupDetails?.admin._id) {
            // Remove Member Logic
          } else {
            alert("You don't have permission to remove members.");
          }
        }}
        disabled={user._id !== groupDetails?.admin._id}
      >
        Remove Member
      </button>
    </div>
  )}
</div>

      </header>

      {showGroupInfoModal && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-80">
      <h3 className="text-lg font-semibold mb-4">Group Information</h3>
      <p className="mb-2"><strong>Group Name:</strong> {groupDetails?.groupName}</p>
      <p className="mb-2"><strong>Admin:</strong> {groupDetails?.admin?.name}</p>
      <p className="mb-2"><strong>Participants:</strong></p>
      <ul className="list-disc list-inside">
        {groupDetails?.participants?.map((participant) => (
          <li key={participant._id}>{participant.name}</li>
        ))}
      </ul>
      <button
        onClick={closeModal}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  </div>
)}

      <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
        <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
          {allMessages.map((msg) => (
            <div key={msg._id} className={`p-1 py-1 rounded w-fit max-w-[380px] md:max-w-sm lg:max-w-md ${msg.sender === user._id ? "ml-auto bg-teal-100" : "bg-white"}`}>
              
              <p className='px-2 font-semibold'>
                {msg.sender=== user._id ? msg.text : getMessageText(msg)} {/* Directly render text if the user is the sender */}
              </p>
              <p className='text-xs text-gray-500'>{msg.sender !== user._id ? msg.senderName || '?' : ''}</p> {/* Display sender's name or default message only for received messages */}
              <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
              {getMessageStatusIcon(msg)} {/* Display the message status icon */}
              <button onClick={() => handleStatusClick(msg)} className="text-blue-500 text-xs">
                <FaInfoCircle size={13} />
              </button> {/* Button to view status */}
            </div>
          ))}
        </div>

        {loading && (
          <div className='w-full h-full flex sticky bottom-0 justify-center items-center'>
            <Loading />
          </div>
        )}
      </section>

      <section className='h-16 bg-white flex items-center px-4'>
        <form 
          className='h-full w-full flex gap-2' 
          onSubmit={(e) => {
            e.preventDefault(); // Prevent form submission
            handleSendMessage();
            if (isRecording) {
              toggleRecording(); // Stop the microphone if it's recording
            } // Call send message logic when form is submitted
          }} 
        >
          <input
            type='text'
            placeholder='Type here message...'
            className='py-1 px-4 outline-none w-full h-full'
            value={textMessage}
            onChange={(e) => setTextMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission on Enter
                handleSendMessage();
                if (isRecording) {
                  toggleRecording(); // Stop the microphone if it's recording
                } // Trigger the send message function
              }
            }}
          />
          <button
            type='submit'
            className='text-primary hover:text-secondary'
          >
            <IoMdSend size={28} />
          </button>
        </form>

        <audio ref={audioRef} src={notificationAudio} preload='auto'></audio>

        {/**Microphone Button */}
        <button onClick={toggleRecording} className={`ml-2 flex justify-center items-center w-11 h-11 rounded-full ${isRecording ? 'bg-red-500' : 'hover:bg-primary hover:text-white'}`}>
          <FaMicrophone size={20} />
        </button>
      </section>

      {/* Status Modal */}
      {statusModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h3 className="font-bold">Message Status</h3>
            <ul>
                {Array.isArray(statusModal.status) ? (
                    statusModal.status.map((status) => (
                        <li key={status.receiver_id}>
                            {status.receiver_name}: {status.status} {/* Display receiver name and status */}
                        </li>
                    ))
                ) : (
                    <li>No status available</li> // Fallback if status is not an array
                )}
            </ul>
            <button onClick={closeStatusModal} className="mt-2 text-red-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMessagePage;

