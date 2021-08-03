import * as React from 'react';

import {KEYBOARD_CODES} from '../../../constants';

import {Icon} from 'superdesk-ui-framework/react';
import {IIcon, getIcons} from './icons';
import './style.scss';

interface IProps {
    searchPlaceholder: string;
    selectIcon(icon: string): void;
    hidePopup(): void;
}

interface IState {
    filteredIcons: Array<IIcon>;
}

export class IconPicker extends React.Component<IProps, IState> {
    searchInput: React.RefObject<HTMLInputElement>;
    gridContainer: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        // Start with an empty list of icons
        // so the popup appears fast
        this.state = {filteredIcons: []};

        this.searchInput = React.createRef();
        this.gridContainer = React.createRef();
        this.handleKeydown = this.handleKeydown.bind(this);
        this.selectIcon = this.selectIcon.bind(this);
        this.filterIcons = this.filterIcons.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
        this.searchInput.current.focus();

        setTimeout(() => {
            // Now that the popup has appeared show all the icons
            this.setState({filteredIcons: getIcons()});
        });
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    getIconElement(index: number): HTMLDivElement | null {
        return this.gridContainer.current?.querySelector(`[data-icon-index="${index}"]`);
    }

    handleKeydown(event: KeyboardEvent) {
        const navKeys = [
            KEYBOARD_CODES.ENTER,
            KEYBOARD_CODES.RIGHT,
            KEYBOARD_CODES.LEFT,
            KEYBOARD_CODES.UP,
            KEYBOARD_CODES.DOWN,
            KEYBOARD_CODES.PAGE_DOWN,
            KEYBOARD_CODES.PAGE_UP,
        ];
        const activeElement = document.activeElement;

        if (event.code === KEYBOARD_CODES.ESCAPE) {
            event.preventDefault();
            event.stopPropagation();
            this.props.hidePopup();
        } else if (activeElement === this.searchInput.current) {
            if (event.code === KEYBOARD_CODES.DOWN) {
                event.preventDefault();
                this.getIconElement(0)?.focus();
            } else if (event.code === KEYBOARD_CODES.ENTER && this.state.filteredIcons.length === 1) {
                event.preventDefault();
                this.selectIcon(this.state.filteredIcons[0]);
            }
        } else if (document.activeElement.getAttribute('data-icon-index') && navKeys.includes(event.code)) {
            let iconIndex = parseInt(activeElement.getAttribute('data-icon-index'), 10);

            // Prevent default behaviour, such as scrolling
            event.preventDefault();
            if (event.code === KEYBOARD_CODES.ENTER) {
                this.selectIcon(this.state.filteredIcons[iconIndex]);
                return;
            } else if (event.code === KEYBOARD_CODES.RIGHT) {
                iconIndex += 1;
            } else if (event.code === KEYBOARD_CODES.LEFT) {
                iconIndex -= 1;
            } else if (event.code === KEYBOARD_CODES.DOWN) {
                iconIndex += 4;
            } else if (event.code === KEYBOARD_CODES.UP) {
                if (iconIndex === 0) {
                    this.searchInput.current?.focus();
                    return;
                }
                iconIndex -= 4;
            } else if (event.code === KEYBOARD_CODES.PAGE_DOWN) {
                iconIndex += 16;
            } else if (event.code === KEYBOARD_CODES.PAGE_UP) {
                iconIndex -= 16;
            }

            if (iconIndex < 0) {
                iconIndex = 0;
            } else if (iconIndex >= this.state.filteredIcons.length) {
                iconIndex = this.state.filteredIcons.length - 1;
            }

            this.getIconElement(iconIndex)?.focus();
        }
    }

    selectIcon(icon: IIcon) {
        this.props.selectIcon(icon.name);
        this.props.hidePopup();
    }

    filterIcons(event: React.ChangeEvent<HTMLInputElement>) {
        const searchString = event.target.value.toLowerCase();

        this.setState({filteredIcons: getIcons().filter(
            (icon) => (
                icon.name.toLowerCase().includes(searchString) ||
                icon.label.toLowerCase().includes(searchString)
            )
        )});
    }

    render() {
        return (
            <div className="select-icon__panel sd-shadow--z3">
                <div className="select-icon__header">
                    <div className="sd-searchbar sd-searchbar--boxed">
                        <label className="sd-searchbar__icon" />
                        <input
                            className="sd-searchbar__input"
                            placeholder={this.props.searchPlaceholder}
                            type="text"
                            onChange={this.filterIcons}
                            ref={this.searchInput}
                        />
                    </div>
                </div>
                <div
                    className="select-icon__body flex-grid flex-grid--wrap-items flex-grid--small-4 flex-grid--boxed"
                    ref={this.gridContainer}
                >
                    {this.state.filteredIcons.map((icon, index) => (
                        <div
                            key={icon.name}
                            data-icon-index={index}
                            className="flex-grid__item select-icon__item sd-padding-y--2"
                            tabIndex={0}
                            role="button"
                            aria-label={icon.name}
                            onClick={this.selectIcon.bind(this, icon)}
                        >
                            <Icon name={icon.name} />
                            <span className="sd-text__normal sd-padding-t--1">
                                {icon.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
