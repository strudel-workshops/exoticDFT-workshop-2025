import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
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
import { SciDataGrid } from '../../../components/SciDataGrid';
import { Box } from '@mui/system';
import {
  iqrOutlierRemover,
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

      const newTableData = unixTime.map((time, index) => ({
        id: time,
        time: new Date(time).toLocaleString(),
        observedFlux: observedFlux[index],
        adjustedFlux: adjustedFlux[index],
      }));

      if (!showOutliers) {
        let filteredData;
        if (outlierModel === 'iqr') {
          filteredData = iqrOutlierRemover(newTableData, 'observedFlux');
        } else {
          filteredData = movingAverageOutlierRemover(
            newTableData,
            'observedFlux'
          );
        }

        setTableData(filteredData);
        setPlotData(
          filteredData.map((d) => ({
            ...d,
            time: new Date(d.time),
          }))
        );
      } else {
        setTableData(newTableData);
        setPlotData(
          newTableData.map((d) => ({
            ...d,
            time: new Date(d.time),
          }))
        );
      }
    }
  }, [laspData, showOutliers, outlierModel]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (isSuccess) {
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
          </Box>
        </Box>
        {view === 'plot' ? (
          <Plot
            data={[
              {
                x: plotData.map((d) => d.time),
                y: plotData.map((d) => d.observedFlux),
                type: 'scatter',
                mode: 'lines',
                name: 'Observed Flux',
              },
              {
                x: plotData.map((d) => d.time),
                y: plotData.map((d) => d.adjustedFlux),
                type: 'scatter',
                mode: 'lines',
                name: 'Adjusted Flux',
              },
            ]}
            layout={{
              title: 'Penticton Radio Flux',
              xaxis: {
                title: 'Time',
              },
              yaxis: {
                title: 'Flux',
              },
            }}
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
            }}
          />
        ) : (
          <SciDataGrid
            rows={tableData}
            columns={[
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
            ]}
          />
        )}
      </Box>
    );
  }
}
