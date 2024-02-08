import {ICalendar, IEventTemplate} from '../interfaces';
import React from 'react';
import {SearchBar, BoxedListItem, Heading, BoxedList, Modal, TreeSelect, Spacer} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../superdeskApi';

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

        type ICloseModalProps = {
            closeModal: () => void;
        }

        const TemplatesListView: React.FC<ICloseModalProps> = ({closeModal}) => {
            const calendarFilter = (template: IEventTemplate) => this.state.activeCalendarFilter
                ? template.data.calendars.map(({qcode}) => qcode).includes(this.state.activeCalendarFilter)
                : template;
            /**
             * Groups the templates by calendar, filters the templates that match the current search query,
             * filters the templates by the current selected calendar if one is selected,
             * filters out the groups that don't have any templates
             */
            const filteredTemplates = calendars.map((calendar) => ({
                calendarName: calendar.name,
                templates: eventTemplates
                    .filter((template) => template.template_name.includes(this.state.searchQuery))
                    .filter((template) => template.data.calendars.map(({qcode}) => qcode).includes(calendar.qcode))
                    .filter(calendarFilter)
            })).filter((templatesGroup) => templatesGroup.templates.length > 0);

            return (
                <>
                    {
                        filteredTemplates.map(({calendarName, templates}) => (
                            <React.Fragment key={calendarName}>
                                <Heading type="h6" className="mt-2 mb-1">{calendarName}</Heading>
                                <BoxedList>
                                    {templates
                                        .map((template) => (
                                            <BoxedListItem
                                                key={template._id}
                                                clickable={true}
                                                onClick={() => {
                                                    createEventFromTemplate(template);
                                                    closeModal();
                                                }}
                                            >
                                                {template.template_name}
                                            </BoxedListItem>
                                        ))
                                    }
                                </BoxedList>
                            </React.Fragment>
                        ))
                    }
                </>
            );
        };

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
                    <Spacer h gap="0" noWrap>
                        <TreeSelect
                            width="match-input"
                            zIndex={3000}
                            value={this.state.activeCalendarFilter
                                ? [this.props.calendars.find(({qcode}) => this.state.activeCalendarFilter === qcode)]
                                : []
                            }
                            kind="synchronous"
                            labelHidden
                            inlineLabel
                            getOptions={() => calendars.map((calendar) => ({value: calendar}))}
                            getLabel={(item) => item.name}
                            getId={(item) => item.qcode}
                            placeholder={gettext('All Calendars')}
                            optionTemplate={(item: any) => <div>{item.name}</div>}
                            valueTemplate={(item: any, Wrapper) => (
                                <Wrapper>
                                    <span>{item.name}</span>
                                </Wrapper>
                            )}
                            onChange={([value]) => {
                                if (value?.qcode != null) {
                                    this.setState({
                                        activeCalendarFilter: value?.qcode,
                                        searchQuery: '',
                                    });
                                } else {
                                    this.setState({
                                        activeCalendarFilter: value?.qcode,
                                    });
                                }
                            }}
                        />
                        <SearchBar
                            value={this.state.searchQuery}
                            onSubmit={(value: string) => {
                                this.setState({
                                    activeCalendarFilter: undefined,
                                    searchQuery: value,
                                });
                            }}
                            placeholder={gettext('Search templates')}
                            boxed
                        />
                    </Spacer>
                    <TemplatesListView closeModal={closeModal} />
                </div>
            </Modal>
        );
    }
}
