import React from 'react';
import {connect} from 'react-redux';
import {memoize, set, cloneDeep} from 'lodash';
import {Button, ButtonGroup, Checkbox, IconButton, IconLabel, Tooltip} from 'superdesk-ui-framework/react';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';

import {
    IEventItem,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningContentProfile
} from '../../interfaces';
import {gettext, planningUtils, getItemInArrayById} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import * as selectors from '../../selectors';
import {
    applyDeskChange,
    createRowsFromContentTypes,
    duplicateRow,
    getFilteredLanguages,
    ICoverageLineItem,
    ICoverageRow,
    ICoverageRowRules,
    updateRow,
    createRow,
} from './coverageRows';
import {CoverageForm} from './CoverageEditor/CoverageForm';

import './CoverageAddInlineForm.scss';

const RULES: ICoverageRowRules = {plannedOnDesk: true, deskRequiredForWorkflow: true};

function getContentTypesByQcode(contentTypes: Array<IG2ContentType>): Map<string, IG2ContentType> {
    return new Map(contentTypes.map((contentType) => [
        contentType.qcode ?? contentType['content item type'],
        contentType,
    ]));
}

interface IOwnProps {
    contentTypes: Array<IG2ContentType>;
    desks: Array<IDesk>;
    users: Array<IUser>;
    event: IEventItem;
    disabled?: boolean;

    onAdd(newCoverages: Array<DeepPartial<ICoverageLineItem>>): void;
}

interface IReduxStateProps {
    allLanguages: Array<{value: IVocabularyItem}>;
    coverageProfiles: {[profileId: string]: IPlanningContentProfile};
    defaultCoverageProfile: IPlanningContentProfile;
}

type IProps = IOwnProps & IReduxStateProps;

interface IState {
    rows: Array<ICoverageRow>;
    open: boolean;
}

class CoverageAddInlineFormComponent extends React.Component<IProps, IState> {
    form: React.RefObject<HTMLDivElement>;
    getContentTypesByQcode = memoize(getContentTypesByQcode);

    constructor(props: IProps) {
        super(props);

        this.form = React.createRef();
        this.state = this.getInitialState();
    }

    getInitialState(): IState {
        const {contentTypes, desks, event} = this.props;

        return {
            rows: createRowsFromContentTypes(event, contentTypes, desks),
            open: true,
        };
    }

    clearRows = () => {
        const {rows} = this.getInitialState();

        this.setState({rows});
    }

    cancel = () => {
        this.setState({...this.getInitialState(), open: false});
    }

    open = () => {
        this.setState({open: true}, () => {
            this.form.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        });
    }

    update = (row: ICoverageRow, updates: ICoverageRow) => {
        this.setState({rows: updateRow(this.state.rows, row, updates)});
    }

    duplicate = (row: ICoverageRow) => {
        this.setState({
            rows: duplicateRow(this.props.event, this.state.rows, row, this.props.desks),
        });
    }

    add = () => {
        const fieldsToRemove: Array<keyof ICoverageLineItem> = [
            'enabled', 'qcode', 'desk', 'user', 'status', 'filteredDesks', 'rowId',
        ];
        const removeRowFieldsFromCoverage = (coverageLine: Partial<ICoverageLineItem>) => {
            const coverage = {...coverageLine};

            for (const field of fieldsToRemove) {
                delete coverage[field];
            }

            if (coverage.planning.language == null) {
                coverage.planning.language = this.props.event.language;
            }
            return coverage;
        };

        this.props.onAdd(this.state.rows
            .filter((row) => (
                row.enabled === true
                && (row.coverage_id == null || row.coverage_id.startsWith('tempId-'))
            ))
            .map((coverageLine) => removeRowFieldsFromCoverage(coverageLine)),
        );
        this.clearRows();
    }

    updateField = (field: string, index: number, value: any) => {
        const relativeField = field.replace(/^coverages\.\d+\./, '');

        this.setState((prevState) => {
            const newState = cloneDeep(prevState);

            if (field === `coverages.${index}`) {
                // Simply replace the entire coverage object
                newState.rows[index] = value;
                return newState;
            }

            const updatedCoverage = newState.rows[index];

            if (relativeField === 'assigned_to.desk') {
                updatedCoverage.user = getItemInArrayById(this.props.users, updatedCoverage.assigned_to?.user);

                const rowUpdates = applyDeskChange(
                    updatedCoverage,
                    getItemInArrayById(this.props.desks, value),
                    this.props.users,
                    getFilteredLanguages(this.props.allLanguages),
                    RULES,
                );

                if (updatedCoverage.assigned_to == null) {
                    updatedCoverage.assigned_to = {};
                }

                updatedCoverage.assigned_to.desk = rowUpdates.desk?._id ?? null;
                updatedCoverage.assigned_to.user = rowUpdates.user?._id ?? null;

                if (rowUpdates.status != null) {
                    updatedCoverage.news_coverage_status = rowUpdates.status;
                }

                if (rowUpdates.planning?.language != null) {
                    updatedCoverage.planning.language = rowUpdates.planning.language;
                }
            } else {
                set(updatedCoverage, relativeField, value);
            }

            return newState;
        });
    }

    toggleCoverageRow = (row: ICoverageRow) => {
        if (!row.enabled) {
            const updatedRow = createRow(this.props.event, row.qcode, this.props.desks);

            this.update(row, {enabled: true, planning: updatedRow.planning});
        } else {
            this.update(row, {enabled: false});
        }
    }

