import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ActionsMenu} from './ActionsMenu';
import {GENERIC_ITEM_ACTIONS} from '../../constants';
import './style.scss';
import {renderToBody, closeActionsMenu} from 'superdesk-core/scripts/apps/search/helpers';

export class ItemActionsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.renderMenu = this.renderMenu.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this);

        if ((!domNode || event.target.className !== 'ItemActionsMenu__action')) {
            if (this.state.isOpen) {
                this.closeMenu();
            }
        }
    }

    closeMenu(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

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
            'icn-btn',
            'dropdown__toggle',
            {[this.props.buttonClass]: this.props.buttonClass},
            {ItemActionsMenu__hidden: isEmptyActions || this.state.isOpen},
            {ItemActionsMenu__visible: !isEmptyActions && !this.state.isOpen}
        );

        return (
            <div className={classes}>
                <a className={buttonClasses} onClick={this.renderMenu}>
                    <i className="icon-dots-vertical" />
                </a>
            </div>
        );
    }

    renderMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        let actions = this.props.actions;

        if (actions[actions.length - 1].label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            actions.pop();
        }

        let elem = React.createElement(ActionsMenu, {
            actions: actions,
            closeMenu: this.closeMenu.bind(this),
        });

        let icon = ReactDOM.findDOMNode(this).getElementsByClassName('icon-dots-vertical')[0];

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