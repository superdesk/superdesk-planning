import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IG2ContentType, IPlanningCoverageItem, IPlanningNewsCoverageStatus} from '../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import {gettext, planningUtils, getUsersForDesk, getDesksForUser} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

import Modal from '../Modal';
import {superdeskApi} from '../../superdeskApi';
import * as actions from '../../actions';
import {Button, Checkbox, IconButton, Option, Select, Spacer, Tooltip} from 'superdesk-ui-framework/react';

interface IReduxDispatchProps {
    setCoverageAddAdvancedMode(enable: boolean): void;
}

type IReduxStateProps = {};

interface IOwnProps {
    field: string;
    value: Array<DeepPartial<IPlanningCoverageItem>>;
    coverageAddAdvancedMode: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;

    onChange(field: string, value: Array<DeepPartial<IPlanningCoverageItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<IPlanningCoverageItem>;
    close(event?: React.MouseEvent): void;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

interface ICoverageSelector {
    id: number;
    enabled: boolean;
    qcode: IG2ContentType['qcode'];
    name: IG2ContentType['name'];
    icon: string;
    desk: IDesk;
    user: IUser;
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

class CoverageAddAdvancedModalComponent extends React.Component<IProps, IState> {
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
            getUserInterfaceLanguageFromCV()
        );
    }

    componentDidMount() {
        const {value, contentTypes, users, desks, newsCoverageStatus} = this.props;
        const coverages = [];
        const savedCoverages = value
            // Filter coverages that are in workflow
            // as these are to be managed from the Assignments page only
            .filter((coverage) => coverage.workflow_status === 'draft')
            .map((coverage) => {
                const contentType = contentTypes.find(
                    (type) => type.qcode === coverage.planning.g2_content_type
                );
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
                    desk: desks.find((desk) => desk._id === coverage.assigned_to?.desk),
                    user: users.find((user) => user._id === coverage.assigned_to?.user),
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
        this.setState({
            coverages: coverages,
            isDirty: true,
        });
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
            .filter((coverage) => coverage.enabled || coverage.coverage_id != null)
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

                if (coverage.coverage_id != null && !coverage.enabled) {
                    newCoverage.workflow_status = 'spiked';
                } else if (coverage.status) {
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
        const language = getUserInterfaceLanguageFromCV();
        const {SelectUser} = superdeskApi.components;
        const savePermitted = this.state.coverages.every((coverage) => {
            if (coverage.enabled) {
                return coverage.desk && coverage.user;
            }

            return true;
        });

        return (
            <Modal
                xLarge={true}
                show={true}
                onHide={this.props.close}
                onClick={(event) => {
                    event.stopPropagation();
                    this.props.close();
                }}
                removeTabIndexAttribute={true}
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
                    <Spacer v gap="8" justifyContent="center" alignItems="center" >
                        {this.state.coverages.map((coverage, index) => (
                            <div
                                key={coverage.id}
                                style={coverage.enabled ? {height: 60} : {}}
                                className="sd-list-item sd-shadow--z1"
                            >
                                <div className="sd-list-item__column">
                                    <Checkbox
                                        label={{
                                            text: gettext('Coverage enabled'),
                                            hidden: true,
                                        }}
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
                                    <>
                                        <Spacer
                                            h
                                            gap="8"
                                            noWrap
                                            alignItems="center"
                                            style={{padding: 12}}
                                            justifyContent="space-between"
                                        >
                                            <Select
                                                fullWidth
                                                inlineLabel
                                                labelHidden
                                                value={coverage.desk?._id}
                                                onChange={(newDeskId) => {
                                                    this.onDeskChange(
                                                        coverage,
                                                        coverage.filteredDesks.find(({_id}) => _id === newDeskId),
                                                    );
                                                }}
                                            >
                                                <Option />
                                                {coverage.filteredDesks.map((desk) => (
                                                    <Option key={desk._id} value={desk._id}>{desk.name}</Option>
                                                ))}
                                            </Select>
                                            <div style={{width: '100%'}}>
                                                <SelectUser
                                                    deskId={coverage.desk?._id ?? undefined}
                                                    selectedUserId = {coverage.user?._id}
                                                    onSelect={(user) => {
                                                        this.onUserChange(coverage, user);
                                                    }}
                                                    autoFocus={false}
                                                    horizontalSpacing={true}
                                                    clearable={true}
                                                />
                                            </div>
                                            <Select
                                                fullWidth
                                                inlineLabel
                                                labelHidden
                                                value={coverage.status?.qcode}
                                                onChange={(value) => this.updateCoverage(coverage, {status: value})}
                                            >
                                                <Option />
                                                {this.props.newsCoverageStatus.map((cov) => (
                                                    <Option key={cov.qcode} value={cov.qcode}>
                                                        {getVocabularyItemFieldTranslated(cov, 'label', language)}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Spacer>
                                        <div
                                            className="sd-list-item__action-menu
                                            sd-list-item__action-menu--direction-row"
                                        >
                                            <IconButton
                                                ariaValue={gettext('Duplicate')}
                                                icon="plus-sign"
                                                onClick={() => {
                                                    this.duplicate(index, coverage);
                                                }}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </Spacer>
                </Modal.Body>
                <Modal.Footer>
                    <Spacer h justifyContent="space-between" gap="0" alignItems="center">
                        <Checkbox
                            checked={this.state.advancedMode}
                            label={{
                                text: gettext('make this mode the default'),
                                side: 'end',
                            }}
                            onChange={() => {
                                this.setState({
                                    advancedMode: !this.state.advancedMode,
                                    isDirty: true,
                                });
                            }}
                        />
                        <Spacer h gap="8" alignItems="end" justifyContent="end" noGrow>
                            <Button
                                text={gettext('Cancel')}
                                style="hollow"
                                onClick={this.props.close}
                            />
                            <Tooltip
                                text={gettext(
                                    'Some coverages aren\'t enabled or you have not assigned them to a desk or a user.'
                                )}
                                flow="top"
                                disabled={!savePermitted}
                            >
                                <Button
                                    text={gettext('Save')}
                                    type="primary"
                                    style="filled"
                                    disabled={!this.state.isDirty || !savePermitted}
                                    onClick={() => {
                                        this.save();
                                    }}
                                />
                            </Tooltip>
                        </Spacer>
                    </Spacer>
                </Modal.Footer>
            </Modal>
        );
    }
}

const mapDispatchToProps = (dispatch): IReduxDispatchProps => ({
    setCoverageAddAdvancedMode: (value) => dispatch(actions.users.setCoverageAddAdvancedMode(value)),
});

export const CoverageAddAdvancedModal = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    null,
    mapDispatchToProps
)(CoverageAddAdvancedModalComponent);
