import * as React from 'react';
import {connect} from 'react-redux';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {
    EDITOR_TYPE,
    IBookmarkProps,
    IContactItem,
    IEditorAPI,
    IG2ContentType,
    IPlanningAppState,
    IPlanningCoverageItem,
    IPlanningItem,
} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../../superdeskApi';

import * as selectors from '../../../selectors';
import {planningUtils} from '../../../utils';

import {Icon} from 'superdesk-ui-framework/react';
import {Row} from '../../UI/Form';
import * as List from '../../UI/List';
import {CoverageEditor, CoverageItem} from '../../Coverages';

interface IProps extends IBookmarkProps {
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    contacts: {[key: string]: IContactItem};
    item?: DeepPartial<IPlanningItem>;
}

interface IState {
    showCoverages: boolean;
}

const mapStateToProps = (state: IPlanningAppState) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    contacts: selectors.general.contacts(state),
});

class CoveragesBookmarkComponent extends React.Component<IProps, IState> {
    editorApi: IEditorAPI;

    constructor(props) {
        super(props);

        this.state = {showCoverages: true};

        this.editorApi = planningApi.editor(this.props.editorType);
        this.toggleCoverages = this.toggleCoverages.bind(this);
    }

    getCoverageEditorInstance(coverageId: IPlanningCoverageItem['coverage_id']): CoverageEditor | undefined {
        return this.editorApi.dom.fields[`coverage_${coverageId}`]?.current;
    }

    onClick(coverage: DeepPartial<IPlanningCoverageItem>) {
        this.getCoverageEditorInstance(coverage.coverage_id)?.scrollInView();
    }

    toggleCoverages() {
        this.setState({showCoverages: !this.state.showCoverages});
    }

    getCoverageIcon(coverage: DeepPartial<IPlanningCoverageItem>) {
        return planningUtils.getCoverageIcon(
            planningUtils.getCoverageContentType(coverage, this.props.contentTypes),
            coverage
        ).substr(5); // remove `icon-` from the name
    }

    renderForPanel() {
        return (this.props.item?.coverages ?? []).map((coverage) => (
            <OverlayTrigger
                key={coverage.coverage_id}
                placement="right"
                overlay={(
                    <Tooltip id="coverage_links">
                        Coverage Links
                    </Tooltip>
                )}
            >
                <button
                    type="button"
                    className={classNames(
                        'sd-navbtn sd-navbtn--default',
                        'editor-bookmark',
                        {active: this.props.active}
                    )}
                    tabIndex={0}
                    aria-label={this.props.bookmark.id}
                    onClick={() => {
                        this.onClick(coverage);
                    }}
                >
                    <Icon name={this.getCoverageIcon(coverage)} />
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
                    aria-label="associated_coverages"
                    onClick={this.toggleCoverages}
                >
                    <span className="sd-d-flex sd-flex-grow">
                        {gettext('Coverages')}
                    </span>
                    <Icon name={this.state.showCoverages ? 'chevron-up-thin' : 'chevron-down-thin'} />
                </button>
                {!this.state.showCoverages ? null : (
                    <div className="related-plannings">
                        <div className="planning-item sd-padding-y--1-5 sd-padding-x--2">
                            {this.props.item.coverages.map((coverage, index) => (
                                <Row
                                    key={coverage.coverage_id}
                                    noPadding={true}
                                >
                                    <List.Group spaceBetween={true}>
                                        <CoverageItem
                                            coverage={coverage}
                                            isPreview={true}
                                            item={this.props.item}
                                            index={index}
                                            showBackground={true}
                                            shadow={1}
                                            onClick={() => {
                                                this.onClick(coverage);
                                            }}
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
        if (!this.props.item?.coverages?.length) {
            return null;
        }

        return this.props.editorType === EDITOR_TYPE.POPUP ?
            this.renderForPopup() :
            this.renderForPanel();
    }
}

export const CoveragesBookmark = connect(mapStateToProps)(CoveragesBookmarkComponent);
