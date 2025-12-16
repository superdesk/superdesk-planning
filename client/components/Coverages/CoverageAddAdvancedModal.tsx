import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get} from 'lodash';

import {IG2ContentType, IPlanningNewsCoverageStatus, IPlanningCoverageItem} from '../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import {gettext, planningUtils, getUsersForDesk, getDesksForUser} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {Button, Checkbox, Modal, Spacer, Tooltip} from 'superdesk-ui-framework/react';
import {CoverageEditableFields} from './CoverageFieldsRow';

type IReduxStateProps = {
    languages: Array<any>;
};

interface IReduxDispatchProps {
    setCoverageAddAdvancedMode: (value: boolean) => void;
}

export interface ICoverageLineItem extends IPlanningCoverageItem {
    enabled: boolean;
    qcode: string;
    desk: IDesk;
    user: IUser;
    status: IPlanningNewsCoverageStatus;
    filteredDesks: Array<IDesk>;
    filteredUsers: Array<IUser>;
}

interface IOwnProps {
    field: string;
    value: Array<DeepPartial<ICoverageLineItem>>;
    coverageAddAdvancedMode: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;

    onChange(field: string, value: Array<DeepPartial<ICoverageLineItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<ICoverageLineItem>;
    close(event?: React.MouseEvent): void;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

interface IState {
    advancedMode: boolean;
    coverages: Array<Partial<ICoverageLineItem>>;
    isDirty: boolean;
}

class CoverageAddAdvancedModalComponent extends React.Component<IProps, IState> {
    contentTypes: Map<string, IProps['contentTypes'][0]>;

    constructor(props) {
        super(props);

        this.contentTypes = new Map(
            this.props.contentTypes.map((contentType) => [
                contentType.qcode ?? contentType['content item type'],
                contentType
            ])
        );

        this.state = {
            advancedMode: !!props.coverageAddAdvancedMode,
            coverages: [],
            isDirty: false,
        };
    }

    componentDidMount() {
        const {value, users, desks, newsCoverageStatus} = this.props;
        const coverages = [];
        const savedCoverages = value

            // if there was a savedCoverage but later the coverage type got removed/disabled from
            // g2_content_type vocabulary do not render it
            .filter((coverage) => this.contentTypes.get(coverage.planning.g2_content_type) != null)
            .map((coverage) => ({
                enabled: true,
                workflow_status: coverage.workflow_status,
                planning: {
                    language: coverage.planning.language,
                },
                qcode: this.contentTypes.get(coverage.planning.g2_content_type).qcode,
                desk: desks.find((desk) => desk._id === coverage.assigned_to?.desk),
                user: users.find((user) => user._id === coverage.assigned_to?.user),
                status: coverage.news_coverage_status,
                filteredDesks: desks,
                filteredUsers: users,
                coverage_id: coverage.coverage_id,
            }));

        this.props.contentTypes.forEach((contentType) => {
            const presentInSavedCoverages = savedCoverages.find((coverage) => coverage.qcode === contentType.qcode);

            if (presentInSavedCoverages == null) {
                coverages.push({
                    enabled: false,
                    qcode: contentType.qcode,
                    workflow_status: 'draft',
                    planning: {
                        language: null,
                    },
                    desk: null,
                    filteredDesks: desks,
                    user: null,
                    filteredUsers: users,
                    status: planningUtils.getDefaultCoverageStatus(newsCoverageStatus),
                });
            }
        });

        this.setState({coverages: [...savedCoverages, ...coverages]});
    }

    getContentTypeName = (contentType) => getVocabularyItemFieldTranslated(
        contentType,
        'name',
        getUserInterfaceLanguageFromCV()
    );

    duplicate = (index, coverage) => {
        const coveragesCopy = cloneDeep(this.state.coverages);
        const coverageToAdd = {
            enabled: false,
            qcode: coverage.qcode,
            desk: null,
            user: null,
            status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
            filteredDesks: this.props.desks,
            filteredUsers: this.props.users,
        } satisfies Partial<ICoverageLineItem>;

        coveragesCopy.splice(index + 1, 0, coverageToAdd);
        this.setState({coverages: coveragesCopy});
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

    onDeskChange = (selected, desk) => {
        const updates = {
            desk: desk,
            filteredUsers: getUsersForDesk(desk, this.props.users),
        };

        this.updateCoverage(selected, updates);
    }

    onUserChange = (selected, user) => {
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
                const newCoverage: DeepPartial<ICoverageLineItem> = coverage.coverage_id == null ?
                    this.props.createCoverage(coverage.qcode) :
                    this.props.value.find(
                        (val) => val.coverage_id === coverage.coverage_id
                    );

                newCoverage.assigned_to = {
                    user: get(coverage, 'user._id'),
                    desk: get(coverage, 'desk._id'),
                };

                if (coverage.planning?.language) {
                    newCoverage.planning = {
                        ...newCoverage.planning,
                        language: coverage.planning.language,
                    };
                }

                if (coverage.coverage_id != null && coverage.enabled !== true) {
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
        const canSave = this.state.coverages.every((coverage) => {
            if (coverage.enabled && coverage.user) {
                return coverage.desk != null;
            }

            return true;
        });

        return (
            <Modal
                visible
                closeOnEscape
                size="x-large"
                onHide={this.props.close}
                headerTemplate={gettext('Add Coverages (advanced mode)')}
                footerTemplate={(
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
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                style="filled"
                                disabled={!this.state.isDirty || !canSave}
                                onClick={() => {
                                    this.save();
                                }}
                            />
                        </Spacer>
                    </Spacer>
                )}
            >
                <Spacer v gap="8" justifyContent="center" alignItems="center">
                    {this.state.coverages.map((coverage, index) => {
                        const isActive = coverage.workflow_status === 'active';

                        return (
                            <div
                                key={index}
                                style={coverage.enabled ? {height: 60} : {}}
                                className="sd-list-item sd-shadow--z1"
                            >
                                <div className="sd-list-item__column">
                                    <Tooltip
                                        flow="top"
                                        text={isActive
                                            ? gettext('Coverage has been added to workflow')
                                            : gettext('Enable coverage')
                                        }
                                    >
                                        <Checkbox
                                            disabled={isActive}
                                            label={{
                                                text: gettext('Coverage enabled'),
                                                hidden: true,
                                            }}
                                            checked={coverage.enabled}
                                            onChange={() => this.updateCoverage(coverage, {enabled: !coverage.enabled})}
                                        />
                                    </Tooltip>
                                </div>
                                <div className="sd-list-item__column">
                                    <i className={planningUtils.getCoverageIcon(coverage.qcode)} />
                                </div>
                                <div className="sd-list-item__column sd-overflow-ellipsis" style={{width: '10%'}}>
                                    {this.getContentTypeName(this.contentTypes.get(coverage.qcode))}
                                </div>
                                {coverage.enabled && (
                                    <CoverageEditableFields
                                        index={index}
                                        coverage={coverage}
                                        languages={this.props.languages}
                                        handleDeskChange={this.onDeskChange}
                                        handleUserChange={this.onUserChange}
                                        updateCoverage={this.updateCoverage}
                                        duplicateCoverage={this.duplicate}
                                        newsCoverageStatus={this.props.newsCoverageStatus}
                                    />
                                )}
                            </div>
                        );
                    })}
                </Spacer>
            </Modal>
        );
    }
}

const mapDispatchToProps = (dispatch): IReduxDispatchProps => ({
    setCoverageAddAdvancedMode: (value) => dispatch(actions.users.setCoverageAddAdvancedMode(value)),
});

const mapStateToProps = (state) => ({
    languages: selectors.vocabs.getLanguages(state),
});

export const CoverageAddAdvancedModal = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(CoverageAddAdvancedModalComponent);
