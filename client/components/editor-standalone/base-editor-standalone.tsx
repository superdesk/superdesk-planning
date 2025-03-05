import React, {RefObject} from 'react';
import {connect} from 'react-redux';
import {noop} from 'lodash';
import {Button} from 'superdesk-ui-framework/react';
import {
    IAuthoringStorage,
    ITopBarWidget,
    IAuthoringValidationErrors,
    IStorageAdapter,
    IAuthoringReact,
    IPropsAuthoring,
} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import * as selectors from '../../selectors';
import {IAgenda, IPlanningAppState, IPlanningItem} from 'interfaces';
import {formProfile} from '../../validators/profile';
import {getPlanningProfileFields} from './profile-fields';
import {FieldTemplate} from './field-template';

interface IOwnProps<T extends IPlanningItem | IEventItem> {
    // will be used as resource and content profile type
    entityType: 'planning' | 'event';

    itemId: string;

    editorRef: RefObject<IAuthoringReact<T>>;
    authoringStorage: IAuthoringStorage<T>;
    storageAdapter: IStorageAdapter<T>;

    makeVisible: IPropsAuthoring<T>['makeVisible'];
}

interface IReduxProps {
    agendas: Array<IAgenda>;
}

type IProps<T extends IPlanningItem | IEventItem> = IOwnProps<T> & IReduxProps;

function validate<T extends IPlanningItem | IEventItem>(
    entityType: 'planning' | 'event',
    fieldsData: Immutable.Map<string, unknown>,
    latestItem: T,
): IAuthoringValidationErrors {
    const planningProfile = planningApi.contentProfiles.get(entityType);
    const errors = {};
    const messages = [];

    // PR-TODO: dates.recurring_rule needs to be handled, fieldId is only 'recurring_rule' which causes the
    // value to be always empty when doing latestItem[fieldId] (actual value is in `latestItem.dates.recurring_rule`)
    // Also changing fieldId from adapter to `dates.recurring_rule` the storage
    // adapter can't be found from authoring internals and causes a crash
    for (const {fieldId} of getPlanningProfileFields({profile: entityType, embeddedOnly: true})) {
        formProfile({
            field: fieldId,
            value: latestItem[fieldId],
            profile: planningProfile,
            errors: errors,
            messages: messages,
            diff: latestItem,
        });
    }

    const filteredErrors = {};

    for (const [fieldId, error] of Object.entries(errors)) {
        if (fieldsData.has(fieldId)) {
            filteredErrors[fieldId] = error;
        }
    }

    return filteredErrors;
}

export class BaseEditorComponent<T extends IPlanningItem | IEventItem> extends React.PureComponent<IProps<T>> {
    render() {
        const Authoring = superdeskApi.components.getAuthoringComponent<T>();
        const {gettext} = superdeskApi.localization;

        return (
            <Authoring
                ref={this.props.editorRef as any}
                itemId={this.props.itemId}
                resourceNames={[this.props.entityType]}
                onClose={noop}
                fieldsAdapter={{}}
                authoringStorage={this.props.authoringStorage}
                storageAdapter={this.props.storageAdapter}
                getLanguage={(item) => item.language ?? 'en'}
                getInlineToolbarActions={({
                    hasUnsavedChanges,
                    save,
                    setValidationErrors,
                    fieldsData,
                    getLatestItem,
                }) => {
                    const saveButton: ITopBarWidget<T> = {
                        group: 'end',
                        priority: 0.2,
                        component: () => (
                            <Button
                                text={gettext('Save')}
                                style="filled"
                                type="primary"
                                disabled={!hasUnsavedChanges()}
                                onClick={() => {
                                    const validationErrors = validate(
                                        this.props.entityType,
                                        fieldsData,
                                        getLatestItem(),
                                    );

                                    if (Object.keys(validationErrors).length > 0) {
                                        setValidationErrors(validationErrors);
                                    } else {
                                        save();
                                    }
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

                    return {readOnly: false, actions: [saveButton]};
                }}
                getSidebarWidgetsCount={() => 0}
                getSidebar={() => null}
                sideWidget={null}
                onSideWidgetChange={noop}
                getSidePanel={() => null}
                getSideWidgetIdAtIndex={(_item) => 'no-id-available'}
                fieldTemplate={FieldTemplate}
                makeVisible={this.props.makeVisible}
            />
        );
    }
}

function mapStateToProps(state: IPlanningAppState): IReduxProps {
    return {
        agendas: selectors.general.enabledAgendas(state),
    };
}

export const BaseEditorStandalone = connect(mapStateToProps, null, null, {forwardRef: true})(BaseEditorComponent);
