import './style.css';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({
  onSearch,
  placeholder = "Поиск по названию или описанию",
  label = "Поиск",
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = () => {
    onSearch(searchInput); 
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-bar">
      <div className="search-container">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} 
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
        />
        <button
          type="button"
          className="search-button"
          onClick={handleSearch}
          aria-label="Выполнить поиск"
        >
          <FaSearch aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
