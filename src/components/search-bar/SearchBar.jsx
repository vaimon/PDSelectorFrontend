import './style.css';
import { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

/**
 * `inline` puts the search inside a page column instead of across the page: the catalogue pages use
 * it in place of their heading (#59), so the field runs from the filters to the edge of the page.
 * `meta` is the line that sits at its right — the number of results, which the heading used to carry.
 */
const SearchBar = ({
  onSearch,
  placeholder = "Поиск по названию или описанию",
  label = "Поиск",
  inline = false,
  meta,
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <div className={inline ? "search-bar search-bar--inline" : "page-container search-bar"}>
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
      {meta && <span className="search-meta">{meta}</span>}
    </div>
  );
};

export default SearchBar;
