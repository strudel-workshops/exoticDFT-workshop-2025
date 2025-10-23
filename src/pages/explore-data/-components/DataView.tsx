import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import { useEffect, useState } from 'react';
import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  SciDataGrid,
  SciDataGridColDef,
} from '../../../components/SciDataGrid';
import { Box } from '@mui/system';
import {
  iqrOutlierRemover,
  movingAverage,
  movingAverageOutlierRemover,
} from '../../../utils/outliers';

async function getLaspData() {
  const response = await fetch(
    'https://lasp.colorado.edu/space-weather-portal/latis/dap/penticton_radio_flux.jsond'
  );
  const data = await response.json();
  return data;
}

export function DataView() {
  const [view, setView] = useState('plot');
  const [showOutliers, setShowOutliers] = useState(true);
  const [outlierModel, setOutlierModel] = useState<'iqr' | 'movingAverage'>(
    'iqr'
  );
  const [showMovingAverage, setShowMovingAverage] = useState(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState(5);

  const {
    isPending,
    isError,
    isSuccess,
    data: laspData,
    error,
  } = useQuery({
    queryKey: ['laspData'],
    queryFn: getLaspData,
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [plotData, setPlotData] = useState<any[]>([]);

  useEffect(() => {
    if (laspData) {
      const unixTime: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[0]
      );

      const observedFlux: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[1]
      );

      const adjustedFlux: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[2]
      );

      let newTableData = unixTime.map((time, index) => ({
        id: time,
        time: new Date(time).toLocaleString(),
        observedFlux: observedFlux[index],
        adjustedFlux: adjustedFlux[index],
      }));

      if (!showOutliers) {
        if (outlierModel === 'iqr') {
          newTableData = iqrOutlierRemover(
            newTableData,
            'observedFlux'
          ) as any[];
        } else {
          newTableData = movingAverageOutlierRemover(
            newTableData,
            'observedFlux'
          ) as any[];
        }
      }

      setPlotData(
        newTableData.map((d) => ({
          ...d,
          time: new Date(d.time),
        }))
      );
    }
  }, [laspData, showOutliers, outlierModel]);

  useEffect(() => {
    if (laspData) {
      const unixTime: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[0]
      );

      const observedFlux: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[1]
      );

      const adjustedFlux: number[] = laspData.penticton_radio_flux.data.map(
        (i: (string | number)[]) => i[2]
      );

      let newTableData = unixTime.map((time, index) => ({
        id: time,
        time: new Date(time).toLocaleString(),
        observedFlux: observedFlux[index],
        adjustedFlux: adjustedFlux[index],
      }));

      if (showMovingAverage) {
        const observedMovingAverage = movingAverage(
          newTableData,
          'observedFlux',
          movingAverageWindow
        );
        const adjustedMovingAverage = movingAverage(
          newTableData,
          'adjustedFlux',
          movingAverageWindow
        );
        newTableData = newTableData.map((d, i) => ({
          ...d,
          observedMovingAverage: observedMovingAverage[i],
          adjustedMovingAverage: adjustedMovingAverage[i],
        }));
      }

      if (!showOutliers) {
        if (outlierModel === 'iqr') {
          newTableData = iqrOutlierRemover(
            newTableData,
            'observedFlux'
          ) as any[];
        } else {
          newTableData = movingAverageOutlierRemover(
            newTableData,
            'observedFlux'
          ) as any[];
        }
      }
      setTableData(newTableData);
    }
  }, [
    laspData,
    showOutliers,
    outlierModel,
    showMovingAverage,
    movingAverageWindow,
  ]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (isSuccess) {
    const columns: SciDataGridColDef[] = [
      { field: 'time', headerName: 'Time', flex: 1 },
      {
        field: 'observedFlux',
        headerName: 'Observed Flux',
        flex: 1,
        type: 'number',
      },
      {
        field: 'adjustedFlux',
        headerName: 'Adjusted Flux',
        flex: 1,
        type: 'number',
      },
      ...(showMovingAverage
        ? ([
            {
              field: 'observedMovingAverage',
              headerName: 'Observed Moving Average',
              flex: 1,
              type: 'number',
            },
            {
              field: 'adjustedMovingAverage',
              headerName: 'Adjusted Moving Average',
              flex: 1,
              type: 'number',
            },
          ] as SciDataGridColDef[])
        : []),
    ];
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_event, newView) => {
              if (newView !== null) {
                setView(newView);
              }
            }}
            aria-label="data view"
          >
            <ToggleButton value="plot" aria-label="plot view">
              Plot
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              Table
            </ToggleButton>
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!showOutliers}
                  onChange={(e) => setShowOutliers(!e.target.checked)}
                />
              }
              label="Remove Outliers"
            />
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="outlier-model-select-label">Model</InputLabel>
              <Select
                labelId="outlier-model-select-label"
                id="outlier-model-select"
                value={outlierModel}
                label="Model"
                onChange={(e) =>
                  setOutlierModel(e.target.value as 'iqr' | 'movingAverage')
                }
                disabled={showOutliers}
              >
                <MenuItem value="iqr">IQR</MenuItem>
                <MenuItem value="movingAverage">Moving Average</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={showMovingAverage}
                  onChange={(e) => setShowMovingAverage(e.target.checked)}
                />
              }
              label="Show Moving Average"
            />
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <InputLabel id="moving-average-window-label">Window</InputLabel>
              <Select
                labelId="moving-average-window-label"
                id="moving-average-window-select"
                value={movingAverageWindow}
                label="Window"
                onChange={(e) =>
                  setMovingAverageWindow(e.target.value as number)
                }
                disabled={!showMovingAverage}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {view === 'plot' ? (
          <Plot
            data={
              [
                {
                  x: plotData.map((d) => d.time),
                  y: plotData.map((d) => d.observedFlux),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Observed Flux',
                  line: { color: 'rgba(26, 118, 255, 1)' },
                },
                {
                  x: plotData.map((d) => d.time),
                  y: plotData.map((d) => d.adjustedFlux),
                  type: 'scatter',
                  mode: 'lines',
                  name: 'Adjusted Flux',
                  line: { color: 'rgba(255, 26, 118, 1)' },
                },
                ...(showMovingAverage
                  ? [
                      {
                        x: plotData.map((d) => d.time),
                        y: movingAverage(
                          plotData,
                          'observedFlux',
                          movingAverageWindow
                        ),
                        type: 'scatter',
                        mode: 'lines',
                        name: `Observed Moving Average (${movingAverageWindow})`,
                        line: { color: 'rgba(229, 137, 0, 0.5)' },
                      },
                      {
                        x: plotData.map((d) => d.time),
                        y: movingAverage(
                          plotData,
                          'adjustedFlux',
                          movingAverageWindow
                        ),
                        type: 'scatter',
                        mode: 'lines',
                        name: `Adjusted Moving Average (${movingAverageWindow})`,
                        line: { color: 'rgba(0, 229, 137, 0.5)' },
                      },
                    ]
                  : []),
              ] as Data[]
            }
            layout={{
              title: { text: 'Penticton Radio Flux' },
              xaxis: {
                title: { text: 'Time' },
              },
              yaxis: {
                title: { text: 'Flux' },
              },
            }}
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
            }}
          />
        ) : (
          <SciDataGrid rows={tableData} columns={columns} />
        )}
      </Box>
    );
  }
}
