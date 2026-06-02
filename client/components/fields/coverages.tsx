import React from 'react';

import {connect} from 'react-redux';
import {IDesk, IUser} from 'superdesk-api';
import {IFieldsProps, IG2ContentType, IPlanningAppState, IPlanningCoverageItem} from 'interfaces';
import {isPlanning} from '../../utils';
import * as selectors from '../../selectors';
import {CoverageIcons} from '../../components/Coverages/CoverageIcons';

interface IOwnProps extends IFieldsProps {
    fieldsProps: {
        coverages?: {
            /**
             * Needed when coverages need to be adjusted before being displayed. e.g. filtered
             */
            prepare?(coverages: Array<IPlanningCoverageItem>): Array<IPlanningCoverageItem>;
        };
    };
}

interface IReduxStateProps {
    contentTypes: Array<IG2ContentType>;
    desks: Array<IDesk>;
    users: Array<IUser>;
}

type IProps = IOwnProps & IReduxStateProps;

const CoveragesComponent: React.FunctionComponent<IProps> = (props) => {
    const {
        users,
        desks,
        contentTypes,
        item,
        fieldsProps,
    } = props;

    if (!isPlanning(item)) {
        return null;
    }

    const coverages = item?.coverages ?? [];
    const prepare = fieldsProps?.coverages?.prepare ?? ((_items) => _items);

    return (
        <CoverageIcons
            coverages={prepare(coverages)}
            users={users}
            desks={desks}
            contentTypes={contentTypes}
        />
    );
};

const mapStateToProps = (state: IPlanningAppState): IReduxStateProps => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
});

export const coverages = connect(
    mapStateToProps,
)(CoveragesComponent);
