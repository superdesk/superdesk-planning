import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {ITEM_TYPE} from '../../constants/index';
import {eventTemplates} from '../../selectors/events';

class CreateNewSubnavDropdownFn extends React.Component {
    render() {
        const {addEvent, addPlanning, createPlanningOnly, privileges, dispatch} = this.props;
        const items = [];

        if (privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
            items.push({
                label: gettext('Planning Item'),
                icon: 'icon-calendar icon--blue',
                group: 'Create new',
                action: addPlanning,
                id: 'create_planning',
            });
        }

        if (!createPlanningOnly && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]) {
            items.push({
                label: gettext('Event'),
                icon: 'icon-event icon--blue',
                group: 'Create new',
                action: addEvent,
                id: 'create_event',
            });

            this.props.eventTemplates.forEach((template) => {
                items.push({
                    label: template.template_name,
                    icon: 'icon-event icon--blue',
                    group: 'From template',
                    searchable: true,
                    action: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT, template.data)),
                    id: template._id,
                });
            });
        }

        return (items.length === 0 ? null : (
            <Dropdown
                icon="icon-plus-large"
                items={items}
                alignRight={true}
                group={true}
                disableSelection={createPlanningOnly}
                defaultAction={addPlanning}
                tooltip={createPlanningOnly ? gettext('Create new planning item') : gettext('Create new item')}
                scrollable
                searchable
            />
        )
        );
    }
}

CreateNewSubnavDropdownFn.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    createPlanningOnly: PropTypes.bool,
    privileges: PropTypes.object,
    dispatch: PropTypes.func,
    eventTemplates: PropTypes.array,
};

function mapStateToProps(state) {
    return {
        eventTemplates: eventTemplates(state),
    };
}

export const CreateNewSubnavDropdown = connect(mapStateToProps)(CreateNewSubnavDropdownFn);
