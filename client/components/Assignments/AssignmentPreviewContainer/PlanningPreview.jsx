import React from 'react';
import PropTypes from 'prop-types';

import {gettext, stringUtils} from '../../../utils';

import {get, keyBy} from 'lodash';
import {UrgencyLabel, Label} from '../../';
import {AgendaNameList} from '../../Agendas';
import {Row} from '../../UI/Preview';

export const PlanningPreview = ({urgencyLabel, item, formProfile, agendas, urgencies}) => {
    const agendaMap = keyBy(agendas, '_id');
    const agendaAssigned = (get(item, 'agendas') || []).map((agendaId) => get(agendaMap, agendaId));

    return (
        <div>
            <Row
                enabled={get(formProfile, 'editor.agendas.enabled')}
                label={gettext('Agenda')}
            >
                {get(agendaAssigned, 'length', 0) > 0 ? (
                    <AgendaNameList agendas={agendaAssigned}/>
                ) : (
                    <p>-</p>
                )}
            </Row>

            <Row
                enabled={get(formProfile, 'editor.slugline.enabled')}
                label={gettext('Slugline')}
                value={item.slugline || '-'}
                className="slugline"
            />

            <Row
                enabled={get(formProfile, 'editor.description.enabled')}
                label={gettext('Description')}
                value={stringUtils.convertNewlineToBreak(item.description_text || '-')}
            />

            <Row
                enabled={get(formProfile, 'editor.ednote.enabled')}
                label={gettext('Ed Note')}
                value={stringUtils.convertNewlineToBreak(item.ednote || '-')}
            />

            <Row
                enabled={get(formProfile, 'editor.internal_note.enabled')}
                label={gettext('Internal Note')}
                value={stringUtils.convertNewlineToBreak(item.internal_note || '-')}
            />

            <Row
                enabled={get(formProfile, 'editor.urgency.enabled')}
                label={gettext('Urgency')}
            >
                {get(item, 'urgency') ? (
                    <UrgencyLabel
                        item={item}
                        urgencies={urgencies}
                        label={urgencyLabel}
                    />
                ) : (
                    <p>-</p>
                )}
            </Row>

            <Row
                enabled={
                    get(formProfile, 'editor.flags.enabled') &&
                    get(item, 'flags.marked_for_not_publication', false)
                }
            >
                <Label text="Not For Publication" iconType="alert"/>
            </Row>
        </div>
    );
};

PlanningPreview.propTypes = {
    urgencyLabel: PropTypes.string,
    item: PropTypes.object,
    formProfile: PropTypes.object,
    agendas: PropTypes.array,
    urgencies: PropTypes.array,
};
