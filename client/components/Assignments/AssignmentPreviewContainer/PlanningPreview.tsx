import React from 'react';
import PropTypes from 'prop-types';

import {getUserInterfaceLanguage} from 'appConfig';

import {gettext, stringUtils, getItemInArrayById} from '../../../utils';

import {get, keyBy} from 'lodash';
import {Label} from '../../';
import {ColouredValueInput} from '../../UI/Form';
import {AgendaNameList} from '../../Agendas';
import {Row} from '../../UI/Preview';

export const PlanningPreview = ({item, formProfile, agendas, urgencies}) => {
    const agendaMap = keyBy(agendas, '_id');
    const agendaAssigned = (get(item, 'agendas') || []).map((agendaId) => get(agendaMap, agendaId));
    const urgency = getItemInArrayById(urgencies, item.urgency, 'qcode');

    return (
        <div>
            <Row
                enabled={get(formProfile, 'editor.agendas.enabled')}
                label={gettext('Agenda')}
            >
                {get(agendaAssigned, 'length', 0) > 0 ? (
                    <AgendaNameList agendas={agendaAssigned} />
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
                enabled={get(formProfile, 'editor.headline.enabled')}
                label={gettext('Headline')}
                value={item.headline || '-'}
            />

            <Row
                enabled={get(formProfile, 'editor.name.enabled')}
                label={gettext('Name')}
                value={item.name || '-'}
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

            <Row enabled={get(formProfile, 'editor.urgency.enabled')}>
                <ColouredValueInput
                    value={urgency}
                    label={gettext('Urgency')}
                    iconName="urgency-label"
                    readOnly={true}
                    options={urgencies}
                    row={true}
                    language={getUserInterfaceLanguage()}
                    borderBottom={false}
                    noValueString={'-'}
                />
            </Row>

            <Row
                enabled={
                    get(formProfile, 'editor.flags.enabled') &&
                    get(item, 'flags.marked_for_not_publication', false)
                }
            >
                <Label text="Not For Publication" iconType="alert" />
            </Row>
        </div>
    );
};

PlanningPreview.propTypes = {
    item: PropTypes.object,
    formProfile: PropTypes.object,
    agendas: PropTypes.array,
    urgencies: PropTypes.array,
};
