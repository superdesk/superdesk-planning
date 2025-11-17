import React from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {isEqual} from 'lodash';
import {Modal} from '../index';
import {gettext} from '../../utils';
import {MODALS, PRIVILEGES, KEYCODES} from '../../constants';
import {SubNav, StretchBar, Button} from '../UI/SubNav';
import {ColumnBox} from '../UI';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {AgendaList, EditAgenda} from './index';
import {IAgenda, IPlanningAppState} from '../../interfaces';

interface IManageAgendasModalOwnProps {
    handleHide(): void;
}

interface IManageAgendasModalState {
    editorOpen: boolean;
    selectedAgenda: IAgenda | null;
}

/**
* Modal for managing and editing agendas
*/
export class ManageAgendasComponent extends React.Component<
    IManageAgendasModalOwnProps & ConnectedProps<typeof connector>,
    IManageAgendasModalState
> {
    constructor(props: IManageAgendasModalOwnProps & ConnectedProps<typeof connector>) {
        super(props);
        this.state = {
            editorOpen: false,
            selectedAgenda: null,
        };
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount(): void {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount(): void {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event: KeyboardEvent): void {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.props.handleHide();
        }
    }

    componentWillReceiveProps(nextProps: IManageAgendasModalOwnProps & ConnectedProps<typeof connector>): void {
        if (this.state.selectedAgenda) {
            const nextPropsAgenda = nextProps.enabledAgendas.find((a) => a._id === this.state.selectedAgenda!._id);

            if (!isEqual(this.state.selectedAgenda, nextPropsAgenda)) {
                this.setState({selectedAgenda: nextPropsAgenda ?? null});
            }
        }
    }

    toggleEditorOpen(): void {
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

    editAgenda(agenda: IAgenda): void {
        this.setState({
            selectedAgenda: agenda,
            editorOpen: true,
        });
    }

    render(): React.ReactNode {
        const {handleHide, privileges, enabledAgendas, disabledAgendas, deleteAgenda} = this.props;

        return (
            <Modal large={true} show={true} onHide={handleHide}>
                <Modal.Header>
                    <h3 className="modal__heading">{gettext('Manage Agendas')}</h3>
                    <a className="icn-btn" aria-label={gettext('Close')} onClick={handleHide}>
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body noPadding={true} noScroll>
                    {!!privileges[PRIVILEGES.AGENDA_MANAGEMENT] && (
                        <SubNav>
                            <StretchBar />
                            <Button
                                disabled={this.state.editorOpen}
                                right={true}
                                buttonClassName="btn btn--primary"
                                onClick={this.toggleEditorOpen.bind(this)}
                            >
                                <i className="icon-plus-sign icon-white" />
                                {gettext('Add New Agenda')}
                            </Button>
                        </SubNav>
                    )}
                    <ColumnBox.Box verticalScroll={true}>
                        <ColumnBox.MainColumn padded={true}>
                            <AgendaList
                                privileges={privileges}
                                agendas={enabledAgendas}
                                editAgenda={this.state.editorOpen ? null : this.editAgenda.bind(this)}
                                deleteAgenda={deleteAgenda}
                                status={gettext('active')}
                            />
                            <AgendaList
                                privileges={privileges}
                                agendas={disabledAgendas}
                                editAgenda={this.state.editorOpen ? null : this.editAgenda.bind(this)}
                                deleteAgenda={deleteAgenda}
                                status={gettext('disabled')}
                                marginTop={true}
                            />
                        </ColumnBox.MainColumn>
                        {this.state.editorOpen && (
                            <ColumnBox.SlideInColumn>
                                <EditAgenda
                                    agenda={this.state.selectedAgenda}
                                    onClose={this.toggleEditorOpen.bind(this)}
                                    onSave={this.props.createOrUpdateAgenda}
                                    openOnSaveModal={this.props.openOnSaveModal}
                                />
                            </ColumnBox.SlideInColumn>
                        )}
                    </ColumnBox.Box>
                </Modal.Body>
                <Modal.Footer>
                    <button className="btn" type="button" onClick={handleHide}>{gettext('Close')}</button>
                </Modal.Footer>
            </Modal>
        );
    }
}

const mapStateToProps = (state: IPlanningAppState) => (
    {
        enabledAgendas: selectors.general.enabledAgendas(state),
        disabledAgendas: selectors.general.disabledAgendas(state),
        privileges: selectors.general.privileges(state),
    }
);

const mapDispatchToProps = (dispatch: any) => ({
    deleteAgenda: (agenda: IAgenda) => dispatch(actions.showModal({
        modalType: MODALS.CONFIRMATION,
        modalProps: {
            body: `Do you want to delete "${agenda.name}" agenda ?`,
            action: () => dispatch(actions.deleteAgenda(agenda)),
            autoClose: true,
        },
    })),
    createOrUpdateAgenda: (agenda: IAgenda) => dispatch(actions.createOrUpdateAgenda(agenda)),
    openOnSaveModal: (props: any) => dispatch(actions.main.openConfirmationModal(props)),
});

const connector = connect(mapStateToProps, mapDispatchToProps);

export const ManageAgendasModal = connector(ManageAgendasComponent);
