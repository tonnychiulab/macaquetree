import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { SizeUnitSelect } from './SizeUnitSelect';
import { SizeUnitProvider, useSizeUnit } from '../hooks/useSizeUnit';

function SizePreview() {
  const { formatSize } = useSizeUnit();
  return <span>{formatSize(1024 ** 2)}</span>;
}

describe('SizeUnitSelect', () => {
  beforeEach(() => {
    localStorage.removeItem('macaquetree.sizeUnit');
  });

  it('switches displayed sizes to the chosen unit', async () => {
    const user = userEvent.setup();
    render(
      <SizeUnitProvider>
        <SizeUnitSelect />
        <SizePreview />
      </SizeUnitProvider>
    );
    expect(screen.getByText('1 MB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '容量顯示單位' }));
    await user.click(screen.getByRole('option', { name: 'KB' }));
    expect(screen.getByText('1024.00 KB')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '容量顯示單位' }));
    await user.click(screen.getByRole('option', { name: 'GB' }));
    expect(screen.getByText('0.00 GB')).toBeInTheDocument();
  });
});
