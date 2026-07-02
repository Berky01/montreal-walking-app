import { getAllRoutes } from "@/lib/data/index";
import { routesToFeatureCollection } from "@/lib/data/geojson";

const collection = routesToFeatureCollection(getAllRoutes());

console.log(JSON.stringify(collection, null, 2));
