import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ActionsMenu} from './ActionsMenu';
import {GENERIC_ITEM_ACTIONS} from '../../constants';
import {onEventCapture} from '../../utils';
import './style.scss';
import {renderToBody, closeActionsMenu} from 'superdesk-core/scripts/apps/search/helpers';

export class ItemActionsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
        this.dom = {menu: null};
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
    }

    handleClickOutside(event) {
        if ((!this.dom.menu || event.target.className !== 'ItemActionsMenu__action')) {
            if (this.state.isOpen) {
                this.closeMenu();
            }
        }
    }

    closeMenu(event) {
        onEventCapture(event);
        closeActionsMenu();
        this.setState({isOpen: false});
    }


    render() {
        const classes = classNames(
            this.props.className,
            'dropdown',
            'ItemActionsMenu',
            'pull-right',
            {open: this.state.isOpen}
        );

        const isEmptyActions = this.props.actions.length === 0;

        const buttonClasses = classNames(
            'dropdown__toggle',
            {[this.props.buttonClass]: this.props.buttonClass},
            {ItemActionsMenu__hidden: isEmptyActions || this.state.isOpen},
            {ItemActionsMenu__visible: !isEmptyActions && !this.state.isOpen}
        );

        return (
            <div className={classes} ref={(node) => this.dom.menu = node}>
                <a className={buttonClasses} onClick={this.renderMenu}>
                    <i className="icon-dots-vertical" />
                </a>
            </div>
        );
    }

    renderMenu(event) {
        onEventCapture(event);
        let actions = this.props.actions;

        if (actions[actions.length - 1].label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            actions.pop();
        }

        let elem = React.createElement(ActionsMenu, {
            actions: actions,
            closeMenu: this.closeMenu.bind(this),
        });

        let icon = this.dom.menu.getElementsByClassName('icon-dots-vertical')[0];

        renderToBody(elem, icon);

        this.setState({isOpen: true});
    }
}

ItemActionsMenu.propTypes = {
    actions: PropTypes.array.isRequired,
    className: PropTypes.string,
    buttonClass: PropTypes.string,
};

ItemActionsMenu.defaultProps = {actions: []};