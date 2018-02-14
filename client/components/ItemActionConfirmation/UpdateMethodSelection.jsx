import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';
import {EventUpdateMethodInput} from '../Events';
import {RelatedEvents, RelatedPlannings} from '../index';
import {gettext} from '../../utils';

export const UpdateMethodSelection = ({
    field,
    value,
    onChange,
    showMethodSelection,
    updateMethodLabel,
    relatedPlannings,
    relatedEvents,
    dateFormat,
    action,
    showSpace,
    readOnly,
}) => (
    <div>
        { showMethodSelection &&
            <div className="MethodSelect">
                <p><strong>{gettext('This event is a recurring event!')}</strong></p>
                <EventUpdateMethodInput
                    field={field}
                    value={value}
                    onChange={onChange}
                    disabled={readOnly}
                    label={updateMethodLabel}/>
            </div>
        }

        { relatedPlannings.length > 0 && (
            <div>
                <div className="sd-alert sd-alert--hollow sd-alert--alert">
                    <strong>{gettext('This will also {{action}} the following planning items', {action})}</strong>
                    <RelatedPlannings
                        plannings={relatedPlannings}
                        openPlanningItem={true}
                        short={true} />
                </div>
            </div>
        )}

        { showMethodSelection && relatedEvents.length > 0 && (
            <div className="sd-alert sd-alert--hollow sd-alert--alert">
                <strong>{gettext('This will also {{action}} the following events', {action})}</strong>
                <RelatedEvents
                    events={relatedEvents}
                    dateFormat={dateFormat} />
            </div>
        )}

        { showSpace && showMethodSelection && relatedPlannings.length === 0 && relatedEvents.length === 0 && (
            <div className="spacing" />
        )}
    </div>
);

UpdateMethodSelection.defaultProps = {
    relatedPlannings: [],
    relatedEvents: [],
    action: 'affect',
    showSpace: true,
    readOnly: false,
};

UpdateMethodSelection.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    showMethodSelection: PropTypes.bool,
    updateMethodLabel: PropTypes.string,
    relatedPlannings: PropTypes.array,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string,
    action: PropTypes.string,
    showSpace: PropTypes.bool,
    readOnly: PropTypes.bool,
};
