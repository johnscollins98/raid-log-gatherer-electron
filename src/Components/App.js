import "./App.css";
import { useEffect, useState } from "react";
import SettingsForm from "./Form/SettingsForm";
import Toast from "./Toast";
import Links from "./Links";
const { ipcRenderer } = window.require("electron");

function App() {
  const [logLinks, setLogLinks] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Idle");

  const [toastShowing, setToastShowing] = useState(false);
  const [toastHeader, setToastHeader] = useState("");
  const [toastBody, setToastBody] = useState("");

  const showToast = (header, body, timeout = 2000) => {
    setToastHeader(header);
    setToastBody(body);
    setToastShowing(true);

    setTimeout(() => setToastShowing(false), timeout);
  };

  useEffect(() => {
    ipcRenderer.once("addLink", (_, link) => {
      setLogLinks([...logLinks, link]);
    });
  }, [logLinks]);

  const linkHandler = (e) => {
    e.preventDefault();
    ipcRenderer.invoke("openLink", e.target.href);
  };

  return (
    <div className="App">
      <SettingsForm
        logLinks={logLinks}
        setLogLinks={setLogLinks}
        setStatusMessage={setStatusMessage}
        ipcRenderer={ipcRenderer}
        showToast={showToast}
      />
      <Links logLinks={logLinks} linkHandler={linkHandler} />
      <div>Status: {statusMessage}</div>
      <Toast
        toastShowing={toastShowing}
        toastBody={toastBody}
        toastHeader={toastHeader}
      />
    </div>
  );
}

export default App;
