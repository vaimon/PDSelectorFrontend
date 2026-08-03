import React, { useEffect, useState } from "react";
import Navbar from "../components/navbar/Navbar";
import SearchBar from "../components/search-bar/SearchBar";
import Card from "../components/card/Card";
import Filter from "../components/forms/Filter";
import MainContent from "../components/main-section/MainSection";
import { fetchStudents } from "../api/apiStudentsController";
import { getSavedTrackId } from "../hooks/cookieUtils";
import { fetchFilterParamsByTrackId } from "../api/apiTeamsController";
import useStudentFilters from "../hooks/useStudentFilters";
const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterParams, setFilterParams] = useState([]);
  const [searchInput, setSearchInput] = useState("");

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
        const data = await fetchStudents(trackId, { ...filters, input: searchInput }); 
        setStudents(data);
        console.log("Загруженные студенты:", data);
      } catch (error) {
        console.error("Не удалось загрузить студентов:", error);
      }
    };

    const loadFilters = async () => {
      const trackId = getSavedTrackId();
      console.log('trackId', trackId);
      if (!trackId) return;
      try {
        const params = await useStudentFilters(trackId);
        setFilterParams(params);
        console.log("Полученные параметры фильтра:", params);
      } catch (error) {
        console.error("Ошибка при получении параметров фильтра:", error);
      }
    };

    setLoading(true); 
    Promise.all([loadStudents(), loadFilters()]).finally(() => {
      setLoading(false);
    });
  }, [filters, searchInput]); 

  return (
    <>
      <Navbar />
      <SearchBar onSearch={handleSearch} /> 
      <div className="container">
        <Filter filterParams={filterParams} onApplyFilters={handleApplyFilters} /> {/* Pass filter parameters */}
        <MainContent>
          <h1>Участники</h1>
          <div className="cards">
            {loading ? (
              <p>Загрузка...</p>
            ) : (
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
            )}
          </div>
        </MainContent>
      </div>
    </>
  );
};

export default StudentsPage;
