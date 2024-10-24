import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import { HiDotsVertical } from "react-icons/hi";
import { FaAngleLeft } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { FaImage } from "react-icons/fa6";
import { FaVideo } from "react-icons/fa6";
import uploadFile from '../helpers/uploadFile';
import { IoClose } from "react-icons/io5";
import Loading from './Loading';
import backgroundImage from '../assets/wallapaper.jpeg'
import { IoMdSend } from "react-icons/io";
import moment from 'moment'
import notificationAudio from "../assets/notificationaudio.m4a"
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import speakMessage from './speakMessage';
import { FaMicrophone } from "react-icons/fa6"; // Microphone icon added

 
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
 
const MessagePage = () => {
  const params = useParams()
  const socketConnection = useSelector(state => state?.user?.socketConnection)
  const onlineUser = useSelector(state => state?.user?.onlineUser)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const user = useSelector(state => state?.user)
  const [dataUser,setDataUser] = useState({
    name : "",
    email : "",
    profile_pic : "",
    online : false,
    language:'',
    _id : ""
  })
  const [openImageVideoUpload,setOpenImageVideoUpload] = useState(false)
  const [message,setMessage] = useState({
    text : "",
    imageUrl : "",
    videoUrl : ""
  })
  const [loading,setLoading] = useState(false)
  const [allMessage,setAllMessage] = useState([])
  const currentMessage = useRef(null)
  const audioRef = useRef(null);
  const micRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizer, setRecognizer] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [transText, settransText] = useState("");
  const [textMessage,setTextMessage]=useState("")
  const navigate = useNavigate(); // Initialize useNavigate
   // Ref for the notification audio
  useEffect(()=>{
      if(currentMessage.current){
          currentMessage.current.scrollIntoView({behavior : 'smooth', block : 'end'})
      }
  },[allMessage,activeChatId])
 
  const handleUploadImageVideoOpen = ()=>{
    setOpenImageVideoUpload(preve => !preve)
  }
  
  
  const handleUploadImage = async(e)=>{
    const file = e.target.files[0]
 
    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)
 
    setMessage(preve => {
      return{
        ...preve,
        imageUrl : uploadPhoto.url
      }
    })
  }
  const handleClearUploadImage = ()=>{
    setMessage(preve => {
      return{
        ...preve,
        imageUrl : ""
      }
    })
  }

 
  const handleUploadVideo = async(e)=>{
    const file = e.target.files[0]
 
    setLoading(true)
    const uploadPhoto = await uploadFile(file)
    setLoading(false)
    setOpenImageVideoUpload(false)
 
    setMessage(preve => {
      return{
        ...preve,
        videoUrl : uploadPhoto.url
      }
    })
  }
  const handleClearUploadVideo = ()=>{
    setMessage(preve => {
      return{
        ...preve,
        videoUrl : ""
      }
    })
  }
  const { userId } = useParams();
  console.log(' reciver ID',userId)
  const isOnlineRec = onlineUser.includes(params.userId)
  const isOnlineME = onlineUser.includes(user._Id)
  console.log('online reciver',isOnlineRec)
  console.log('online ME',isOnlineME)

    // The ID of the other person
  const myId = user._id;  
  console.log('my id',myId) 
  

  const updateMessageStatus = async (messageId, status) => {
    try {
        const response = await fetch('/api/messages/update-status', {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messageId,
                status,
            }),
        });
        console.log('rrreessponee', response);
        if (!response.ok) {
            throw new Error("Failed to update message status");
        }

        const data = await response.json();
        console.log("Message status updated:", data);

        // Remove the recursive call to prevent infinite loop
        // updateMessageStatus(messageId, status); // This line should be removed

        // Emit real-time updates based on the status
        if (status === 'delivered') {
            socketConnection.emit("messageDelivered", messageId);
            // Update the sender's message status as well
            setAllMessage((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, status: 'delivered' } : msg
                )
            );
        } else if (status === 'seen') {
            socketConnection.emit("messageSeen", messageId);
            // Update the sender's message status as well
            setAllMessage((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, status: 'seen' } : msg
                )
            );
        }

    } catch (error) {
        console.error("Error updating message status:", error);
    }
};





  useEffect(() => {
    if (isOnlineRec) {
        const deliveredMessages = new Set(); // Track delivered messages
        allMessage.forEach((message) => {
            if (message.status === "sent" && !deliveredMessages.has(message._id)) {
                updateMessageStatus(message._id, "delivered");
                deliveredMessages.add(message._id); // Mark this message as delivered
            }
        });
    }
  }, [isOnlineRec, allMessage, user]);

 // Removed isOnlineRec from dependencies

  //fdsdasdasdasdasa
  //dasdasssssssssssssssssssssssssssssssssssssssss

  useEffect(() => {
    // Make a request to get the conversation (chatId) between the two users
    fetchConversationId();
    if (socketConnection) {
      socketConnection.emit('message-page', params.userId);
      console.log('fetchConv : message page emit params userId')
      socketConnection.emit('seen', params.userId);
      console.log('fetchConv :seen emit params userId')

    }
    
  }, [socketConnection, params.userId]);

    
  async function fetchConversationId() {
    try {
        const response = await fetch(`/api/conversation/${user._id}/${params.userId}`);
        const data = await response.json();
        
        if (data.conversationId) {
            setActiveChatId(data.conversationId); // Store the conversation ID
            fetchMessages(data.conversationId); // Fetch messages immediately after setting activeChatId
        } else {
            console.log("No conversation found between these users");
        }
    } catch (error) {
        console.error("Error fetching conversation ID:", error);
    }
  }

  useEffect(() => {
    // Fetch messages when the component mounts or when activeChatId changes
    if (activeChatId) {
        fetchMessages(activeChatId);
    }
  }, [activeChatId]); // Ensure this runs when activeChatId changes

  // Fetch all messages for the selected conversation using both user IDs
  const fetchMessages = async (chatId) => { // Accept chatId as a parameter
    const cachedMessages = localStorage.getItem(`messages_${chatId}`);
    if (cachedMessages) {
      setAllMessage(JSON.parse(cachedMessages)); // Use cached messages
      return; // Exit early
    }

    try {
      const response = await fetch(`/api/conversations/messages/${user._id}/${params.userId}`);
      const messages = await response.json();
      if (Array.isArray(messages)) {
        setAllMessage(messages); // Set the fetched messages to state
        localStorage.setItem(`messages_${chatId}`, JSON.stringify(messages)); // Cache messages
      } else {
        setAllMessage([]); // Reset to an empty array if not an array
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setAllMessage([]); // Reset to an empty array on error
    }
  };

  useEffect(() => {
    if (socketConnection) {
        const handleMessage = (message) => {
            console.log('New message received:', message);
            if (message.chatId === activeChatId) {
                setAllMessage((prevMessages) => [...prevMessages, message]);
            }
        };
        socketConnection.on('message-user', (message) => {
          setDataUser(message);
        });

        socketConnection.on('message', handleMessage);

        // Cleanup function to remove the listener
        return () => {
            socketConnection.off('message', handleMessage);
            
        };
    }
  }, [socketConnection, activeChatId]);

  const handleOnChange = (e)=>{
    const { name, value} = e.target
 
    setMessage(preve => {
      return{
        ...preve,
        text : value
      }
    })
  }

 

  
  const handleSendMessage = async (e) => { 

    
    if (e) {
        e.preventDefault(); // Prevent default form submission
    }
    
    // Check if there is any content to send
    if (textMessage.trim() || message.imageUrl || message.videoUrl) {
        // Fetch receiver's language code
        try {
            const response = await fetch(`/api/users/${params.userId}`); // Adjust the endpoint as necessary
            const receiverData = await response.json();
            const targetLang = receiverData.language;
            console.log('target Lang :',targetLang) // Get the language of the receiver

            // Translate the message to the receiver's language
            const transText = await translateMessage(textMessage, targetLang);
            
            // Check if socketConnection exists
            if (socketConnection) {
                socketConnection.emit('new message', {
                    chatId: activeChatId, // Use activeChatId instead of params.chatId
                    sender: user?._id,
                    receiver: params.userId,
                    text: textMessage, // Send the original text to the receiver
                    translatedText:transText, // Send the translated text for the receiver
                    imageUrl: message.imageUrl,
                    videoUrl: message.videoUrl,
                    msgByUserId: user._id,
                    status:"sent",
                });
                
                
                // Clear the text message state after sending
                setTextMessage('');
                settransText('')
                setMessage({ imageUrl: '', videoUrl: '' });
            }
        } catch (error) {
            console.error("Error fetching receiver's language or translating message:", error);
        }
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
  
    
  
  
  

  const getMessageStatusIcon = (msg) => {
    if (user._id === msg?.msgByUserId) { // Check if the message is sent by the user
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

  useEffect(() => {
    // Retrieve activeChatId from localStorage on component mount
    const storedChatId = localStorage.getItem('activeChatId');
    if (storedChatId) {
      setActiveChatId(storedChatId); // Set the active chat ID from localStorage
      fetchMessages(storedChatId); // Fetch messages for the stored chat ID
 // Navigate to home if no chat ID is found
    }
  }, []); // Run only once on mount

  useEffect(() => {
    // Store activeChatId in localStorage whenever it changes
    if (activeChatId) {
      localStorage.setItem('activeChatId', activeChatId);
    }
  }, [activeChatId]); // Run whenever activeChatId changes

  return (
    <div style={{ backgroundImage : `url(${backgroundImage})`}} className='bg-no-repeat bg-cover'>
          <header className='sticky top-0 h-16 bg-white flex justify-between items-center px-4'>
              <div className='flex items-center gap-4'>
                  <Link to={"/"} className='lg:hidden'>
                      <FaAngleLeft size={25}/>
                  </Link>
                  <div>
                      <Avatar
                        width={50}
                        height={50}
                        imageUrl={dataUser?.profile_pic}
                        name={dataUser?.name}
                        userId={dataUser?._id}
                      />
                  </div>
                  <div>
                     <h3 className='font-semibold text-lg my-0 text-ellipsis line-clamp-1'>{dataUser?.name}</h3>
                     <p className='-my-2 text-sm'>
                      {
                        isOnlineRec ? <span className='text-primary'>online</span> : <span className='text-slate-400'>offline</span>
                      }
                     </p>
                  </div>
              </div>
 
              <div >
                    <button className='cursor-pointer hover:text-primary'>
                      <HiDotsVertical/>
                    </button>
              </div>
          </header>
 
          {/***show all message */}
          <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar relative bg-slate-200 bg-opacity-50'>
                 
               
                  {/**all message show here */}
                  <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
                    {
                      allMessage.map((msg, index) => {
                        return (
                          <div className={`p-1 py-1 rounded w-fit max-w-[280px] md:max-w-sm lg:max-w-md ${user._id === msg?.msgByUserId ? "ml-auto bg-teal-100" : "bg-white"}`}>
                            <div className='w-full relative'>
                              {msg?.imageUrl && (
                                <img
                                  src={msg?.imageUrl}
                                  className='w-full h-full object-scale-down'
                                />
                              )}
                              {
                                msg?.videoUrl && (
                                  <video
                                    src={msg.videoUrl}
                                    className='w-full h-full object-scale-down'
                                    controls
                                  />
                                )
                              }
                            </div>
                            <p className='px-2'>{user._id === msg?.msgByUserId ? msg.text : msg.translatedText}
                              {user._id === msg?.msgByUserId && msg.text && ( // Only show speak button for user's own messages
                                <button
                                  className={`ml-2 inline-block text-primary cursor-pointer ${isSpeaking === msg.text ? 'text-red-500' : ''}`} // Change condition to check specific message
                                  onClick={() => {
                                    speakMessage(msg.text, () => setIsSpeaking(msg.text)); // Set specific message as speaking
                                  }}
                                >
                                  <SpeakerIcon isSpeaking={isSpeaking === msg.text} />
                                </button>
                              )}
                              {msg.translatedText && user._id !== msg?.msgByUserId && ( // Keep button for translated text
                                <button
                                  className={`ml-2 inline-block text-primary cursor-pointer ${isSpeaking === msg.translatedText ? 'text-red-500' : ''}`} // Change condition to check specific message
                                  onClick={() => {
                                    speakMessage(msg.translatedText, () => setIsSpeaking(msg.translatedText)); // Set specific message as speaking
                                  }}
                                >
                                  <SpeakerIcon isSpeaking={isSpeaking === msg.translatedText} />
                                </button>
                              )}
                              <span style={{ marginLeft: "8px" }}>{getMessageStatusIcon(msg)}</span> {/* Render the message status icon */}
                            </p>
                            <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
                          </div>
                        )
                      })
                    }
                  </div>
 
 
                  {/**upload Image display */}
                  {
                    message.imageUrl && (
                      <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                        <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadImage}>
                            <IoClose size={30}/>
                        </div>
                        <div className='bg-white p-3'>
                            <img
                              src={message.imageUrl}
                              alt='uploadImage'
                              className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                            />
                        </div>
                      </div>
                    )
                  }
 
                  {/**upload video display */}
                  {
                    message.videoUrl && (
                      <div className='w-full h-full sticky bottom-0 bg-slate-700 bg-opacity-30 flex justify-center items-center rounded overflow-hidden'>
                        <div className='w-fit p-2 absolute top-0 right-0 cursor-pointer hover:text-red-600' onClick={handleClearUploadVideo}>
                            <IoClose size={30}/>
                        </div>
                        <div className='bg-white p-3'>
                            <video
                              src={message.videoUrl}
                              className='aspect-square w-full h-full max-w-sm m-2 object-scale-down'
                              controls
                              muted
                              autoPlay
                            />
                        </div>
                      </div>
                    )
                  }
 
                  {
                    loading && (
                      <div className='w-full h-full flex sticky bottom-0 justify-center items-center'>
                        <Loading/>
                      </div>
                    )
                  }
          </section>
 
          {/**send message */}
          <section className='h-16 bg-white flex items-center px-4'>
              <div className='relative '>
                  <button onClick={handleUploadImageVideoOpen} className='flex justify-center items-center w-11 h-11 rounded-full hover:bg-primary hover:text-white'>
                    <FaPlus size={20}/>
                  </button>
 
                  {/**video and image */}
                  {
                    openImageVideoUpload && (
                      <div className='bg-white shadow rounded absolute bottom-14 w-36 p-2'>
                      <form>
                          <label htmlFor='uploadImage' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                              <div className='text-primary'>
                                  <FaImage size={18}/>
                              </div>
                              <p>Image</p>
                          </label>
                          <label htmlFor='uploadVideo' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'>
                              <div className='text-purple-500'>
                                  <FaVideo size={18}/>
                              </div>
                              <p>Video</p>
                          </label>
 
                          <input
                            type='file'
                            id='uploadImage'
                            onChange={handleUploadImage}
                            className='hidden'
                          />
 
                          <input
                            type='file'
                            id='uploadVideo'
                            onChange={handleUploadVideo}
                            className='hidden'
                          />
                      </form>
                      </div>
                    )
                  }
                 
              </div>
              
              {/**Microphone Button */}
              <button onClick={toggleRecording} className={`ml-2 flex justify-center items-center w-11 h-11 rounded-full ${isRecording ? 'bg-red-500' : 'hover:bg-primary hover:text-white'}`}>
                <FaMicrophone size={20} />
              </button>
 
              {/**input box */}
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
        </section>

 
        <audio ref={audioRef} src={notificationAudio} preload='auto'></audio>
 
 
    </div>
  )
}
 
export default MessagePage

