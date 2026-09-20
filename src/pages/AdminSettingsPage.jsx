import { useEffect, useMemo, useState } from "react";

import ConfirmDialog from "../components/confirm-dialog/ConfirmDialog";
import { useIdentity } from "../context/identityContext";
import { useNotifications } from "../context/notificationContext";
import useConfirmAction from "../hooks/useConfirmAction";
import useHandOver from "../hooks/useHandOver";
import {
  cancelHandOver,
  handOverTrack,
  startNewSelection,
  updateTrack,
} from "../api/apiTracks";
import {
  toFormValues,
  toNewSelectionPayload,
  toTrackPayload,
  validate,
  validateNewSelection,
} from "../utils/trackForm";
import "./AdminSettingsPage.css";

const EMPTY_NEW_SELECTION = { name: "", startDate: "", endDate: "" };

/**
 * The settings of the current selection: what it is called, when it runs, how big a team should
 * be — plus the two things that end it, starting the next selection and marking this one handed
 * over to the ПД cabinet.
 *
 * One form and one «Сохранить» for the settings, because `PUT /tracks/{id}` takes the whole track
 * and overwrites what it is given: two forms sharing that endpoint would each erase the other's
 * fields. The payload is therefore built from the track as loaded, not from the inputs alone.
 */
const AdminSettingsPage = () => {
  const { activeTrack, refresh: refreshIdentity } = useIdentity();
  const { handedOver } = useHandOver();
  const { notify } = useNotifications();
  const { ask, confirmProps } = useConfirmAction(refreshIdentity);

  const initial = useMemo(
    () => (activeTrack ? toFormValues(activeTrack) : null),
    [activeTrack],
  );
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [newSelection, setNewSelection] = useState(EMPTY_NEW_SELECTION);
  const [newErrors, setNewErrors] = useState({});

  // The track arrives with identity and is refetched after every change here, so the form is
  // re-seeded when it does — `initial` is memoised on the track itself, or a toast re-render
  // would throw away what the organiser has typed.
  useEffect(() => {
    setValues(initial);
  }, [initial]);

  // `values` is null until that effect runs, and it runs after the render in which the track
  // first arrives — so the form reads the seed directly on that one render.
  const form = values ?? initial;

  const change = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...(current ?? initial), [name]: value }));
  };

  const changeNew = (event) => {
    const { name, value } = event.target;
    setNewSelection((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await updateTrack(activeTrack.id, toTrackPayload(activeTrack, form));
      // The shell, the catalogue and every disabled button read this track: refetch before the
      // toast, so the page never says «сохранено» above the previous numbers.
      await refreshIdentity();
      notify({ type: "success", text: "Настройки сохранены" });
    } catch (error) {
      // The shared client has already shown what went wrong; the typed values stay put.
      console.error("Не удалось сохранить настройки набора:", error);
    } finally {
      setSaving(false);
    }
  };

  const askNewSelection = (event) => {
    event.preventDefault();
    const found = validateNewSelection(newSelection);
    setNewErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    ask({
      heading: "Начать новый набор?",
      description: activeTrack
        ? `Набор «${activeTrack.name}» перестанет быть текущим: его команды и анкеты останутся, но изменить их будет нельзя. Цели и тип перейдут на новый набор.`
        : "Новый набор станет текущим: в нём можно будет заполнять анкеты и собирать команды.",
      confirmText: "Начать новый набор",
      successText: "Новый набор начат",
      run: () => startNewSelection(toNewSelectionPayload(newSelection)),
      after: async () => {
        await refreshIdentity();
        setNewSelection(EMPTY_NEW_SELECTION);
      },
    });
  };

  const askHandOver = () => ask({
    heading: "Отметить набор переданным?",
    description: `Набор «${activeTrack.name}» будет отмечен как переданный в кабинет ПД, и здесь его больше нельзя будет изменить. Отметку можно снять.`,
    confirmText: "Отметить переданным",
    successText: "Набор отмечен как переданный",
    run: () => handOverTrack(activeTrack.id),
  });

  const askCancelHandOver = () => ask({
    heading: "Снять отметку о передаче?",
    description: `Набор «${activeTrack.name}» снова можно будет менять здесь. Сделайте это, только если в кабинете ПД составы ещё не разобрали.`,
    confirmText: "Снять отметку",
    successText: "Отметка о передаче снята",
    run: () => cancelHandOver(activeTrack.id),
  });

  // After the hand-over the backend answers every change to this selection with 409, so the screen
  // must not offer one. Starting the NEXT selection is not a change to this one — the backend
  // allows it, and handing over and then opening next year's selection is the normal sequence.
  const locked = handedOver;

  return (
    <>
      <section className="admin-section" aria-labelledby="admin-settings-title">
        <div className="admin-section-head">
          <p className="admin-section-kicker">Настройки</p>
          {/* The name alone: the backend names a selection it generates «Набор 2027», and
              «Набор «Набор 2027»» is what wrapping it produced. */}
          <h2 id="admin-settings-title">
            {activeTrack ? activeTrack.name : "Набор не настроен"}
          </h2>
        </div>

        {!activeTrack ? (
          <p className="admin-state">
            Сейчас нет активного набора — настраивать пока нечего. Начать новый можно ниже.
          </p>
        ) : (
          <form className="settings-form" onSubmit={save}>
            <label htmlFor="name">Название набора</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={change}
              disabled={locked}
              className={errors.name ? "input-error" : ""}
              aria-invalid={errors.name || undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <p className="error-text" id="name-error">Назовите набор</p>}

            <div className="settings-pair">
              <div className="settings-field">
                <label htmlFor="startDate">Начало</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={form.startDate}
                  onChange={change}
                  disabled={locked}
                  className={errors.startDate ? "input-error" : ""}
                  aria-invalid={errors.startDate || undefined}
                  aria-describedby={errors.startDate ? "start-error" : undefined}
                />
                {errors.startDate && (
                  <p className="error-text" id="start-error">Укажите дату начала</p>
                )}
              </div>

              <div className="settings-field">
                <label htmlFor="endDate">Окончание</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={form.endDate}
                  onChange={change}
                  disabled={locked}
                  className={errors.endDate ? "input-error" : ""}
                  aria-invalid={errors.endDate || undefined}
                  aria-describedby={errors.endDate ? "end-error" : "end-hint"}
                />
                {errors.endDate ? (
                  <p className="error-text" id="end-error">
                    {errors.range
                      ? "Окончание должно быть позже начала"
                      : "Укажите дату окончания"}
                  </p>
                ) : (
                  // Not a formality: the backend reads a selection without an end date as closed,
                  // so leaving it empty would shut the selection down while looking like it
                  // removed a limit.
                  <p className="field-hint" id="end-hint">
                    Без даты окончания набор считается закрытым.
                  </p>
                )}
              </div>
            </div>

            <p className="settings-note">
              Цель — сколько мест в команде на каждом курсе. Правка применится к каждой команде, у
              которой нет собственной цели.
            </p>

            <div className="settings-pair">
              <div className="settings-field">
                <label htmlFor="firstYearTarget">Мест для 1 курса</label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="firstYearTarget"
                  name="firstYearTarget"
                  value={form.firstYearTarget}
                  onChange={change}
                  disabled={locked}
                  className={errors.firstYearTarget ? "input-error" : ""}
                  aria-invalid={errors.firstYearTarget || undefined}
                  aria-describedby={errors.firstYearTarget ? "first-error" : undefined}
                />
                {errors.firstYearTarget && (
                  <p className="error-text" id="first-error">Целое число, например 3</p>
                )}
              </div>

              <div className="settings-field">
                <label htmlFor="secondYearTarget">Мест для 2 курса и старше</label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="secondYearTarget"
                  name="secondYearTarget"
                  value={form.secondYearTarget}
                  onChange={change}
                  disabled={locked}
                  className={errors.secondYearTarget ? "input-error" : ""}
                  aria-invalid={errors.secondYearTarget || undefined}
                  aria-describedby={errors.secondYearTarget ? "second-error" : undefined}
                />
                {errors.secondYearTarget && (
                  <p className="error-text" id="second-error">Целое число, например 3</p>
                )}
              </div>
            </div>

            <div className="settings-actions">
              <button type="submit" disabled={saving || locked}>Сохранить</button>
              {/* The banner above gives the whole sentence; beside the button it only has to say
                  why this one is off, because a phone has no hover to ask with. */}
              {locked && (
                <span className="settings-reason">Набор передан — правки в кабинете ПД.</span>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="admin-section" aria-labelledby="admin-next-title">
        <div className="admin-section-head">
          <p className="admin-section-kicker">Дальше</p>
          <h2 id="admin-next-title">
            {activeTrack ? "Закончить этот набор" : "Начать набор"}
          </h2>
        </div>

        <form className="settings-form" onSubmit={askNewSelection}>
          <p className="settings-note">
            {activeTrack
              ? "Новый набор становится текущим, а этот — архивом: его команды и анкеты остаются, но меняться перестают. Цели и тип перейдут с текущего набора."
              : "Новый набор станет текущим: студенты смогут заполнять анкеты и собирать команды."}
          </p>

          <label htmlFor="newName">Название нового набора</label>
          <input
            type="text"
            id="newName"
            name="name"
            value={newSelection.name}
            onChange={changeNew}
            placeholder="Если не указать — «Набор» и год начала"
          />

          <div className="settings-pair">
            <div className="settings-field">
              <label htmlFor="newStart">Начало нового набора</label>
              <input
                type="date"
                id="newStart"
                name="startDate"
                value={newSelection.startDate}
                onChange={changeNew}
                className={newErrors.startDate ? "input-error" : ""}
                aria-invalid={newErrors.startDate || undefined}
                aria-describedby={newErrors.startDate ? "new-start-error" : undefined}
              />
              {newErrors.startDate && (
                <p className="error-text" id="new-start-error">Укажите дату начала</p>
              )}
            </div>

            <div className="settings-field">
              <label htmlFor="newEnd">Окончание нового набора</label>
              <input
                type="date"
                id="newEnd"
                name="endDate"
                value={newSelection.endDate}
                onChange={changeNew}
                className={newErrors.endDate ? "input-error" : ""}
                aria-invalid={newErrors.endDate || undefined}
                aria-describedby={newErrors.endDate ? "new-end-error" : "new-end-hint"}
              />
              {newErrors.endDate ? (
                <p className="error-text" id="new-end-error">
                  {newErrors.range
                    ? "Окончание должно быть позже начала"
                    : "Укажите дату окончания"}
                </p>
              ) : (
                <p className="field-hint" id="new-end-hint">
                  Без даты окончания набор считается закрытым.
                </p>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button type="submit">Начать новый набор</button>
          </div>
        </form>

        {activeTrack && (
          <div className="settings-handover">
            {/* Deliberately not «отправляет составы»: `handOver` writes a timestamp and nothing
                else. Core normally marks the hand-over itself through the integration API, and
                this button is for the case where the import happened without it. */}
            <p className="settings-note">
              {handedOver
                ? "Набор отмечен как переданный: дальше с составами работают в кабинете ПД, а здесь изменить его нельзя. Отметку можно снять, пока составы там не разобрали."
                : "Отметка ставится, когда составы забрал кабинет ПД — там этапы, защиты и оценки. После неё набор здесь только для чтения."}
            </p>
            <div className="settings-actions">
              {handedOver ? (
                <button type="button" onClick={askCancelHandOver}>
                  Снять отметку о передаче
                </button>
              ) : (
                <button type="button" onClick={askHandOver}>Отметить переданным</button>
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog {...confirmProps} />
    </>
  );
};

export default AdminSettingsPage;
