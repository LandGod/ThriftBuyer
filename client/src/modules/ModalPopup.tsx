import React, { Component } from "react";
import Modal, { ModalProps } from "react-bootstrap/Modal";
import Button, { ButtonProps } from "react-bootstrap/Button";

type buttons = "close" | "okay" | "confirm";

type ModalPopupProps = {
  header?: string;
  title?: string;
  message?: string; // Message or children can be passed in for maximum customizeability
  onModalClose?: Function;
  // ToDo: Figure out how to import type defenitions from react-bootstrap module for use here
  size: ModalProps["size"]; // 'sm', 'lg', or 'xl'
  style: ButtonProps["variant"]; // Bootstrap color for button
  buttons: buttons;
  confirm: (...args: any[]) => void;
  cancel: (...arg: any[]) => void;
};

type ModalState = {
  showModal: boolean;
};

export class ModalPopup extends Component<ModalPopupProps, ModalState> {
  static defaultProps: ModalPopupProps = {
    size: "sm",
    style: "primary",
    buttons: "close",
    confirm: () => {},
    cancel: () => {}
  };

  state = {
    showModal: false
  };

  // Show or hide modal
  toggle = (): void => {
    this.setState((currentState: ModalState) => {
      currentState.showModal = !currentState.showModal;

      // If this toggle would close the modal, also execute the onModalClose function if one has been supplied
      if (!currentState.showModal && this.props.onModalClose) {
        this.props.onModalClose();
      }

      return currentState;
    });
  };

  confirm = (callback: Function): void => {
    callback();
    this.toggle();
  };

  cancel = (callback: Function): void => {
    callback();
    this.toggle();
  };

  // Select the buttons to render based on props.
  buttonSelect = (buttonType: buttons): React.ReactElement => {
    switch (buttonType) {
      default:
        buttonType = "okay";
      case "close" || "okay":
        return (
          <Modal.Footer>
            <Button variant={this.props.style} onClick={this.toggle}>
              {buttonType}
            </Button>
          </Modal.Footer>
        );

      case "confirm":
        return (
          <Modal.Footer>
            <Button
              variant={"success"}
              onClick={() => {
                this.confirm(this.props.confirm);
              }}
            >
              Confirm
            </Button>
            <Button
              variant={"danger"}
              onClick={() => {
                this.cancel(this.props.cancel);
              }}
            >
              Cancel
            </Button>
          </Modal.Footer>
        );
    }
  };

  render() {
    return (
      <Modal
        size={this.props.size}
        centered
        show={this.state.showModal}
        onHide={this.toggle}
      >
        <Modal.Header closeButton>
          {this.props.header ? (
            <Modal.Title>{this.props.header}</Modal.Title>
          ) : (
            ""
          )}
        </Modal.Header>
        <Modal.Body>
          {this.props.title ? <h4>{this.props.title}</h4> : ""}
          {this.props.message ? <p>{this.props.message}</p> : ""}
          {this.props.children ? this.props.children : ""}
        </Modal.Body>
        {/* Footer rendered below based on desired buttons */}
        {this.buttonSelect(this.props.buttons)}
      </Modal>
    );
  }
}

export default ModalPopup;
