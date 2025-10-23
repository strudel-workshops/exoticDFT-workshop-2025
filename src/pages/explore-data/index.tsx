import { Box, Paper } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '../../components/PageHeader';
import { DataView } from './-components/DataView';

export const Route = createFileRoute('/explore-data/')({
  component: DataExplorer,
});

function DataExplorer() {
  return (
    <Box>
      <PageHeader
        pageTitle="Explore Data App"
        description="Description of this app"
        sx={{
          marginBottom: 1,
          padding: 2,
        }}
      />
      <Box>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: '600px',
            minWidth: 0,
          }}
        >
          <DataView />
        </Paper>
      </Box>
    </Box>
  );
}
