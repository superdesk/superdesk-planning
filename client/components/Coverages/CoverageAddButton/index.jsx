import React from 'react';
import PropTypes from 'prop-types';
import {onEventCapture, gettext, planningUtils} from '../../../utils';
import {CoveragesMenuPopup} from './CoveragesMenuPopup';


export class CoverageAddButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.toggleMenu = this.toggleMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.items = nextProps.contentTypes.map((c) => (
            {
                id: `coverage-menu-add-${c.qcode}`,
                label: c.name,
                icon: planningUtils.getCoverageIcon(c.qcode),
                callback: nextProps.onAdd.bind(null, c.qcode, nextProps.defaultDesk),
            }
        ));
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
        const {className, buttonClass} = this.props;

        return (
            <div className={className}>
                <button className={buttonClass} onClick={this.toggleMenu} title={gettext('Create new coverage')}>
                    <i className="icon-plus-large" />
                    <span className="circle" />

                    {this.state.isOpen && (
                        <CoveragesMenuPopup
                            closeMenu={this.closeMenu}
                            actions={this.items}
                            target="icon-plus-large"
                        />
                    )}
                </button>
            </div>
        );
    }

    toggleMenu(event) {
        this.state.isOpen ?
            this.closeMenu(event) :
            this.openMenu(event);
    }
}

CoverageAddButton.propTypes = {
    contentTypes: PropTypes.array.isRequired,
    defaultDesk: PropTypes.object,
    className: PropTypes.string,
    buttonClass: PropTypes.string,
    onOpen: PropTypes.func,
    onAdd: PropTypes.func,
};

CoverageAddButton.defaultProps = {
    contentTypes: [],
    className: 'dropdown dropdown--align-right dropdown--dropup pull-right',
    buttonClass: 'dropdown__toggle sd-create-btn',
};
