import React, { useState, useEffect, useRef } from 'react';
import { TileLayer, LayersControl, GeoJSON, Marker, Popup, useMapEvents } from 'react-leaflet';
// Refernce: https://javascript.plainenglish.io/react-leaflet-v3-creating-a-mapping-application-d5477f19bdeb
import L from 'leaflet';
import './App.css';
import './index.css';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Responsive from '@amcharts/amcharts5/themes/Responsive';
import { statusLotColor, statusLotLabel, statusLotQuery } from './StatusUniqueValues';

// Dispose function
function maybeDisposeRoot(divId: any) {
  am5.array.each(am5.registry.rootElements, function (root) {
    if (root.dom.id === divId) {
      root.dispose();
    }
  });
}

const Layers = (props: any) => {
  const pieSeriesRef = useRef<unknown | any | undefined>({});
  const legendRef = useRef<unknown | any | undefined>({});
  const chartRef = useRef<unknown | any | undefined>({});
  const [lotData, setLotData] = useState([
    {
      category: String,
      value: Number,
      sliceSettings: {
        fill: am5.color('#00c5ff'),
      },
    },
  ]);
  const [selectedStateChart, setSelectedStateChart] = useState<any>();

  const chartID = 'pie-two';

  const [lotNumber, setLotNumber] = useState([]);
  const [handedOverPteNumber, setHandedOverPteNumber] = useState([]);

  useEffect(() => {
    if (props.chartdata !== undefined) {
      setLotData(props.chartdata);
    }
  }, [props.chartdata]);

  useEffect(() => {
    // Dispose previously created root element

    maybeDisposeRoot(chartID);

    var root = am5.Root.new(chartID);
    root.container.children.clear();
    root._logo?.dispose();

    // Set themesf
    // https://www.amcharts.com/docs/v5/concepts/themes/
    root.setThemes([am5themes_Animated.new(root), am5themes_Responsive.new(root)]);

    // Create chart
    // https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/
    var chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
      }),
    );
    chartRef.current = chart;

    // Create series
    // https://www.amcharts.com/docs/v5/charts/percent-charts/pie-chart/#Series
    var pieSeries = chart.series.push(
      am5percent.PieSeries.new(root, {
        name: 'Series',
        categoryField: 'category',
        valueField: 'value',
        //legendLabelText: "[{fill}]{category}[/]",
        legendValueText: "{valuePercentTotal.formatNumber('#.')}% ({value})",
        radius: am5.percent(45), // outer radius
        innerRadius: am5.percent(20),
        scale: 2,
      }),
    );
    pieSeriesRef.current = pieSeries;
    chart.series.push(pieSeries);

    // Set slice opacity and stroke color
    pieSeries.slices.template.setAll({
      fillOpacity: 0.9,
      stroke: am5.color('#ffffff'),
      strokeWidth: 0.5,
      strokeOpacity: 1,
      templateField: 'sliceSettings',
    });

    // Disabling labels and ticksll
    pieSeries.labels.template.set('visible', false);
    pieSeries.ticks.template.set('visible', false);

    // EventDispatcher is disposed at SpriteEventDispatcher...
    // It looks like this error results from clicking events
    pieSeries.slices.template.events.on('click', (ev) => {
      const selected: any = ev.target.dataItem?.dataContext;
      const stateSelected: string = selected.category;
      const find = statusLotQuery.find((emp: any) => emp.category === stateSelected);
      const stateSelectedValue = find?.value;
      setSelectedStateChart(stateSelectedValue);
    });

    pieSeries.data.setAll(lotData);

    // Legend
    // https://www.amcharts.com/docs/v5/charts/percent-charts/legend-percent-series/
    var legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.percent(50),
        x: am5.percent(50),
        scale: 1.15,
      }),
    );
    legendRef.current = legend;
    legend.data.setAll(pieSeries.dataItems);

    // Change the size of legend markers
    legend.markers.template.setAll({
      width: 18,
      height: 18,
    });

    // Change the marker shape
    legend.markerRectangles.template.setAll({
      cornerRadiusTL: 10,
      cornerRadiusTR: 10,
      cornerRadiusBL: 10,
      cornerRadiusBR: 10,
    });

    // Responsive legend
    // https://www.amcharts.com/docs/v5/tutorials/pie-chart-with-a-legend-with-dynamically-sized-labels/
    // This aligns Legend to Left
    chart.onPrivate('width', function (width: any) {
      const boxWidth = 190; //props.style.width;
      var availableSpace = Math.max(width - chart.height() - boxWidth, boxWidth);
      //var availableSpace = (boxWidth - valueLabelsWidth) * 0.7
      legend.labels.template.setAll({
        width: availableSpace,
        maxWidth: availableSpace,
      });
    });

    // To align legend items: valueLabels right, labels to left
    // 1. fix width of valueLabels
    // 2. dynamically change width of labels by screen size

    // Change legend labelling properties
    // To have responsive font size, do not set font size
    legend.labels.template.setAll({
      oversizedBehavior: 'truncate',
      fill: am5.color('#ffffff'),
      //textDecoration: "underline"
      //width: am5.percent(200)
      //fontWeight: "300"
    });

    legend.valueLabels.template.setAll({
      textAlign: 'right',
      //width: valueLabelsWidth,
      fill: am5.color('#ffffff'),
      //fontSize: LEGEND_FONT_SIZE,
    });

    legend.itemContainers.template.setAll({
      // set space between legend items
      paddingTop: 3,
      paddingBottom: 1,
    });

    pieSeries.appear(1000, 100);

    return () => {
      root.dispose();
    };
  }, [chartID, lotData]);

  useEffect(() => {
    pieSeriesRef.current?.data.setAll(lotData);
    legendRef.current?.data.setAll(pieSeriesRef.current.dataItems);
  });
  //////////////////// End of Chart ////////////////////////////////

  ////////////////////// Layers ////////////////////////////////////
  const [usaData, setUsaData] = useState<any | null>([]);
  const [legendClick, setLegendClicked] = useState<any>();
  const [borderSelected, setBorderSelected] = useState<L.GeoJSON | any>(
    L.geoJSON(props.data, {
      style: highlightStyle,
    }),
  );
  const [resetClick, setResetClick] = useState<boolean>(false);
  const [defaultTotalNumberLots, setDefaultTotalNumberLots] = useState<any>();
  const [totalNumberLots, setTotalNumberLots] = useState<any>();

  // Call useMap
  // const map = useMap();
  const map = useMapEvents({
    zoomend: () => {
      // console.log(map.getZoom());
    },
    moveend: () => {
      // console.log(map.getBounds());
    },
  });

  // Polygon color style
  function defaultStyle(feature: any) {
    var status = feature.properties.StatusNVS3;
    return {
      fillColor: getColor(status),
      fillOpacity: 0.7,
      weight: 1,
      opacity: 0.7,
      dashArray: 3,
      color: 'black',
    };
  }

  function highlightStyle(feature: any) {
    return {
      fillColor: '#00FFFF',
      fillOpacity: 0.9,
      weight: 4,
      stroke: true,
      color: '#00FFFF',
    };
  }

  function noStyle(feature: any) {
    return {
      fillColor: 'rgb(0, 0, 0, 0)',
      stroke: false,
    };
  }

  // Filter Status data when clicked on Chart
  useEffect(() => {
    if (selectedStateChart) {
      // Filter props.data based on selected props.state
      console.log(props.state);
      const filtered_data = props.data.filter((a: any) =>
        props.state === null || props.state === 'All'
          ? a.properties.StatusNVS3 === selectedStateChart
          : a.properties.StatusNVS3 === selectedStateChart && a.properties.Station1 === props.state,
      );
      borderSelected.removeFrom(map);
      const border = L.geoJSON(filtered_data, {
        style: highlightStyle,
      }).addTo(map);
      setBorderSelected(border);

      // Zoom to the selected states
      map.fitBounds(border.getBounds());
    }
  }, [selectedStateChart]);

  // total number of lots when first open
  useEffect(() => {
    if (props.data) {
      const total_n = props.data.map((property: any, sum: any) => {
        sum = sum + 1;
      });
      setDefaultTotalNumberLots(total_n.length);
    }
  });

  // Zoom to the selected polygon
  useEffect(() => {
    if (props.state && props.state !== 'All') {
      setUsaData(props.state);

      // Filter props.data based on selected props.state

      const filtered_data = props.data.filter((a: any) => a.properties.Station1 === props.state);

      borderSelected.removeFrom(map);
      const border = L.geoJSON(filtered_data[0]);
      setBorderSelected(border);

      const total_n = filtered_data.map((property: any, sum: any) => {
        sum = sum + 1;
      });
      setTotalNumberLots(total_n.length);

      // Zoom to the selected states
      map.fitBounds(border.getBounds());
    } else if (props.state === 'All') {
      borderSelected.removeFrom(map);
      const border_all = L.geoJSON(props.data);
      setBorderSelected(border_all);

      map.fitBounds(border_all.getBounds());

      // Calculate total number of lots
      const total_n = props.data.map((property: any, sum: any) => {
        sum = sum + 1;
      });
      setTotalNumberLots(total_n.length);
    }
  }, [props.state]);

  // Click legend
  useEffect(() => {
    // Remove border selected style when 'reset' is clicked.
    // borderSelected.removeFrom(map);
    if (legendClick) {
      const clicked_value = Number(legendClick);
      const lowest_value = 200;
      const highest_value = 1000;
      const interval = 200;
      const lower_bound = clicked_value - interval;

      // Zoom and Style
      const filtered_data = props.data.filter((a: any) =>
        clicked_value === lowest_value
          ? a.properties.density < clicked_value
          : clicked_value === highest_value
            ? a.properties.density > highest_value
            : a.properties.density >= lower_bound && a.properties.density < clicked_value,
      );

      // Highlight selected polygons
      borderSelected.removeFrom(map);
      const border = L.geoJSON(filtered_data, {
        style: highlightStyle,
      }).addTo(map);
      setBorderSelected(border);
      map.fitBounds(border.getBounds());
    }
  }, [legendClick]);

  // Reset style when clicking anywhere on the map
  useEffect(() => {
    borderSelected.removeFrom(map);
  }, [resetClick]);

  // Label
  function onEachFeature(feature: any, layer: any) {
    // does this feature have a property named popupContent?

    if (feature.properties) {
      layer.bindTooltip(feature.properties.CN, {
        permanent: true,
        direction: 'center',
        className: 'my-labels',
      });
      layer.on('click', (event: any) => {
        const popup_name = feature.properties.Station1;
        const popup_id = feature.properties.Id;
        const popup_owner = feature.properties.OWNER;

        const status_field = feature.properties.StatusNVS3;
        const popup_status_n = !status_field ? '' : status_field;
        const popu_status = !status_field
          ? 'Undefined'
          : statusLotQuery[popup_status_n - 1].category;
        const popup_contents = `<b style="color:blue">${popup_name}</b> </br>
                                    Status: ${popu_status}</br>
                                    LotID: ${popup_id}</br>
                                    Lot Owner: ${popup_owner}
                                    `;
        layer.bindPopup(popup_contents);
      });
    }
  }

  // Polygon color
  function getColor(status: any) {
    return status === 1
      ? statusLotColor[0]
      : status === 2
        ? statusLotColor[1]
        : status === 3
          ? statusLotColor[2]
          : status === 4
            ? statusLotColor[3]
            : status === 5
              ? statusLotColor[4]
              : status === 6
                ? statusLotColor[5]
                : status === 7
                  ? statusLotColor[6]
                  : '#fff5eb';
  }

  // filter geoJson layer
  // make sure to use props.state instead of useState
  // otherwise, it will not be updated properly.
  const filterGeo = (feature: any) => {
    if (props.state === 'All') {
      return props.data;
    } else {
      return props.state.includes(feature.properties.Station1);
    }
  };

  // Initial state is display all states
  const initialFilterGeo = () => {
    return props.data;
  };

  return (
    <>
      <div
        // border border-slate-500
        className="bg-slate-800 h-full border-r-4 border-slate-500"
        style={{
          position: 'absolute',
          zIndex: '900',
          // height: '100%',
          width: '350px',
          // backgroundColor: '#000',
          color: 'white',
        }}
      >
        <div className="text-2xl mt-3 ml-2">
          Total Lots
          <div className="text-6xl text-orange-500 text-center font-bold pt-4">
            {!totalNumberLots ? defaultTotalNumberLots : totalNumberLots}
          </div>
        </div>

        <div
          id={chartID}
          className="mt-5 border-t-4 border-slate-500"
          style={{
            height: '50%',
            color: 'white',
          }}
        >
          <div className="text-2xl mt-3 ml-2 mb-3">Land Acquisition</div>
        </div>
      </div>

      <button
        className="bg-slate-800 text-md border border-slate-500"
        style={{
          position: 'absolute',
          zIndex: '900',
          height: '35px',
          width: '5%',

          color: 'white',
          bottom: '30px',
          right: '200px',
        }}
        onClick={() => setResetClick(resetClick === false ? true : false)}
      >
        Reset
      </button>
      <GeoJSON
        key={JSON.stringify(props.data, usaData, props.state)}
        data={props.data}
        eventHandlers={{
          click: (event: any) => {
            const id = event.layer.feature.properties.name;
            // setPopupText(id);
            // setPopupClicked(popupClicked === false ? true : false); // this ensures popupClicked is changed when clicked
          },
        }}
        filter={props.state === null ? initialFilterGeo : filterGeo}
        style={
          (!props.state && !legendClick && defaultStyle) ||
          (props.state && legendClick && defaultStyle) ||
          (props.state && !legendClick && defaultStyle)
        }
        onEachFeature={onEachFeature}
      />

      {/* Legend */}
      {/* Reference: https://docs.maptiler.com/leaflet/examples/choropleth-geojson/ */}
      <div id="state-legend" className="bg-slate-800 border border-slate-500">
        <h4 className="text-md text-center">Status of Land Acquisition</h4>
        {statusLotLabel.map((label: any, index: any) => {
          return (
            <div key={index} onClick={(event) => setLegendClicked(event.currentTarget.innerText)}>
              <span style={{ backgroundColor: statusLotColor[index] }}></span>
              {label}
            </div>
          );
        })}
      </div>

      <Marker position={[44.0011, -92.92177]}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Basic Map">
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topo Map">
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
    </>
  );
};

export default Layers;
