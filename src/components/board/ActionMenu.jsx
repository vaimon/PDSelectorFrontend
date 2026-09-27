import { useCallback, useEffect, useRef, useState } from "react";

import useDismissable from "../../hooks/useDismissable";
import { MoreIcon } from "../icons/AdminIcons";
import IconAction from "./IconAction";
import "./actions.css";

/**
 * The «⋯» of a row or a card (#72): what it can do, out of sight until asked for.
 *
 * A menu in the ARIA sense, because that is what a keyboard expects of «⋯»: the arrows walk the items,
 * Home and End jump to the ends, Escape closes it and puts focus back on the button it came from. A
 * click elsewhere closes it too, without pulling focus anywhere.
 *
 * `items`: `{ label, onSelect, danger?, hidden? }`. A danger item goes last, under a rule.
 */
const ActionMenu = ({ label, tip = "Действия", items, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [upward, setUpward] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const shown = items.filter((item) => !item.hidden);

  // A click elsewhere closes it quietly; Escape is the menu's own (below), since it hands focus back.
  const closeQuietly = useCallback(() => setOpen(false), []);
  const wrapRef = useDismissable(open, closeQuietly);

  const close = (returnFocus) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (open) menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  const toggle = () => {
    if (open) {
      close(false);
      return;
    }
    // Near the bottom of the window the menu opens upwards instead of off the screen.
    const box = triggerRef.current.getBoundingClientRect();
    setUpward(box.bottom + 160 > window.innerHeight);
    setOpen(true);
  };

  const onMenuKey = (event) => {
    const entries = [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')];
    const at = entries.indexOf(document.activeElement);
    const go = (index) => {
      event.preventDefault();
      entries[(index + entries.length) % entries.length]?.focus();
    };
    if (event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(entries.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  };

  const plain = shown.filter((item) => !item.danger);
  const danger = shown.filter((item) => item.danger);

  const renderItem = (item) => (
    <button
      key={item.label}
      type="button"
      role="menuitem"
      className={`action-menu-item${item.danger ? " is-danger" : ""}`}
      disabled={disabled}
      onClick={() => {
        close(false);
        item.onSelect();
      }}
    >
      {item.label}
    </button>
  );

  return (
    <div className="action-menu" ref={wrapRef}>
      <IconAction
        ref={triggerRef}
        label={label}
        tip={open ? undefined : tip}
        className={open ? "is-open" : ""}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || shown.length === 0}
        onClick={toggle}
      >
        <MoreIcon />
      </IconAction>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className={`action-menu-list${upward ? " is-up" : ""}`}
          onKeyDown={onMenuKey}
        >
          {plain.map(renderItem)}
          {plain.length > 0 && danger.length > 0 && <hr className="action-menu-rule" />}
          {danger.map(renderItem)}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
