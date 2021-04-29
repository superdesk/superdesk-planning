import * as React from 'react';
import {connect} from 'react-redux';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {
    IContactItem,
    IEditorAPI,
    IG2ContentType,
    IPlanningAppState,
    IPlanningCoverageItem,
    IBookmarkProps,
    IPlanningItem,
} from '../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';
import {planningApi} from '../../../superdeskApi';

import * as selectors from '../../../selectors';
import {planningUtils} from '../../../utils';

import {Icon} from 'superdesk-ui-framework/react';
import {CoverageEditor} from '../../Coverages';

interface IProps extends IBookmarkProps {
    users: Array<IUser>;
    desks: Array<IDesk>;
    contentTypes: Array<IG2ContentType>;
    contacts: {[key: string]: IContactItem};
    item?: DeepPartial<IPlanningItem>;
}

const mapStateToProps = (state: IPlanningAppState) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    contacts: selectors.general.contacts(state),
});

class CoveragesBookmarkComponent extends React.PureComponent<IProps> {
    editorApi: IEditorAPI;

    constructor(props) {
        super(props);

        this.editorApi = planningApi.editor(this.props.editorType);
    }

    getCoverageEditorInstance(coverageId: IPlanningCoverageItem['coverage_id']): CoverageEditor | undefined {
        return this.editorApi.dom.fields[`coverage_${coverageId}`]?.current;
    }

    onClick(coverage: DeepPartial<IPlanningCoverageItem>) {
        this.getCoverageEditorInstance(coverage.coverage_id)?.scrollInView();
    }

    render() {
        const getCoverageIcon = (coverage) => (
            planningUtils.getCoverageIcon(
                planningUtils.getCoverageContentType(coverage, this.props.contentTypes),
                coverage
            ).substr(5) // remove `icon-` from the name
        );

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
                    <Icon name={getCoverageIcon(coverage)} />
                </button>
            </OverlayTrigger>
        ));
    }
}

export const CoveragesBookmark = connect(mapStateToProps)(CoveragesBookmarkComponent);
