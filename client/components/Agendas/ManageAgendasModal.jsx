import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Modal} from '../index';
import {gettext} from '../../utils';
import {MODALS} from '../../constants';
import {SubNav, StretchBar, Button} from '../UI/SubNav';
import {ColumnBox} from '../UI';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {AgendaList, EditAgenda} from './index';

/**
* Modal for managing and editing agendas
*/
export class ManageAgendasComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorOpen: false,
            selectedAgenda: null
        };
    }

    toggleEditorOpen() {
        if (this.state.editorOpen) {
            // Closing - set selected Agenda to null
            this.setState({
                editorOpen: !this.state.editorOpen,
                selectedAgenda: null,
            });
        } else {
            this.setState({editorOpen: !this.state.editorOpen});
        }
    }

    editAgenda(agenda) {
        this.setState({
            selectedAgenda: agenda,
            editorOpen: true,
        });
    }

    render() {
        const {handleHide, privileges, enabledAgendas, disabledAgendas, deleteAgenda} = this.props;

        return (
            <Modal large={true} show={true} onHide={handleHide}>
                <Modal.Header>
                    <a className="close" onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                    <h3 className="modal__heading">{gettext('Manage Agendas')}</h3>
                </Modal.Header>
                <Modal.Body noPadding={true}>
                    <SubNav>
                        <StretchBar />
                        {!this.state.editorOpen && <Button
                            right={true}
                            buttonClassName="btn btn--primary"
                            onClick={this.toggleEditorOpen.bind(this)}>
                            <i className="icon-plus-sign icon-white" />
                            {gettext('Add New Agenda')}
                        </Button>}
                    </SubNav>
                    <ColumnBox.Box>
                        <ColumnBox.MainColumn padded={true}>
                            <AgendaList privileges={privileges}
                                agendas={enabledAgendas}
                                editAgenda={this.state.editorOpen ? null : this.editAgenda.bind(this)}
                                deleteAgenda={deleteAgenda}
                                status={gettext('active')} />
                            <AgendaList privileges={privileges}
                                agendas={disabledAgendas}
                                editAgenda={this.state.editorOpen ? null : this.editAgenda.bind(this)}
                                deleteAgenda={deleteAgenda}
                                status={gettext('disabled')} />
                        </ColumnBox.MainColumn>
                        {this.state.editorOpen &&
                            <ColumnBox.SlideInColumn>
                                <EditAgenda
                                    agenda={this.state.selectedAgenda}
                                    onClose={this.toggleEditorOpen.bind(this)}
                                    onSave={this.props.createOrUpdateAgenda}/>
                            </ColumnBox.SlideInColumn>
                        }
                    </ColumnBox.Box>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn btn--primary" type="submit" onClick={handleHide}>{gettext('Ok')}</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

ManageAgendasComponent.propTypes = {
    handleHide: PropTypes.func,
    enabledAgendas: PropTypes.array,
    disabledAgendas: PropTypes.array,
    privileges: PropTypes.object.isRequired,
    deleteAgenda: PropTypes.func,
    createOrUpdateAgenda: PropTypes.func,
};

const mapStateToProps = (state) => (
    {
        enabledAgendas: selectors.getEnabledAgendas(state),
        disabledAgendas: selectors.getDisabledAgendas(state),
        privileges: selectors.getPrivileges(state),
    }
);

const mapDispatchToProps = (dispatch) => ({
    deleteAgenda: (agenda) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            body: `Do you want to delete "${agenda.name}" agenda ?`,
            action: () => dispatch(actions.deleteAgenda(agenda)),
        },
    })),
    createOrUpdateAgenda: (agenda) => dispatch(actions.createOrUpdateAgenda(agenda)),
});

export const ManageAgendasModal = connect(
    mapStateToProps,
    mapDispatchToProps
)(ManageAgendasComponent);