import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, remove as _remove, some, isEqual} from 'lodash';
import * as selectors from '../../../selectors';

import {gettext, getItemInArrayById, planningUtils} from '../../../utils';

import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    TextAreaInput,
    SelectMetaTermsInput,
    ToggleInput,
    ColouredValueInput,
    Field,
} from '../../UI/Form';
import {ToggleBox} from '../../UI';

import {PlanningEditorHeader} from './PlanningEditorHeader';
import {CoverageArrayInput} from '../../Coverages';
import {EventMetadata} from '../../Events';
import {ASSIGNMENTS, ITEM_TYPE, PLANNING} from '../../../constants';
import {stripHtmlRaw} from 'superdesk-core/scripts/apps/authoring/authoring/helpers';

const toggleDetails = [
    'ednote',
    'anpa_category',
    'subject',
];

export class PlanningEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {slugline: null};
        this.onChange = this.onChange.bind(this);
        this.onDuplicateCoverage = this.onDuplicateCoverage.bind(this);
        this.onCancelCoverage = this.onCancelCoverage.bind(this);
        this.createNewPlanningFromNewsItem = this.createNewPlanningFromNewsItem.bind(this);
    }

    componentWillMount() {
        if (!this.props.addNewsItemToPlanning || !planningUtils.isLockedForAddToPlanning(this.props.item)) {
            return;
        }

        // If we are creating a new planning item for 'add-to-planning'
        if (!get(this.props, 'item._id')) {
            const newPlanning = this.createNewPlanningFromNewsItem();

            this.props.onChangeHandler(null, newPlanning);
        } else {
            let dupItem = cloneDeep(this.props.item);

            dupItem.coverages.push(planningUtils.createCoverageFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                this.props.user,
                this.props.contentTypes));

            // reset the object to trigger a save
            this.props.onChangeHandler(null, dupItem);
        }
    }

    createNewPlanningFromNewsItem() {
        const {addNewsItemToPlanning} = this.props;
        const newCoverage = planningUtils.createCoverageFromNewsItem(
            this.props.addNewsItemToPlanning,
            this.props.newsCoverageStatus,
            this.props.desk,
            this.props.user,
            this.props.contentTypes);

        let newPlanning = {
            _type: ITEM_TYPE.PLANNING,
            slugline: addNewsItemToPlanning.slugline,
            ednote: get(addNewsItemToPlanning, 'ednote'),
            subject: get(addNewsItemToPlanning, 'subject'),
            anpa_category: get(addNewsItemToPlanning, 'anpa_category'),
            urgency: get(addNewsItemToPlanning, 'urgency'),
            description_text: stripHtmlRaw(
                get(addNewsItemToPlanning, 'abstract', get(addNewsItemToPlanning, 'headline', ''))
            ),
            coverages: [newCoverage],
        };

        if (get(addNewsItemToPlanning, 'flags.marked_for_not_publication')) {
            newPlanning.flags = {marked_for_not_publication: true};
        }

        return newPlanning;
    }

    onDuplicateCoverage(coverage, duplicateAs) {
        let diffCoverages = cloneDeep(this.props.diff.coverages);
        let newCoverage = cloneDeep(coverage);

        newCoverage.news_coverage_status = {qcode: 'ncostat:int'};
        delete newCoverage.coverage_id;
        delete newCoverage.assigned_to;

        if (duplicateAs) {
            newCoverage.planning.g2_content_type = duplicateAs;
        }

        diffCoverages.push(newCoverage);
        this.onChange('coverages', diffCoverages);
    }

    onCancelCoverage(coverage, remove = false) {
        let coverages = cloneDeep(this.props.diff.coverages);

        if (remove) {
            _remove(coverages, (c) => c.coverage_id === coverage.coverage_id);
        } else {
            // Cancel only
            let coverageToUpdate = coverages.find((c) => c.coverage_id === coverage.coverage_id);

            coverageToUpdate.news_coverage_status = PLANNING.NEWS_COVERAGE_CANCELLED_STATUS,
            coverageToUpdate.planning = {
                ...coverageToUpdate.planning,
                internal_note: `------------------------------------------------------------
        Coverage cancelled
        `,
                ednote: `------------------------------------------------------------
        Coverage cancelled
        `,
            };
        }

        this.onChange('coverages', coverages);
    }

    onChange(field, value) {
        let valueToUpdate = value;

        if (field === 'agendas') {
            valueToUpdate = value.map((agenda) => agenda._id);
        }

        if (field === 'urgency') {
            valueToUpdate = get(value, 'qcode', null);
        }

        if (field === 'coverages' && this.props.addNewsItemToPlanning) {
            valueToUpdate[value.length - 1] = planningUtils.createCoverageFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                this.props.user,
                this.props.contentTypes);
        } else if (field.match(/coverages\[/)) {
            // If there is an assignment and coverage status not planned,
            // change it to 'planned'
            if (get(value, 'news_coverage_status.qcode') !== this.props.newsCoverageStatus[0].qcode &&
                !!get(value, 'assigned_to.desk')) {
                valueToUpdate = {
                    ...value,
                    news_coverage_status: this.props.newsCoverageStatus[0]
                };
            }
        }

        this.props.onChangeHandler(field, valueToUpdate);
    }

    componentWillReceiveProps(nextProps) {
        // if the assignment associated with the planning item are modified

        if (get(this.props, 'item._id') === get(nextProps, 'item._id')) {
            const storedCoverages = get(nextProps, 'item.coverages') || [];
            const diffCoverages = get(this.props, 'diff.coverages') || [];

            if (get(storedCoverages, 'length', 0) > 0) {
                storedCoverages.forEach((coverage) => {
                    if (get(coverage, 'assigned_to.state', '') !== ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED) {
                        const index = diffCoverages.findIndex((c) => c.coverage_id === coverage.coverage_id);

                        if (index >= 0) {
                            const diffCoverage = diffCoverages[index];
                            const storedAssigmentState = get(coverage, 'assigned_to.state');

                            if (diffCoverage && storedAssigmentState &&
                                storedAssigmentState !== ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED &&
                                !isEqual(diffCoverage.assigned_to, coverage.assigned_to)) {
                                this.onChange(`coverages[${index}].assigned_to`, coverage.assigned_to);
                            }
                        }
                    }
                });
            }
        }
    }

    componentDidMount() {
        this.dom.slugline.focus();
    }

    render() {
        const {
            item,
            diff,
            event,
            categories,
            subjects,
            users,
            desks,
            agendas,
            readOnly,
            urgencies,
            timeFormat,
            dateFormat,
            newsCoverageStatus,
            contentTypes,
            genres,
            coverageProviders,
            priorities,
            keywords,
            addNewsItemToPlanning,
            currentWorkspace,
            submitFailed,
            dirty,
            errors,
            planningProfile,
            coverageProfile,
        } = this.props;

        const agendaValues = get(diff, 'agendas', [])
            .map((agendaId) => agendas.find((a) => a._id === agendaId));

        const enabledAgendas = agendas.filter((agenda) => get(agenda, 'is_enabled', true));

        const urgencyQcode = get(diff, 'urgency') || null;
        const urgency = getItemInArrayById(urgencies, urgencyQcode, 'qcode');
        const existingPlanning = !!get(diff, '_id');

        // Read-only if
        // 1 - it is supposed to be readOnly by parernt props
        // 2 - for add-to-planning and existing planning item
        const updatedReadOnly = readOnly || (!!addNewsItemToPlanning && existingPlanning);

        let maxCoverageCount = 0;

        if (addNewsItemToPlanning) {
            if (!existingPlanning) {
                maxCoverageCount = 1;
            } else {
                maxCoverageCount = get(item, 'coverages.length', 0) + 1;
            }
        }

        const fieldProps = {
            item: item,
            diff: diff,
            readOnly: updatedReadOnly,
            onChange: this.onChange,
            formProfile: planningProfile,
            errors: errors,
            showErrors: submitFailed
        };

        const detailsErrored = some(toggleDetails, (field) => !!get(errors, field));

        return (
            <div className="planning-editor">
                <PlanningEditorHeader
                    item={diff}
                    users={users}
                />

                <ContentBlock>
                    <Field
                        component={TextInput}
                        field="slugline"
                        label={gettext('Slugline')}
                        refNode={(node) => this.dom.slugline = node}
                        {...fieldProps}
                    />

                    <Field
                        component={TextAreaInput}
                        field="description_text"
                        label={gettext('Description')}
                        {...fieldProps}
                    />

                    <Field
                        component={TextAreaInput}
                        field="internal_note"
                        label={gettext('Internal Note')}
                        {...fieldProps}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="agendas"
                        label={gettext('Agenda')}
                        options={enabledAgendas}
                        valueKey="_id"
                        value={agendaValues}
                        {...fieldProps}
                    />

                    <ToggleBox
                        title={gettext('Details')}
                        isOpen={false}
                        scrollInView={true}
                        invalid={detailsErrored && (dirty || submitFailed)}
                    >
                        <Field
                            component={TextAreaInput}
                            field="ednote"
                            label={gettext('Ed Note')}
                            {...fieldProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="anpa_category"
                            label={gettext('Category')}
                            options={categories}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                        />

                        <Field
                            component={ColouredValueInput}
                            field="urgency"
                            label={gettext('Urgency')}
                            value={urgency}
                            options={urgencies}
                            iconName="urgency-label"
                            labelLeft={true}
                            defaultValue={null}
                            {...fieldProps}
                        />

                        <Field
                            component={ToggleInput}
                            field="flags.marked_for_not_publication"
                            label={gettext('Not for Publication')}
                            labelLeft={true}
                            defaultValue={false}
                            {...fieldProps}
                        />
                    </ToggleBox>
                </ContentBlock>

                {event && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Associated Event')}
                    </h3>
                )}

                {event && (
                    <ContentBlock>
                        <EventMetadata
                            event={event}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                        />
                    </ContentBlock>
                )}

                <Field
                    component={CoverageArrayInput}
                    row={false}
                    field="coverages"
                    users={users}
                    desks={desks}
                    timeFormat={timeFormat}
                    dateFormat={dateFormat}
                    newsCoverageStatus={newsCoverageStatus}
                    contentTypes={contentTypes}
                    genres={genres}
                    coverageProviders={coverageProviders}
                    priorities={priorities}
                    keywords={keywords}
                    onDuplicateCoverage={this.onDuplicateCoverage}
                    onCancelCoverage={this.onCancelCoverage}
                    currentWorkspace={currentWorkspace}
                    readOnly={readOnly}
                    maxCoverageCount={maxCoverageCount}
                    addOnly={!!addNewsItemToPlanning && existingPlanning}
                    originalCount={get(item, 'coverages', []).length}
                    defaultValue={[]}
                    {...fieldProps}
                    formProfile={coverageProfile}
                />
            </div>
        );
    }
}

