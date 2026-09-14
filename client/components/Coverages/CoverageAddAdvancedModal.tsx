import React from 'react';
import {connect} from 'react-redux';
import {uniqueId} from 'lodash';

import {
    IEventItem,
    IG2ContentType,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';

import {gettext, planningUtils} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {Button, ButtonGroup, Checkbox, Modal, Tooltip} from 'superdesk-ui-framework/react';
import {CoverageEditableFields} from './CoverageFieldsRow';
import {
    applyDeskChange,
    applyUserChange,
    buildNewCoverage,
    createRowsFromContentTypes,
    duplicateRow,
    getFilteredLanguages,
    ICoverageLineItem,
    updateRow,
    validateRows,
} from './coverageRows';

export type {ICoverageLineItem};

type IReduxStateProps = {
    allLanguages: Array<{value: IVocabularyItem}>;
};

interface IReduxDispatchProps {
    setCoverageAddAdvancedMode: (value: boolean) => void;
}

interface IOwnProps {
    field: string;
    value: Array<DeepPartial<ICoverageLineItem>>;
    coverageAddAdvancedMode: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    event?: IEventItem;

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

    getContentTypeName = (contentType) => getVocabularyItemFieldTranslated(
        contentType,
        'name',
        getUserInterfaceLanguageFromCV()
    );

    componentDidMount() {
        const {value, users, desks, newsCoverageStatus} = this.props;
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

        const remainingContentTypes = this.props.contentTypes.filter(
            (contentType) => !savedCoverages.some((coverage) => coverage.qcode === contentType.qcode)
        );

        const combinedCoverages = [
            ...savedCoverages,
            ...createRowsFromContentTypes(remainingContentTypes, desks, users, newsCoverageStatus),
        ];

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
        const coverages = duplicateRow(
            this.state.coverages,
            coverage,
            this.props.newsCoverageStatus,
            this.props.desks,
            this.props.users
        );
        const sourceIndex = coverages.findIndex((row) => row.rowId === coverage.rowId);

        this.pendingFocusId = coverages[sourceIndex + 1].rowId;
        this.setState({coverages: coverages});
    }

    updateCoverage = (selected: Partial<ICoverageLineItem>, updates: Partial<ICoverageLineItem>) => {
        this.setState({
            coverages: updateRow(this.state.coverages, selected, updates),
            isDirty: true,
        });
    }

    onDeskChange = (selected: Partial<ICoverageLineItem>, desk: IDesk | null) => {
        this.updateCoverage(selected, applyDeskChange(
            selected,
            desk,
            this.props.users,
            getFilteredLanguages(this.props.allLanguages)
        ));
    }

    onUserChange = (selected: Partial<ICoverageLineItem>, user: IUser | null) => {
        this.updateCoverage(selected, applyUserChange(user, this.props.desks));
    }

    save = () => {
        const coverages = this.state.coverages
            .filter((coverage) => coverage.enabled || coverage.coverage_id != null)
            .map((coverage) => {
                if (coverage.coverage_id == null) {
                    return buildNewCoverage(coverage, this.props.createCoverage, this.props.event);
                }

                const savedCoverage = this.props.value.find((val) => val.coverage_id === coverage.coverage_id);

                savedCoverage.assigned_to = Object.assign({}, savedCoverage.assigned_to || {}, {
                    user: coverage.user?._id,
                    desk: coverage.desk?._id,
                });

                if (coverage.planning?.language) {
                    savedCoverage.planning = {
                        ...savedCoverage.planning,
                        language: coverage.planning.language,
                    };
                }

                if (coverage.enabled !== true) {
                    savedCoverage.workflow_status = 'spiked';
                } else if (coverage.status) {
                    savedCoverage.news_coverage_status = coverage.status;
                }

                return savedCoverage;
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
        const canSave = Object.keys(validateRows(this.state.coverages)).length === 0;

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
                                        languages={getFilteredLanguages(this.props.allLanguages)}
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
