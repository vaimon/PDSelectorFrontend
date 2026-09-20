import { useState } from "react";
import Navbar from "../components/navbar/Navbar";
import SearchBar from "../components/search-bar/SearchBar";
import Card from "../components/card/Card";
import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import Filter from "../components/forms/Filter";
import MainContent from "../components/main-section/MainSection";
import useStudentFilters from "../hooks/useStudentFilters";
import useStudents from "../hooks/useStudents";
import { useIdentity } from "../context/identityContext";
import { useTeamInvites } from "../hooks/useTeamInvites";
import Pagination from "../components/pagination/Pagination";
const StudentsPage = () => {
  const [filters, setFilters] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const { activeTrack, loading: identityLoading } = useIdentity();
  const { inviteActionFor, confirmProps } = useTeamInvites();

  // The catalogue always shows the current selection, so there is nothing to show between two.
  const selectionRunning = activeTrack != null;
  const catalogEnabled = !identityLoading && selectionRunning;
  const filterParams = useStudentFilters(catalogEnabled);
  const { students, pagination, loading, error } = useStudents(filters, searchInput, page, catalogEnabled);

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
      <main className="page-container content-layout catalog-layout">
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
          <div className="cards" aria-busy={loading || identityLoading}>
            {identityLoading ? (
              <p className="loading-state">Загружаем участников…</p>
            ) : !selectionRunning ? (
              <p className="empty-state">
                Отбор сейчас не идёт. Участники появятся, когда начнётся новый набор.
              </p>
            ) : loading ? (
              <p className="loading-state">Загружаем участников…</p>
            ) : error ? (
              <p className="empty-state" role="alert">{error}</p>
            ) : students.length > 0 ? (
              students.map((student) => {
                const inviteAction = inviteActionFor(student);

                return (
                  <Card
                    key={student.id}
                    variant="person"
                    name={student.user?.fio || "Имя отсутствует"}
                    resume={student.about_self || "Описание отсутствует"}
                    tags={student.technologies || []}
                    profileLink={`/students/${student.id}`}
                    showApplyButton={Boolean(inviteAction)}
                    onApply={inviteAction?.onClick}
                    applyText={inviteAction?.label}
                    applyDisabled={inviteAction?.disabled}
                    applyReason={inviteAction?.reason}
                    applyTone={inviteAction?.tone}
                  />
                );
              })
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

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default StudentsPage;
