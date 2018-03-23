import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {KEYCODES} from '../../../../constants';
import {onEventCapture} from '../../../../utils';

import {Popup, Content} from '../../Popup';

import './style.scss';

export class SelectTagPopup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {activeOptionIndex: -1};

        this.onKeyDown = this.onKeyDown.bind(this);
    }

    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpKey(event);
                break;
            }
        }
    }

    handleEnterKey(event) {
        let newTag;

        if (this.state.activeOptionIndex > -1) {
            newTag = this.props.options[this.state.activeOptionIndex];
        } else if (this.props.options.length === 1) {
            newTag = this.props.options[0];
        } else if (this.props.allowCustom) {
            newTag = get(event, 'target.value');
        }

        this.props.onChange(newTag);
    }

    handleDownKey(event) {
        if (this.state.activeOptionIndex < this.props.options.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
        }
    }

    handleUpKey(event) {
        if (this.state.activeOptionIndex > -1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
        }
    }

    render() {
        const {
            onClose,
            target,
            popupContainer,
            options,
            labelKey
        } = this.props;

        return (
            <Popup
                close={onClose}
                target={target}
                popupContainer={popupContainer}
                onKeyDown={this.onKeyDown}
                noPadding={true}
                className="select-tag__popup"
                inheritWidth={true}
            >
                <Content noPadding={true}>
                    {options.length > 0 && (
                        <ul className="select-tag__popup-list">
                            {options.map((o, index) => (
                                <li
                                    key={index}
                                    className={classNames(
                                        'select-tag__popup-item',
                                        {'select-tag__popup-item--active': index === this.state.activeOptionIndex}
                                    )}
                                >
                                    <button onClick={this.props.onChange.bind(null, o)}>
                                        <span>&nbsp;&nbsp;{get(o, labelKey, '')}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Content>
            </Popup>
        );
    }
}

SelectTagPopup.propTypes = {
    value: PropTypes.array,
    options: PropTypes.array,
    onClose: PropTypes.func,
    target: PropTypes.string,
    onChange: PropTypes.func,
    labelKey: PropTypes.string,
    popupContainer: PropTypes.func,
    allowCustom: PropTypes.bool,
};
