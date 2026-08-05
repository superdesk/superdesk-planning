from superdesk.core.elastic.mapping import get_elastic_mapping_from_model
from planning.types.unified import UnifiedPlanningResource
from planning.tests import TestCase

from .expected_es_mapping import expected_es_mapping


class TestUnifiedPlanningElasticsearch(TestCase):
    async def test_elastic_mapping(self):
        self.maxDiff = None
        es_mapping = get_elastic_mapping_from_model(
            UnifiedPlanningResource.model_resource_name, UnifiedPlanningResource
        )
        self.assertEqual(es_mapping, expected_es_mapping)
