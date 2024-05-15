import React, { Component, useEffect, useState, createContext, useContext, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  Marker,
  Popup,
  ZoomControl,
  Polygon,
  LayersControl,
} from 'react-leaflet';
import Layers from './Layers';
import Select from 'react-select';
import './index.css';
import './App.css';
import { lotStatusField, statusLotLabel, statusLotQuery } from './StatusUniqueValues';
import { uniqueValue } from './Query';
import * as am5 from '@amcharts/amcharts5';

// Read https://react-leaflet.js.org/docs/api-map/
function App() {
  // Dropdown filter
  const [initStations, setInitStations] = useState<null | undefined | any>();
  const [stationSelected, setStationSelected] = useState<null | any>(null);
  const [resetLegend, setResetLegend] = useState<boolean>(true);
  const [testText, setTestText] = useState<any>('');

  const data_usa =
    'https://raw.githubusercontent.com/EijiGorilla/EijiGorilla.github.io/master/WebApp/ArcGIS_API_for_JavaScript/Sample/MMSP_Land_Sample.geojson';
  const [geojsonData, setGeojsonData] = useState([]);
  const [chartData, setChartData] = useState<any>();

  // Function to Add 'All' to dropdown list
  function addDropdown(arr: any, elem: any) {
    if (arr.indexOf(elem) !== -1) {
      return arr;
    }
    arr.push(elem);
    return arr;
  }
  console.log(testText);
  // Read geojson
  useEffect(() => {
    fetch(data_usa)
      .then((response: any) => {
        return response.json();
      })
      .then((data: any) => {
        setGeojsonData(data.features);

        // Create an object array of dropdown values
        let station_all: any = [];
        data.features.map((property: any, index: any) => {
          if (property.properties) {
            station_all.push(property.properties.Station1);
          }
        });
        const dropdownArray = uniqueValue(station_all).map((station: any, index: any) => {
          return Object.assign({
            field1: station,
          });
        });
        const final = addDropdown(dropdownArray, { field1: 'All' });
        setInitStations(final);

        // Create an object array of chart values
        let status_all: any = [];
        data.features.map((property: any, index: any) => {
          if (property.properties && property.properties.StatusNVS3) {
            status_all.push(property.properties.StatusNVS3);
          }
        });
        const chartArray = uniqueValue(status_all)
          .sort()
          .map((status: any, index: any) => {
            return Object.assign({
              category: statusLotLabel[status - 1],
              value: status,
              sliceSettings: {
                fill: am5.color(statusLotQuery[index].color),
              },
            });
          });
        setChartData(chartArray);
      });
  }, []);

  const handleMunicipalityChange = (obj: any) => {
    setStationSelected(obj);
  };

  // Style CSS
  const customstyles = {
    option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
      // const color = chroma(data.color);
      return {
        ...styles,
        backgroundColor: isFocused ? '#999999' : isSelected ? '#2b2b2b' : '#2b2b2b',
        color: '#ffffff',
        padding: '0px 5px',
      };
    },

    control: (defaultStyles: any) => ({
      ...defaultStyles,
      backgroundColor: '#2b2b2b',
      borderColor: '#949494',
      height: 35,
      width: '170px',
      color: '#ffffff',
    }),
    singleValue: (defaultStyles: any) => ({ ...defaultStyles, color: '#fff' }),
  };

  return (
    <div className="parent h-screen flex flex-col border-2 border-slate-500">
      <header
        id="header"
        className="flex items-stretch h-fit p-4 bg-slate-800 text-slate-100 text-2xl border border-slate-500"
      >
        LAND ACQUISITION (Sample)
        {/* Dropdown filter */}
        <div className="dropdownFilterLayout">
          <b className="text-md text-slate-100 px-3 py-1">Station</b>
          <Select
            placeholder="Select Station"
            value={stationSelected}
            options={initStations}
            onChange={handleMunicipalityChange}
            getOptionLabel={(x: any) => x.field1}
            styles={customstyles}
          />
        </div>
      </header>
      <main className="flex-1 flex">
        <MapContainer
          className="flex-1"
          center={[14.6821565, 121.0319746]}
          zoom={16}
          zoomControl={false}
        >
          <Layers
            className="absolute z-90"
            data={geojsonData}
            state={stationSelected && stationSelected.field1}
            legendr={resetLegend}
            chartdata={chartData && chartData}
          />
          <ZoomControl position="topright" />
        </MapContainer>
      </main>
    </div>
  );
}

export default App;
