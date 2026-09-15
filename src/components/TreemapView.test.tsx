import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TreemapView } from './TreemapView';
import { dirNode, fileNode } from '../test/fixtures';

const tree = dirNode(
  'root',
  [
    dirNode('videos', [], { path: 'root/videos', depth: 1, size: 900, fileCount: 0 }),
    fileNode('tiny.txt', 10, { path: 'root/tiny.txt', extension: '.txt' }),
  ],
  { path: 'root' }
);

describe('TreemapView', () => {
  it('double-clicking a directory rectangle focuses that path', () => {
    const onFocusPath = vi.fn();
    const { container } = render(
      <TreemapView
        rootNode={tree}
        focusedPath="root"
        onFocusPath={onFocusPath}
        selectedNode={null}
        onSelectNode={vi.fn()}
      />
    );
    const groups = container.querySelectorAll('svg g');
    groups.forEach((group) => fireEvent.doubleClick(group));
    expect(onFocusPath).toHaveBeenCalledWith('root/videos');
  });

  it('selects on click and does not drill into files', () => {
    const onFocusPath = vi.fn();
    const onSelectNode = vi.fn();
    const { container } = render(
      <TreemapView
        rootNode={tree}
        focusedPath="root"
        onFocusPath={onFocusPath}
        selectedNode={tree.children?.[1] ?? null}
        onSelectNode={onSelectNode}
      />
    );
    const svg = container.querySelector('svg');
    const groups = container.querySelectorAll('svg g');
    groups.forEach((group) => {
      fireEvent.click(group);
      fireEvent.mouseEnter(group);
    });
    fireEvent.mouseMove(svg!, { clientX: 40, clientY: 40 });
    fireEvent.mouseLeave(svg!);
    expect(onSelectNode).toHaveBeenCalled();
    const fileGroup = Array.from(groups).find((group) => group.querySelector('text')?.textContent === 'tiny.txt');
    if (fileGroup) fireEvent.doubleClick(fileGroup);
    expect(onFocusPath).not.toHaveBeenCalledWith('root/tiny.txt');
  });

  it('describes implemented drill-down', () => {
    render(
      <TreemapView
        rootNode={tree}
        focusedPath="root"
        onFocusPath={vi.fn()}
        selectedNode={null}
        onSelectNode={vi.fn()}
      />
    );
    expect(screen.getByText(/雙擊資料夾可鑽取進入/)).toBeInTheDocument();
  });
});
