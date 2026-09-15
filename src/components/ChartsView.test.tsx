import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartsView } from './ChartsView';
import { dirNode, fileNode } from '../test/fixtures';

describe('ChartsView', () => {
  it('renders top files without keeping a filesList variable', () => {
    const root = dirNode(
      'root',
      [
        fileNode('a.mp4', 500, { path: 'root/a.mp4', extension: '.mp4' }),
        fileNode('b.txt', 50, { path: 'root/b.txt', extension: '.txt' }),
      ],
      { path: 'root' }
    );
    render(<ChartsView rootNode={root} />);
    expect(screen.getByText('a.mp4')).toBeInTheDocument();
    expect(screen.getAllByText('.mp4').length).toBeGreaterThan(0);
  });

  it('groups leftover extensions as others', () => {
    const files = [
      fileNode('a.mp4', 600, { path: 'root/a.mp4', extension: '.mp4' }),
      fileNode('b.zip', 500, { path: 'root/b.zip', extension: '.zip' }),
      fileNode('c.png', 400, { path: 'root/c.png', extension: '.png' }),
      fileNode('d.pdf', 300, { path: 'root/d.pdf', extension: '.pdf' }),
      fileNode('e.ts', 200, { path: 'root/e.ts', extension: '.ts' }),
      fileNode('f.bin', 100, { path: 'root/f.bin', extension: '.bin' }),
    ];
    const root = dirNode('root', files, { path: 'root', size: 2100 });
    render(<ChartsView rootNode={root} />);
    expect(screen.getByText('其他檔案 (Others)')).toBeInTheDocument();
  });
});
