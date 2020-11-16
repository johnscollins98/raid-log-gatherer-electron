import { InputGroup, InputGroupAddon, Input, InputGroupText } from "reactstrap";

const DateInput = ({ id, label, date, setDate }) => {
  return (
    <InputGroup>
      <InputGroupAddon addonType="prepend">
        <InputGroupText>{label}</InputGroupText>
      </InputGroupAddon>
      <Input
        type="date"
        name={id}
        id={id}
        placeholder="date placeholder"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
    </InputGroup>
  );
};

export default DateInput;
