import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext, getCreator, getItemInArrayById, getDateTimeString} from '../../utils';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {get} from 'lodash';
import {Row} from '../UI/Preview';
import {
    AuditInformation,
    StateLabel,
} from '../index';
import {ToggleBox} from '../UI';
import {ColouredValueInput} from '../UI/Form';
import {CoveragePreview} from '../Coverages';
import {ContentBlock} from '../UI/SidePanel';
import {EventMetadata} from '../Events';
import {AgendaNameList} from '../Agendas';
import CustomVocabulariesPreview from '../CustomVocabulariesPreview';

export class PlanningPreviewContentComponent extends React.Component {
    render() {
        const {item,
            users,
            formProfile,
            agendas,
            event,
            dateFormat,
            timeFormat,
            desks,
            newsCoverageStatus,
            urgencies,
            streetMapUrl,
            onEditEvent,
            lockedItems,
            customVocabularies,
            inner,
            noPadding,
        } = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);

        const agendaList = get(item, 'agendas.length', 0) === 0 ? [] :
            item.agendas.map((a) => getItemInArrayById(agendas, a));
        const placeText = get(item, 'place.length', 0) === 0 ? '' :
            item.place.map((c) => c.name).join(', ');
        const categoryText = get(item, 'anpa_category.length', 0) === 0 ? '' :
            item.anpa_category.map((c) => c.name).join(', ');
        const subjectText = get(item, 'subject.length', 0) === 0 ? '' :
            item.subject.map((s) => s.name).join(', ');

        const hasCoverage = get(item, 'coverages.length', 0) > 0;
        const urgency = getItemInArrayById(urgencies, item.urgency, 'qcode');

        return (
            <ContentBlock noPadding={noPadding}>
                <div className="side-panel__content-block--flex">
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                        <AuditInformation
                            createdBy={createdBy}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate}
                        />
                    </div>
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--right">
                        <StateLabel
                            item={item}
                            verbose={true}
                            withExpiredStatus={true}
                        />
                    </div>
                </div>
                <Row
                    enabled={get(formProfile, 'planning.editor.slugline.enabled')}
                    label={gettext('Slugline')}
                    value={item.slugline || ''}
                    className="slugline"
                />
                <Row
                    enabled={get(formProfile, 'planning.editor.headline.enabled')}
                    label={gettext('headline')}
                    value={item.headline || ''}
                />
                <Row
                    enabled={get(formProfile, 'planning.editor.planning_date.enabled')}
                    label={gettext('Planning Date')}
                    value={getDateTimeString(item.planning_date, dateFormat, timeFormat) || ''}
                />
                <Row
                    enabled={get(formProfile, 'planning.editor.description_text.enabled')}
                    label={gettext('Description')}
                    value={item.description_text || ''}
                />
                <Row
                    enabled={get(formProfile, 'planning.editor.internal_note.enabled')}
                    label={gettext('Internal Note')}
                    value={item.internal_note || ''}
                />
                <Row
                    enabled={get(formProfile, 'planning.editor.agendas.enabled')}
                    label={gettext('Agenda')}
                    value={<AgendaNameList agendas={agendaList}/>}
                />
                <ToggleBox title={gettext('Details')} isOpen={false}>
                    <Row
                        enabled={get(formProfile, 'planning.editor.ednote.enabled')}
                        label={gettext('Ed Note')}
                        value={item.ednote || ''}
                    />
                    <Row
                        enabled={get(formProfile, 'planning.editor.place.enabled')}
                        label={gettext('Place')}
                        value={placeText || ''}
                    />
                    <Row
                        enabled={get(formProfile, 'planning.editor.anpa_category.enabled')}
                        label={gettext('ANPA Category')}
                        value={categoryText || ''}
                    />
                    {!customVocabularies.length && (
                        <Row
                            enabled={get(formProfile, 'planning.editor.subject.enabled')}
                            label={gettext('Subject')}
                            value={subjectText || ''}
                        />
                    )}
                    <CustomVocabulariesPreview customVocabularies={customVocabularies} item={item} />
                    <Row enabled={get(formProfile, 'planning.editor.urgency.enabled')}>
                        <ColouredValueInput
                            value={urgency}
                            label="Urgency"
                            iconName="urgency-label"
                            readOnly={true}
                            options={urgencies}
                            row={true}
                            borderBottom={false}
                        />
                    </Row>
                    <Row enabled={
                        get(formProfile, 'planning.editor.flags') &&
                        get(item, 'flags.marked_for_not_publication', false)
                    }>
                        <span className="state-label not-for-publication">{gettext('Not for Publication')}</span>
                    </Row>
                </ToggleBox>
                {event && <h3 className="side-panel__heading--big">{gettext('Associated Event')}</h3>}
                {event && <EventMetadata event={event}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    dateOnly={true}
                    streetMapUrl={streetMapUrl}
                    onEditEvent={onEditEvent.bind(null, event)}
                    lockedItems={lockedItems}
                />}
                {hasCoverage &&
                    (<h3 className="side-panel__heading--big">{gettext('Coverages')}</h3>)}
                {hasCoverage &&
                    (item.coverages.map((c, index) => <CoveragePreview
                        key={index}
                        coverage={c}
                        users= {users}
                        desks= {desks}
                        newsCoverageStatus={newsCoverageStatus}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                        formProfile={formProfile.coverage}
                        inner={inner} />)
                    )
                }
            </ContentBlock>
        );
    }
}

PlanningPreviewContentComponent.propTypes = {
    item: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    agendas: PropTypes.array,
    session: PropTypes.object,
    lockedItems: PropTypes.object,
    formProfile: PropTypes.object,
    event: PropTypes.object,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    newsCoverageStatus: PropTypes.array,
    urgencies: PropTypes.array,
    streetMapUrl: PropTypes.string,
    onEditEvent: PropTypes.func,
    customVocabularies: PropTypes.array,
    inner: PropTypes.bool,
    noPadding: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.planning.currentPlanning(state) || ownProps.item,
    event: selectors.events.planningWithEventDetails(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    lockedItems: selectors.locks.getLockedItems(state),
    agendas: selectors.general.agendas(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    formProfile: selectors.forms.profiles(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state) || ownProps.item.coverages.news_coverage_status,
    urgencies: selectors.getUrgencies(state),
    streetMapUrl: selectors.config.getStreetMapUrl(state),
    customVocabularies: state.customVocabularies,
});

const mapDispatchToProps = (dispatch) => ({onEditEvent: (event) => (dispatch(actions.main.lockAndEdit(event)))});


export const PlanningPreviewContent = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewContentComponent);
