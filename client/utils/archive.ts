import {IArticle} from 'superdesk-api';
import {appConfig} from 'appConfig';

export function isContentLinkToCoverageAllowed(item: IArticle) {
    const config = appConfig;

    return !config?.planning?.allowed_coverage_link_types?.length ?
        true :
        config.planning.allowed_coverage_link_types.includes(item.type);
}
