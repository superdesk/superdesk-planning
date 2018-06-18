import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, remove as _remove, some, isEqual} from 'lodash';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {
    gettext,
    getItemInArrayById,
    planningUtils,
    isSameItemId,
    editorMenuUtils,
    isExistingItem,
} from '../../../utils';

import {ContentBlock} from '../../UI/SidePanel';
import {
    TextInput,
    TextAreaInput,
    SelectMetaTermsInput,
    ToggleInput,
    ColouredValueInput,
    Field,
    DateTimeInput,
} from '../../UI/Form';
import {ToggleBox} from '../../UI';

import {PlanningEditorHeader} from './PlanningEditorHeader';
import {CoverageArrayInput} from '../../Coverages';
import {EventMetadata} from '../../Events';
import {PLANNING, WORKFLOW_STATE, COVERAGES} from '../../../constants';
import CustomVocabulariesFields from '../../CustomVocabulariesFields';

const toggleDetails = [
    'ednote',
    'anpa_category',
    'subject',
];

export class PlanningEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {
            slugline: null,
            top: null,
            details: null,
        };
        this.onChange = this.onChange.bind(this);
        this.onDuplicateCoverage = this.onDuplicateCoverage.bind(this);
        this.onCancelCoverage = this.onCancelCoverage.bind(this);
        this.onPlanningDateChange = this.onPlanningDateChange.bind(this);
        this.onAddCoverageToWorkflow = this.onAddCoverageToWorkflow.bind(this);
        this.onRemoveAssignment = this.onRemoveAssignment.bind(this);
    }

    componentWillMount() {
        if (this.props.addNewsItemToPlanning) {
            // In add-to-planning modal
            this.handleAddToPlanningLoading();
        }
    }

    handleAddToPlanningLoading() {
        if (this.props.itemExists && !planningUtils.isLockedForAddToPlanning(this.props.item)) {
            return;
        }

        // If we are creating a new planning item for 'add-to-planning'
        if (!this.props.itemExists) {
            let newPlanning = planningUtils.createNewPlanningFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                get(this.props, 'addNewsItemToPlanning.version_creator'),
                this.props.contentTypes);

            this.fillCurrentAgenda(newPlanning);
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

    fillCurrentAgenda(item) {
        // set the current agenda if agenda is enabled
        if (get(this.props, 'currentAgenda.is_enabled')) {
            item.agendas = [this.props.currentAgenda._id];
        }
    }

    onDuplicateCoverage(coverage, duplicateAs) {
        let diffCoverages = cloneDeep(this.props.diff.coverages);
        let newCoverage = cloneDeep(coverage);

        newCoverage.news_coverage_status = {qcode: 'ncostat:int'};
        newCoverage.workflow_status = WORKFLOW_STATE.DRAFT;
        if (coverage.workflow_status === WORKFLOW_STATE.CANCELLED) {
            newCoverage.planning.internal_note = '';
            newCoverage.planning.ednote = '';
        }

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

            coverageToUpdate.news_coverage_status = PLANNING.NEWS_COVERAGE_CANCELLED_STATUS;
            coverageToUpdate.planning = {
                ...coverageToUpdate.planning,
                internal_note: `------------------------------------------------------------
        Coverage cancelled
        `,
                ednote: `------------------------------------------------------------
        Coverage cancelled
        `,
            };
            coverageToUpdate.workflow_status = WORKFLOW_STATE.CANCELLED;
        }

        this.onChange('coverages', coverages);
    }

    onPartialSave(coverage, index, action) {
        const updates = cloneDeep(get(this.props, 'item'));

        updates.coverages[index] = coverage;

        // Let the ItemEditor component know we're about to perform a partial save
        // This is way the 'save' buttons are disabled while we perform our partial save
        if (!this.props.startPartialSave(updates)) {
            return;
        }

        let partialSaveAction;

        if (action === COVERAGES.PARTIAL_SAVE.ADD_TO_WORKFLOW) {
            partialSaveAction = this.props.onAddCoverageToWorkflow;
        } else if (action === COVERAGES.PARTIAL_SAVE.REMOVE_ASSIGNMENT) {
            partialSaveAction = this.props.removeAssignment;
        }

        partialSaveAction(this.props.item, coverage, index)
            .then((updates) => {
            // Make sure the coverage in our AutoSave is updated with the new workflow states
            // Otherwise this will cause the form to stay dirty when the initialValues change
                planningUtils.modifyCoverageForClient(updates.coverages[index]);
                this.onChange(`coverages[${index}]`, updates.coverages[index]);
            });
    }

    onAddCoverageToWorkflow(coverage, index) {
        this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.ADD_TO_WORKFLOW);
    }

    onRemoveAssignment(coverage, index) {
        if (!get(coverage, 'assigned_to.assignment_id')) {
            // Non existing assignment, just remove from autosave
            this.onChange('coverages[' + index + '].assigned_to', {});
        } else {
            delete coverage.assigned_to;
            this.onPartialSave(coverage, index, COVERAGES.PARTIAL_SAVE.REMOVE_ASSIGNMENT);
        }
    }

    onChange(field, value) {
        let valueToUpdate = value;

        if (field === 'agendas') {
            valueToUpdate = value.map((agenda) => agenda._id);
        }

        if (field === 'urgency') {
            valueToUpdate = get(value, 'qcode', null);
        }

        if (field.match(/coverages\[/)) {
            const {newsCoverageStatus} = this.props;

            // If there is an assignment and coverage status not planned,
            // change it to 'planned'
            if (newsCoverageStatus.length > 0
                && get(value, 'news_coverage_status.qcode') !== newsCoverageStatus[0].qcode
                && !!get(value, 'assigned_to.desk')
            ) {
                valueToUpdate = {
                    ...value,
                    news_coverage_status: this.props.newsCoverageStatus[0],
                };
            }
        }

        this.props.onChangeHandler(field, valueToUpdate);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.addNewsItemToPlanning && !isExistingItem(this.props.item) &&
            get(nextProps, 'diff.coverages.length', 0) === 0) {
            this.handleAddToPlanningLoading();
            return;
        }

        if (isSameItemId(nextProps.item, this.props.item)) {
            // if the assignment associated with the planning item are modified
            const storedCoverages = get(nextProps, 'item.coverages') || [];
            const diffCoverages = get(this.props, 'diff.coverages') || [];

            if (get(storedCoverages, 'length', 0) > 0) {
                storedCoverages.forEach((coverage) => {
                    // Push notification updates from 'assignment' workflow changes
                    if (!planningUtils.isCoverageDraft(coverage)) {
                        const index = diffCoverages.findIndex((c) => c.coverage_id === coverage.coverage_id);

                        if (index >= 0) {
                            const diffCoverage = diffCoverages[index];

                            if (diffCoverage && !isEqual(diffCoverage.assigned_to, coverage.assigned_to)) {
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

    componentDidUpdate(prevProps) {
        // If item changed or it got locked for editing
        if (!isSameItemId(prevProps.item, this.props.item) ||
            (!get(prevProps, 'diff.lock_user') && get(this.props, 'diff.lock_user'))) {
            this.dom.slugline.focus();
        }

        if (get(prevProps, 'navigation.scrollToViewItem') !== get(this.props, 'navigation.scrollToViewItem')) {
            // scroll to new position
            if (editorMenuUtils.forceScroll(this.props.navigation, 'planning')) {
                this.dom.top.scrollIntoView();
            }
        }
    }

    onPlanningDateChange(field, value) {
        this.onChange('planning_date', value);
    }

    render() {
        const {
            item,
            itemExists,
            diff,
            event,
            eventModal,
            locators,
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
            submitFailed,
            dirty,
            errors,
            planningProfile,
            coverageProfile,
            lockedItems,
            navigation,
            customVocabularies,
        } = this.props;

        const agendaValues = cloneDeep(get(diff, 'agendas', [])
            .map((agendaId) => agendas.find((a) => a._id === agendaId)));

        agendaValues.forEach((agenda) => {
            agenda.name = planningUtils.formatAgendaName(agenda);
        });

        const enabledAgendas = agendas.filter((agenda) => get(agenda, 'is_enabled', true));

        const urgencyQcode = get(diff, 'urgency') || null;
        const urgency = getItemInArrayById(urgencies, urgencyQcode, 'qcode');

        // Read-only if
        // 1 - it is supposed to be readOnly by parent props
        // 2 - for add-to-planning and existing planning item
        const updatedReadOnly = readOnly || (!!addNewsItemToPlanning && itemExists);

        let maxCoverageCount = 0;

        if (addNewsItemToPlanning) {
            if (!itemExists) {
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
            showErrors: submitFailed,
        };

        const detailsErrored = some(toggleDetails, (field) => !!get(errors, field));
        const onFocusPlanning = editorMenuUtils.onItemFocus(this.props.navigation, 'planning');
        const onFocusDetails = editorMenuUtils.onItemFocus(this.props.navigation, 'details');
        const associatedEvent = onFocusPlanning ? eventModal : event;

        return (
            <div className="planning-editor" ref={(node) => this.dom.top = node}>
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
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={TextInput}
                        field="name"
                        label={gettext('Name')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={DateTimeInput}
                        field="planning_date"
                        label={gettext('Planning Date')}
                        timeFormat={timeFormat}
                        dateFormat={dateFormat}
                        defaultValue={null}
                        row={false}
                        {...fieldProps}
                        onChange={this.onPlanningDateChange}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={TextAreaInput}
                        field="description_text"
                        label={gettext('Description')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={TextAreaInput}
                        field="internal_note"
                        label={gettext('Internal Note')}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <Field
                        component={SelectMetaTermsInput}
                        field="agendas"
                        label={gettext('Agenda')}
                        options={enabledAgendas}
                        valueKey="_id"
                        value={agendaValues}
                        {...fieldProps}
                        onFocus={onFocusPlanning}
                    />

                    <ToggleBox
                        title={gettext('Details')}
                        isOpen={editorMenuUtils.isOpen(navigation, 'details')}
                        onClose={editorMenuUtils.onItemClose(navigation, 'details')}
                        onOpen={editorMenuUtils.onItemOpen(navigation, 'details')}
                        forceScroll={editorMenuUtils.forceScroll(navigation, 'details')}
                        scrollInView={true}
                        invalid={detailsErrored && (dirty || submitFailed)}
                        paddingTop={!!onFocusDetails}
                    >
                        <Field
                            component={TextAreaInput}
                            field="ednote"
                            label={gettext('Ed Note')}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="place"
                            label={gettext('Place')}
                            options={locators}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        <Field
                            component={SelectMetaTermsInput}
                            field="anpa_category"
                            label={gettext('ANPA Category')}
                            options={categories}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        {!customVocabularies.length && <Field
                            component={SelectMetaTermsInput}
                            field="subject"
                            label={gettext('Subject')}
                            options={subjects}
                            defaultValue={[]}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />}

                        <CustomVocabulariesFields
                            customVocabularies={customVocabularies}
                            fieldProps={fieldProps}
                            onFocusDefails={onFocusDetails}
                        />

                        <Field
                            component={ColouredValueInput}
                            field="urgency"
                            label={gettext('Urgency')}
                            value={urgency}
                            options={urgencies}
                            iconName="urgency-label"
                            defaultValue={null}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />

                        {!get(item, 'pubstatus') && <Field
                            component={ToggleInput}
                            field="flags.marked_for_not_publication"
                            label={gettext('Not for Publication')}
                            labelLeft={true}
                            defaultValue={false}
                            {...fieldProps}
                            onFocus={onFocusDetails}
                        />}
                    </ToggleBox>
                </ContentBlock>

                {associatedEvent && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Associated Event')}
                    </h3>
                )}

                {associatedEvent && (
                    <ContentBlock>
                        <EventMetadata
                            event={associatedEvent}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                            lockedItems={lockedItems}
                            navigation={navigation}
                            tabEnabled
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
                    onAddCoverageToWorkflow={this.onAddCoverageToWorkflow}
                    onRemoveAssignment={this.onRemoveAssignment}
                    readOnly={readOnly}
                    maxCoverageCount={maxCoverageCount}
                    addOnly={!!addNewsItemToPlanning}
                    addNewsItemToPlanning={addNewsItemToPlanning}
                    originalCount={get(item, 'coverages', []).length}
                    defaultValue={[]}
                    defaultGenre={this.props.defaultGenre}
                    {...fieldProps}
                    formProfile={coverageProfile}
                    navigation={navigation}
                />
            </div>
        );
    }
}

PlanningEditorComponent.propTypes = {
    item: PropTypes.object,
    diff: PropTypes.object,
    itemExists: PropTypes.bool,
    event: PropTypes.object,
    onChangeHandler: PropTypes.func,
    locators: PropTypes.array,
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
    errors: PropTypes.object,
    submitFailed: PropTypes.bool,
    dirty: PropTypes.bool,
    planningProfile: PropTypes.object,
    coverageProfile: PropTypes.object,
    defaultGenre: PropTypes.object,
    currentAgenda: PropTypes.object,
    lockedItems: PropTypes.object,
    onAddCoverageToWorkflow: PropTypes.func,
    startPartialSave: PropTypes.func,
    removeAssignment: PropTypes.func,
    navigation: PropTypes.object,
    eventModal: PropTypes.object,
    customVocabularies: PropTypes.array,
};

PlanningEditorComponent.defaultProps = {
    readOnly: false,
    navigation: {},
};

const mapStateToProps = (state) => ({
    locators: selectors.vocabs.locators(state),
    categories: selectors.vocabs.categories(state),
    subjects: selectors.vocabs.subjects(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    agendas: selectors.general.agendas(state),
    urgencies: state.urgency.urgency,
    timeFormat: selectors.config.getTimeFormat(state),
    dateFormat: selectors.config.getDateFormat(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    genres: state.genres,
    coverageProviders: selectors.vocabs.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    keywords: selectors.general.keywords(state),
    event: selectors.events.planningEditAssociatedEvent(state),
    eventModal: selectors.events.planningEditAssociatedEventModal(state),
    desk: selectors.general.currentDeskId(state),
    user: selectors.general.currentUserId(state),
    planningProfile: selectors.forms.planningProfile(state),
    coverageProfile: selectors.forms.coverageProfile(state),
    defaultGenre: selectors.config.getDefaultGenre(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    lockedItems: selectors.locks.getLockedItems(state),
    customVocabularies: state.customVocabularies,
});

const mapDispatchToProps = (dispatch) => ({
    onAddCoverageToWorkflow: (planning, coverage, index) =>
        dispatch(actions.planning.ui.addCoverageToWorkflow(planning, coverage, index)),
    removeAssignment: (planning, coverage, index) =>
        dispatch(actions.planning.ui.removeAssignment(planning, coverage, index)),
});

export const PlanningEditor = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningEditorComponent);
