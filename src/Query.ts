import { statusLotLabel, statusLotQuery } from './StatusUniqueValues';
import * as am5 from '@amcharts/amcharts5';

export function uniqueValue(arr: any) {
  let outputArray = Array.from(new Set(arr));
  return outputArray;
}

export const updatechartData = (dataObj: any, station: any) => {
  let status_all: any = [];
  if (station === 'All') {
    dataObj.map((property: any, index: any) => {
      if (property.properties && property.properties.StatusNVS3) {
        status_all.push(property.properties.StatusNVS3);
      }
    });
  } else {
    // const filtered_data = dataObj.filter((a: any) => a.properties.Station1 === station);
    dataObj.map((property: any, index: any) => {
      if (property.properties && property.properties.StatusNVS3) {
        status_all.push(property.properties.StatusNVS3);
      }
    });
  }

  // Count for each status
  let counts: any = {};
  status_all.forEach((x: any) => {
    counts[x] = (counts[x] || 0) + 1;
  });

  // compiling for chart
  const chartArray = statusLotLabel.map((status: any, index: any) => {
    return Object.assign({
      category: statusLotLabel[index],
      value: counts[index + 1] ? counts[index + 1] : 0,
      sliceSettings: {
        fill: am5.color(statusLotQuery[index].color),
      },
    });
  });

  return chartArray;
};
