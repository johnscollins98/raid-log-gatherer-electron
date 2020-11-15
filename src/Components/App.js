import "./App.css";
import {
  InputGroup,
  InputGroupText,
  Button,
  Input,
  InputGroupAddon,
  Form,
  FormGroup,
  Row,
  Col,
  Spinner,
} from "reactstrap";
import { useEffect, useState } from "react";
import Toast from "./Toast";
import Links from "./Links";
const { ipcRenderer } = window.require("electron");

function App() {
  const [selectedFolder, setSelectedFolder] = useState("");

  const getDateAndTimeStrings = (isoString) => {
    return [
      isoString.match(/\d\d\d\d-\d\d-\d\d/)[0],
      isoString.match(/\d\d:\d\d/)[0],
    ];
  };

  const date = new Date();
  const isoString = date.toISOString();
  const [dateString, timeString] = getDateAndTimeStrings(isoString);

  const [startDate, setStartDate] = useState(dateString);
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState(dateString);
  const [endTime, setEndTime] = useState("00:00");
  const [startTimeEnabled, setStartTimeEnabled] = useState(false);
  const [endTimeEnabled, setEndTimeEnabled] = useState(false);

  const handleTimeEnabled = (flag, setFlag, setTime) => {
    setFlag(flag);

    if (!flag) {
      setTime("00:00");
    }
  };

  const [processing, setProcessing] = useState(false);
  const [logLinks, setLogLinks] = useState([]);
  const [statusMessage, setStatusMessage] = useState("Idle")

  const [toastShowing, setToastShowing] = useState(false);
  const [toastHeader, setToastHeader] = useState("");
  const [toastBody, setToastBody] = useState("");

  const showToast = (header, body, timeout = 1000) => {
    setToastHeader(header);
    setToastBody(body);
    setToastShowing(true);

    setTimeout(() => setToastShowing(false), 2000);
  };

  useEffect(() => {
    const getUserConfig = async () => {
      const data = await ipcRenderer.invoke("getUserConfig");
      if (data) {
        setSelectedFolder(data.selectedFolder);
        let [date, time] = getDateAndTimeStrings(data.fullStartTime);
        setStartDate(date);

        [date, time] = getDateAndTimeStrings(data.fullEndTime);
        setEndDate(date);
      }
    };
    getUserConfig();
  }, []);

  useEffect(() => {
    ipcRenderer.once("addLink", (event, link) => {
      setLogLinks([...logLinks, link]);
    });
  }, [logLinks]);

  const selectFolder = async () => {
    const selection = await ipcRenderer.invoke("getDirectorySelection");
    if (selection.canceled) return;

    setSelectedFolder(selection.filePaths[0]);
  };

  const copyToClipboard = async (e) => {
    navigator.clipboard.writeText(
      logLinks.reduce((final, current) => `${final}\n${current}`, "")
    );
    showToast("Copied", "Copied links to clipboard");
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setLogLinks([]);

    try {
      const fullStartTime = new Date(`${startDate}T${startTime}:00`);
      const fullEndTime = new Date(`${endDate}T${endTime}:00`);

      if (fullEndTime - fullStartTime < 0) {
        showToast("Error", "End time must be after start time.");
        return;
      }

      if (selectedFolder === "" || selectedFolder === null) {
        showToast("Error", "Please select log directory.");
        return;
      }

      const data = { selectedFolder, fullStartTime, fullEndTime };
      setStatusMessage("Processing Files...")
      const res = await ipcRenderer.invoke("sendFileWithinTimes", data);
      if (res.error) {
        console.log(res.error);
        showToast("Error", res.message);
        return;
      }

      const numFailures = res.filter((o) => o === false).length
      const numSuccess = res.length - numFailures;
      const msg = `Completed with ${numSuccess} links. ${numFailures} failures.`;
      showToast("Complete", msg);
      setStatusMessage(msg);
    } catch (err) {
      showToast("Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const linkHandler = (e) => {
    e.preventDefault();
    ipcRenderer.invoke("openLink", e.target.href);
  };

  return (
    <div className="App">
      <Form onSubmit={submitHandler}>
        <FormGroup>
          <InputGroup>
            <InputGroupAddon addonType="prepend">
              <InputGroupText>Select Log Folder</InputGroupText>
            </InputGroupAddon>
            <Input
              placeholder="Directory containing raid logs..."
              onChange={(e) => setSelectedFolder(e.target.value)}
              value={selectedFolder}
            />
            <InputGroupAddon addonType="append">
              <Button onClick={selectFolder}>Browse</Button>
            </InputGroupAddon>
          </InputGroup>
        </FormGroup>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>Raid Start Date</InputGroupText>
                </InputGroupAddon>
                <Input
                  type="date"
                  name="startDate"
                  id="startDate"
                  placeholder="date placeholder"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </InputGroup>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <Input
                      addon
                      type="checkbox"
                      aria-label="Checkbox for following text input"
                      checked={startTimeEnabled}
                      onChange={(e) =>
                        handleTimeEnabled(
                          e.target.checked,
                          setStartTimeEnabled,
                          setStartTime
                        )
                      }
                      style={{ marginRight: "5px" }}
                    />
                    Raid Start Time
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  type="time"
                  name="startTime"
                  id="startTime"
                  placeholder="time placeholder"
                  value={startTime}
                  disabled={!startTimeEnabled}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </InputGroup>
            </FormGroup>
          </Col>
        </Row>
        <Row form>
          <Col md={6}>
            <FormGroup>
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>Raid End Date</InputGroupText>
                </InputGroupAddon>
                <Input
                  type="date"
                  name="startDate"
                  id="startDate"
                  placeholder="date placeholder"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </InputGroup>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <InputGroup>
                <InputGroupAddon addonType="prepend">
                  <InputGroupText>
                    <Input
                      addon
                      type="checkbox"
                      aria-label="Checkbox for following text input"
                      checked={endTimeEnabled}
                      onChange={(e) =>
                        handleTimeEnabled(
                          e.target.checked,
                          setEndTimeEnabled,
                          setEndTime
                        )
                      }
                      style={{ marginRight: "5px" }}
                    />
                    Raid End Time
                  </InputGroupText>
                </InputGroupAddon>
                <Input
                  type="time"
                  name="startTime"
                  id="startTime"
                  placeholder="time placeholder"
                  disabled={!endTimeEnabled}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </InputGroup>
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <FormGroup>
              <Button className="form-control" disabled={processing}>
                {processing ? "Processing " : "Submit"}
                {processing ? <Spinner size="sm" /> : null}
              </Button>
            </FormGroup>
          </Col>
          <Col md={6}>
            <FormGroup>
              <Button
                className="form-control"
                onClick={copyToClipboard}
                disabled={logLinks.length === 0 || processing}
              >
                Copy links to Clipboard
              </Button>
            </FormGroup>
          </Col>
        </Row>
      </Form>
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
