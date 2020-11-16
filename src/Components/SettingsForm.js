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
import DateInput from "./Form/DateInput";
import { useEffect, useState } from "react";

const SettingsForm = ({
  logLinks,
  setLogLinks,
  setStatusMessage,
  ipcRenderer,
  showToast,
}) => {
  useEffect(() => {
    const getUserConfig = async () => {
      const data = await ipcRenderer.invoke("getUserConfig");
      if (data) {
        if (data.selectedFolder) setSelectedFolder(data.selectedFolder);
      }
    };
    getUserConfig();
  }, []);

  const date = new Date();
  const dateString = date.toISOString().substring(0, 10);
  date.setDate(date.getDate() + 1);
  const nextDateString = date.toISOString().substring(0, 10);

  const [startDate, setStartDate] = useState(dateString);
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState(nextDateString);
  const [endTime, setEndTime] = useState("00:00");
  const [startTimeEnabled, setStartTimeEnabled] = useState(false);
  const [endTimeEnabled, setEndTimeEnabled] = useState(false);

  const handleTimeEnabled = (flag, setFlag, setTime) => {
    setFlag(flag);

    if (!flag) {
      setTime("00:00");
    }
  };

  const [selectedFolder, setSelectedFolder] = useState("");
  const [processing, setProcessing] = useState(false);

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
      setStatusMessage("Processing Files...");
      const res = await ipcRenderer.invoke("sendFileWithinTimes", data);
      if (res.error) {
        throw res;
      }

      const numFailures = res.filter((o) => o === false).length;
      const numSuccess = res.length - numFailures;
      const msg = `Completed with ${numSuccess} links. ${numFailures} failures.`;
      showToast("Complete", msg);
      setStatusMessage(msg);
    } catch (err) {
      showToast("Error", err.message);
      setStatusMessage(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
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
            <DateInput
              id="startDate"
              date={startDate}
              setDate={setStartDate}
              label="Raid Start Date"
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText style={{ alignItems: "baseline" }}>
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
            <DateInput
              id="endDate"
              date={endDate}
              setDate={setEndDate}
              label="Raid End Date"
            />
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup>
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText style={{ alignItems: "baseline" }}>
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
  );
};

export default SettingsForm;
