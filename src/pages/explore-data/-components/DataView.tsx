import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { SciDataGrid } from '../../../components/SciDataGrid';
import { Box } from '@mui/system';

async function getLaspData() {
  const response = await fetch(
    'https://lasp.colorado.edu/space-weather-portal/latis/dap/penticton_radio_flux.jsond'
  );
  const data = await response.json();
  return data;
}

export function DataView() {
  const [view, setView] = useState('plot');

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

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (isSuccess) {
    const unixTime: number[] = laspData.penticton_radio_flux.data.map(
      (i: (string | number)[]) => i[0]
    );

    const observedFlux: number[] = laspData.penticton_radio_flux.data.map(
      (i: (string | number)[]) => i[1]
    );

    const adjustedFlux: number[] = laspData.penticton_radio_flux.data.map(
      (i: (string | number)[]) => i[2]
    );

    const tableData = unixTime.map((time, index) => ({
      id: time,
      time: new Date(time).toLocaleString(),
      observedFlux: observedFlux[index],
      adjustedFlux: adjustedFlux[index],
    }));

    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_event, newView) => setView(newView)}
          aria-label="data view"
        >
          <ToggleButton value="plot" aria-label="plot view">
            Plot
          </ToggleButton>
          <ToggleButton value="table" aria-label="table view">
            Table
          </ToggleButton>
        </ToggleButtonGroup>
        {view === 'plot' ? (
          <Plot
            data={[
              {
                x: unixTime.map((i) => new Date(i)),
                y: observedFlux,
                type: 'scatter',
                mode: 'lines',
                name: 'Observed Flux',
              },
              {
                x: unixTime.map((i) => new Date(i)),
                y: adjustedFlux,
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
              { field: 'observedFlux', headerName: 'Observed Flux', flex: 1 },
              { field: 'adjustedFlux', headerName: 'Adjusted Flux', flex: 1 },
            ]}
          />
        )}
      </Box>
    );
  }
}
