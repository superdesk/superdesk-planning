import React from 'react';
import {get} from 'lodash';
import classNames from 'classnames';

import {gettext, onEventCapture} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';
import {KEYCODES} from '../../constants';

import {Popup, Header, Content, Label} from '../../Popup';

import './style.scss';

interface IProps {
    title: string;
    options: Array<any>
    clearable?: boolean;
    labelKey?: string; // Defaults to 'name'
    valueKey?: string; // Defaults to 'qcode'
    language?: string;

    // Input events
    onChange(option: any): void;
    onCancel(): void;
    getClassNamesForOption(option: any): string;

    // Popup target element & callbacks
    target: string;
    popupContainer(): HTMLElement;
    onPopupOpen(): void;
    onPopupClose(): void;
}

interface IState {
    activeIndex: number;
}


/**
 * @ngdoc react
 * @name ColouredValuePopup
 * @description Popup component to show color coded options
 */
export class ColouredValuePopup extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.state = {activeIndex: -1};
    }

    /**
     * @ngdoc method
     * @name ColouredValuePopup#onKeyDown
     * @description onKeyDown method to handle keyboard selection of options
     */
    onKeyDown(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    /**
     * @ngdoc method
     * @name ColouredValuePopup#handleEnterKey
     * @description handleEnterKey method to handle enter-key press on a selected option
     */
    handleEnterKey(event) {
        this.props.onChange(this.props.options[this.state.activeIndex]);
    }

    /**
     * @ngdoc method
     * @name ColouredValuePopup#handleDownArrowKey
     * @description handleDownArrowKey method to handle down-key press to select options
     */
    handleDownArrowKey(event) {
        if (get(this.props, 'options.length', 0) - 1 > this.state.activeIndex) {
            this.setState({activeIndex: this.state.activeIndex + 1});
        }
    }

    /**
     * @ngdoc method
     * @name ColouredValuePopup#handleUpArrowKey
     * @description handleUpArrowKey method to handle up-key press to select options
     */
    handleUpArrowKey(event) {
        if (this.state.activeIndex > 0) {
            this.setState({activeIndex: this.state.activeIndex - 1});
        }
    }

    render() {
        const {
            target,
            onCancel,
            title,
            clearable,
            onChange,
            getClassNamesForOption,
            options,
            labelKey = 'name',
            valueKey = 'qcode',
            popupContainer,
            onPopupOpen,
            onPopupClose,
            language,
        } = this.props;

        return (
            <Popup
                target={target}
                close={onCancel}
                className="select-coloured-value__popup"
                popupContainer={popupContainer}
                onKeyDown={this.onKeyDown}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
            >
                {title && (
                    <Header noPadding={true}>
                        <Label text={title} centerText={true} />
                    </Header>
                )}

                <Content noPadding={true}>
                    <ul>
                        {!clearable ? null : (
                            <li>
                                <button
                                    type="button"
                                    onClick={onChange.bind(null, {
                                        [labelKey]: 'None',
                                        [valueKey]: null,
                                    })}
                                >
                                    <span>{gettext('None')}</span>
                                </button>
                            </li>
                        )}

                        {options.map((opt, index) => (
                            <li key={index}>
                                <button
                                    type="button"
                                    onClick={onChange.bind(null, opt)}
                                    className={classNames({
                                        'select-coloured-value__popup--activeElement': this.state.activeIndex === index,
                                    })}
                                >
                                    <span
                                        className={getClassNamesForOption(opt)}
                                        style={{backgroundColor: opt.color}}
                                    >
                                        {get(opt, valueKey, '')}
                                    </span>
                                    &nbsp;&nbsp;{getVocabularyItemFieldTranslated(opt, labelKey, language)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Content>
            </Popup>
        );
    }
}
