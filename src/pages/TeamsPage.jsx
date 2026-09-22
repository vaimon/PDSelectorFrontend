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

  const { activeTrack, loading: identityLoading, isParticipant, user } = useIdentity();
  const { applyActionFor, confirmProps } = useTeamRequests();

  // Which course the viewer takes a place on. `RequireParticipant` guards this page, so anyone
  // who is not a participant here is an admin: they have no course, join nothing, and keep the
  // old filter. A participant whose course is somehow unset is a second-year, because that is
  // what the backend assumes of them — the list then cannot offer a team the button would refuse.
  const placesForCourse = isParticipant ? user?.student?.course ?? 2 : null;

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
        variant="team"
        name={team.name}
        type={team.project_type.name}
        resume={team.project_description}
        tags={team.technologies}
        profileLink={`/teams/${team.id}`}
        // What actually decides whether this team is worth opening: the target is a number of
        // first-years plus a number of second-years, not one number of people.
        composition={team.composition}
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
      <main className="page-container content-layout catalog-layout">
        <Filter
          filterParams={filterParams}
          onApplyFilters={handleApplyFilters}
          placesForCourse={placesForCourse}
        />
        <MainContent>
          {/* The search stands where the heading used to (#59): «Команды» repeated the navbar item
              that is already highlighted, and the count moved into the search row. */}
          <SearchBar
            onSearch={handleSearch}
            inline
            meta={loading ? undefined : `${pagination.totalElements} результатов`}
          />
          <div className="cards" aria-busy={loading || identityLoading}>
            {identityLoading ? (
              <p className="loading-state">Загружаем команды…</p>
            ) : !selectionRunning ? (
              <p className="empty-state">
                Набора сейчас нет. Команды появятся, когда начнётся следующий.
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
