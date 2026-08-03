import { useState } from "react";
import Navbar from "../components/navbar/Navbar";
import SearchBar from "../components/search-bar/SearchBar";
import Card from "../components/card/Card";
import Filter from "../components/forms/Filter";
import MainContent from "../components/main-section/MainSection";
import { getSavedTrackId } from "../hooks/cookieUtils";
import useStudentFilters from "../hooks/useStudentFilters";
import useStudents from "../hooks/useStudents";
import Pagination from "../components/pagination/Pagination";
const StudentsPage = () => {
  const [filters, setFilters] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const trackId = getSavedTrackId();
  const filterParams = useStudentFilters(trackId);
  const { students, pagination, loading, error } = useStudents(filters, searchInput, trackId, page);

  const handleApplyFilters = (newFilters) => {
    setPage(0);
    setFilters(newFilters);
  };

  const handleSearch = (input) => {
    setPage(0);
    setSearchInput(input);
  };

  return (
    <>
      <Navbar />
      <SearchBar
        onSearch={handleSearch}
        placeholder="Поиск по ФИО или резюме"
        label="Поиск участников"
      />
      <main className="container content-layout catalog-layout">
        <Filter
          filterParams={filterParams}
          onApplyFilters={handleApplyFilters}
          variant="students"
        />
        <MainContent>
          <div className="catalog-head">
            <div>
              <p className="catalog-kicker">Проектная деятельность</p>
              <h1>Участники</h1>
            </div>
            {!loading && <span className="catalog-count">{pagination.totalElements} результатов</span>}
          </div>
          <div className="cards" aria-busy={loading}>
            {loading ? (
              <p className="loading-state">Загружаем участников…</p>
            ) : error ? (
              <p className="empty-state" role="alert">{error}</p>
            ) : students.length > 0 ? (
              students.map((student) => (
                <Card
                  key={student.id}
                  name={student.user?.fio || "Имя отсутствует"} 
                  resume={student.about_self || "Описание отсутствует"}
                  tags={student.technologies || []}
                  showActionsForCaptain={false}
                  showActionsForUser={false}
                  profileLink={`/students/${student.id}`}
                />
              ))
            ) : (
              <p className="empty-state">
                Участники не найдены. Попробуйте изменить поиск или фильтры.
              </p>
            )}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </MainContent>
      </main>
    </>
  );
};

export default StudentsPage;
