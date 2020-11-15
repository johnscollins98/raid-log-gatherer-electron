import { Toast as RToast, ToastHeader, ToastBody } from "reactstrap";

const Toast = ({ toastShowing, toastBody, toastHeader }) => (
  <RToast
    isOpen={toastShowing}
    style={{ position: "fixed", alignSelf: "center", fontSize: 20, zIndex: 999 }}
  >
    <ToastHeader>{toastHeader}</ToastHeader>
    <ToastBody>{toastBody}</ToastBody>
  </RToast>
);

export default Toast;