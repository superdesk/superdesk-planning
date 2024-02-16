import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {ICalendar, IEventTemplate} from '../../interfaces';

import {PRIVILEGES} from '../../constants';
import * as actions from '../../actions';
import {eventTemplates, getRecentTemplatesSelector} from '../../selectors/events';
import {Dropdown, IDropdownItem} from '../UI/SubNav';
import {showModal} from '@superdesk/common';
import PlanningTemplatesModal from '../PlanningTemplatesModal/PlanningTemplatesModal';

interface IProps {
    addEvent(): void;
    addPlanning(): void;
    createPlanningOnly: boolean;
    privileges: {[key: string]: number};
    createEventFromTemplate(template: IEventTemplate): void;
    eventTemplates: Array<IEventTemplate>;
    calendars: Array<ICalendar>;
    recentTemplates?: Array<IEventTemplate>;
}

const MORE_TEMPLATES_THRESHOLD = 5;

class CreateNewSubnavDropdownFn extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            addEvent,
            addPlanning,
            createPlanningOnly,
            privileges,
            createEventFromTemplate,
            recentTemplates,
            eventTemplates
        } = this.props;
        const items: Array<IDropdownItem> = [];

        if (privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
            items.push({
                label: gettext('Planning Item'),
                icon: 'icon-calendar icon--blue',
                group: gettext('Create new'),
                action: addPlanning,
                id: 'create_planning',
            });
        }

        if (!createPlanningOnly && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]) {
            items.push({
                label: gettext('Event'),
                icon: 'icon-event icon--blue',
                group: gettext('Create new'),
                action: addEvent,
                id: 'create_event',
            });

            /**
             * Sort the templates by their name.
             */
            const sortedTemplates = eventTemplates
                .sort((templ1, templ2) => templ1.template_name.localeCompare(templ2.template_name));

            const templates = recentTemplates.length === 0 ? sortedTemplates : recentTemplates;

            templates
                .forEach((template) => {
                    items.push({
                        label: template.template_name,
                        icon: 'icon-event icon--blue',
                        group: gettext('From template'),
                        action: () => createEventFromTemplate(template),
                        id: template._id,
                    });
                });

            if (recentTemplates.length < MORE_TEMPLATES_THRESHOLD ||
                sortedTemplates.length > MORE_TEMPLATES_THRESHOLD) {
                items.push({
                    label: gettext('More templates...'),
                    icon: 'icon-event icon--blue',
                    group: gettext('From template'),
                    action: () => {
                        showModal(({closeModal}) => (
                            <PlanningTemplatesModal
                                createEventFromTemplate={createEventFromTemplate}
                                closeModal={closeModal}
                                calendars={this.props.calendars}
                                eventTemplates={sortedTemplates}
                            />
                        ));
                    },
                    id: 'more_templates',
                });
            }
        }

        return items.length === 0 ? null : (
            <Dropdown
                icon="icon-plus-large"
                items={items}
                alignRight={true}
                group={true}
                disableSelection={createPlanningOnly}
                defaultAction={addPlanning}
                tooltip={createPlanningOnly ?
                    gettext('Create new planning item') :
                    gettext('Create new item')
                }
                aria-label={createPlanningOnly ?
                    gettext('Create new planning item') :
                    gettext('Create new item')
                }
                scrollable={true}
                searchable={true}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        calendars: state.events.calendars,
        eventTemplates: eventTemplates(state),
        recentTemplates: getRecentTemplatesSelector(state)
    };
}

const mapDispatchToProps = (dispatch) => ({
    createEventFromTemplate: (template: IEventTemplate) => {
        dispatch(actions.main.createEventFromTemplate(template));
        dispatch(actions.events.api.addEventRecentTemplate('templates', template._id));
        dispatch(actions.events.api.getEventsRecentTemplates());
    },
});

export const CreateNewSubnavDropdown = connect(
    mapStateToProps,
    mapDispatchToProps,
)(CreateNewSubnavDropdownFn);
