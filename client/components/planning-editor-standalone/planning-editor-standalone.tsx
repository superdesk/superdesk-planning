import React from 'react';
import {connect} from 'react-redux';
import {noop} from 'lodash';
import {Button} from 'superdesk-ui-framework/react';
import {IAuthoringStorage, ITopBarWidget} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import * as selectors from '../../selectors';
import {IAgenda, IPlanningAppState, IPlanningItem} from 'interfaces';
import {storageAdapterPlanningItem} from './storage-adapter';

interface IOwnProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
}

interface IReduxProps {
    agendas: Array<IAgenda>;
}

type IProps = IOwnProps & IReduxProps;

export class PlanningEditorStandaloneComponent extends React.PureComponent<IProps> {
    render() {
        const Authoring = superdeskApi.components.getAuthoringComponent<IPlanningItem>();
        const {gettext} = superdeskApi.localization;

        return (
            <Authoring
                itemId={this.props.itemId}
                resourceNames={['planning']}
                onClose={noop}
                fieldsAdapter={{}}
                authoringStorage={this.props.authoringStorage}
                storageAdapter={storageAdapterPlanningItem}
                getLanguage={(item) => item.language ?? 'en'}
                getInlineToolbarActions={({hasUnsavedChanges, save}) => {
                    const saveButton: ITopBarWidget<IPlanningItem> = {
                        group: 'end',
                        priority: 0.2,
                        component: () => (
                            <Button
                                text={gettext('Save')}
                                style="filled"
                                type="primary"
                                disabled={!hasUnsavedChanges()}
                                onClick={() => {
                                    save();
                                }}
                            />
                        ),
                        availableOffline: true,
                        keyBindings: {
                            'ctrl+shift+s': () => {
                                if (hasUnsavedChanges()) {
                                    save();
                                }
                            },
                        },
                    };

                    // PR-TODO: add a close button that will collapse the accordion
                    return {readOnly: false, actions: [saveButton]};
                }}
                getAuthoringPrimaryToolbarWidgets={() => []}
                secondaryToolbarWidgets={[]}
                getSidebarWidgetsCount={() => 0}
                getSidebar={() => null}
                sideWidget={null}
                onSideWidgetChange={noop}
                getSidePanel={() => null}
                getSideWidgetIdAtIndex={(_item) => 'no-id-available'}
            />
        );
    }
}

function mapStateToProps(state: IPlanningAppState): IReduxProps {
    return {
        agendas: selectors.general.enabledAgendas(state),
    };
}

export const PlanningEditorStandalone = connect(mapStateToProps)(PlanningEditorStandaloneComponent);