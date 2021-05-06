import {superdeskApi} from '../superdeskApi';

export const TOOLTIPS = {
    editAgenda: 'Edit Agenda',
    edit: 'Edit',
    close: 'Close',
    deleteAgenda: 'Delete Agenda',
    delete: 'Delete',
    postedState: 'Posted',
    withheldState: 'The event has been killed',
    scheduledState: 'Scheduled',
    notForPublication: 'Not For Publication',
    editModal: 'Edit in popup',
    minimize: 'Minimise',
    actions: 'Actions',
    editFilter: 'Edit Filter',
    deleteFilter: 'Delete Filter',
};

export function assignTooltipConstantTranslations() {
    const {gettext} = superdeskApi.localization;

    TOOLTIPS.editAgenda = gettext('Edit Agenda');
    TOOLTIPS.edit = gettext('Edit');
    TOOLTIPS.close = gettext('Close');
    TOOLTIPS.deleteAgenda = gettext('Delete Agenda');
    TOOLTIPS.delete = gettext('Delete');
    TOOLTIPS.postedState = gettext('Posted');
    TOOLTIPS.withheldState = gettext('The event has been killed');
    TOOLTIPS.scheduledState = gettext('Scheduled');
    TOOLTIPS.notForPublication = gettext('Not For Publication');
    TOOLTIPS.editModal = gettext('Edit in popup');
    TOOLTIPS.minimize = gettext('Minimise');
    TOOLTIPS.actions = gettext('Actions');
    TOOLTIPS.editFilter = gettext('Edit Filter');
    TOOLTIPS.deleteFilter = gettext('Delete Filter');
}
