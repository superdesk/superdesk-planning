import React from 'react';
import classNames from 'classnames';

import {Button} from './index';
import {KEYCODES} from './constants';
import {onEventCapture} from './utils';

interface ButtonListProps {
    buttonList?: Array<any>;
    captureShiftTab?: boolean;
    right?: boolean;
}

/**
 * @ngdoc react
 * @name ButtonList
 * @description List of buttons
 */
class ButtonList extends React.PureComponent<ButtonListProps> {
    static defaultProps = {
        buttonList: [],
        captureShiftTab: true,
        right: true,
    };

    dom: {
        startButton: HTMLButtonElement | null;
        endButton: HTMLButtonElement | null;
    };

    constructor(props: ButtonListProps) {
        super(props);
        this.dom = {
            startButton: null,
            endButton: null,
        };
    }

    onKeyDown(index: number, event: React.KeyboardEvent) {
        if (event.keyCode !== KEYCODES.TAB) {
            return;
        }

        if (event.shiftKey === false && index === this.props.buttonList.length - 1) {
            // Last button, bring focus back to first button
            onEventCapture(event);
            this.dom.startButton.focus();
        } else if (event.shiftKey === true && this.props.captureShiftTab && index === 0) {
            // First button, take focus back to last button
            onEventCapture(event);
            this.dom.endButton.focus();
        }
    }

    render() {
        const {buttonList, right} = this.props;

        return (
            <div className="button-group button-group--end button-group--comfort">
                {buttonList.map((buttonProps, index) => (
                    <Button
                        className={classNames({'pull-right': right})}
                        key={index}
                        onKeyDown={this.onKeyDown.bind(this, index)}
                        refNode={(ref) => {
                            if (index === 0) {
                                this.dom.startButton = ref;
                            }

                            if (index === buttonList.length - 1) {
                                this.dom.endButton = ref;
                            }
                        }}
                        {...buttonProps}
                    />
                ))}
            </div>
        );
    }
}

export default ButtonList;
