import { Link } from "react-router-dom";

import Navbar from "../components/navbar/Navbar";
import { useIdentity } from "../context/identityContext";
import { describeTargets } from "../utils/composition";
import { describeSelectionWindow, selectionClosedReason } from "../utils/selectionWindow";
import "./HowItWorksPage.css";

/**
 * The first screen after the questionnaire, and the answer to «а что мне делать» from the menu.
 *
 * Everything on it is about THIS selection — its target composition and its deadline come from the
 * active track, not from the text — because those are the two numbers a student has to know and
 * the two that change every year.
 */
const HowItWorksPage = () => {
  const { activeTrack, isParticipant, user, loading } = useIdentity();
  const selection = describeSelectionWindow(activeTrack);
  const targets = activeTrack
    ? describeTargets(activeTrack.firstYearTarget, activeTrack.secondYearTarget)
    : null;
  const teamId = user?.student?.current_team_id ?? null;

  return (
    <>
      <Navbar />
      <main className="page-container how-page">
        <header className="how-head">
          <p className="how-kicker">Проектная деятельность</p>
          <h1>Как проходит набор</h1>
          {selection ? (
            <p className="how-lead">
              {selection.state === "open"
                ? `Идёт набор «${selection.name}», ${selection.note}.`
                // «Идёт набор — завершён вчера» contradicts itself; this is the sentence every
                // disabled button on the other pages already gives for the same state.
                : selectionClosedReason(activeTrack)}
            </p>
          ) : !loading && (
            // Only once the answer is actually known: on a cold load this page would otherwise
            // open by denying the very selection it exists to explain.
            <p className="how-lead">Сейчас набор не идёт — дождитесь объявления о следующем.</p>
          )}
        </header>

        <section className="how-section" aria-labelledby="how-paths-title">
          <h2 id="how-paths-title">Два пути</h2>
          <div className="how-paths">
            <article className="how-path">
              <h3>Собрать свою команду</h3>
              <p>
                Создайте команду в личном кабинете, опишите проект — и зовите людей: ссылкой для
                вступления, которую можно кинуть в чат, или приглашением со страницы «Участники».
              </p>
              <Link className="how-action" to={teamId ? `/teams/${teamId}` : "/profile"}>
                {teamId ? "Моя команда" : "Создать команду"}
              </Link>
            </article>
            <article className="how-path">
              <h3>Вступить в чужую команду</h3>
              <p>
                Просмотрите, какие команды уже есть в каталоге, и подайте заявку в одну из них.
                Проверьте вкладку «Заявки» — там могут быть приглашения в команды, а также
                отражены все ваши заявки.
              </p>
              <Link className="how-action" to={isParticipant ? "/teams" : "/registration"}>
                {isParticipant ? "Смотреть команды" : "Заполнить анкету"}
              </Link>
            </article>
          </div>
        </section>

        <section className="how-section" aria-labelledby="how-rules-title">
          <h2 id="how-rules-title">Что важно знать</h2>
          <dl className="how-rules">
            {targets && (
              <div className="how-rule">
                <dt>Состав</dt>
                <dd>
                  Команда собрана, когда в ней {targets}. Места считаются по курсам отдельно:
                  первокурсник не займёт место второкурсника и наоборот.
                </dd>
              </div>
            )}
            {selection?.state === "open" && (
              <div className="how-rule">
                <dt>Срок</dt>
                <dd>
                  Подать заявку, принять приглашение и собрать состав можно {selection.note}. После
                  этого заявки и приглашения перестают работать.
                </dd>
              </div>
            )}
            <div className="how-rule">
              <dt>Если команда не собралась</dt>
              <dd>
                Неполные команды после набора разбирают организаторы — вручную, вместе с теми, кто
                остался без команды. Лучше не доводить: состав виден и вам, и им.
              </dd>
            </div>
            <div className="how-rule">
              <dt>Что дальше</dt>
              <dd>
                Собранные команды переезжают в кабинет ПД — там будут этапы, защиты и оценки. Этот
                сервис нужен только чтобы собраться.
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </>
  );
};

export default HowItWorksPage;
