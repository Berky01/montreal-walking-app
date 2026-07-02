import { getRoutes } from "@/lib/data/index";
import { routesToFeatureCollection } from "@/lib/data/geojson";

const collection = routesToFeatureCollection(getRoutes());

console.log(JSON.stringify(collection, null, 2));
