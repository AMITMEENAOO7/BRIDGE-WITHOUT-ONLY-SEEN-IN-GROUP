import React, { useState } from 'react';
import { IoClose } from "react-icons/io5";
import { Link, useNavigate } from 'react-router-dom';
import uploadFile from '../helpers/uploadFile';
import axios from 'axios';
import toast from 'react-hot-toast';

// Language mapping dictionary
const lang_mapping = {
  "Arabic (Egypt)": 'ar-EG',        // STT, TTS
  "Arabic (Saudi Arabia)": 'ar-SA', // STT, TTS
  //"Bulgarian": 'bg-BG',             // STT
  "Chinese (Cantonese, Traditional)": 'zh-HK', // STT, TTS
  "Chinese (Mandarin, Simplified)": 'zh-CN',   // STT, TTS
  "Chinese (Taiwan)": 'zh-TW',       // STT, TTS
  "Czech": 'cs-CZ',                 // STT, TTS
  "Danish": 'da-DK',                // STT, TTS
  "Dutch (Netherlands)": 'nl-NL',   // STT, TTS
  "English (Australia)": 'en-AU',   // STT, TTS
  "English (Canada)": 'en-CA',      // STT, TTS
  "English (India)": 'en-IN',       // STT, TTS
  "English (New Zealand)": 'en-NZ', // STT
  "English (South Africa)": 'en-ZA',// STT
  "English (United Kingdom)": 'en-GB', // STT, TTS
  "English (United States)": 'en-US',  // STT, TTS
  "Finnish": 'fi-FI',               // STT, TTS
  "French (Canada)": 'fr-CA',       // STT, TTS
  "French (France)": 'fr-FR',       // STT, TTS
  "German": 'de-DE',                // STT, TTS
  //"Greek": 'el-GR',                 // STT
  //"Hebrew": 'he-IL',                // STT
  "Hindi": 'hi-IN',                 // STT, TTS
  //"Hungarian": 'hu-HU',             // STT
  "Indonesian": 'id-ID',            // STT, TTS
  "Italian": 'it-IT',               // STT, TTS
  "Japanese": 'ja-JP',              // STT, TTS
  "Korean": 'ko-KR',                // STT, TTS
  "Norwegian (Bokmål)": 'nb-NO',    // STT, TTS
  "Polish": 'pl-PL',                // STT, TTS
  "Portuguese (Brazil)": 'pt-BR',   // STT, TTS
  "Portuguese (Portugal)": 'pt-PT', // STT, TTS
  //"Romanian": 'ro-RO',              // STT
  "Russian": 'ru-RU',               // STT, TTS
  //"Slovak": 'sk-SK',                // STT
  //"Spanish (Argentina)": 'es-AR',   // STT
  "Spanish (Mexico)": 'es-MX',      // STT, TTS
  "Spanish (Spain)": 'es-ES',       // STT, TTS
  "Swedish": 'sv-SE',               // STT, TTS
  "Telugu (India)": 'te-IN',
  "Thai": 'th-TH',                  // STT, TTS
  "Turkish": 'tr-TR',               // STT, TTS
  //"Ukrainian": 'uk-UA',             // STT
  "Vietnamese": 'vi-VN'             // STT, TTS
};

const RegisterPage = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    profile_pic: "",
    language: "" // New language field
  });
  const [uploadPhoto, setUploadPhoto] = useState("");
  const navigate = useNavigate();

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLanguageChange = (e) => {
    setData((prevData) => ({
      ...prevData,
      language: e.target.value // Send the selected language code
    }));
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    const uploadPhoto = await uploadFile(file);

    setUploadPhoto(file);

    setData((prev) => ({
      ...prev,
      profile_pic: uploadPhoto?.url
    }));
  };

  const handleClearUploadPhoto = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setUploadPhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const URL = `${process.env.REACT_APP_BACKEND_URL}/api/register`;

    try {
      const response = await axios.post(URL, data); // Send the language along with other data

      toast.success(response.data.message);

      if (response.data.success) {
        setData({
          name: "",
          email: "",
          password: "",
          profile_pic: "",
          language: "" // Reset the language field
        });

        navigate('/email');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div className='mt-5'>
      <div className='bg-white w-full max-w-md rounded overflow-hidden p-4 mx-auto'>
        <form className='grid gap-4 mt-5' onSubmit={handleSubmit}>
          <div className='flex flex-col gap-1'>
            <label htmlFor='name'>Name :</label>
            <input
              type='text'
              id='name'
              name='name'
              placeholder='enter your name'
              className='bg-slate-100 px-2 py-1 focus:outline-primary'
              value={data.name}
              onChange={handleOnChange}
              required
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label htmlFor='email'>Email :</label>
            <input
              type='email'
              id='email'
              name='email'
              placeholder='enter your email'
              className='bg-slate-100 px-2 py-1 focus:outline-primary'
              value={data.email}
              onChange={handleOnChange}
              required
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label htmlFor='password'>Password :</label>
            <input
              type='password'
              id='password'
              name='password'
              placeholder='enter your password'
              className='bg-slate-100 px-2 py-1 focus:outline-primary'
              value={data.password}
              onChange={handleOnChange}
              required
            />
          </div>

          <div className='flex flex-col gap-1'>
            <label htmlFor='profile_pic'>Photo :
              <div className='h-14 bg-slate-200 flex justify-center items-center border rounded hover:border-primary cursor-pointer'>
                <p className='text-sm max-w-[300px] text-ellipsis line-clamp-1'>
                  {
                    uploadPhoto?.name ? uploadPhoto?.name : "Upload profile photo"
                  }
                </p>
                {
                  uploadPhoto?.name && (
                    <button className='text-lg ml-2 hover:text-red-600' onClick={handleClearUploadPhoto}>
                      <IoClose />
                    </button>
                  )
                }
              </div>
            </label>

            <input
              type='file'
              id='profile_pic'
              name='profile_pic'
              className='bg-slate-100 px-2 py-1 focus:outline-primary hidden'
              onChange={handleUploadPhoto}
            />
          </div>

          {/* New Language Selection */}
          <div className='flex flex-col gap-1'>
            <label htmlFor='language'>Preferred Language:</label>
            <select
              id='language'
              name='language'
              className='bg-slate-100 px-2 py-1 focus:outline-primary'
              value={data.language}
              onChange={handleLanguageChange}
              required
            >
              <option value="" disabled>Select a language</option>
              {Object.keys(lang_mapping).map((lang) => (
                <option key={lang} value={lang_mapping[lang]}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <button
            className='bg-primary text-lg px-4 py-1 hover:bg-secondary rounded mt-2 font-bold text-white leading-relaxed tracking-wide'
          >
            Register
          </button>
        </form>

        <p className='my-3 text-center'>Already have an account? <Link to={"/email"} className='hover:text-primary font-semibold'>Login</Link></p>
      </div>
    </div>
  );
};

export default RegisterPage;