/**
 Copyright Daniela Maftuleac 2019.
 */

import React from "react";
import Input from "reactstrap/es/Input";

class UserForm extends React.Component {
    /**
     * Handler triggered by state mutations.
     *
     * @param event The triggered event (keystroke).
     */
    onChange(event) {
        this.props.notifyUserChanged(event.target.value);
    }

    /**
     * The render function of UserForm component.
     *
     * @returns {*} React elements and components.
     */
    render() {
        return (<Input type="text"
                       value={this.props.user}
                       placeholder="Enter your name"
                       size="lg"
                       onChange={this.onChange.bind(this)}
                       invalid={!this.props.isValidUser}
                       disabled={this.props.userLocked}
        />);
    }
}

export default UserForm;