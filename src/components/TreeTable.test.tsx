import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TreeTable } from './TreeTable';
import { dirNode, fileNode } from '../test/fixtures';

const tree = dirNode(
  'root',
  [
    dirNode(
      'src',
      [
        fileNode('keep.ts', 20, { path: 'root/src/keep.ts', extension: '.ts' }),
        ...Array.from({ length: 30 }, (_, i) =>
          fileNode(`noise${i}.txt`, 1, { path: `root/src/noise${i}.txt`, extension: '.txt' })
        ),
      ],
      { path: 'root/src', depth: 1 }
    ),
  ],
  { path: 'root' }
);

describe('TreeTable', () => {
  it('search lists matching paths instead of every descendant', async () => {
    const user = userEvent.setup();
    render(
      <TreeTable
        rootNode={tree}
        focusedPath="root"
        onFocusPath={vi.fn()}
        selectedNode={null}
        onSelectNode={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText('搜尋檔案或資料夾名稱'), 'keep');
    expect(await screen.findByTitle('src/keep.ts')).toBeInTheDocument();
    expect(screen.queryByText('noise0.txt')).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('清除搜尋'));
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('drills down on double-click and sorts by name', async () => {
    const user = userEvent.setup();
    const onFocusPath = vi.fn();
    const onSelectNode = vi.fn();
    render(
      <TreeTable
        rootNode={tree}
        focusedPath="root"
        onFocusPath={onFocusPath}
        selectedNode={null}
        onSelectNode={onSelectNode}
      />
    );
    await user.click(screen.getByText('src'));
    expect(onSelectNode).toHaveBeenCalled();
    await user.dblClick(screen.getByText('src'));
    expect(onFocusPath).toHaveBeenCalledWith('root/src');
    await user.click(screen.getByRole('columnheader', { name: /名稱/ }));
    expect(screen.getByText('src')).toBeInTheDocument();
  });

  it('expands folders, climbs breadcrumbs, and ignores file drill-down', async () => {
    const user = userEvent.setup();
    const onFocusPath = vi.fn();
    render(
      <TreeTable
        rootNode={tree}
        focusedPath="root/src"
        onFocusPath={onFocusPath}
        selectedNode={tree.children?.[0] ?? null}
        onSelectNode={vi.fn()}
      />
    );
    await user.click(screen.getByTitle('返回上一層'));
    expect(onFocusPath).toHaveBeenCalledWith('root');
    await user.click(screen.getByRole('button', { name: 'root' }));
    expect(onFocusPath).toHaveBeenCalledWith('root');
    await user.click(screen.getByRole('columnheader', { name: /檔案數/ }));
    await user.click(screen.getByRole('columnheader', { name: /修改日期/ }));
    const keep = screen.getByText('keep.ts');
    await user.dblClick(keep);
    expect(onFocusPath).not.toHaveBeenCalledWith('root/src/keep.ts');
    const row = keep.closest('tr');
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  });

  it('toggles a directory expander and shows an empty search state', async () => {
    const user = userEvent.setup();
    render(
      <TreeTable
        rootNode={tree}
        focusedPath="root"
        onFocusPath={vi.fn()}
        selectedNode={null}
        onSelectNode={vi.fn()}
      />
    );
    await user.click(screen.getByLabelText('展開src'));
    await user.type(screen.getByLabelText('搜尋檔案或資料夾名稱'), 'zzzz-missing');
    expect(await screen.findByText('沒有找到相符的檔案或資料夾。')).toBeInTheDocument();
  });

  it('shows an empty directory placeholder', () => {
    render(
      <TreeTable
        rootNode={dirNode('empty', [], { path: 'empty' })}
        focusedPath="empty"
        onFocusPath={vi.fn()}
        selectedNode={null}
        onSelectNode={vi.fn()}
      />
    );
    expect(screen.getByText('目錄為空。')).toBeInTheDocument();
  });
});
