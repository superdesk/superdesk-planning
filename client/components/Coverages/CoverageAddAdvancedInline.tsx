import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get, uniqueId} from 'lodash';
import {Button, ButtonGroup, Checkbox, IconButton, Tooltip} from 'superdesk-ui-framework/react';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';

import {
    ICoveragePlanningDetails,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {gettext, getDesksForUser, getUsersForDesk, planningUtils} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import {planningApi} from '../../superdeskApi';
import * as selectors from '../../selectors';
import {CoverageEditableFields} from './CoverageFieldsRow';
import {ICoverageLineItem} from './CoverageAddAdvancedModal';

interface IOwnProps {
    field: string;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;

    // Remaining number of coverages that may be enabled and saved (0 or undefined means unlimited)
    maxCoverageCount?: number;

    onSave(field: string, value: Array<DeepPartial<ICoverageLineItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<ICoverageLineItem>;
}

interface IReduxStateProps {
    allLanguages: Array<{value: IVocabularyItem}>;
}

type IProps = IOwnProps & IReduxStateProps;

interface IState {
    coverages: Array<Partial<ICoverageLineItem>>;
    isDirty: boolean;
}

class CoverageAddAdvancedInlineComponent extends React.Component<IProps, IState> {
    contentTypes: Map<string, IProps['contentTypes'][0]>;

    constructor(props: IProps) {
        super(props);
        this.contentTypes = new Map(props.contentTypes.map((contentType) => [
            contentType.qcode ?? contentType['content item type'],
            contentType,
        ]));
        this.state = this.getInitialState(props);
    }

    getInitialState(props = this.props): IState {
        const coverages = props.contentTypes.map((contentType) => ({
            rowId: uniqueId('coverage-row-'),
            enabled: false,
            qcode: contentType.qcode,
            workflow_status: 'draft',
            planning: {language: null},
            desk: null,
            filteredDesks: props.desks,
            user: null,
            filteredUsers: props.users,
            status: planningUtils.getDefaultCoverageStatus(props.newsCoverageStatus),
        }));

        return {
            coverages: coverages,
            isDirty: false,
        };
    }

    getFilteredLanguages = () => {
        const planningProfile = planningApi.contentProfiles.get('planning');

        if (!planningApi.contentProfiles.multilingual.isEnabled(planningProfile)) {
            return this.props.allLanguages;
        }

        const planningProfileLanguages = planningApi.contentProfiles.multilingual.getLanguages(planningProfile);

        return this.props.allLanguages.filter(
            (language) => planningProfileLanguages.includes(language.value.qcode)
        );
    }

    updateCoverage = (selected, updates) => {
        this.setState({
            coverages: this.state.coverages.map((coverage) => coverage === selected ?
                Object.assign(coverage, updates) : coverage),
            isDirty: true,
        });
    }

    onDeskChange = (selected: Partial<ICoverageLineItem>, desk: IDesk | null) => {
        const deskLanguage = desk?.desk_language;
        let user = selected.user;
        const deskUsers = getUsersForDesk(desk, this.props.users);

        if (!user || !deskUsers.some((candidate) => candidate._id === user._id)) {
            user = null;
        }

        const updates: Partial<ICoverageLineItem> = {
            desk: desk,
            user: user,
            filteredUsers: deskUsers,
        };

        // Only apply the desk language if it's available in the (possibly filtered) planning profile
        if (deskLanguage != null) {
            const deskLanguageAvailable = this.getFilteredLanguages().some(
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
        this.updateCoverage(selected, {
            user: user,
            filteredDesks: getDesksForUser(user, this.props.desks),
        });
    }

    duplicateCoverage = (coverage: Partial<ICoverageLineItem>) => {
        const coverages = cloneDeep(this.state.coverages);
        const index = coverages.findIndex((candidate) => candidate.rowId === coverage.rowId);

        coverages.splice(index + 1, 0, {
            rowId: uniqueId('coverage-row-'),
            enabled: false,
            qcode: coverage.qcode,
            desk: null,
            user: null,
            planning: {language: coverage.planning?.language} as ICoveragePlanningDetails,
            status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
            filteredDesks: this.props.desks,
            filteredUsers: this.props.users,
        });
        this.setState({coverages: coverages, isDirty: true});
    }

    save = () => {
        const {maxCoverageCount} = this.props;
        const coverages = this.state.coverages
            .filter((coverage) => coverage.enabled)
            .slice(0, maxCoverageCount ? maxCoverageCount : undefined)
            .map((coverage) => {
                const newCoverage = this.props.createCoverage(coverage.qcode);

                newCoverage.assigned_to = {
                    ...(newCoverage.assigned_to ?? {}),
                    user: get(coverage, 'user._id'),
                    desk: get(coverage, 'desk._id'),
                };
                if (coverage.planning?.language) {
                    newCoverage.planning = {...newCoverage.planning, language: coverage.planning.language};
                }
                if (coverage.status) {
                    newCoverage.news_coverage_status = coverage.status;
                }

                return newCoverage;
            });

        this.props.onSave(this.props.field, coverages);
        this.setState(this.getInitialState());
    }

    render() {
        const {maxCoverageCount} = this.props;
        const enabledCount = this.state.coverages.filter((coverage) => coverage.enabled).length;
        const limitReached = maxCoverageCount ? enabledCount >= maxCoverageCount : false;
        const canSave = (maxCoverageCount ? enabledCount <= maxCoverageCount : true) &&
            this.state.coverages.every((coverage) => (
                !coverage.enabled || !coverage.user || coverage.desk != null
            ));

        return (
            <div className="coverage-form sd-shadow--z2" data-test-id="advanced-coverages-inline">
                <div className="coverage-form__header">
                    <span className="form-label">{gettext('Coverage Types')}</span>
                </div>
                <div className="coverage-form__body">
                    <div className="sd-list-item-group sd-list-item-group--space-between-items">
                        {this.state.coverages.map((coverage) => (
                            <React.Fragment key={coverage.rowId}>
                                <div
                                    className={'sd-list-item sd-list-item--no-hover ' +
                                        'sd-list-item--focusable sd-shadow--z1'}
                                >
                                    <div className="sd-list-item__column">
                                        <Tooltip flow="top" text={gettext('Enable coverage')}>
                                            <Checkbox
                                                disabled={coverage.workflow_status === 'active' ||
                                                    (!coverage.enabled && limitReached)}
                                                label={{text: gettext('Coverage enabled'), hidden: true}}
                                                checked={coverage.enabled}
                                                onChange={() => this.updateCoverage(
                                                    coverage,
                                                    {enabled: !coverage.enabled}
                                                )}
                                            />
                                        </Tooltip>
                                    </div>
                                    <div className="sd-list-item__column">
                                        <i className={planningUtils.getCoverageIcon(coverage.qcode)} />
                                    </div>
                                    <div
                                        className="coverage-form__type sd-list-item__column sd-overflow-ellipsis"
                                    >
                                        {getVocabularyItemFieldTranslated(
                                            this.contentTypes.get(coverage.qcode),
                                            'name',
                                            getUserInterfaceLanguageFromCV()
                                        )}
                                    </div>
                                    <div className="coverage-form__duplicate">
                                        <IconButton
                                            ariaValue={gettext('Duplicate')}
                                            icon="plus-sign"
                                            onClick={() => this.duplicateCoverage(coverage)}
                                        />
                                    </div>
                                </div>
                                {coverage.enabled && (
                                    <div
                                        className={'coverage-form__fields sd-list-item ' +
                                            'sd-list-item--no-hover sd-shadow--z1'}
                                    >
                                        <CoverageEditableFields
                                            coverage={coverage}
                                            languages={this.getFilteredLanguages()}
                                            handleDeskChange={this.onDeskChange}
                                            handleUserChange={this.onUserChange}
                                            updateCoverage={this.updateCoverage}
                                            duplicateCoverage={this.duplicateCoverage}
                                            newsCoverageStatus={this.props.newsCoverageStatus}
                                            stacked
                                            showDuplicate={false}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="coverage-form__footer">
                    <ButtonGroup align="end">
                        <Button
                            type="secondary"
                            text={gettext('Cancel')}
                            onClick={() => this.setState(this.getInitialState())}
                        />
                        <Button
                            type="primary"
                            text={gettext('Add Coverage(s)')}
                            disabled={!this.state.isDirty || !canSave}
                            onClick={() => this.save()}
                        />
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state): IReduxStateProps => ({
    allLanguages: selectors.vocabs.getLanguagesForTreeSelectInput(state),
});

export const CoverageAddAdvancedInline = connect<IReduxStateProps, null, IOwnProps>(
    mapStateToProps,
)(CoverageAddAdvancedInlineComponent);