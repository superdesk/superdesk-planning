import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {
    IEventDateFieldConfig,
    IEventDateFieldUserPreferences,
    IEventDateValueOperational,
} from './interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';
import {IEventFormProfile} from '../../../../interfaces';

type IProps = IEditorComponentProps<
    IEventDateValueOperational,
    IEventDateFieldConfig,
    IEventDateFieldUserPreferences
>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldEventSchedule} = extensionBridge.editor.fields;
        const profile = extensionBridge.ui.utils.getItemProfile(this.props.item.type);

        return (
            <Container>
                <EditorFieldEventSchedule
                    required={true}
                    profile={profile}
                    disabled={
                        extensionBridge.ui.utils.planning_event_link_method === 'many_secondary'
                            ? true
                            : !extensionBridge.ui.utils.isTemporaryId(this.props.item.id)
                    }
                    onChange={(changes: {[fieldPath: string]: any}) => {
                        const valueCopy = cloneDeep(this.props.value);

                        Object.entries(changes).forEach(([path, value]) => {
                            set(valueCopy, path, value);
                        });

                        this.props.onChange(valueCopy);
                    }}
                    showAllDay={(profile as unknown as IEventFormProfile).editor.dates.all_day.enabled}
                    showTimeZone={true}
                    item={{
                        ...this.props.item,
                        ...this.props.value,
                    }}
                    field='dates'
                />
            </Container>
        );
    }
}
