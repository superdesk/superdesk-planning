# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Iterable, List, Optional

from .resource import PlanningResource


def str_to_bool(value: Optional[object], default: bool = False) -> bool:
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    return str(value).strip().lower() in {"1", "true", "t", "yes", "y", "on"}


def construct_planning_link(plan_id: str, coverages: Optional[List[Dict]] = None):
    link = {
        "title": PlanningResource.resource_title,
        "href": f"{PlanningResource.url}/{plan_id}",
        "coverages": coverages or [],
    }

    return link


def extract_coverage_summaries(coverages: Iterable[Dict]) -> List[Dict]:
    summaries = []
    for coverage in coverages:
        summaries.append(
            {
                "coverage_id": coverage.get("coverage_id"),
                "workflow_status": coverage.get("workflow_status"),
                "news_coverage_status": coverage.get("news_coverage_status"),
                "g2_content_type": (coverage.get("planning") or {}).get("g2_content_type"),
            }
        )

    return summaries
