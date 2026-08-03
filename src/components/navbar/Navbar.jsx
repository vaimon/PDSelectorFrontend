import {useState, useRef, useEffect} from 'react';
import './style.css';
import { NavLink } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import useTracks from '../../hooks/useTracks';
import { saveTrackId } from '../../hooks/cookieUtils';
import { getCurrentStudentId } from '../../api/apiStudentsController';
import ConsoleMark from '../logo/ConsoleMark';
import ThemeToggle from '../header/Header';
const Navbar = () => {
  const { tracks, selectedTrack, setSelectedTrack } = useTracks();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await getCurrentStudentId(); 
        if (userId) {
            setCurrentStudentId(userId); 
        }
      } catch (error) {
        if (error.response?.status !== 401) {
          console.error("Не удалось загрузить профиль пользователя:", error);
        }
      }
    };
    
    fetchUserId(); 
}, []); 

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isDropdownOpen) return undefined;

    const closeDropdown = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && dropdownRef.current?.contains(event.target)) return;
      setIsDropdownOpen(false);
    };

    document.addEventListener('pointerdown', closeDropdown);
    document.addEventListener('keydown', closeDropdown);
    return () => {
      document.removeEventListener('pointerdown', closeDropdown);
      document.removeEventListener('keydown', closeDropdown);
    };
  }, [isDropdownOpen]);

  const handleTrackChange = (trackId) => {
      setSelectedTrack(trackId);
      saveTrackId(trackId);
      setIsDropdownOpen(false);
      window.location.reload();
  }

  const selectedTrackName = tracks.find(track => track.id === Number(selectedTrack))?.name || "Выберите трек";

  return (
      <div className="navbar">
          <div className="logo"><ConsoleMark /></div>
          <div className="nav-links">
              <NavLink
                  to="/teams"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                  Команды
              </NavLink>
              <NavLink
                  to="/students"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                  Участники
              </NavLink>
              {currentStudentId && (
                  <NavLink
                      to={`/students/${currentStudentId}`}
                      className={({ isActive }) => (isActive ? "active-link" : "")}
                  >
                      Профиль
                  </NavLink>
              )}
          </div>
          <div className="navbar-actions">
            <div className="track-selector" ref={dropdownRef}>
              <button
                  type="button"
                  className={`select-icon ${isDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDropdownOpen((prev) => !prev)} 
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="listbox"
              >
                  <span>{selectedTrackName}</span>
                  <FaChevronDown aria-hidden="true" />
              </button>
              {isDropdownOpen && (
                  <div className="dropdown" role="listbox" aria-label="Выбор учебного трека">
                      <ul role="presentation">
                          {tracks.map((track) => (
                              <li
                                  key={track.id}
                                  role="option"
                                  aria-selected={track.id === Number(selectedTrack)}
                                  tabIndex={0}
                                  onClick={() => handleTrackChange(track.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                      event.preventDefault();
                                      handleTrackChange(track.id);
                                    }
                                  }}
                              >
                                  {track.name}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
            <ThemeToggle />
          </div>
      </div>
  );
};

export default Navbar;
