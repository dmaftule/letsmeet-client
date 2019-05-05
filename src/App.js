/**
 Copyright Daniela Maftuleac 2019.
 */

import React, {Component} from 'react';
import {Badge, Button, Container} from "reactstrap";
import {Row} from "reactstrap";
import {Col} from "reactstrap";
import Weekday from "./Weekday";
import UserForm from "./UserForm";

/**
 * App class is the main component and entry point.
 * When the component is created it connects to the server
 * and sends to the server the selected time slots by the users
 * and it receives and displays the common overlaps of selected
 * time slots.
 */
class App extends Component {
    /**
     * Creates an App instance with the given properties.
     *
     * @param props The input properties.
     */
    constructor(props) {
        super(props);
        this.state = {
            user: undefined,
            week: this.mkWeek(5),
            userLocked: false
        };
        this.connect();
    }

    /**
     * Creates WebSocket connection and listen for messages.
     */
    connect() {
        // Choose the server address. Use the local server if running locally.
        let host = 'wss://letsmeet.maftuleac.com';
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            host = 'ws://localhost:9123';
        }

        // Create WebSocket connection.
        this.socket = new WebSocket(host);

        // Connection opened.
        this.socket.addEventListener('open', () => {
            console.log("Connected to: " + host);
        });

        // Listen for messages.
        this.socket.addEventListener('message', (event) => {
            this.receiveSolution(event.data);
        });

