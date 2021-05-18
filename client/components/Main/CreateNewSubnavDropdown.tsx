import React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../superdeskApi';
import {IEventTemplate} from '../../interfaces';

import {PRIVILEGES, ITEM_TYPE} from '../../constants';
import * as actions from '../../actions';
import {eventTemplates} from '../../selectors/events';
import {Dropdown, IDropdownItem} from '../UI/SubNav';

interface IProps {
    addEvent(): void;
    addPlanning(): void;
    createPlanningOnly: boolean;
    privileges: {[key: string]: number};
    createEventFromTemplate(template: IEventTemplate): void;
    eventTemplates: Array<IEventTemplate>;
}

class CreateNewSubnavDropdownFn extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {addEvent, addPlanning, createPlanningOnly, privileges, createEventFromTemplate} = this.props;
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

            this.props.eventTemplates.forEach((template) => {
                items.push({
                    label: template.template_name,
                    icon: 'icon-event icon--blue',
                    group: gettext('From template'),
                    action: () => createEventFromTemplate(template),
                    id: template._id,
                });
            });
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
        eventTemplates: eventTemplates(state),
    };
}

const mapDispatchToProps = (dispatch) => ({
    createEventFromTemplate: (template: IEventTemplate) => dispatch(actions.main.createNew(
        ITEM_TYPE.EVENT,
        template.data
    ))
});

export const CreateNewSubnavDropdown = connect(
    mapStateToProps,
    mapDispatchToProps,
)(CreateNewSubnavDropdownFn);
