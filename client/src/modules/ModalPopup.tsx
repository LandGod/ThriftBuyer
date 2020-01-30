import React, { Component } from "react";
import Modal, { ModalProps } from "react-bootstrap/Modal";
import Button, { ButtonProps } from "react-bootstrap/Button";

type ModalPopupProps = {
  header: string;
  title?: string;
  message: string;
  onModalClose?: Function;
  // ToDo: Figure out how to import type defenitions from react-bootstrap module for use here
  size: ModalProps['size'];
  style: ButtonProps['variant'];
};

type ModalState = {
  showModal: boolean;
};

export class ModalPopup extends Component<ModalPopupProps, ModalState> {
  static defaultProps: ModalPopupProps = {
    header: "Alert!",
    message: "<Oops! Something went wrong.>",
    size: "lg",
    style: "primary"
  };

  state = {
    showModal: false
  };

  // Show or hide modal
  toggle = () => {
    this.setState((currentState: ModalState) => {
      currentState.showModal = !currentState.showModal;

      // If this toggle would close the modal, also execute the onModalClose function if one has been supplied
      if (!currentState.showModal && this.props.onModalClose) {
        this.props.onModalClose();
      }

      return currentState;
    });
  };

  render() {
    return (
      <Modal
        size={this.props.size}
        centered
        show={this.state.showModal}
        onHide={this.toggle}
      >
        <Modal.Header closebutton>
          <Modal.Title>{this.props.header}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.title ? <h4>{this.props.title}</h4> : ""}
          <p>{this.props.message}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={this.props.style} onClick={this.toggle}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ModalPopup;
