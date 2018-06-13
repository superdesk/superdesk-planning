import React from 'react';
import {Tooltip} from 'react-bootstrap';
import {gettext} from '../utils';

export const spikePlanningTooltip = <Tooltip id="spikePlanningTT">{gettext('Spike planning item')}</Tooltip>;
export const unspikePlanningTooltip = <Tooltip id="unspikePlanningTT">{gettext('Unspike planning item')}</Tooltip>;
export const spikeEventTooltip = <Tooltip id="spikeEventTT">{gettext('Spike event')}</Tooltip>;
export const unspikeEventTooltip = <Tooltip id="unspikeEventTT">{gettext('Unspike event')}</Tooltip>;
export const editAgendaTooltip = <Tooltip id="editAgendaTT">{gettext('Edit Agenda')}</Tooltip>;
export const editTooltip = <Tooltip id="editTT">{gettext('Edit')}</Tooltip>;
export const closeTooltip = <Tooltip id="editTT">{gettext('Close')}</Tooltip>;
export const deleteAgendaTooltip = <Tooltip id="deleteAgendaTT">{gettext('Delete Agenda')}</Tooltip>;
export const repeatingEventTooltip = <Tooltip id="repeatingEventTT">{gettext('Repeating Event')}</Tooltip>;
export const postedStateTooltip = <Tooltip id="pubStatusUsuableTT">{gettext('Posted')}</Tooltip>;
export const scheduledStateTooltip = <Tooltip id="pubStatusUsuableTT">{gettext('Scheduled')}</Tooltip>;
export const withheldStateTooltip = <Tooltip id="pubStatusWithHoldTT">{gettext('The event has been killed.')}</Tooltip>;
