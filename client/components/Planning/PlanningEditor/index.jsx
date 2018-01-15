import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import * as selectors from '../../../selectors';

import {isItemPublic, gettext, getItemInArrayById} from '../../../utils';

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

export class PlanningEditorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.dom = {slugline: null};
        this.onChange = this.onChange.bind(this);
    }

    onChange(field, value) {
        if (field === 'agendas') {
            this.props.onChangeHandler(field, value.map((agenda) => agenda._id));
        } else if (field === 'urgency') {
            this.props.onChangeHandler(field, get(value, 'qcode') || null);
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
        } = this.props;

        const isPublic = isItemPublic(item);

        const agendaValues = get(diff, 'agendas', [])
            .map((agendaId) => agendas.find((a) => a._id === agendaId));

        const enabledAgendas = agendas.filter((agenda) => get(agenda, 'is_enabled', true));

        const urgencyQcode = get(diff, 'urgency') || null;
        const urgency = getItemInArrayById(urgencies, urgencyQcode, 'qcode');

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
                            readOnly={readOnly}
                        />
                    </Row>

                    <Row>
                        <TextAreaInput
                            field="description_text"
                            label="Description"
                            value={get(diff, 'description_text', '')}
                            onChange={this.onChange}
                            readOnly={readOnly}
                        />
                    </Row>

                    <Row>
                        <TextAreaInput
                            field="internal_note"
                            label="Internal Note"
                            value={get(diff, 'internal_note', '')}
                            onChange={this.onChange}
                            readOnly={readOnly}
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
                            readOnly={readOnly}
                        />
                    </Row>

                    <ToggleBox title="Details" isOpen={false} scrollInView={true}>
                        <Row>
                            <TextAreaInput
                                field="ednote"
                                label="Ed Note"
                                value={get(diff, 'ednote', '')}
                                onChange={this.onChange}
                                readOnly={readOnly}
                            />
                        </Row>

                        <Row>
                            <SelectMetaTermsInput
                                field="anpa_category"
                                label="Category"
                                value={get(diff, 'anpa_category', [])}
                                onChange={this.onChange}
                                options={categories}
                                readOnly={readOnly}
                            />
                        </Row>

                        <Row>
                            <SelectMetaTermsInput
                                field="subject"
                                label="Subject"
                                value={get(diff, 'subject', [])}
                                onChange={this.onChange}
                                options={subjects}
                                readOnly={readOnly}
                            />
                        </Row>

                        <Row>
                            <ColouredValueInput
                                field="urgency"
                                label="Urgency"
                                value={urgency}
                                onChange={this.onChange}
                                readOnly={readOnly}
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
                                readOnly={readOnly || isPublic}
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
                    readOnly={readOnly}
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
});

export const PlanningEditor = connect(mapStateToProps)(PlanningEditorComponent);
