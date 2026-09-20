import { useState } from "react";
import Navbar from "../components/navbar/Navbar";
import SearchBar from "../components/search-bar/SearchBar";
import Filter from "../components/forms/Filter";
import MainContent from "../components/main-section/MainSection";
import Card from "../components/card/Card";
import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import useTeamFilters from "../hooks/useTeamFilters";
import useTeams from "../hooks/useTeams";
import { useTeamRequests } from "../hooks/useTeamRequests";
import { useIdentity } from "../context/identityContext";
import Pagination from "../components/pagination/Pagination";



const TeamsPage = () => {
  const [filters, setFilters] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);

  const { activeTrack, loading: identityLoading } = useIdentity();
  const { applyActionFor, confirmProps } = useTeamRequests();

  // The catalogue always shows the current selection, so there is nothing to show between two.
  const selectionRunning = activeTrack != null;
  const catalogEnabled = !identityLoading && selectionRunning;
  const { teams, pagination, loading, error } = useTeams(filters, searchInput, page, catalogEnabled);
  const filterParams = useTeamFilters(catalogEnabled);

  const handleApplyFilters = (newFilters) => {
    setPage(0);
    setFilters(newFilters);
  };
  const handleSearch = (input) => {
    setPage(0);
    setSearchInput(input);
  };

  const renderTeam = (team) => {
    const applyAction = applyActionFor(team);

    return (
      <Card
        key={team.id}
        name={team.name}
        type={team.project_type.name}
        resume={team.project_description}
        tags={team.technologies}
        profileLink={`/teams/${team.id}`}
        showApplyButton={Boolean(applyAction)}
        applyText={applyAction?.label}
        applyDisabled={applyAction?.disabled}
        applyReason={applyAction?.reason}
        onApply={applyAction?.onClick}
      />
    );
  };

  return (
    <>
      <Navbar />
      <SearchBar onSearch={handleSearch} />
      <main className="container content-layout catalog-layout">
        <Filter filterParams={filterParams} onApplyFilters={handleApplyFilters} />
        <MainContent>
          <div className="catalog-head">
            <div>
              <p className="catalog-kicker">Проектная деятельность</p>
              <h1>Команды</h1>
            </div>
            {!loading && <span className="catalog-count">{pagination.totalElements} результатов</span>}
          </div>
          <div className="cards" aria-busy={loading || identityLoading}>
            {identityLoading ? (
              <p className="loading-state">Загружаем команды…</p>
            ) : !selectionRunning ? (
              <p className="empty-state">
                Отбор сейчас не идёт. Команды появятся, когда начнётся новый набор.
              </p>
            ) : loading ? (
              <p className="loading-state">Загружаем команды…</p>
            ) : error ? (
              <p className="empty-state" role="alert">{error}</p>
            ) : teams.length > 0 ? (
              teams.map(renderTeam)
            ) : (
              <p className="empty-state">
                Команды не найдены. Попробуйте изменить поиск или фильтры.
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

export default TeamsPage;
