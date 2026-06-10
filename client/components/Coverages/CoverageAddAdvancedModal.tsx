import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get, uniqueId} from 'lodash';

import {
    IG2ContentType,
    IPlanningNewsCoverageStatus,
    IPlanningCoverageItem,
    ICoveragePlanningDetails,
} from '../../interfaces';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';

import {gettext, planningUtils, getUsersForDesk, getDesksForUser} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {planningApi, superdeskApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {Button, ButtonGroup, Checkbox, Modal, Tooltip} from 'superdesk-ui-framework/react';
import {CoverageEditableFields} from './CoverageFieldsRow';

type IReduxStateProps = {
    allLanguages: Array<{value: IVocabularyItem}>;
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

    // frontend-only stable identity used for React keys and focus management
    rowId: string;
}

interface IOwnProps {
    field: string;
    value: Array<DeepPartial<ICoverageLineItem>>;
    coverageAddAdvancedMode: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;

    onSave(field: string, value: Array<DeepPartial<ICoverageLineItem>>): void;
    onCancel(): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<ICoverageLineItem>;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

interface IState {
    advancedMode: boolean;
    coverages: Array<Partial<ICoverageLineItem>>;
    isDirty: boolean;
}

class CoverageAddAdvancedModalComponent extends React.Component<IProps, IState> {
    contentTypes: Map<string, IProps['contentTypes'][0]>;
    private pendingFocusId: string | null = null;
    private pendingFocusFieldId: string | null = null;
    private rowRefs = new Map<string, HTMLElement | null>();

    constructor(props: IProps) {
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

    getFilteredLanguages(allLanguages: Array<{value: IVocabularyItem}>) {
        const {multilingual} = planningApi.contentProfiles;

        const planningProfile = planningApi.contentProfiles.get('planning');
        const isMultilingual = multilingual.isEnabled(planningProfile);

        // If `multilingual` is enabled, filter to only configured languages
        if (!isMultilingual) {
            return allLanguages;
        }

        const planningProfileLanguages = multilingual.getLanguages(planningProfile);

        return allLanguages.filter((language) => planningProfileLanguages.includes(language.value.qcode));
    }

    getContentTypeName = (contentType) => getVocabularyItemFieldTranslated(
        contentType,
        'name',
        getUserInterfaceLanguageFromCV()
    );

    componentDidMount() {
        const {value, users, desks, newsCoverageStatus} = this.props;
        const coverages = [];
        const savedCoverages = value

            // if there was a savedCoverage but later the coverage type got removed/disabled from
            // g2_content_type vocabulary do not try to render it
            .filter((coverage) => this.contentTypes.get(coverage.planning.g2_content_type) != null)
            .map((coverage) => ({
                rowId: uniqueId('coverage-row-'),
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
                    rowId: uniqueId('coverage-row-'),
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

        const combinedCoverages = [...savedCoverages, ...coverages];

        // focus the first row with an enabled checkbox; active coverages are
        // disabled and cannot receive focus
        const firstFocusable = combinedCoverages.find((coverage) => coverage.workflow_status !== 'active')
            ?? combinedCoverages[0];

        this.pendingFocusId = firstFocusable?.rowId ?? null;
        this.setState({coverages: combinedCoverages});
    }

    componentDidUpdate() {
        if (this.pendingFocusId != null) {
            const rowEl = this.rowRefs.get(this.pendingFocusId);

            rowEl?.querySelector<HTMLElement>('input[type="checkbox"]')?.focus();
            this.pendingFocusId = null;
        }
        if (this.pendingFocusFieldId != null) {
            const rowEl = this.rowRefs.get(this.pendingFocusFieldId);

            rowEl?.querySelector<HTMLElement>('select')?.focus();
            this.pendingFocusFieldId = null;
        }
    }

    handleListKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
            return;
        }
        const target = e.target as HTMLElement;

        if (!target.matches('input[type="checkbox"]')) {
            return;
        }

        e.preventDefault();

        const rowIds = this.state.coverages.map((coverage) => coverage.rowId);
        const currentId = rowIds.find((id) => id != null && this.rowRefs.get(id)?.contains(target));

        if (currentId == null) {
            return;
        }

        const nextId = rowIds[rowIds.indexOf(currentId) + (e.key === 'ArrowDown' ? 1 : -1)];

        if (nextId == null) {
            return;
        }

        this.rowRefs.get(nextId)?.querySelector<HTMLElement>('input[type="checkbox"]')
            ?.focus();
    }

    duplicate = (coverage: Partial<ICoverageLineItem>) => {
        const coveragesCopy = cloneDeep(this.state.coverages);
        const index = coveragesCopy.findIndex((c) => c.rowId === coverage.rowId);
        const rowId = uniqueId('coverage-row-');
        const coverageToAdd: Partial<ICoverageLineItem> = {
            rowId: rowId,
            enabled: false,
            qcode: coverage.qcode,
            desk: null,
            user: null,
            planning: {
                language: coverage.planning?.language,
            } as ICoveragePlanningDetails,
            status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
            filteredDesks: this.props.desks,
            filteredUsers: this.props.users,
        };

        coveragesCopy.splice(index + 1, 0, coverageToAdd);
        this.pendingFocusId = rowId;
        this.setState({coverages: coveragesCopy});
    }

    updateCoverage = (selected, updates) => {
        const coverages = this.state.coverages.map((coverage) => {
            if (selected === coverage) {
                return Object.assign(coverage, updates);
            }

            return coverage;
        });

        this.setState({coverages: coverages, isDirty: true});
    }

    onDeskChange = (selected: Partial<ICoverageLineItem>, desk: IDesk | null) => {
        const deskLanguage = desk?.desk_language;
        let user = selected.user;

        const deskUsers = getUsersForDesk(desk, this.props.users);

        if (!user || !deskUsers.some((u) => u._id === user._id)) {
            user = null;
        }

        const updates: Partial<ICoverageLineItem> = {
            desk: desk,
            filteredUsers: deskUsers,
            user: user,
        };

        // If desk has a language, check if it's available in the planning profile
        // and set it as the coverage language
        if (deskLanguage != null) {
            const deskLanguageAvailable = this.getFilteredLanguages(this.props.allLanguages).some(
                (lang) => lang.value.qcode === deskLanguage
            );

            if (deskLanguageAvailable) {
                updates.planning = {
                    ...(selected.planning ?? {}),
                    language: deskLanguage,
                };
            }
        }

        this.updateCoverage(selected, updates);
    }

    onUserChange = (selected, user) => {
        const updates = {
            user: user,
            filteredDesks: getDesksForUser(user, this.props.desks),
        };

        this.updateCoverage(selected, updates);
    }

    save = () => {
        const coverages = this.state.coverages
            .filter((coverage) => coverage.enabled || coverage.coverage_id != null)
            .map((coverage) => {
                const newCoverage: DeepPartial<ICoverageLineItem> = coverage.coverage_id == null ?
                    this.props.createCoverage(coverage.qcode) :
                    this.props.value.find(
                        (val) => val.coverage_id === coverage.coverage_id
                    );

                newCoverage.assigned_to = Object.assign({}, newCoverage.assigned_to || {}, {
                    user: get(coverage, 'user._id'),
                    desk: get(coverage, 'desk._id'),
                });

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

        // Trigger save with coverages
        // Important note: `spiked` workflow_status is only used on the frontend
        // to indicate which coverages should be removed.
        // TODO-PR: Do we still need to exclude spiked?
        this.props.onSave(this.props.field, coverages.filter((x) => x.workflow_status !== 'spiked'));

        // Save advanced mode preference
        if (this.state.advancedMode !== this.props.coverageAddAdvancedMode) {
            this.props.setCoverageAddAdvancedMode(this.state.advancedMode);
        }
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
                contentBg="medium"
                onHide={this.props.onCancel}
                headerTemplate={gettext('Add Coverages (advanced mode)')}
                footerTemplate={(
                    <React.Fragment>
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
                        <ButtonGroup align="end">
                            <Button
                                text={gettext('Cancel')}
                                type="secondary"
                                onClick={this.props.onCancel}
                            />
                            <Button
                                text={gettext('Save')}
                                type="primary"
                                disabled={!this.state.isDirty || !canSave}
                                onClick={() => {
                                    this.save();
                                }}
                            />
                        </ButtonGroup>
                    </React.Fragment>
                )}
            >
                <div
                    className="sd-list-item-group sd-list-item-group--space-between-items"
                    onKeyDown={this.handleListKeyDown}
                >
                    {this.state.coverages.map((coverage) => {
                        const isActive = coverage.workflow_status === 'active';

                        return (
                            <div
                                key={coverage.rowId}
                                ref={(el) => {
                                    if (coverage.rowId != null) {
                                        this.rowRefs.set(coverage.rowId, el);
                                    }
                                }}
                                className="sd-list-item sd-list-item--no-hover sd-list-item--focusable sd-shadow--z1"
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
                                            onChange={() => {
                                                if (!coverage.enabled) {
                                                    this.pendingFocusFieldId = coverage.rowId ?? null;
                                                }
                                                this.updateCoverage(coverage, {enabled: !coverage.enabled});
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                                <div className="sd-list-item__column">
                                    <i className={planningUtils.getCoverageIcon(coverage.qcode)} />
                                </div>
                                <div className="sd-list-item__column sd-overflow-ellipsis" style={{width: '15%'}}>
                                    {this.getContentTypeName(this.contentTypes.get(coverage.qcode))}
                                </div>
                                {coverage.enabled && (
                                    <CoverageEditableFields
                                        coverage={coverage}
                                        languages={this.getFilteredLanguages(this.props.allLanguages)}
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
                </div>
            </Modal>
        );
    }
}

const mapDispatchToProps = (dispatch): IReduxDispatchProps => ({
    setCoverageAddAdvancedMode: (value) => dispatch(actions.users.setCoverageAddAdvancedMode(value)),
});

const mapStateToProps = (state) => ({
    allLanguages: selectors.vocabs.getLanguagesForTreeSelectInput(state),
});

export const CoverageAddAdvancedModal = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(CoverageAddAdvancedModalComponent);
