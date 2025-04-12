import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

import { ReactComponent as MinaLogo } from '../assets/mina_logo.svg';

const Navbar = ({ user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <>
      {/* Space navbar */}
      <div className="h-16 md:h-20"></div>
      
      <nav className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        isScrolled || !isHomePage 
          ? 'bg-white shadow-md' 
          : 'bg-white shadow-md '
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="flex items-center" aria-label="MINA Healthcare">
                  <MinaLogo className="h-8 w-8" />
                  <span className={`ml-2 font-bold text-xl ${
                    isScrolled || !isHomePage ? 'text-blue-600' : 'text-blue-600'
                  }`}>
                    MINA
                  </span>
                </Link>
              </div>
              <div className="hidden md:ml-8 md:flex md:items-center space-x-1 lg:space-x-4">
                <NavLink to="/" currentPath={location.pathname} isScrolled={isScrolled} isHomePage={isHomePage}>
                  Home
                </NavLink>
                <NavLink to="/about" currentPath={location.pathname} isScrolled={isScrolled} isHomePage={isHomePage}>
                  About
                </NavLink>
                <NavLink to="/ai-assistance" currentPath={location.pathname} isScrolled={isScrolled} isHomePage={isHomePage}>
                  AI Assistance
                </NavLink>
                <NavLink 
                  to={user ? (user.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard') : '/login'} 
                  currentPath={location.pathname} 
                  isScrolled={isScrolled} 
                  isHomePage={isHomePage}
                  isDashboard={true}
                >
                  {user ? 'Dashboard' : 'Connect with Professionals'}
                </NavLink>
              </div>
            </div>
            <div className="hidden md:flex md:items-center space-x-3 lg:space-x-4">
              {user ? (
                <>
                  <div className="relative flex items-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || user.email.split('@')[0]}
                        className="h-10 w-10 rounded-full object-cover shadow-md border-2 border-white"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold shadow-md">
                        {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                    )}
                    <span className={`ml-2 text-sm font-medium ${isScrolled || !isHomePage ? 'text-gray-700' : 'text-gray-700'}`}>
                      {user.displayName || user.email.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                    aria-label="Sign Out"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      isScrolled || !isHomePage
                        ? 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                        : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                    } transition-colors shadow-sm`}
                    aria-label="Sign In"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    aria-label="Sign Up"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`inline-flex items-center justify-center p-2 rounded-lg ${
                  isScrolled || !isHomePage
                    ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    : 'text-white hover:text-white hover:bg-white/20'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="bg-white shadow-lg border-t border-gray-100 px-2 pt-2 pb-3 space-y-1">
            <MobileNavLink to="/" currentPath={location.pathname} onClick={() => setIsMenuOpen(false)}>
              Home
            </MobileNavLink>
            <MobileNavLink to="/about" currentPath={location.pathname} onClick={() => setIsMenuOpen(false)}>
              About
            </MobileNavLink>
            <MobileNavLink to="/ai-assistance" currentPath={location.pathname} onClick={() => setIsMenuOpen(false)}>
              AI Assistance
            </MobileNavLink>
            <MobileNavLink 
              to={user ? (user.role === 'patient' ? '/patient-dashboard' : '/doctor-dashboard') : '/login'} 
              currentPath={location.pathname} 
              onClick={() => setIsMenuOpen(false)}
              isDashboard={true}
            >
              {user ? 'Dashboard' : 'Connect with Professionals'}
            </MobileNavLink>
            
            <div className="pt-4 pb-3 border-t border-gray-200">
              {user ? (
                <>
                  <div className="flex items-center px-4 py-3">
                    <div className="flex-shrink-0">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || user.email.split('@')[0]}
                          className="h-10 w-10 rounded-full object-cover shadow-md border-2 border-white"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold">
                          {user.displayName ? user.displayName[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{user.displayName || user.email.split('@')[0]}</div>
                      <div className="text-sm font-medium text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="mt-3 px-2">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-center px-4 py-3 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-3 px-2 space-y-3 pb-3">
                  <Link
                    to="/login"
                    className="block w-full py-3 px-4 text-base font-medium text-center border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full py-3 px-4 text-base font-medium text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

// Helper component for desktop navigation links
const NavLink = ({ to, children, currentPath, isScrolled, isHomePage, isDashboard = false }) => {
  const isActive = isDashboard 
    ? currentPath.includes('-dashboard') 
    : currentPath === to;
  
  return (
    <Link
      to={to}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : `${isScrolled || !isHomePage 
              ? 'text-gray-700 hover:bg-gray-100 hover:text-blue-600' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'}`
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
};

// Helper component for mobile navigation links
const MobileNavLink = ({ to, children, currentPath, onClick, isDashboard = false }) => {
  const isActive = isDashboard 
    ? currentPath.includes('-dashboard') 
    : currentPath === to;
  
  return (
    <Link
      to={to}
      className={`block px-4 py-3 rounded-lg text-base font-medium ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
      }`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
};

export default Navbar;