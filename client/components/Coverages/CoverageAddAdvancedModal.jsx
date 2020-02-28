import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import Modal from '../Modal';
import {SelectInput, SelectUserInput} from '../UI/Form';
import {gettext, planningUtils, getUsersForDesk, getDesksForUser} from '../../utils';

const isInvalid = (coverage) => coverage.user && !coverage.desk;

export class CoverageAddAdvancedModal extends React.PureComponent {
    constructor(props) {
        super(props);

        this.id = 1;
        this.state = {
            advancedMode: !!props.coverageAddAdvancedMode,
            coverages: [],
            isDirty: false,
        };
    }

    componentDidMount() {
        const {value, contentTypes, users, desks, newsCoverageStatus} = this.props;
        const coverages = [];
        const savedCoverages = value.map((coverage) => {
            const contentType = contentTypes.find((type) => type.qcode === coverage.planning.g2_content_type);

            return {
                id: this.id++,
                enabled: true,
                qcode: contentType.qcode,
                name: contentType.name,
                icon: contentType.icon,
                desk: desks.find((desk) => desk._id === coverage.assigned_to.desk),
                user: users.find((user) => user._id === coverage.assigned_to.user),
                status: coverage.news_coverage_status,
                popupContainer: null,
                filteredDesks: desks,
                filteredUsers: users,
                coverage_id: coverage.coverage_id,
            };
        });

        contentTypes.forEach((contentType) => {
            const presentInSavedCoverages = savedCoverages.find((coverage) => coverage.qcode === contentType.qcode);

            if (presentInSavedCoverages == null) {
                const coverageObj = {
                    id: this.id++,
                    enabled: false,
                    qcode: contentType.qcode,
                    name: contentType.name,
                    icon: planningUtils.getCoverageIcon(get(contentType, 'content item type') || contentType.qcode),
                    desk: null,
                    filteredDesks: desks,
                    user: null,
                    filteredUsers: users,
                    popupContainer: null,
                    status: planningUtils.getDefaultCoverageStatus(newsCoverageStatus),
                };

                coverages.push(coverageObj);
            }
        });

        this.setState({coverages: [...savedCoverages, ...coverages]});
    }

    duplicate(index, coverage) {
        const coverages = this.state.coverages.slice();
        const newCoverage = {
            id: this.id++,
            enabled: false,
            qcode: coverage.qcode,
            name: coverage.name,
            icon: coverage.icon,
            desk: null,
            user: null,
            status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
            popupContainer: null,
            filteredDesks: this.props.desks,
            filteredUsers: this.props.users,
        };

        coverages.splice(index + 1, 0, newCoverage);
        this.setState({coverages});
    }

    updateCoverage(selected, updates) {
        const coverages = this.state.coverages.map((coverage) => {
            if (selected === coverage) {
                return Object.assign(coverage, updates);
            }
            return coverage;
        });

        this.setState({coverages: coverages, isDirty: true});
    }

    onDeskChange(selected, desk) {
        const updates = {
            desk: desk,
            filteredUsers: getUsersForDesk(desk, this.props.users),
        };

        this.updateCoverage(selected, updates);
    }

    onUserChange(selected, user) {
        const updates = {
            user: user,
            filteredDesks: getDesksForUser(user, this.props.desks),
        };

        this.updateCoverage(selected, updates);
    }

    save() {
        const coverages = this.state.coverages
            .filter((coverage) => coverage.enabled)
            .map((coverage) => {
                let newCoverage = {};

                if (coverage.coverage_id != null) {
                    newCoverage = this.props.value.find((val) => val.coverage_id === coverage.coverage_id);
                } else {
                    newCoverage = this.props.createCoverage(coverage.qcode);
                }

                newCoverage.assigned_to = {
                    user: get(coverage, 'user._id'),
                    desk: get(coverage, 'desk._id'),
                };

                if (coverage.status) {
                    newCoverage.news_coverage_status = coverage.status;
                }

                return newCoverage;
            });


        // create coverages
        this.props.onChange(this.props.field, coverages);

        // save advanced mode preference
        if (this.state.advancedMode !== this.props.coverageAddAdvancedMode) {
            this.props.setCoverageAddAdvancedMode(this.state.advancedMode);
        }

        this.props.close();
    }

