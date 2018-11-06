import React from 'react';
import PropTypes from 'prop-types';
import {onEventCapture, gettext} from '../../utils';
import {Button} from '../UI';
import {Popup, Content} from '../UI/Popup';


export class AssignAgendaButton extends React.Component {
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
    }

    render() {
        const {key, agendas, onAgendaSelect} = this.props;

        return (
            <div>
                <Button
                    key={key}
                    icon="icon-plus-sign"
                    onClick={this.toggleMenu}
                    color="primary"
                    text={gettext('Assign Agenda')}
                    pullRight />
                {this.state.isOpen &&
                    <Popup
                        close={this.closeMenu}
                        noPadding={true}
                        className="item-actions-menu__popup"
                        target="icon-plus-sign"
                    >
                        <Content noPadding={true}>
                            <ul className="dropdown dropdown__menu more-activity-menu open">
                                <li onClick={onEventCapture.bind(this)}>
                                    <div className="dropdown__menu-label">
                                        {gettext('Agendas')}
                                        <button
                                            className="dropdown__menu-close"
                                            onClick={this.closeMenu}
                                        >
                                            <i className="icon-close-small" />
                                        </button>
                                    </div>
                                </li>
                                <li className="dropdown__menu-divider" />
                                {agendas.map((a) => (
                                    <li key={a._id}>
                                        <Button
                                            onClick={onAgendaSelect.bind(null, a)}
                                            text={a.name}
                                            empty />
                                    </li>
                                ))}
                            </ul>
                        </Content>
                    </Popup>
                }
            </div>
        );
    }

    toggleMenu(event) {
        this.state.isOpen ?
            this.closeMenu(event) :
            this.openMenu(event);
    }
}

AssignAgendaButton.propTypes = {
    agendas: PropTypes.array.isRequired,
    key: PropTypes.string,
    onAgendaSelect: PropTypes.func,
};
