import * as React from 'react';

import {superdeskApi} from '../../superdeskApi';
import {IEventsPlanningContentPanelProps} from '../../interfaces';

import * as SidePanel from '../UI/SidePanel';
import {renderFieldsForPanel} from '../fields';

export class PreviewFilter extends React.PureComponent<IEventsPlanningContentPanelProps> {
    constructor(props) {
        super(props);

        this.editFilter = this.editFilter.bind(this);
    }

    editFilter() {
        this.props.editFilter(this.props.filter);
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <SidePanel.Header className="side-panel__header--border-b">
                    <h3 className="side-panel__heading">
                        {gettext('Filter Details')}
                    </h3>
                    <SidePanel.Tools
                        tools={[{
                            icon: 'icon-pencil',
                            onClick: this.editFilter,
                            title: gettext('Edit'),
                        }, {
                            icon: 'icon-close-small',
                            onClick: this.props.onClose,
                            title: gettext('Close'),
                        }]}
                    />
                </SidePanel.Header>
                <SidePanel.Content>
                    <SidePanel.ContentBlock flex={true}>
                        <SidePanel.ContentBlockInner grow={true}>
                            <h3>{this.props.filter.name}</h3>
                            <ul className="simple-list simple-list--dotted">
                                {renderFieldsForPanel(
                                    'simple-preview',
                                    {
                                        calendars: {enabled: true, index: 1},
                                        agendas: {enabled: true, index: 2},
                                        item_type: {enabled: true, index: 3},
                                        state: {enabled: true, index: 4},
                                    },
                                    {
                                        item: this.props.filter
                                    },
                                    {
                                        calendars: {field: 'params.calendars'},
                                        agendas: {field: 'params.agendas'},
                                        state: {field: 'params.state'},
                                    }
                                )}
                            </ul>

                            <h3>{gettext('Filtered By')}</h3>
                            <ul className="simple-list simple-list--dotted">
                                {renderFieldsForPanel(
                                    'simple-preview',
                                    {
                                        place: {enabled: true, index: 1},
                                        anpa_category: {enabled: true, index: 2},
                                        subject: {enabled: true, index: 3},
                                        g2_content_type: {enabled: true, index: 4},
                                        featured: {enabled: true, index: 5},
                                        source: {enabled: true, index: 6},
                                        location: {enabled: true, index: 7},
                                        name: {enabled: true, index: 8},
                                        no_coverage: {enabled: true, index: 9},
                                        posted: {enabled: true, index: 10},
                                        reference: {enabled: true, index: 11},
                                        slugline: {enabled: true, index: 12},
                                        spike_state: {enabled: true, index: 13},
                                        urgency: {enabled: true, index: 14},
                                    },
                                    {
                                        item: this.props.filter.params
                                    },
                                    {
                                    }
                                )}
                            </ul>

                            <h3>{gettext('Date Filters')}</h3>
                            <ul className="simple-list simple-list--dotted">
                                {renderFieldsForPanel(
                                    'simple-preview',
                                    {
                                        date_filter: {enabled: true, index: 1},
                                        start_date: {enabled: true, index: 2},
                                        end_date: {enabled: true, index: 3},
                                    },
                                    {
                                        item: this.props.filter.params
                                    },
                                    {
                                    }
                                )}
                            </ul>
                        </SidePanel.ContentBlockInner>
                    </SidePanel.ContentBlock>
                </SidePanel.Content>
            </React.Fragment>
        );
    }
}
