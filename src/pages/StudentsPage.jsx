import { useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import SearchBar from "../components/search-bar/SearchBar";
import Card from "../components/card/Card";
import Filter from "../components/forms/Filter";
import MainContent from "../components/main-section/MainSection";
import { fetchStudents } from "../api/apiStudentsController";
import { getSavedTrackId } from "../hooks/cookieUtils";
import useStudentFilters from "../hooks/useStudentFilters";
const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const filterParams = useStudentFilters();

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = (input) => {
    setSearchInput(input);
  };

  useEffect(() => {
    const loadStudents = async () => {
      const trackId = getSavedTrackId();
      if (!trackId) {
        console.error("trackId отсутствует в куках");
        setLoading(false);
        return;
      }
      try {
        const data = await fetchStudents({
          trackId,
          ...filters,
          input: searchInput,
        });
        setStudents(data);
        console.log("Загруженные студенты:", data);
      } catch (error) {
        console.error("Не удалось загрузить студентов:", error);
      }
    };

    setLoading(true);
    loadStudents().finally(() => {
      setLoading(false);
    });
  }, [filters, searchInput]); 

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
            {!loading && <span className="catalog-count">{students.length} результатов</span>}
          </div>
          <div className="cards" aria-busy={loading}>
            {loading ? (
              <p className="loading-state">Загружаем участников…</p>
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
        </MainContent>
      </main>
    </>
  );
};

export default StudentsPage;
