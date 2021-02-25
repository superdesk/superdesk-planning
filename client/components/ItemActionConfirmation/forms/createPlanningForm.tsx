import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext} from '../../../utils';
import {Label, Row as FormRow, Field, SelectMetaTermsInput} from '../../UI/Form/';
import '../style.scss';

export class CreatePlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {agendas: []};
        this.onChange = this.onChange.bind(this);
    }

    componentWillMount() {
        if (this.props.currentAgenda) {
            this.setState({agendas: [this.props.currentAgenda]});
        } else {
            this.setState({agendas: []});
        }

        this.props.enableSaveInModal();
    }

    onChange(field, value) {
        this.setState({agendas: value});
    }

    submit() {
        return this.props.onSubmit(
            get(this.props, 'modalProps.events'),
            this.state.agendas
        );
    }

    render() {
        const language = getUserInterfaceLanguage();

        return (
            <FormRow noPadding>
                <Label text={gettext('Agenda')} row={true} />
                <Field
                    component={SelectMetaTermsInput}
                    field="agenda"
                    value={this.state.agendas}
                    options={this.props.enabledAgendas}
                    valueKey="_id"
                    onChange={this.onChange}
                    language={language}
                />
            </FormRow>
        );
    }
}

CreatePlanningComponent.propTypes = {
    enabledAgendas: PropTypes.array,
    onSubmit: PropTypes.func,
    enableSaveInModal: PropTypes.func,
    modalProps: PropTypes.object,
    currentAgenda: PropTypes.object,
};

const mapStateToProps = (state) => ({
    enabledAgendas: selectors.general.enabledAgendas(state),
    currentAgenda: selectors.planning.currentAgenda(state),
});

const mapDispatchToProps = (dispatch) => ({
    onSubmit: (events, agendas) =>
        dispatch(actions.addEventToCurrentAgenda(
            events,
            null,
            false,
            agendas
        ))
            .then(() => (
                dispatch(actions.multiSelect.deSelectEvents(null, true)))
            ),
});

export const CreatePlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {forwardRef: true}
)(CreatePlanningComponent);
