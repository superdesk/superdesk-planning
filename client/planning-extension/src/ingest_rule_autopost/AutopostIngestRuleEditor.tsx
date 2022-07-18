import * as React from 'react';
import {
    IIngestRuleHandlerEditorProps,
    ILiveResourcesProps,
    IRestApiResponse,
    IVocabulary,
    IVocabularyItem
} from 'superdesk-api';
import {IAgenda} from '../../../interfaces';
import {Switch} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {extensionBridge} from '../extension_bridge';

const {EditorFieldVocabulary} = extensionBridge.ui.components;
const {WithLiveResources} = superdesk.components;

interface IExtraAttributes {
    autopost: boolean,
    agendas?: Array<IAgenda['_id']>;
    calendars?: Array<IVocabularyItem['qcode']>;
}

type IProps = IIngestRuleHandlerEditorProps<IExtraAttributes>;

export class AutopostIngestRuleEditor extends React.PureComponent<IProps> {
    constructor(props: IProps) {
        super(props);

        this.updateAttributes = this.updateAttributes.bind(this);
        this.updateAutopostValue = this.updateAutopostValue.bind(this);
    }

    updateAttributes<T extends keyof IExtraAttributes>(field: T, value: IExtraAttributes[T]) {
        this.props.updateRule({
            ...this.props.rule,
            actions: {
                ...this.props.rule.actions,
                extra: {
                    ...this.props.rule.actions.extra ?? {},
                    [field]: value,
                },
            },
        });
    }

    updateAutopostValue(value: boolean) {
        this.updateAttributes('autopost', value);
    }

    render() {
        const {gettext} = superdesk.localization;
        const resources: ILiveResourcesProps['resources'] = [
            {resource: 'vocabularies', ids: ['event_calendars']},
            {resource: 'agenda'},
        ];

        return (
            <div>
                <Switch
                    label={{text: gettext('Post Items')}}
                    value={this.props.rule.actions.extra?.autopost === true}
                    onChange={this.updateAutopostValue}
                />
                <WithLiveResources resources={resources}>{(resourcesResponse) => {
                    const calendars = resourcesResponse[0] as IRestApiResponse<IVocabulary>;
                    const agendas = resourcesResponse[1] as IRestApiResponse<IAgenda>;

                    return (
                        <React.Fragment>
                            <EditorFieldVocabulary
                                item={this.props.rule.actions.extra ?? {}}
                                field="calendars"
                                label={gettext('Calendars')}
                                defaultValue={[]}
                                onChange={this.updateAttributes}
                                options={calendars._items[0].items.filter((item) => (
                                    item.is_active !== false
                                ))}
                                valueAsString={true}
                            />
                            <EditorFieldVocabulary
                                item={this.props.rule.actions.extra ?? {}}
                                field="agendas"
                                label={gettext('Agendas')}
                                defaultValue={[]}
                                onChange={this.updateAttributes}
                                options={agendas._items.filter((item) => (
                                    item.is_enabled !== false
                                ))}
                                valueAsString={true}
                                valueKey="_id"
                            />
                        </React.Fragment>
                    );
                }}</WithLiveResources>
            </div>
        );
    }
}
