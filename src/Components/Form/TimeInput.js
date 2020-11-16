import { useState } from "react";
import { InputGroup, InputGroupAddon, Input, InputGroupText } from "reactstrap";

const TimeInput = ({ id, label, time, setTime }) => {
  const [enabled, setEnabled] = useState(false);

  const handleTimeEnabled = (flag) => {
    setEnabled(flag);

    if (!flag) {
      setTime("00:00");
    }
  };

  return (
    <InputGroup>
      <InputGroupAddon addonType="prepend">
        <InputGroupText style={{ alignItems: "baseline" }}>
          <Input
            addon
            type="checkbox"
            aria-label="Checkbox for following text input"
            checked={enabled}
            onChange={(e) => handleTimeEnabled(e.target.checked)}
            style={{ marginRight: "5px" }}
          />
          {label}
        </InputGroupText>
      </InputGroupAddon>
      <Input
        type="time"
        name={id}
        id={id}
        placeholder="time placeholder"
        disabled={!enabled}
        value={time}
        onChange={(e) => setTime(e.target.value)}
      />
    </InputGroup>
  );
};

export default TimeInput;
