import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from '../../utils';
import {Dropdown} from '../UI/SubNav';
import {PRIVILEGES} from '../../constants';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {ITEM_TYPE} from '../../constants/index';
import {connectServices} from 'superdesk-core/scripts/core/helpers/ReactRenderAsync';

class CreateNewSubnavDropdownFn extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            eventTemplates: null,
        };
    }

    componentDidMount() {
        setTimeout(() => {
            // this.props.api
            this.setState({
                eventTemplates: [{name: 'test', data: {slugline: 'test2'}}],
            });
        }, 2000);
    }
    render() {
        if (this.state.eventTemplates == null) {
            return null;
        }

        const {addEvent, addPlanning, createPlanningOnly, privileges, dispatch} = this.props;
        const items = [];

        // need a list of templates here

        if (privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
            items.push({
                label: gettext('Planning Item'),
                icon: 'icon-plus-sign icon--blue',
                action: addPlanning,
                id: 'create_planning',
            });
        }

        if (!createPlanningOnly && !!privileges[PRIVILEGES.EVENT_MANAGEMENT]) {
            items.push({
                label: gettext('Event'),
                icon: 'icon-plus-sign icon--blue',
                action: addEvent,
                id: 'create_event',
            });

            this.state.eventTemplates.forEach((template) => {
                items.push({
                    label: template.name,
                    icon: 'icon-plus-sign icon--blue',
                    action: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT, template.data)),
                    id: template.name,
                });
            });
        }

        return (items.length === 0 ? null :
            <Dropdown
                icon="icon-plus-large"
                label={gettext('Create new')}
                items={items}
                alignRight={true}
                disableSelection={createPlanningOnly}
                defaultAction={addPlanning}
                tooltip={createPlanningOnly ? gettext('Create new planning item') : gettext('Create new item')} />
        );
    }
}

CreateNewSubnavDropdownFn.propTypes = {
    addEvent: PropTypes.func.isRequired,
    addPlanning: PropTypes.func.isRequired,
    createPlanningOnly: PropTypes.bool,
    privileges: PropTypes.object,
    dispatch: PropTypes.func,
    api: PropTypes.func,
};

export const CreateNewSubnavDropdown = connect()(
    connectServices(
        CreateNewSubnavDropdownFn,
        ['api']
    )
);
