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
  Modal,
  ModalHeader,
  ModalBody,
  Label,
} from "reactstrap";
import DateInput from "./DateInput";
import TimeInput from "./TimeInput";
import { useEffect, useState } from "react";
import data from "../../bossData.json";
const { ipcRenderer } = window.require("electron");

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

  const [selectedFolder, setSelectedFolder] = useState("");
  const [processing, setProcessing] = useState(false);

  const [allPossibleFolders, setAllPossibleFolders] = useState([]);
  const [foldersModal, setFoldersModal] = useState(false);
  const [foldersToUse, setFoldersToUse] = useState([]);

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

      const data = { selectedFolder, foldersToUse, fullStartTime, fullEndTime };
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
      console.error(err.error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(async () => {
    try {
      const bossNames = await ipcRenderer.invoke("getBossNames", {
        selectedFolder,
      });

      const bossData = data.map((category) => {
        const bosses = category.bosses.filter((boss) => {
          const idx = bossNames.indexOf(boss);
          if (idx == -1) return false;

          bossNames.splice(idx, 1);
          return true;
        });

        return { ...category, bosses };
      });

      if (bossNames.length) {
        bossData.push({
          id: "other",
          label: "Uncategorised",
          bosses: bossNames,
        });
      }

      setAllPossibleFolders(bossData);
      setFoldersToUse(bossData.map((b) => b.bosses).flat());
    } catch (err) {
      console.error(err);
    }
  }, [selectedFolder]);

  return (
    <>
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
              <TimeInput
                time={startTime}
                setTime={setStartTime}
                id="startTime"
                label="Raid Start Time"
              />
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
              <TimeInput
                time={endTime}
                setTime={setEndTime}
                id="endTime"
                label="Raid End Time"
              />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <FormGroup>
              <Button
                className="form-control"
                disabled={processing}
                onClick={() => setFoldersModal(!foldersModal)}
              >
                Select folders to include
              </Button>
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
      <Modal
        isOpen={foldersModal}
        toggle={() => setFoldersModal(!foldersModal)}
      >
        <ModalHeader toggle={() => setFoldersModal(!foldersModal)}>
          Select Folders
        </ModalHeader>
        <ModalBody>
          <h5>Please select which folders you wish to include:</h5>
          <a
            href="#"
            onClick={() =>
              setFoldersToUse(allPossibleFolders.map((b) => b.bosses).flat())
            }
          >
            Select all
          </a>{" "}
          /{" "}
          <a href="#" onClick={() => setFoldersToUse([])}>
            Select none
          </a>
          <Form className="modal-select-form">
            {allPossibleFolders.map((category) => (
              <>
                <span className="category-label">{category.label}</span>
                <a
                  href="#"
                  onClick={() =>
                    setFoldersToUse([...foldersToUse, ...category.bosses])
                  }
                >
                  +
                </a>{" "}
                /{" "}
                <a
                  href="#"
                  onClick={() =>
                    setFoldersToUse(
                      foldersToUse.filter((b) => !category.bosses.includes(b))
                    )
                  }
                >
                  -
                </a>
                {category.bosses.map((boss) => (
                  <FormGroup check key={category.id}>
                    <Label check>
                      <Input
                        type="checkbox"
                        checked={foldersToUse.includes(boss)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFoldersToUse([...foldersToUse, boss]);
                          } else {
                            setFoldersToUse(
                              foldersToUse.filter((f) => f !== boss)
                            );
                          }
                        }}
                      />{" "}
                      {boss}
                    </Label>
                  </FormGroup>
                ))}
              </>
            ))}
          </Form>
        </ModalBody>
      </Modal>
    </>
  );
};

export default SettingsForm;
