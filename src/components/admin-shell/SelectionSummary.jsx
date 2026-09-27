import { summarize } from "../../utils/overview";

/** Where the selection stands, one line, above what ends it (#73). Nothing until it is known. */
const SelectionSummary = ({ overview }) => {
  const sentence = summarize(overview);
  return sentence ? <p className="settings-summary">{sentence}</p> : null;
};

export default SelectionSummary;
