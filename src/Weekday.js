/**
 Copyright Daniela Maftuleac 2019.
 */

import React from "react";
import {Button, Col, Container} from "reactstrap";

class Weekday extends React.Component {
    /**
     * Checks if the user name is valid.
     *
     * @returns {boolean} true if the username is valid, and false otherwise.
     */
    // isDisabled() {
    //     return !(this.props.user !== undefined && this.props.user.trim().length >= 1);
    // }

    /**
     * The render for the time slot button.
     *
     * @param slot The slot object.
     * @returns {*} The button element.
     */
    renderSlot(slot) {
        let color = "secondary";
        if (slot.optimal) {
            color = "success";
        } else if (slot.selected) {
            color = "primary";
        }
        return (
            <Button
                disabled={!this.props.isValidUser}
                color={color}
                size="sm" block
                className="mt-1"
                onClick={() => this.props.notifyToggleSlot(slot.day, slot.id)}>
                {slot.text}
            </Button>);
    }

    /**
     * Th render function of Weekday component.
     *
     * @returns {*} React elements and components.
     */
    render() {
        return (<Col className="border rounded" md={2}>
                <h3 className="text-center mt-2">
                    {this.props.name}
                </h3>
                <Container className="text-center">
                    {this.props.day.map(slot => this.renderSlot(slot))}
                </Container>
            </Col>
        )
    }
}

export default Weekday;