    renderTypeLine(row: ICoverageRow, contentTypes: Map<string, IG2ContentType>) {
        return (
            <div
                className="sd-list-item sd-list-item--no-hover sd-shadow--z1"
                data-test-id={`coverage-inline-form__row--${row.qcode}`}
            >
                <div className="sd-list-item__column">
                    <Tooltip flow="top" text={gettext('Enable coverage')}>
                        <Checkbox
                            label={{text: gettext('Coverage enabled'), hidden: true}}
                            checked={row.enabled === true}
                            onChange={this.toggleCoverageRow.bind(this, row)}
                        />
                    </Tooltip>
                </div>
                <div className="sd-list-item__column">
                    <i className={planningUtils.getCoverageIcon(row.qcode)} />
                </div>
                <div className="coverage-inline-form__type sd-list-item__column sd-overflow-ellipsis">
                    {getVocabularyItemFieldTranslated(
                        contentTypes.get(row.qcode),
                        'name',
                        getUserInterfaceLanguageFromCV()
                    )}
                </div>
                <div className="d-flex items-center ml-auto">
                    <IconButton
                        ariaValue={gettext('Duplicate')}
                        icon="plus-sign"
                        onClick={() => this.duplicate(row)}
                    />
                </div>
            </div>
        );
    }

    renderEditor(coverage: Partial<IPlanningCoverageItem>, index: number) {
        const profile = cloneDeep<IPlanningContentProfile>(
            this.props.coverageProfiles[coverage.profile]
            || this.props.defaultCoverageProfile
        );
        const fieldProps = {
            desk: {
                field: 'assigned_to.desk',
                clearable: true,
                required: false,
                restrictToUser: true,
                userId: coverage.assigned_to?.user,
            },
            user: {
                field: 'assigned_to.user',
                required: false,
                deskId: coverage.assigned_to?.desk,
            },
        };

        // Enable or Disable fields that are to be shown or hidden
        for (const field of Object.keys(profile.schema)) {
            const schema = profile.schema[field];
            let enabled: boolean = profile.editor[field]?.enabled ?? false;

            if (!enabled) {
                // This field is already disabled, no need to check anything
                continue;
            }

            if (field === 'g2_content_type') {
                enabled = false;
            } else if (schema.required) {
                enabled = true;
            } else if (!schema.show_in_embedded_editor) {
                enabled = false;
            }

            if (profile.editor[field] != null) {
                profile.editor[field].enabled = enabled;
            } else {
                profile.editor[field] = {enabled: enabled};
            }

            // Turn off all required fields, as we should be able to use defaults
            schema.required = false;
        }

        profile.schema.desk = {required: true, type: 'dict'};
        profile.editor.desk = {enabled: true, index: 0};
        profile.schema.user = {required: true, type: 'dict'};
        profile.editor.user = {enabled: true, index: 0};

        // Remove the `add to workflow` toggle
        if (profile.editor.add_coverage_to_workflow == null) {
            profile.editor.add_coverage_to_workflow = {enabled: false};
        } else {
            profile.editor.add_coverage_to_workflow.enabled = false;
        }

        return (
            <CoverageForm
                testId={`coverages[${index}]`}
                field={`coverages[${index}]`}
                value={coverage}
                item={this.state}
                diff={this.state}
                coverages={this.state.rows}
                disabled={this.props.disabled}
                onChange={(field, value) => this.updateField(field, index, value)}
                hasAssignment={planningUtils.isCoverageAssigned(coverage)}
                index={index}
                coverageTypeProfile={profile}
                fieldProps={fieldProps}
            />
        );
    }

    render() {
        const {rows} = this.state;
        const enabledCount = rows.filter((row) => row.enabled === true).length;
        const contentTypes = this.getContentTypesByQcode(this.props.contentTypes);

        if (!this.state.open) {
            return (
                <button
                    type="button"
                    className="item-association coverage-inline-form__open"
                    data-test-id="coverage-inline-form__open"
                    onClick={this.open}
                >
                    <IconLabel text={gettext('Add Coverages')} icon="plus-sign" type="primary" />
                </button>
            );
        }

        return (
            <div className="coverage-inline-form sd-shadow--z2" data-test-id="coverage-inline-form" ref={this.form}>
                <div className="coverage-inline-form__header py-1 px-2">
                    <span className="form-label">{gettext('Coverage Types')}</span>
                </div>
                <div className="coverage-inline-form__body p-2">
                    <div className="sd-list-item-group sd-list-item-group--space-between-items">
                        {rows.map((row, index) => (
                            <React.Fragment key={row.rowId}>
                                {this.renderTypeLine(row, contentTypes)}
                                {row.enabled === true && (
                                    <div
                                        className={'coverage-inline-form__fields sd-list-item ' +
                                            'sd-list-item--no-hover sd-shadow--z1'}
                                        data-test-id={`coverage-inline-form__fields--${row.qcode}`}
                                    >
                                        <div className="coverage-editable-fields--stacked">
                                            {this.renderEditor(row, index)}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="coverage-inline-form__footer d-flex py-1 px-2">
                    <ButtonGroup align="end">
                        <Button
                            type="secondary"
                            text={gettext('Cancel')}
                            onClick={this.cancel}
                        />
                        <Button
                            type="primary"
                            text={gettext('Add Coverage(s)')}
                            disabled={enabledCount === 0}
                            onClick={this.add}
                        />
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state): IReduxStateProps => ({
    allLanguages: selectors.vocabs.getLanguagesForTreeSelectInput(state),
    coverageProfiles: selectors.forms.getCoverageProfilesIdMap(state),
    defaultCoverageProfile: selectors.forms.defaultCoverageProfile(state),
});

export const CoverageAddInlineForm = connect<IReduxStateProps, null, IOwnProps>(
    mapStateToProps,
)(CoverageAddInlineFormComponent);
