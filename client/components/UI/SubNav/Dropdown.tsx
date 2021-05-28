import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';
import {defer, get, groupBy} from 'lodash';

import {Menu, Label, Divider, Dropdown as DropMenu} from '../Dropdown';
import {gettext} from '../utils';

interface IDropdownAction {
    id: string;
    label: string;
    action(): void;
    disabled?: boolean;
    icon?: string;
    divider?: false;
    className?: string;
    group?: string;
}

interface IDropdownDivider {
    divider: true;
}

export type IDropdownItem = IDropdownDivider | IDropdownAction;

interface IProps {
    icon?: string;
    buttonLabel?: string;
    buttonLabelClassName?: string;
    label?: string;
    items: Array<IDropdownItem>;
    alignRight?: boolean;
    group?: boolean;
    disableSelection?: boolean;
    defaultAction?(): void;
    dropUp?: boolean;
    navbtn?: boolean; // defaults to true
    className?: string;
    tooltip?: string;
    scrollable?: boolean;
    searchable?: boolean;
}

interface IState {
    open: boolean;
    filterValue: string;
}

export class Dropdown extends React.Component<IProps, IState> {
    private searchInput: React.RefObject<HTMLInputElement>;
    inToggle: boolean;

    constructor(props) {
        super(props);
        this.state = {
            open: false,
            filterValue: '',
        };
        this.inToggle = false;
        this.searchInput = React.createRef<HTMLInputElement>();
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
        this.updateSearchText = this.updateSearchText.bind(this);
    }

    toggle() {
        // change state only when click event handling is over
        this.inToggle = true;
        defer(() => {
            const newState: IState = {
                open: !this.state.open,
                filterValue: this.state.open ? '' : this.state.filterValue,
            };

            this.setState(newState, () => {
                if (this.state.open) {
                    document.addEventListener('mousedown', this.close);
                    if (this.searchInput.current != undefined) {
                        this.searchInput.current.focus();
                    }
                } else {
                    document.removeEventListener('mousedown', this.close);
                }
            });
            this.inToggle = false;
        });
    }

    close(event) {
        if (event.target.classList.contains('dropdown-filter')) {
            return;
        }
        if (!this.inToggle && this.state.open && !(get(event.target, 'nodeName') === 'UL')) {
            this.setState({
                open: false,
                filterValue: '',
            });
        }
    }

    componentWillUnmount() {
        if (this.state.open) {
            document.removeEventListener('mousedown', this.close);
        }
    }

    updateSearchText(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({filterValue: event.target.value});
    }

    renderButtonDropMenu() {
        const isCreate = this.props.icon === 'icon-plus-large';
        const buttonClassName = classNames(
            'dropdown-toggle',
            'dropdown__toggle',
            this.props.buttonLabelClassName,
            {
                navbtn: this.props.navbtn ?? true,
                'sd-create-btn': isCreate,
                'navbtn--text-only': this.props.buttonLabel,
            }
        );

        return (
            <button
                className={buttonClassName}
                aria-label={this.props.tooltip}
                onClick={this.props.disableSelection ?
                    this.props.defaultAction :
                    this.toggle
                }
            >
                {this.props.icon == undefined ? null : (
                    <i className={this.props.icon} />
                )}
                {this.props.buttonLabel == undefined ? null : (
                    <React.Fragment>
                        {this.props.buttonLabel}
                        <span className="dropdown__caret" />
                    </React.Fragment>
                )}
                {!isCreate ? null : (
                    <span className="circle" />
                )}
            </button>
        );
    }

    renderDropdownItem(item: IDropdownItem, index: number) {
        return item.divider === true ? (
            <Divider key={index} />
        ) : (
            <li key={`${index}-${item.id}`}>
                <button
                    id={item.id}
                    onMouseDown={() => item.action()}
                >
                    {!item.icon ? null : (
                        <i
                            className={classNames(
                                {'icon--gray': item.disabled},
                                item.icon
                            )}
                        />
                    )}

                    <span
                        className={classNames(
                            {'dropdown__menu-item--disabled': item.disabled},
                            item.className
                        )}
                    >
                        {item.label}
                    </span>
                </button>
            </li>
        );
    }

    render() {
        const filterValueNormalized = this.state.filterValue.trim().toLowerCase();
        const filteredItems = filterValueNormalized.length < 1 ?
            this.props.items :
            this.props.items.filter(
                (item) => (
                    item.divider !== true &&
                    item.label.toLowerCase().includes(filterValueNormalized)
                )
            );
        const filterGroups = !this.props.group ? {} : groupBy(filteredItems, 'group');

        return (
            <DropMenu
                isOpen={this.state.open}
                alignRight={this.props.alignRight}
                dropUp={this.props.dropUp}
                className={this.props.className}
            >
                {this.props.tooltip ? (
                    <OverlayTrigger
                        placement="left"
                        overlay={(
                            <Tooltip id="create_new_btn">
                                {this.props.tooltip}
                            </Tooltip>
                        )}
                    >
                        <span>{this.renderButtonDropMenu()}</span>
                    </OverlayTrigger>
                ) :
                    this.renderButtonDropMenu()
                }
                <Menu
                    isOpen={this.state.open}
                    alignRight={false}
                    scrollable={this.props.scrollable}
                >
                    {this.props.label == undefined ? null : (
                        <React.Fragment>
                            <Label>{this.props.label}</Label>
                            <Divider />
                        </React.Fragment>
                    )}

                    {(this.props.searchable !== true || this.props.items.length < 3) ?
                        null :
                        (
                            <div style={{paddingLeft: 10, paddingRight: 10}}>
                                <input
                                    type="text"
                                    value={this.state.filterValue}
                                    onChange={this.updateSearchText}
                                    placeholder={gettext('Filter')}
                                    className="dropdown-filter"
                                    ref={this.searchInput}
                                />
                            </div>
                        )
                    }

                    {this.props.group ? (
                        Object.keys(filterGroups)
                            .map((group, index) => (
                                <React.Fragment key={index}>
                                    {!group?.length ? null : (
                                        <React.Fragment>
                                            <Divider />
                                            <Label>{group}</Label>
                                        </React.Fragment>
                                    )}
                                    {filterGroups[group].map(this.renderDropdownItem)}
                                </React.Fragment>
                            ))
                    ) : (
                        filteredItems.map(this.renderDropdownItem)
                    )}
                </Menu>
            </DropMenu>
        );
    }
}