PlanningEditorComponent.propTypes = {
    item: PropTypes.object,
    diff: PropTypes.object,
    event: PropTypes.object,
    onChangeHandler: PropTypes.func,
    categories: PropTypes.array,
    subjects: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    agendas: PropTypes.array,
    readOnly: PropTypes.bool,
    urgencies: PropTypes.array,
    timeFormat: PropTypes.string.isRequired,
    dateFormat: PropTypes.string.isRequired,
    newsCoverageStatus: PropTypes.array,
    contentTypes: PropTypes.array,
    genres: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    keywords: PropTypes.array,
    addNewsItemToPlanning: PropTypes.object,
    desk: PropTypes.string,
    user: PropTypes.string,
    currentWorkspace: PropTypes.string,
    errors: PropTypes.object,
    submitFailed: PropTypes.bool,
    dirty: PropTypes.bool,
    planningProfile: PropTypes.object,
    coverageProfile: PropTypes.object,
};

PlanningEditorComponent.defaultProps = {readOnly: false};

const mapStateToProps = (state) => ({
    categories: state.vocabularies.categories,
    subjects: state.subjects,
    users: selectors.getUsers(state),
    desks: selectors.getDesks(state),
    agendas: selectors.general.agendas(state),
    urgencies: state.urgency.urgency,
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
    newsCoverageStatus: selectors.getNewsCoverageStatus(state),
    contentTypes: selectors.getContentTypes(state),
    genres: state.genres,
    coverageProviders: selectors.general.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    keywords: selectors.getKeywords(state),
    event: selectors.events.planningEditAssociatedEvent(state),
    desk: selectors.getCurrentDeskId(state),
    user: selectors.getCurrentUserId(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
    planningProfile: selectors.forms.planningProfile(state),
    coverageProfile: selectors.forms.coverageProfile(state),
});

export const PlanningEditor = connect(mapStateToProps)(PlanningEditorComponent);
