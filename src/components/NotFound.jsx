import { State } from "./State";
import { useDocumentTitle } from "../hooks/useNow";
import { FaFlagCheckered } from "react-icons/fa6";

function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <main className="page" id="main">
      <section className="panel state-panel">
        <State
          kind="empty"
          icon={FaFlagCheckered}
          title="Off track"
          action={{ label: "Back to the dashboard", to: "/", primary: true }}
        >
          This page doesn't exist — the link may be old or mistyped.
        </State>
      </section>
    </main>
  );
}

export default NotFound;
