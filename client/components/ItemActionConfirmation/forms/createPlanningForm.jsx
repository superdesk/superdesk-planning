import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {gettext} from '../../../utils';
import {Label, Row as FormRow, Field, SelectMetaTermsInput} from '../../UI/Form/';
import '../style.scss';
import {get} from 'lodash';

export class CreatePlanningComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {agendas: []};
        this.onChange = this.onChange.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);
        this.dom = {popupContainer: null};
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
        return this.props.onSubmit(this.state.agendas, this.props.modalProps);
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    render() {
        const events = get(this.props, 'modalProps.events', []);
        const message = events.length === 1 ?
            gettext('Do you want to add this event to the planning list ?') :
            gettext(`Do you want to add these ${events.length} events to the planning list ?`);

        return (
            <div className="MetadataView">
                <FormRow noPadding>
                    <Label text={gettext('Agenda')} row={true}/>
                    <Field
                        component={SelectMetaTermsInput}
                        field="agenda"
                        value={this.state.agendas}
                        options={this.props.enabledAgendas}
                        valueKey="_id"
                        onChange={this.onChange}
                    />
                </FormRow>
                <div><strong>{message}</strong></div>
                <div ref={(node) => this.dom.popupContainer = node} />
            </div>
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
    onSubmit: (agendas, modalProps) => dispatch(actions.addEventToCurrentAgenda(
        modalProps.events, null, false, agendas)),
});

export const CreatePlanningForm = connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    {withRef: true}
)(CreatePlanningComponent);
