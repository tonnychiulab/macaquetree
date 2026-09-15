import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatsView } from './StatsView';

describe('StatsView', () => {
  it('shows totals and elapsed time when idle', () => {
    render(
      <StatsView
        totalSize={2048}
        totalFiles={3}
        totalFolders={1}
        scanTime={1500}
        isScanning={false}
        scanSpeed={0}
      />
    );
    expect(screen.getByText('檔案總數')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });
});
