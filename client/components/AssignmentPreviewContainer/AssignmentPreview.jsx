import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {gettext} from '../../utils';

import {InternalNoteLabel} from '../';
import {Row} from '../UI/Preview';

// eslint-disable-next-line complexity
export const AssignmentPreview = ({
    assignment,
    keywords,
    coverageFormProfile,
    planningFormProfile,
    planningItem,
}) => {
    const planning = get(assignment, 'planning', {});

    const keywordString = get(planning, 'keyword.length', 0) > 0 ?
        planning.keyword
            .map((qcode) => get(keywords.find((k) => k.qcode === qcode), 'name') || qcode)
            .join(', ')
        : '-';

    const placeText = get(planningItem, 'place.length', 0) > 0 ?
        planningItem.place.map((c) => c.name).join(', ') : '-';

    const categoryText = get(planningItem, 'anpa_category.length', 0) > 0 ?
        planningItem.anpa_category.map((c) => c.name).join(', ') : '-';

    const subjectText = get(planningItem, 'subject.length', 0) > 0 ?
        planningItem.subject.map((s) => s.name).join(', ') : '-';

    return (
        <div>
            <Row
                enabled={get(coverageFormProfile, 'editor.slugline.enabled')}
                label={gettext('Slugline')}
                value={planning.slugline || '-'}
                className="slugline"
            />
            <Row
                enabled={get(planningFormProfile, 'editor.place.enabled')}
                label={gettext('Place')}
                value={placeText}
            />
            <Row
                enabled={get(planningFormProfile, 'editor.anpa_category.enabled')}
                label={gettext('Category')}
                value={categoryText}
            />
            <Row
                enabled={get(planningFormProfile, 'editor.subject.enabled')}
                label={gettext('Subject')}
                value={subjectText}
            />
            <Row
                enabled={get(coverageFormProfile, 'editor.genre.enabled')}
                label={gettext('Genre')}
                value={get(planning, 'genre.name') || '-'}
            />
            <Row
                enabled={get(coverageFormProfile, 'editor.keyword.enabled')}
                label={gettext('Keywords')}
                value={keywordString}
            />
            <Row
                enabled={get(coverageFormProfile, 'editor.ednote.enabled')}
                label={gettext('Ed Note')}
                value={planning.ednote || '-'}
            />
            <Row
                enabled={get(coverageFormProfile, 'editor.internal_note.enabled')}
                label={gettext('Internal Note')}
            >
                <InternalNoteLabel item={planning} showTooltip={false}/>
                <p>{planning.internal_note || '-'}</p>
            </Row>
        </div>
    );
};

AssignmentPreview.propTypes = {
    assignment: PropTypes.object,
    keywords: PropTypes.array,
    coverageFormProfile: PropTypes.object,
    planningFormProfile: PropTypes.object,
    planningItem: PropTypes.object,
};
