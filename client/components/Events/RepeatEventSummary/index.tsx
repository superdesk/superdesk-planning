import React from 'react';
import PropTypes from 'prop-types';
import {gettext, eventUtils} from '../../../utils';

import {Label, LineInput} from '../../UI/Form';

export const RepeatEventSummary = ({
    schedule,
    noMargin,
    forUpdating,
}) => (
    <LineInput noMargin={noMargin}>
        <Label
            text={forUpdating ? gettext('Current Repeat Summary') :
                gettext('Repeat Summary')}
            row={true}
            light={true}
        />
        <p className="sd-text__strong">{eventUtils.getRepeatSummaryForEvent(schedule)}</p>
    </LineInput>
);

RepeatEventSummary.propTypes = {
    schedule: PropTypes.object,
    noMargin: PropTypes.bool,
    forUpdating: PropTypes.bool,
};

RepeatEventSummary.defaultProps = {
    noMargin: false,
};
