import React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {Button, Modal} from 'superdesk-ui-framework/react';
import {IFormField, IFormGroup} from 'superdesk-api';
import {IAgenda, IAgendaEntity, IPlanningAppState} from '../../interfaces';
import {AgendaListItem} from './AgendaListItem';
import {PRIVILEGES} from '../../constants';
import {connect, ConnectedProps} from 'react-redux';
import * as selectors from '../../selectors';

export const getNameField = (): IFormField<IAgenda> => {
    const {GenericFormFieldType} = superdeskApi.forms;

    return {
        type: GenericFormFieldType.plainText,
        field: 'name',
        label: superdeskApi.localization.gettext('Name'),
        required: true,
    };
};

const getFormConfig = (): IFormGroup<IAgenda> => {
    const {GenericFormFieldType} = superdeskApi.forms;

    return {
        direction: 'vertical',
        type: 'inline',
        form: [
            getNameField(),
            {
                type: GenericFormFieldType.checkbox,
                field: 'is_enabled',
                label: superdeskApi.localization.gettext('Enabled'),
                defaultValue: true,
            },
        ]
    };
};

interface IManageAgendasModalOwnProps {
    handleHide(): void;
}

type IProps = IManageAgendasModalOwnProps & ConnectedProps<typeof connector>;

class ManageAgendasModalComponent extends React.PureComponent<IProps> {
    private config: IFormGroup<IAgenda>;

    constructor(props: IProps) {
        super(props);

        this.config = getFormConfig();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const AgendasView = superdeskApi
            .components
            .getGenericHttpEntityListPageComponent<IAgendaEntity, never>(
                'agenda',
                this.config,
            );

        return (
            <Modal
                visible
                size="x-large"
                closeOnEscape
                contentPadding="none"
                onHide={this.props.handleHide}
                headerTemplate={gettext('Manage Agendas')}
                footerTemplate={(
                    <Button
                        type="tertiary"
                        onClick={this.props.handleHide}
                        text={gettext('Close')}
                    />
                )}
            >
                <AgendasView
                    ItemComponent={AgendaListItem}
                    getFormConfig={() => this.config}
                    fieldForSearch={getNameField()}
                    getId={(item) => item._id}
                    defaultSortOption={{field: 'is_enabled', direction: 'descending'}}
                    hideItemsCount
                    disallowCreatingNewItem={
                        this.props.privileges[PRIVILEGES.AGENDA_MANAGEMENT] != 1 ? true : undefined
                    }
                />
            </Modal>
        );
    }
}

const mapStateToProps = (state: IPlanningAppState) => ({
    privileges: selectors.general.privileges(state),
});

const connector = connect(mapStateToProps);

export const ManageAgendasModal = connector(ManageAgendasModalComponent);
