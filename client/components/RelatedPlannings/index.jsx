/* eslint-disable camelcase */

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import './style.scss';
import * as actions from '../../actions';
import {WORKFLOW_STATE} from '../../constants/index';
import {gettext} from '../../utils';
import {PlanningMetaData} from './PlanningMetaData';
import * as selectors from '../../selectors';

export const RelatedPlanningsComponent = ({
    plannings,
    openPlanningItem,
    openPlanningClick,
    short,
    expandable,
    navigation,
    lockedItems,
    onEditPlanning,
    users,
    desks,
    allowEditPlanning,
    contentTypes,
}) => (
    (
        <div>
            {expandable ?
                plannings.map((plan, index) => (
                    <PlanningMetaData
                        key={index}
                        field={`plannings[${index}]`}
                        plan={plan}
                        scrollInView={true}
                        navigation={navigation}
                        lockedItems={lockedItems}
                        onEditPlanning={allowEditPlanning ? onEditPlanning.bind(null, plan) : null}
                        users={users}
                        desks={desks}
                        contentTypes={contentTypes}
                        tabEnabled
                    />
                ))
                :
                (
                    <ul className="simple-list simple-list--dotted simple-list--no-padding">
                        {plannings.map(({
                            _id,
                            slugline,
                            headline,
                            anpa_category,
                            _agendas = [],
                            original_creator: {display_name},
                            state,
                        }) => {
                            const agendaElements = _agendas.map((_agenda) => (
                                _agenda && (
                                    <span key={_agenda._id}>
                                        <a
                                            onClick={openPlanningItem ?
                                                openPlanningClick.bind(null, _id, _agenda) :
                                                null
                                            }
                                        >
                                            {
                                                _agenda.is_enabled ? _agenda.name : `${_agenda.name} - [Disabled]`
                                            }
                                        </a>
                                    </span>
                                )
                            )).reduce((accu, elem) => accu === null ? [elem] : [accu, ', ', elem], null);

                            const inAgendaText = _agendas.length > 0 ? gettext('in agenda') : '';

                            return (
                                <li key={_id} className="simple-list__item simple-list__item--with-icon">
                                    <i className="icon-list-alt" />&nbsp;
                                    {state && state === WORKFLOW_STATE.SPIKED &&
                                        <span className="label label--alert">spiked</span>
                                    }
                                    { short ? (
                                        <span>
                                            <strong>{slugline || headline}</strong>
                                            {inAgendaText}{ agendaElements }
                                        </span>
                                    )
                                        :
                                        (
                                            <span>
                                                {agendaElements && <strong>{slugline || headline} </strong>}
                                                {!agendaElements && (
                                                    <a
                                                        onClick={openPlanningItem ?
                                                            openPlanningClick.bind(null, _id) : null}
                                                    >
                                                        <strong>{slugline || headline} </strong></a>
                                                )}
                                                {
                                                    gettext('created by') + ' ' + display_name + ' ' + inAgendaText
                                                } {agendaElements}
                                                {anpa_category && anpa_category.length && (
                                                    <span>&nbsp;[{anpa_category.map((c) => c.name).join(', ')}]</span>
                                                )
                                                }</span>
                                        )
                                    }
                                </li>
                            );
                        })}
                    </ul>
                )
            }
        </div>
    )
);

RelatedPlanningsComponent.propTypes = {
    plannings: PropTypes.array.isRequired,
    openPlanningItem: PropTypes.bool,
    openPlanningClick: PropTypes.func.isRequired,
    short: PropTypes.bool,
    expandable: PropTypes.bool,
    lockedItems: PropTypes.object,
    navigation: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    onEditPlanning: PropTypes.func,
    allowEditPlanning: PropTypes.bool,
    contentTypes: PropTypes.array,
};

RelatedPlanningsComponent.defaultProps = {short: false};

const mapStateToProps = (state, ownProps) => ({
    plannings: ownProps.plannings.map((planning) => ({...planning})),
    lockedItems: selectors.locks.getLockedItems(state),
    contentTypes: selectors.general.contentTypes(state),
});

const mapDispatchToProps = (dispatch) => ({
    openPlanningClick: (planningId, agenda) => (
        dispatch(actions.main.openPreview({
            _id: planningId,
            type: 'planning',
        }))
    ),
    onEditPlanning: (plan) => (dispatch(actions.main.openForEdit(plan))),
});

export const RelatedPlannings = connect(mapStateToProps, mapDispatchToProps)(RelatedPlanningsComponent);

