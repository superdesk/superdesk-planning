import React from 'react';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IG2ContentType, IPlanningCoverageItem, IPlanningNewsCoverageStatus} from '../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import {gettext, planningUtils, getUsersForDesk, getDesksForUser} from '../../utils';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

import Modal from '../Modal';
import {SelectInput, SelectUserInput} from '../UI/Form';

const isInvalid = (coverage) => coverage.user && !coverage.desk;

interface IProps {
    field: string;
    value: Array<DeepPartial<IPlanningCoverageItem>>;
    coverageAddAdvancedMode: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;

    onChange(field: string, value: Array<DeepPartial<IPlanningCoverageItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<IPlanningCoverageItem>;
    setCoverageAddAdvancedMode(enable: boolean): void;
    close(event?: React.MouseEvent): void;
}

interface ICoverageSelector {
    id: number;
    enabled: boolean;
    qcode: IG2ContentType['qcode'];
    name: IG2ContentType['name'];
    icon: string;
    desk: IDesk['_id'];
    user: IUser['_id'];
    status: IPlanningNewsCoverageStatus;
    popupContainer: any;
    filteredDesks: Array<IDesk>;
    filteredUsers: Array<IUser>;
    coverage_id?: string;
}

interface IState {
    advancedMode: boolean;
    coverages: Array<ICoverageSelector>;
    isDirty: boolean;
}

export class CoverageAddAdvancedModal extends React.Component<IProps, IState> {
    id: number;

    constructor(props) {
        super(props);

        this.id = 1;
        this.state = {
            advancedMode: !!props.coverageAddAdvancedMode,
            coverages: [],
            isDirty: false,
        };
    }

    getContentTypeName(contentType) {
        return getVocabularyItemFieldTranslated(
            contentType,
            'name',
            getUserInterfaceLanguage()
        );
    }

    componentDidMount() {
        const {value, contentTypes, users, desks, newsCoverageStatus} = this.props;
        const coverages = [];
        const savedCoverages = value.map((coverage) => {
            const contentType = contentTypes.find((type) => type.qcode === coverage.planning.g2_content_type);
            const icon = planningUtils.getCoverageIcon(
                get(contentType, 'content item type') ||
                contentType.qcode
            );

            return {
                id: this.id++,
                enabled: true,
                qcode: contentType.qcode,
                name: this.getContentTypeName(contentType),
                icon: icon,
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
            const icon = planningUtils.getCoverageIcon(
                get(contentType, 'content item type') ||
                contentType.qcode
            );

            if (presentInSavedCoverages == null) {
                const coverageObj = {
                    id: this.id++,
                    enabled: false,
                    qcode: contentType.qcode,
                    name: this.getContentTypeName(contentType),
                    icon: icon,
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
            name: this.getContentTypeName(coverage),
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
                const newCoverage: DeepPartial<IPlanningCoverageItem> = coverage.coverage_id == null ?
                    this.props.createCoverage(coverage.qcode) :
                    this.props.value.find(
                        (val) => val.coverage_id === coverage.coverage_id
                    );

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
        const language = getUserInterfaceLanguage();

        return (
            <Modal
                xLarge={true}
                show={true}
                onHide={this.props.close}
                onClick={(event) => {
                    event.stopPropagation();
                    this.props.close();
                }}
            >
                <Modal.Header>
                    <h3 className="modal__heading">
                        {gettext('Add Coverages')}
                        {' '}
                        <small>{gettext('(advanced mode)')}</small>
                    </h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={this.props.close}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body>
                    <div className="sd-list-item-group sd-list-item-group--space-between-items">
                        {this.state.coverages.map((coverage, index) => (
                            <div key={coverage.id} className="sd-list-item sd-shadow--z1">
                                <div className="sd-list-item__column">
                                    <input
                                        type="checkbox"
                                        value={coverage.enabled}
                                        checked={coverage.enabled}
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
                                                        language={language}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            className="sd-list-item__action-menu
                                            sd-list-item__action-menu--direction-row"
                                        >
                                            <button
                                                className="icn-btn"
                                                title={gettext('Duplicate')}
                                                onClick={() => this.duplicate(index, coverage)}
                                            >
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
                        <input
                            type="checkbox"
                            id="advanced-default-mode"
                            checked={this.state.advancedMode}
                            onChange={() => this.setState({
                                advancedMode: !this.state.advancedMode,
                                isDirty: true,
                            })}
                        />
                        {' '}
                        {gettext('make this mode the default')}
                    </label>
                    <button className="btn" type="button" onClick={this.props.close}>{gettext('Cancel')}</button>
                    <button
                        className="btn btn--primary"
                        type="button"
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
