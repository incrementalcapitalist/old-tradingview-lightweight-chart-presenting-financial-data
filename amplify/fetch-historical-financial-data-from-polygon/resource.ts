import { defineFunction } from "@aws-amplify/backend";
    
export const fetchHistoricalFinancialDataFromPolygon = defineFunction({
  name: "fetch-historical-financial-data-from-polygon",
  entry: "./handler.ts"
});
