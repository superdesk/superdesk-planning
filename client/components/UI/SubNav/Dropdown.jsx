import React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {defer, get, groupBy} from 'lodash';

import {Menu, Label, Divider, Dropdown as DropMenu} from '../Dropdown';
import {gettext} from '../utils';

/**
 * @ngdoc react
 * @name Dropdown
 * @description Dropdown of a Sub Nav bar
 */
export class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            filterValue: '',
        };
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        // change state only when click event handling is over
        this.inToggle = true;
        defer(() => {
            this.setState({open: !this.state.open}, () => {
                if (this.state.open) {
                    document.addEventListener('mousedown', this.close);
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
            this.setState({open: false});
        }
    }

    componentWillUnmount() {
        if (this.state.open) {
            document.removeEventListener('mousedown', this.close);
        }
    }

    // eslint-disable-next-line complexity
    render() {
        const isCreate = this.props.icon === 'icon-plus-large';
        const buttonClassName = classNames(
            'dropdown-toggle',
            'dropdown__toggle',
            this.props.buttonLabelClassName,
            {
                navbtn: this.props.navbtn,
                'sd-create-btn': isCreate,
                'navbtn--text-only': this.props.buttonLabel,
            }
        );

        const buttonDropMenu = (
            <button
                className={buttonClassName}
                onClick={this.props.disableSelection ? this.props.defaultAction : this.toggle}
            >
                {this.props.icon && (
                    <i className={this.props.icon} />
                )}
                {this.props.buttonLabel && this.props.buttonLabel}
                {this.props.buttonLabel && (
                    <span className="dropdown__caret" />
                )}
                {isCreate && (
                    <span className="circle" />
                )}
            </button>
        );

        const buttonItem = (item, index) => (
            <li key={index}>
                <button id={item.id} onMouseDown={() => item.action()}>
                    {item.icon && (
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

        const filterValueNormalized = this.state.filterValue.trim().toLowerCase();

        let filteredItems;

        if (this.props.group === true) {
            filteredItems = filterValueNormalized.length < 1 ? this.props.items : this.props.items.filter(
                (item) => item.label.toLowerCase().includes(filterValueNormalized)
            );
            filteredItems = groupBy(filteredItems, 'group');
        } else {
            filteredItems = filterValueNormalized.length < 1 ? this.props.items : this.props.items.filter(
                (item) => item.label.toLowerCase().includes(filterValueNormalized)
            );
        }

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
                        <span>{buttonDropMenu}</span>
                    </OverlayTrigger>
                ) :
                    buttonDropMenu
                }
                <Menu
                    isOpen={this.state.open}
                    alignRight={false}
                    scrollable={this.props.scrollable}
                >
                    {this.props.label && (
                        <Label>{this.props.label}</Label>
                    )}

                    {this.props.label && (
                        <Divider />
                    )}

                    {
                        this.props.searchable === true && this.props.items.length > 2 ? (
                            <div style={{paddingLeft: 10, paddingRight: 10}}>
                                <input
                                    type="text"
                                    value={this.state.filterValue}
                                    onChange={(event) => this.setState({filterValue: event.target.value})}
                                    placeholder={gettext('Filter')}
                                    className="dropdown-filter"
                                />
                            </div>
                        ) : null
                    }

                    {
                        this.props.group === true && Object.keys(filteredItems).map((item, index) => (
                            <React.Fragment key={index}>
                                <Divider />
                                <Label>{item}</Label>
                                {filteredItems[item].map((item, index) => buttonItem(item, index))}
                            </React.Fragment>
                        )
                        )
                    }

                    {!this.props.group && filteredItems.map((item, index) => {
                        if (item.divider) {
                            return <Divider key={index} />;
                        } else {
                            return buttonItem(item, index);
                        }
                    })}
                </Menu>
            </DropMenu>
        );
    }
}

Dropdown.propTypes = {
    icon: PropTypes.string,
    buttonLabel: PropTypes.string,
    buttonLabelClassName: PropTypes.string,
    label: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        group: PropTypes.string,
        searchable: PropTypes.bool,
        divider: PropTypes.bool,
        icon: PropTypes.string,
        action: PropTypes.func,
        className: PropTypes.string,
        disabled: PropTypes.bool,
    })),
    alignRight: PropTypes.bool,
    group: PropTypes.bool,
    disableSelection: PropTypes.bool,
    defaultAction: PropTypes.func,
    dropUp: PropTypes.bool,
    navbtn: PropTypes.bool,
    className: PropTypes.string,
    tooltip: PropTypes.string,
    scrollable: PropTypes.bool,
    searchable: PropTypes.bool,
};

Dropdown.defaultProps = {
    alignRight: false,
    navbtn: true,
    scrollable: false,
};
