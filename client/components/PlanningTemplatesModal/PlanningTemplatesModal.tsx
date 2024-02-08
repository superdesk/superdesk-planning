import {ICalendar, IEventTemplate} from '../../interfaces';
import React from 'react';
import {SearchBar, Modal, TreeSelect} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../superdeskApi';
import {TemplatesListView} from './TemplatesListView';

interface IProps {
    closeModal: () => void;
    calendars: Array<ICalendar>;
    eventTemplates: Array<IEventTemplate>;
    createEventFromTemplate(template: IEventTemplate): void;
}

interface IState {
    activeCalendarFilter?: string;
    searchQuery: string;
}

export default class PlanningTemplatesModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            activeCalendarFilter: null,
            searchQuery: '',
        };
    }

    render(): React.ReactNode {
        const {gettext} = superdeskApi.localization;
        const {closeModal, createEventFromTemplate, calendars, eventTemplates} = this.props;

        return (
            <Modal
                headerTemplate={gettext('Planning templates')}
                visible
                contentPadding="medium"
                contentBg="medium"
                size="medium"
                onHide={closeModal}
            >
                <div className="modal__sticky-header">
                    <SearchBar
                        value={this.state.searchQuery}
                        onSubmit={(value: string) => {
                            this.setState({
                                searchQuery: value,
                            });
                        }}
                        placeholder={gettext('Search templates')}
                        boxed
                    >
                        <div style={{width: 200}}>
                            <TreeSelect
                                fullWidth
                                zIndex={3000}
                                value={this.state.activeCalendarFilter
                                    ? [this.props.calendars
                                        .find(({qcode}) => this.state.activeCalendarFilter === qcode)]
                                    : []
                                }
                                kind="synchronous"
                                labelHidden
                                inlineLabel
                                getOptions={() => calendars.map((calendar) => ({value: calendar}))}
                                getLabel={(item) => item.name}
                                getId={(item) => item.qcode}
                                placeholder={(
                                    <div
                                        style={{
                                            height: '100%',
                                            flexGrow: 1,
                                            whiteSpace: 'nowrap',
                                            alignContent: 'center',
                                        }}
                                    >
                                        {gettext('All Calendars')}
                                    </div>
                                )}
                                optionTemplate={(item: any) => <div>{item.name}</div>}
                                valueTemplate={(item: any, Wrapper) => (
                                    <div style={{height: '100%', flexGrow: 1, whiteSpace: 'nowrap'}}>
                                        <Wrapper>
                                            <span>{gettext('Calendar')}: {item.name}</span>
                                        </Wrapper>
                                    </div>
                                )}
                                onChange={([value]) => {
                                    this.setState({
                                        activeCalendarFilter: value?.qcode,
                                        searchQuery: '',
                                    });
                                }}
                            />
                        </div>
                    </SearchBar>
                    <TemplatesListView
                        calendars={calendars}
                        createEventFromTemplate={createEventFromTemplate}
                        eventTemplates={eventTemplates}
                        searchQuery={this.state.searchQuery}
                        activeCalendarFilter={this.state.activeCalendarFilter}
                        closeModal={closeModal}
                    />
                </div>
            </Modal>
        );
    }
}
