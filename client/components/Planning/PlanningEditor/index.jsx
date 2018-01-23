import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, cloneDeep, remove as _remove} from 'lodash';
import * as selectors from '../../../selectors';

import {isItemPublic, gettext, getItemInArrayById, planningUtils} from '../../../utils';

import {ContentBlock} from '../../UI/SidePanel';
import {
    Row,
    TextInput,
    TextAreaInput,
    SelectMetaTermsInput,
    ToggleInput,
    ColouredValueInput,
} from '../../UI/Form';
import {ToggleBox} from '../../UI';

import {PlanningEditorHeader} from './PlanningEditorHeader';
import {CoverageArrayInput} from '../../Coverages';
import {EventMetadata} from '../../Events';
import {ITEM_TYPE} from '../../../constants';
import {stripHtmlRaw} from 'superdesk-core/scripts/apps/authoring/authoring/helpers';

import {PLANNING} from '../../../constants';

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
        if (!this.props.addNewsItemToPlanning) {
            return;
        }

        // If we are creating a new planning item for 'add-to-planning'
        if (!get(this.props, 'item._id')) {
            const newPlanning = this.createNewPlanningFromNewsItem();

            this.props.onChangeHandler(null, newPlanning);
        } else if (get(this.props, 'item._addNewCoverage')) {
            let dupItem = cloneDeep(this.props.item);

            dupItem.coverages.push(planningUtils.createCoverageFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                this.props.user,
                this.props.contentTypes));

            delete dupItem._addedNewCoverage;

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
        if (field === 'agendas') {
            this.props.onChangeHandler(field, value.map((agenda) => agenda._id));
        } else if (field === 'urgency') {
            this.props.onChangeHandler(field, get(value, 'qcode') || null);
        } else if (field === 'coverages' && this.props.addNewsItemToPlanning) {
            value[value.length - 1] = planningUtils.createCoverageFromNewsItem(
                this.props.addNewsItemToPlanning,
                this.props.newsCoverageStatus,
                this.props.desk,
                this.props.user,
                this.props.contentTypes);
            this.props.onChangeHandler(field, value);
        } else {
            this.props.onChangeHandler(field, value);
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
        } = this.props;

        const isPublic = isItemPublic(item);

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

        return (
            <div className="planning-editor">
                <PlanningEditorHeader
                    item={diff}
                    users={users}
                />

                <ContentBlock>
                    <Row>
                        <TextInput
                            field="slugline"
                            label="Slugline"
                            value={get(diff, 'slugline', '')}
                            onChange={this.onChange}
                            refNode={(node) => this.dom.slugline = node}
                            readOnly={updatedReadOnly}
                        />
                    </Row>

                    <Row>
                        <TextAreaInput
                            field="description_text"
                            label="Description"
                            value={get(diff, 'description_text', '')}
                            onChange={this.onChange}
                            readOnly={updatedReadOnly}
                        />
                    </Row>

                    <Row>
                        <TextAreaInput
                            field="internal_note"
                            label="Internal Note"
                            value={get(diff, 'internal_note', '')}
                            onChange={this.onChange}
                            readOnly={updatedReadOnly}
                        />
                    </Row>

                    <Row>
                        <SelectMetaTermsInput
                            field="agendas"
                            label="Agenda"
                            value={agendaValues}
                            onChange={this.onChange}
                            options={enabledAgendas}
                            valueKey="_id"
                            readOnly={updatedReadOnly}
                        />
                    </Row>

                    <ToggleBox title="Details" isOpen={false} scrollInView={true}>
                        <Row>
                            <TextAreaInput
                                field="ednote"
                                label="Ed Note"
                                value={get(diff, 'ednote', '')}
                                onChange={this.onChange}
                                readOnly={updatedReadOnly}
                            />
                        </Row>

                        <Row>
                            <SelectMetaTermsInput
                                field="anpa_category"
                                label="Category"
                                value={get(diff, 'anpa_category', [])}
                                onChange={this.onChange}
                                options={categories}
                                readOnly={updatedReadOnly}
                            />
                        </Row>

                        <Row>
                            <SelectMetaTermsInput
                                field="subject"
                                label="Subject"
                                value={get(diff, 'subject', [])}
                                onChange={this.onChange}
                                options={subjects}
                                readOnly={updatedReadOnly}
                            />
                        </Row>

                        <Row>
                            <ColouredValueInput
                                field="urgency"
                                label="Urgency"
                                value={urgency}
                                onChange={this.onChange}
                                readOnly={updatedReadOnly}
                                options={urgencies}
                                iconName="urgency-label"
                                labelLeft={true}
                            />
                        </Row>

                        <Row>
                            <ToggleInput
                                field="flags.marked_for_not_publication"
                                label="Not for Publication"
                                value={get(diff, 'flags.marked_for_not_publication')}
                                onChange={this.onChange}
                                readOnly={updatedReadOnly || isPublic}
                                labelLeft={true}
                            />
                        </Row>
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

                <CoverageArrayInput
                    value={get(diff, 'coverages', [])}
                    onChange={this.onChange}
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
});

export const PlanningEditor = connect(mapStateToProps)(PlanningEditorComponent);
