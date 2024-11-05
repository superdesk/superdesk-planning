import * as React from 'react';
import {IIngestRuleHandlerPreviewProps, IRestApiResponse} from 'superdesk-api';
import {superdesk} from '../superdesk';
import {IAgenda} from '../../../interfaces';
import {extensionBridge} from '../extension_bridge';

const {getUserInterfaceLanguageFromCV, getVocabularyItemFieldTranslated} = extensionBridge.ui.utils;

type IProps = IIngestRuleHandlerPreviewProps<{
    autopost: boolean,
    agendas?: Array<string>;
    calendars?: Array<string>;
}>;

interface IStateLoading {
    loading: true;
}

interface IStateLoaded {
    loading: false;
    agendas: Array<IAgenda>;
}

type IState = IStateLoading | IStateLoaded;

export class AutopostIngestRulePreview extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
        };
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

        const calendarsNames: string = calendars
            .filter((calendar) => (
                (this.props.rule.actions.extra?.calendars ?? []).includes(calendar.qcode)
            ))
            .map((calendar) => getVocabularyItemFieldTranslated(
                calendar,
                'name',
                getUserInterfaceLanguageFromCV()
            ))
            .join(', ');
        const agendaNames: string = agendas
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
    }
}
