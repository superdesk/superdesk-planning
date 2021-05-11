import * as React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {EDITOR_TYPE, IBookmarkProps, IEventItem, IPlanningItem} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

import {Icon} from 'superdesk-ui-framework/react';
import * as List from '../../UI/List';
import {Row} from '../../UI/Form';
import {RelatedPlanningListItem} from '../../RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';

interface IProps extends IBookmarkProps {
    item?: DeepPartial<IEventItem>;
}

interface IState {
    showPlannings: boolean;
}

export class AssociatedPlanningsBookmark extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {showPlannings: true};

        this.onClick = this.onClick.bind(this);
        this.togglePlannings = this.togglePlannings.bind(this);
    }

    onClick(plan: DeepPartial<IPlanningItem>) {
        const editor = planningApi.editor(this.props.editorType);
        const node = editor.item.events.getRelatedPlanningDomRef(plan._id);

        if (node.current != null) {
            node.current.scrollIntoView();
            editor.form
                .waitForScroll()
                .then(() => {
                    node.current.focus();
                });
        }
    }

    togglePlannings() {
        this.setState({showPlannings: !this.state.showPlannings});
    }

    renderForPanel() {
        const {gettext} = superdeskApi.localization;

        return this.props.item.associated_plannings.map((plan, index) => (
            <OverlayTrigger
                key={plan._id}
                placement="right"
                overlay={(
                    <Tooltip id="associated_plannings">
                        {gettext('Planning: {{ name }}', {
                            name: plan.slugline || plan.headline || plan.name,
                        })}
                    </Tooltip>
                )}
            >
                <button
                    data-test-id={`editor--bookmarks__planning-${index}`}
                    type="button"
                    className={classNames(
                        'sd-navbtn sd-navbtn--default',
                        'editor-bookmark',
                        {active: this.props.active}
                    )}
                    tabIndex={0}
                    aria-label={this.props.bookmark.id}
                    onClick={() => {
                        this.onClick(plan);
                    }}
                >
                    <Icon name="calendar" />
                </button>
            </OverlayTrigger>
        ));
    }

    renderForPopup() {
        const {gettext} = superdeskApi.localization;

        return (
            <React.Fragment>
                <button
                    key={this.props.bookmark.id}
                    type="button"
                    className="sd-navbtn sd-navbtn--default sd-padding-l--2"
                    style={{width: '100%'}}
                    tabIndex={0}
                    aria-label="associated_plannings"
                    onClick={this.togglePlannings}
                >
                    <span className="sd-d-flex sd-flex-grow">
                        {gettext('Related Plannings')}
                    </span>
                    <Icon name={this.state.showPlannings ? 'chevron-up-thin' : 'chevron-down-thin'} />
                </button>
                {!this.state.showPlannings ? null : (
                    <div className="related-plannings">
                        <div className="planning-item sd-padding-y--1-5 sd-padding-x--2">
                            {this.props.item.associated_plannings.map((item) => (
                                <Row
                                    key={item._id}
                                    noPadding={true}
                                >
                                    <List.Group spaceBetween={true}>
                                        <RelatedPlanningListItem
                                            item={item}
                                            shadow={1}
                                            showIcon={true}
                                            onClick={() => this.onClick(item)}
                                        />
                                    </List.Group>
                                </Row>
                            ))}
                        </div>
                    </div>
                )}
            </React.Fragment>
        );
    }

    render() {
        if (!this.props.item?.associated_plannings?.length) {
            return null;
        }

        return this.props.editorType === EDITOR_TYPE.POPUP ?
            this.renderForPopup() :
            this.renderForPanel();
    }
}
