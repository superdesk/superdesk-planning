import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {onEventCapture} from '../../utils';
import {GENERIC_ITEM_ACTIONS} from '../../constants';

import {ActionsMenuPopup} from './ActionsMenuPopup';

import './style.scss';

export class ItemActionsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.toggleMenu = this.toggleMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
    }

    closeMenu(event) {
        onEventCapture(event);
        this.setState({isOpen: false});
    }

    openMenu(event) {
        onEventCapture(event);
        this.setState({isOpen: true});

        if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    render() {
        const {actions, className, wide, field} = this.props;

        // If there are no actions, then we don't render anything
        if (get(actions, 'length', 0) < 1) {
            return null;
        }

        // If the last action is a DIVIDER, then remove it
        if (get(actions, `[${actions.length - 1}].label`) === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            actions.pop();
        }

        return (
            <button
                id={`${field}-item-actions`}
                className={className}
                onClick={this.toggleMenu}
                title={gettext('Actions')}
                aria-label={gettext('More actions')}
            >
                <i className="icon-dots-vertical" />

                {this.state.isOpen && (
                    <ActionsMenuPopup
                        closeMenu={this.closeMenu}
                        actions={actions}
                        target="icon-dots-vertical"
                        wide={wide}
                    />
                )}
            </button>
        );
    }

    toggleMenu(event) {
        this.state.isOpen ?
            this.closeMenu(event) :
            this.openMenu(event);
    }
}

ItemActionsMenu.propTypes = {
    field: PropTypes.string,
    actions: PropTypes.array.isRequired,
    className: PropTypes.string,
    buttonClass: PropTypes.string,
    onOpen: PropTypes.func,
    wide: PropTypes.bool,
};

ItemActionsMenu.defaultProps = {
    actions: [],
    className: 'icn-btn dropdown__toggle',
    wide: false,
};
