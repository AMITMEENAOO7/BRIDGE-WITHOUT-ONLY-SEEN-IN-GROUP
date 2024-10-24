import React from 'react';
import logo from '../assets/nav-logo.png';

const AuthLayouts = ({ children }) => {
  return (
    <>
      <header className="fixed top-0 left-0 w-full flex justify-start items-center py-3 h-20 shadow-md bg-white z-50">
        <img
          src={logo}
          alt="logo"
          style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'contain' }}
        />
        <h1 className="ml-3 text-2xl font-bold tracking-wide text-gray-700">B.R.I.D.G.E.</h1>
      </header>

      {/* Add padding to prevent overlap with the fixed navbar */}
      <div className="pt-20">
        {children}
      </div>
    </>
  );
};

export default AuthLayouts;