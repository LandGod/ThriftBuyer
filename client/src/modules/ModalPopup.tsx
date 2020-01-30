import React, { Component } from "react";
import Modal, { ModalProps } from "react-bootstrap/Modal";
import Button, { ButtonProps } from "react-bootstrap/Button";

type ModalPopupProps = {
  header?: string;
  title?: string;
  message?: string; // Message or children can be passed in for maximum customizeability
  onModalClose?: Function;
  // ToDo: Figure out how to import type defenitions from react-bootstrap module for use here
  size: ModalProps["size"]; // 'sm', 'lg', or 'xl'
  style: ButtonProps["variant"]; // Bootstrap color for button
};

type ModalState = {
  showModal: boolean;
};

export class ModalPopup extends Component<ModalPopupProps, ModalState> {
  static defaultProps: ModalPopupProps = {
    size: "sm",
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
        <Modal.Header closeButton>
          { this.props.header ? <Modal.Title>{this.props.header}</Modal.Title> : ""}
        </Modal.Header>
        <Modal.Body>
          {this.props.title ? <h4>{this.props.title}</h4> : ""}
          {this.props.message ? <p>{this.props.message}</p> : ""}
          {this.props.children ? this.props.children : ""}
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
