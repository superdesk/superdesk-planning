import * as React from 'react';
import {
    IIngestRuleHandlerEditorProps,
    IRestApiResponse,
    IVocabularyItem
} from 'superdesk-api';
import {IAgenda} from '../../../interfaces';
import {Switch} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import {extensionBridge} from '../extension_bridge';

const {EditorFieldVocabulary} = extensionBridge.ui.components;

interface IExtraAttributes {
    autopost: boolean,
    agendas?: Array<IAgenda['_id']>;
    calendars?: Array<IVocabularyItem['qcode']>;
}

type IProps = IIngestRuleHandlerEditorProps<IExtraAttributes>;

interface IStateLoading {
    loading: true;
}

interface IStateLoaded {
    loading: false;
    agendas: Array<IAgenda>;
}

type IState = IStateLoading | IStateLoaded;

export class AutopostIngestRuleEditor extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.updateAttributes = this.updateAttributes.bind(this);
        this.updateAutopostValue = this.updateAutopostValue.bind(this);

        this.state = {
            loading: true,
        };
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

    componentDidMount(): void {
        superdesk.httpRequestJsonLocal<IRestApiResponse<IAgenda>>({
            method: 'GET',
            path: '/agenda',
        }).then((res) => {
            this.setState({
                loading: false,
                agendas: res._items,
            });
        });
    }

    render() {
        if (this.state.loading) {
            return null;
        }

        const {agendas} = this.state;
        const calendars = superdesk.entities.vocabulary.getAll().get('event_calendars').items;
        const {gettext} = superdesk.localization;

        return (
            <div>
                <Switch
                    label={{content: gettext('Post Items')}}
                    value={this.props.rule.actions.extra?.autopost === true}
                    onChange={this.updateAutopostValue}
                />

                <EditorFieldVocabulary
                    item={this.props.rule.actions.extra ?? {}}
                    field="calendars"
                    label={gettext('Calendars')}
                    defaultValue={[]}
                    onChange={this.updateAttributes}
                    options={calendars.filter((item) => (
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
                    options={agendas.filter((item) => (
                        item.is_enabled !== false
                    ))}
                    valueAsString={true}
                    valueKey="_id"
                />
            </div>
        );
    }
}
