import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';
import {EventUpdateMethodField} from '../fields/index';
import {RelatedEvents, RelatedPlannings} from '../index';
import {gettext} from '../../utils';

export const UpdateMethodSelection = ({
    input,
    showMethodSelection,
    updateMethodLabel,
    relatedPlannings,
    relatedEvents,
    dateFormat,
    action,
    handleSubmit,
    showSpace,
    readOnly,
}) => (
    <div>
        { showMethodSelection &&
            <div className="MethodSelect">
                <p><strong>{gettext('This event is a recurring event!')}</strong></p>
                <EventUpdateMethodField
                    input={input}
                    readOnly={readOnly}
                    label={updateMethodLabel}/>
            </div>
        }

        { relatedPlannings.length > 0 && (
            <div>
                <div className="sd-alert sd-alert--hollow sd-alert--alert">
                    <strong>{gettext('This will also {action} the following planning items')}</strong>
                    <RelatedPlannings
                        plannings={relatedPlannings}
                        openPlanningItem={true}
                        short={true} />
                </div>
            </div>
        )}

        { showMethodSelection && relatedEvents.length > 0 && (
            <div className="sd-alert sd-alert--hollow sd-alert--alert">
                <strong>{gettext('This will also {action} the following events')}</strong>
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
    input: PropTypes.object.isRequired,
    showMethodSelection: PropTypes.bool,
    updateMethodLabel: PropTypes.string,
    relatedPlannings: PropTypes.array,
    relatedEvents: PropTypes.array,
    dateFormat: PropTypes.string,
    action: PropTypes.string,
    handleSubmit: PropTypes.func.isRequired,
    showSpace: PropTypes.bool,
    readOnly: PropTypes.bool,
};
