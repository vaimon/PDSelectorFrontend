import './style.css';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

const SearchBar = ({
  onSearch,
  placeholder = "Поиск по названию или описанию",
  label = "Поиск",
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <div className="search-bar">
      <form className="search-container" role="search" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
        />
        <button
          type="submit"
          className="search-button"
          aria-label="Выполнить поиск"
        >
          <FaSearch aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
