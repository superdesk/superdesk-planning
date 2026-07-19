from quart import render_template_string

from superdesk.core.web import EndpointGroup
from superdesk.core.openapi import OpenAPISpec

from planning.types.unified import UnifiedPlanningResource


unified_resource_docs_endpoints = EndpointGroup("unified_resource_docs", __name__)
docs_html = """<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="redoc-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"> </script>
    <script>
        const spec = {{ spec | tojson }};
        Redoc.init(spec, {showExtensions: true}, document.getElementById('redoc-container'));
    </script>
  </body>
</html>"""


@unified_resource_docs_endpoints.endpoint("/planning/docs", auth=False)
async def unified_resource_docs():
    spec = get_spec()
    spec.spec.setdefault("theme", {}).setdefault("openapi", {})["showExtensions"] = True
    return await render_template_string(docs_html, spec=spec.to_dict())


def get_spec():
    return (
        OpenAPISpec(title="Unified Planning Resource", description="Planning", api_version="3.6.0")
        .add_tag("Unified Resource", "Unified Planning Resource")
        .add_model(UnifiedPlanningResource, tags=["Unified Resource"])
        .remove_additional_properties_from_top_level()
    )
