import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';

async function getLaspData() {
  const response = await fetch(
    'https://lasp.colorado.edu/space-weather-portal/latis/dap/penticton_radio_flux.jsond'
  );
  const data = await response.json();
  return data;
}

export function DataView() {
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

    return (
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
          height: '100%',
        }}
      />
    );
  }
}