    render() {
        return (
            <Modal xLarge={true} show={true} onHide={this.props.close} onClick={(event) => {
                event.stopPropagation();
                this.props.close();
            }}>
                <Modal.Header>
                    <a className="close" onClick={this.props.close}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">
                        {gettext('Add Coverages')}
                        {' '}
                        <small>{gettext('(advanced mode)')}</small>
                    </h3>
                </Modal.Header>
                <Modal.Body>
                    <div className="sd-list-item-group sd-list-item-group--space-between-items">
                        {this.state.coverages.map((coverage, index) => (
                            <div key={coverage.id} className="sd-list-item sd-shadow--z1">
                                <div className="sd-list-item__column">
                                    <input type="checkbox" value={coverage.enabled} checked={coverage.enabled}
                                        onChange={() => this.updateCoverage(coverage, {enabled: !coverage.enabled})}
                                    />
                                </div>
                                <div className="sd-list-item__column">
                                    <i className={coverage.icon} />
                                </div>
                                <div className="sd-list-item__column" style={{width: '15%'}}>
                                    {coverage.name}
                                </div>
                                {coverage.enabled && (
                                    <React.Fragment>
                                        <div className="sd-list-item__column sd-list-item__column--grow">
                                            <div className="grid">
                                                <div className="grid__item grid__item--col4">
                                                    <SelectInput
                                                        placeholder={gettext('Select desk')}
                                                        field={'desk'}
                                                        value={coverage.desk}
                                                        onChange={(field, value) => this.onDeskChange(coverage, value)}
                                                        options={coverage.filteredDesks}
                                                        labelField="name"
                                                        keyField="_id"
                                                        clearable={true}
                                                        invalid={isInvalid(coverage)}
                                                    />
                                                </div>

                                                <div className="grid__item grid__item--col4">
                                                    <SelectUserInput
                                                        field={'user'}
                                                        value={coverage.user}
                                                        onChange={(field, value) => this.onUserChange(coverage, value)}
                                                        labelField="name"
                                                        keyField="_id"
                                                        users={coverage.filteredUsers}
                                                        clearable={true}
                                                        popupContainer={() => coverage.popupContainer}
                                                        inline={true}
                                                    />
                                                    <div ref={(node) => coverage.popupContainer = node} />
                                                </div>

                                                <div className="grid__item grid__item--col4">
                                                    <SelectInput
                                                        placeholder={gettext('Select status')}
                                                        field={'coverage.status'}
                                                        value={coverage.status}
                                                        onChange={(field, value) =>
                                                            this.updateCoverage(coverage, {status: value})}
                                                        options={this.props.newsCoverageStatus}
                                                        labelField="label"
                                                        keyField="qcode"
                                                        clearable={true}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="sd-list-item__action-menu
                                            sd-list-item__action-menu--direction-row">
                                            <button className="icn-btn" title={gettext('Duplicate')}
                                                onClick={() => this.duplicate(index, coverage)}>
                                                <i className="icon-plus-sign" />
                                            </button>
                                        </div>
                                    </React.Fragment>
                                )}
                            </div>
                        ))}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <label style={{float: 'left'}}>
                        <input type="checkbox" id="advanced-default-mode"
                            checked={this.state.advancedMode}
                            onChange={() => this.setState({
                                advancedMode: !this.state.advancedMode,
                                isDirty: !this.state.isDirty,
                            })}
                        />
                        {' '}
                        {gettext('make this mode the default')}
                    </label>
                    <button className="btn" type="button" onClick={this.props.close}>{gettext('Cancel')}</button>
                    <button className="btn btn--primary" type="button"
                        disabled={
                            !this.state.isDirty
                            || this.state.coverages.some((coverage) => coverage.enabled && isInvalid(coverage))
                        }
                        onClick={() => this.save()}
                    >{gettext('Save')}</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

CoverageAddAdvancedModal.propTypes = {
    desks: PropTypes.array,
    users: PropTypes.array,
    contentTypes: PropTypes.array,
    newsCoverageStatus: PropTypes.array,

    field: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func,
    createCoverage: PropTypes.func,

    coverageAddAdvancedMode: PropTypes.bool,
    setCoverageAddAdvancedMode: PropTypes.func,

    close: PropTypes.func,
};