        // Connection closed.
        this.socket.addEventListener('close', () => {
            console.log("Disconnected from: " + host);
            this.retryConnection();
        });
    }

    /**
     * In case of disconnection from the server,
     * it attempts to reconnect every 3 seconds.
     */
    retryConnection() {
        setTimeout(() => {
            this.connect();
        }, 3000);
    }

    /**
     * Receives the common overlapping time slots from the Server and
     * updates `solution`.
     * @param data The transmitted optimal time slots by the Server.
     */
    receiveSolution(data) {
        this.deleteSolution();
        let solution = JSON.parse(data);
        solution.forEach((timeslot) => {
            let day = timeslot.day;
            let slot = timeslot.slot;
            this.setSolution(day, slot);
        });
    }

    /**
     * Sends to the Server the selected time slots (clicked time slots), as
     * an object containing the user's id, the day index, the slot index and
     * its type set to "selected".
     *
     * @param day An integer from 0 to 4 representing the index of the selected
     *            time slot's day.
     * @param slot An integer from 0 to 12 representing the index of the selected
     *            time slot of day 'day'.
     */
    sendSlotSelected(day, slot) {
        if (typeof day !== "number" || day < 0 || day > 4) {
            throw new Error("The parameter 'day' must be a number between 0 and 4.")
        }
        if (typeof slot !== "number" || slot < 0 || slot > 12) {
            throw new Error("The parameter 'slot' must be a number between 0 and 12.")
        }
        let data = {user: this.state.user, day: day, slot: slot, type: "selected"};
        this.send(data);
    }

    /**
     * Sends to the Server the unselected time slots (unclicked time slots), as
     * an object containing the user's id, the day index, the slot index and
     * its type set to "unselected".

     *
     * @param day An integer from 0 to 4 representing the index of the unselected
     *            time slot's day.
     * @param slot An integer from 0 to 12 representing the index of the selected
     *            time slot of day 'day'.
     */
    sendSlotUnselected(day, slot) {
        if (typeof day !== "number" || day < 0 || day > 4) {
            throw new Error("The parameter 'day' must be a number between 0 and 4.")
        }
        if (typeof slot !== "number" || slot < 0 || slot > 12) {
            throw new Error("The parameter 'slot' must be a number between 0 and 12.")
        }
        let data = {user: this.state.user, day: day, slot: slot, type: "unselected"};
        this.send(data);
    }

    /**
     * Sends message to the Server.
     *
     * @param obj The object to be sent.
     */
    send(obj) {
        let json = JSON.stringify(obj);
        this.socket.send(json);
    }

    /**
     * Switches time slots from selected to unselected or vice-versa.
     * This is done by creating an new copy of the week array with an updated entry,
     * i.e. the field `type` will be switched from 'selected' to 'unselected' and
     * vice-versa.
     *
     * @param d An integer from 0 to 4 representing the index of the
     *          clicked time slot's day.
     * @param s An integer from 0 to 12 representing the index of
     *          clicked time slot.
     */
    toggleAvailability(d, s) {
        if (typeof d !== "number" || d < 0 || d > 4) {
            throw new Error("The parameter 'd' must be a number between 0 and 4.")
        }
        if (typeof s !== "number" || s < 0 || s > 12) {
            throw new Error("The parameter 's' must be a number between 0 and 12.")
        }
        let newdays = this.state.week.map((day, dayindex) => {
            if (d === dayindex) {
                return day.map((slot, slotindex) => {
                    if (s === slotindex) {
                        let obj = {...slot};
                        if (obj.selected) {
                            this.sendSlotUnselected(d, s);
                            obj.selected = false;
                        } else {
                            this.sendSlotSelected(d, s);
                            obj.selected = true;
                        }
                        return obj;
                    } else {
                        return slot;
                    }
                })
            } else {
                return day;
            }
        });
        this.setState({week: newdays, userLocked: true});
    }

    /**
     * Checks if the user name is valid.
     *
     * @returns {boolean} true if the user name is valid, false otherwise.
     */
    isValid() {
        return (this.state.user !== undefined && this.state.user.trim().length >= 1);
    }

    /**
     * Updates the common overlapping time slots.
     *
     * @param d An integer from 0 to 4 representing the index of
     *          the common time slot's day.
     * @param s An integer from 0 to 12 representing the index of
     *          common time slot.
     */
    setSolution(d, s) {
        if (typeof d !== "number" || d < 0 || d > 4) {
            throw new Error("The parameter 'd' must be a number between 0 and 4.")
        }
        if (typeof s !== "number" || s < 0 || s > 12) {
            throw new Error("The parameter 's' must be a number between 0 and 12.")
        }
        let updatedWeek = this.state.week.map((day, dayindex) => {
            if (d === dayindex) {
                return day.map((slot, slotindex) => {
                    if (s === slotindex) {
                        let obj = {...slot};
                        obj.optimal = true;
                        return obj;
                    } else {
                        return slot;
                    }
                })
            } else {
                return day;
            }
        });
        this.setState({week: updatedWeek});
    }

    /**
     * Deletes the array of common overlapping time slots.
     */
    deleteSolution() {
        let newdays = this.state.week.map((day) => {
            return day.map((slot) => {
                let obj = {...slot};
                obj.optimal = false;
                return obj;
            })
        });
        this.setState({week: newdays});
    }

    /**
     * Creates a time slot object that contains the index of the time slot in the day,
     * the index of the day, the text for the time slot and label selected and optimal,
     * showing if the time slot was selected and respectively, if it is selected by
     * all the users.
     * Example: The time slot with index 3, on Wednesday, from 12pm to 1pm, is initialized
     * as not selected by this user nor selected by all th users.
     *          {
     *           id: 3,
     *           day: 2,
     *           text: "12:00-13:00",
     *           selected: false,
     *           optimal: false
     *          }
     *
     * @param id An integer representing the index of the time slot.
     * @param day An integer from 0 to 4 representing the day index.
     * @param text The text (hour) of the time slot.
     * @returns {{optimal: boolean, id: *, text: *, day: *, selected: boolean}} The created time slot object,
     *          containing the index of the time slot, the day index of the week, the text for the time slot hour,
     *          the labels selected and optimal set to false (as initially the time slot is neither selected
     *          by a user and even less part of the common overlapping time slots).
     */
    mkSlot(id, day, text) {
        if (typeof id !== "number") {
            throw new Error("The parameter 'id' must be a number.")
        }
        if (typeof day !== "number" || day < 0 || day > 4) {
            throw new Error("The parameter 'day' must be a number between 0 and 4.")
        }
        if (typeof text !== "string") {
            throw new Error("The parameter 'text' must be a string.")
        }

        return {
            id: id,
            day: day,
            text: text,
            selected: false,
            optimal: false
        };
    }

    /**
     * Creates a day array for the day of the week with index `day`. The index
     * considered for our demo is from 0 to 4.
     * Each element of the array is a `mkSlot` object corresponding to the time slots in that day.
     *
     * @param day An integer from 0 to 4 representing the day index.
     * @returns {Array} The constructed array of `mkSlot` objects.
     */
    mkDay(day) {
        if (typeof day !== "number" || day < 0 || day > 4) {
            throw new Error("The parameter 'day' must be a number between 0 and 4.")
        }
        // The returning array containing the time slots for the day `day`.
        let result = [];

        // Starting from time slot 9:00 to time slot 21:00, create all time slots.
        // The first time slot is done separately as it needs a "0" for "9:00".
        result.push(this.mkSlot(0, day, "09:00-10:00"));
        for (let i = 10; i < 22; i++) {
            result.push(this.mkSlot(i - 9, day, i + ":00-" + (i + 1) + ":00"));
        }
        return result;
    }

    /**
     * Creates a week array with the number of elements `numDays` corresponding
     * to the number of days of the week considered (in our demo - 5 days, however,
     * it can be maximum 7 days).
     * Each element of the array is a `mkDay` object.
     *
     * @param numDays An number representing the number of days considered per week.
     * @returns {Array} The array containing `numDays` object of type `mkDay`.
     */
    mkWeek(numDays) {
        if (typeof numDays !== "number") {
            throw new Error("The parameter 'numDays' must be a number.")
        }
        let week = [];
        for (let i = 0; i < numDays; i++) {
            week.push(this.mkDay(i));
        }
        return week;
    }

    /**
     * Returns the name of the week day.
     *
     * @param i An integer from 0 to 6 representing the index of the week day.
     * @returns {string} The text for the day object.
     */
    getDayName(i) {
        if (typeof i !== "number") {
            throw new Error("The parameter 'i' must be a number");
        }
        if (i === 0) {
            return "Monday";
        } else if (i === 1) {
            return "Tuesday";
        } else if (i === 2) {
            return "Wednesday";
        } else if (i === 3) {
            return "Thursday";
        } else if (i === 4) {
            return "Friday";
        } else if (i === 5) {
            return "Saturday";
        } else if (i === 6) {
            return "Sunday";
        } else {
            throw new Error("Invalid day of the week.");
        }
    }

    /**
     * Updates the user name. The method called when the user name is changed.
     *
     * @param newname The new name of the user.
     */
    notifyUserChanged(newname) {
        if (typeof newname !== "string") {
            throw new Error("The parameter 'newname' must be a string.")
        }
        this.setState({user: newname});
    }

    ResetDataOnServer() {
        let reset = {reset: true};
        this.send(reset);
        this.setState({
            user: undefined,
            week: this.mkWeek(5),
            userLocked: false
        });
    }

    /**
     * The render function of App component.
     *
     * @returns {*} React elements and components.
     */
    render = () => {
        return (
            <Container className="mt-3">
                <h1 className="display-4">
                    Let's Meet
                </h1>
                <p className="lead mt-3">
                    Welcome to the online group meeting scheduler. <br/>
                    <ul>
                        <li> Enter your name.</li>
                        <li> Choose the time slots where you are available. They will appear in blue.</li>
                        <li> Wait for your friends to choose their available time slots.
                            The time slots where everyone is available will appear in green.
                        </li>
                    </ul>
                </p>
                <Container className="mt-4">
                    <Row>
                        <Col md={2}> </Col>
                        <Col md={6}>
                            <UserForm
                                user={this.state.user}
                                isValidUser={this.isValid()}
                                userLocked={this.state.userLocked}
                                notifyUserChanged={this.notifyUserChanged.bind(this)}
                            />
                        </Col>
                        <Col md={4}></Col>
                    </Row>
                    <Row className="mt-4">
                        <h5>
                            <Badge color="secondary" pill className="mr-2">I am unavailable</Badge>
                            <Badge color="primary" pill className="mr-2">I am available</Badge>
                            <Badge color="success" pill className="mr-2">Everyone is available</Badge>
                        </h5>
                    </Row>
                </Container>
                <Container className="mt-2">
                    <Row>
                        {this.state.week.map((day, index) => {
                            return <Weekday
                                user={this.state.user}
                                name={this.getDayName(index)}
                                day={day}
                                isValidUser={this.isValid()}
                                notifyToggleSlot={this.toggleAvailability.bind(this)}/>
                        })}
                    </Row>
                    <Container className="mt-2">
                        <Row>
                            <Col md={4}>
                                <Button
                                    color="outline-danger"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => this.ResetDataOnServer()}>
                                    Reset Everything on Server
                                </Button>
                            </Col>
                            <Col md={8}> </Col>
                        </Row>
                    </Container>
                </Container>
            </Container>

        );
    }
}

export default App;
