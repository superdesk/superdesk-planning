import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {onEventCapture, gettext, planningUtils} from '../../../utils';
import {CoveragesMenuPopup} from './CoveragesMenuPopup';
import {CoverageAddAdvancedModal} from '../CoverageAddAdvancedModal';


export class CoverageAddButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false, advanced: false};
        this.toggleMenu = this.toggleMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.openMenu = this.openMenu.bind(this);
        this.openAdvanced = this.openAdvanced.bind(this);
    }

    componentDidMount() {
        this.items = this.getCoverageTypes(this.props);
    }

    componentWillReceiveProps(nextProps) {
        this.items = this.getCoverageTypes(nextProps);
    }

    getCoverageTypes(props) {
        return props.contentTypes.map((c) => ({
            id: `coverage-menu-add-${c.qcode}`,
            label: c.name,
            icon: planningUtils.getCoverageIcon(get(c, 'content item type') || c.qcode),
            callback: props.onAdd.bind(
                null,
                c.qcode,
                props.defaultDesk,
                props.preferredCoverageDesks
            ),
        }));
    }

    closeMenu(event) {
        onEventCapture(event);
        this.setState({isOpen: false});
    }

    openAdvanced(event) {
        onEventCapture(event);
        this.setState({isOpen: false, advanced: true});
    }

    openMenu(event) {
        if (this.props.coverageAddAdvancedMode) {
            this.openAdvanced(event);
            return;
        }

        onEventCapture(event);

        this.setState({isOpen: true});

        if (this.props.onOpen) {
            this.props.onOpen();
        }
    }

    render() {
        const {className, buttonClass, onPopupOpen, onPopupClose} = this.props;

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
                            onPopupOpen={onPopupOpen}
                            onPopupClose={onPopupClose}
                            openAdvanced={this.openAdvanced}
                        />
                    )}
                </button>
                {this.state.advanced && (
                    <CoverageAddAdvancedModal
                        close={() => this.setState({advanced: false})}

                        contentTypes={this.props.contentTypes}
                        newsCoverageStatus={this.props.newsCoverageStatus}

                        field={this.props.field}
                        value={this.props.value}
                        onChange={this.props.onChange}
                        createCoverage={this.props.createCoverage}

                        users={this.props.users}
                        desks={this.props.desks}

                        coverageAddAdvancedMode={this.props.coverageAddAdvancedMode}
                        setCoverageAddAdvancedMode={this.props.setCoverageAddAdvancedMode}
                    />
                )}
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
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    preferredCoverageDesks: PropTypes.object,
    newsCoverageStatus: PropTypes.array,

    desks: PropTypes.array,
    users: PropTypes.array,
    field: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func,
    createCoverage: PropTypes.func,
    coverageAddAdvancedMode: PropTypes.bool,
    setCoverageAddAdvancedMode: PropTypes.func,
};

CoverageAddButton.defaultProps = {
    contentTypes: [],
    className: 'dropdown dropdown--align-right dropdown--dropup pull-right',
    buttonClass: 'dropdown__toggle sd-create-btn',
};
