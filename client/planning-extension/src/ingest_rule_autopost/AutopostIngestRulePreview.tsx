import * as React from 'react';
import {IIngestRuleHandlerPreviewProps, ILiveResourcesProps, IRestApiResponse, IVocabulary} from 'superdesk-api';
import {superdesk} from '../superdesk';
import {IAgenda} from '../../../interfaces';
import {extensionBridge} from '../extension_bridge';

const {WithLiveResources} = superdesk.components;
const {getUserInterfaceLanguageFromCV, getVocabularyItemFieldTranslated} = extensionBridge.ui.utils;

type IProps = IIngestRuleHandlerPreviewProps<{
    autopost: boolean,
    agendas?: Array<string>;
    calendars?: Array<string>;
}>;

export class AutopostIngestRulePreview extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdesk.localization;
        const resources: ILiveResourcesProps['resources'] = [
            {resource: 'vocabularies', ids: ['event_calendars']},
            {resource: 'agenda'},
        ];

        return (
            <WithLiveResources resources={resources}>
                {(resourcesResponse) => {
                    const calendars = resourcesResponse[0] as IRestApiResponse<IVocabulary>;
                    const agendas = resourcesResponse[1] as IRestApiResponse<IAgenda>;

                    const calendarsNames: string = calendars._items[0].items
                        .filter((calendar) => (
                            (this.props.rule.actions.extra?.calendars ?? []).includes(calendar.qcode)
                        ))
                        .map((calendar) => getVocabularyItemFieldTranslated(
                            calendar,
                            'name',
                            getUserInterfaceLanguageFromCV()
                        ))
                        .join(', ');
                    const agendaNames: string = agendas._items
                        .filter((agenda) => (
                            (this.props.rule.actions.extra?.agendas ?? []).includes(agenda._id)
                        ))
                        .map((agenda) => agenda.name)
                        .join(', ');

                    return (
                        <React.Fragment>
                            <div className="list-row">
                                <span className="text-label text-label--auto">
                                    {gettext('Post Items')}:
                                </span>
                                <span className="list-row__item">
                                    {this.props.rule.actions.extra?.autopost === true ?
                                        gettext('On') :
                                        gettext('Off')
                                    }
                                </span>
                            </div>
                            <div className="list-row">
                                <span className="text-label text-label--auto">
                                    {gettext('Agendas')}:
                                </span>
                                <span className="list-row__item">
                                    {agendaNames}
                                </span>
                            </div>
                            <div className="list-row">
                                <span className="text-label text-label--auto">
                                    {gettext('Calendars')}:
                                </span>
                                <span className="list-row__item">
                                    {calendarsNames}
                                </span>
                            </div>
                        </React.Fragment>
                    );
                }}
            </WithLiveResources>
        );
    }
}
