import type { RefObject } from 'react';
import { FolderOpen, Info, ShieldCheck, Zap, LayoutGrid, Layers } from 'lucide-react';
import { APP_NAME, SCAN_ACTION_LABEL } from '../brand';
import { appStyles as styles } from '../appStyles';

interface WelcomeViewProps {
  isApiSupported: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileSystemScan: () => void;
  onFallbackScan: (files: FileList | null) => void;
}

export function WelcomeView({
  isApiSupported,
  fileInputRef,
  onFileSystemScan,
  onFallbackScan,
}: WelcomeViewProps) {
  return (
    <div style={styles.welcomeGrid}>
      <div className="glass-panel" style={styles.welcomeCard}>
        <h2 style={styles.welcomeTitle}>開始分析您的磁碟空間</h2>
        <p style={styles.welcomeSubtitle}>
          {APP_NAME} 是免安裝本機磁碟空間分析工具。
          只需選取您欲掃描的硬碟分區或專案目錄，即可立即為您繪製空間佔用圖譜。
        </p>
        <div style={styles.supportAlert}>
          <Info size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
          <span>
                {isApiSupported ? (
              <>
                <strong>您的瀏覽器已完美支援 File System Access API！</strong> 掃描時可完整保證檔案樹排序與本機多執行緒效率。
              </>
            ) : (
              <>
                <strong>當前瀏覽器將使用 Fallback 掃描模式。</strong>（由於 Firefox/Safari 尚未全面開放 Directory API，本工具已貼心實作了本地檔案流處理技術，功能不受影響）。
              </>
            )}
          </span>
        </div>
        <div style={styles.actionCenter}>
          {isApiSupported ? (
            <button onClick={onFileSystemScan} className="glow-btn" style={styles.hugeBtn}>
              <FolderOpen size={20} />
              {SCAN_ACTION_LABEL}
            </button>
          ) : (
            <div>
              <button onClick={() => fileInputRef.current?.click()} className="glow-btn" style={styles.hugeBtn}>
                <FolderOpen size={20} />
                {SCAN_ACTION_LABEL}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                webkitdirectory=""
                directory=""
                onChange={(event) => { onFallbackScan(event.target.files); }}
                onClick={(event) => { (event.target as HTMLInputElement).value = ''; }}
                style={{ display: 'none' }}
              />
            </div>
          )}
          <span style={styles.securityHint}>
            <ShieldCheck size={14} color="var(--color-safe)" />
            目錄中繼資料只在這個瀏覽器分頁處理，應用程式沒有上傳檔案或掃描結果的邏輯。開啟本頁仍會向託管靜態網站的主機下載 HTML/JS。
          </span>
        </div>
      </div>
      <div style={styles.featureCards}>
        <div className="glass-panel" style={styles.featureCard}>
          <Zap size={22} color="var(--accent)" />
          <h4>極速多執行緒效能</h4>
          <p>將繁複的磁碟遍歷任務完全託付於背景 Web Worker，不佔用 UI 主線程，流暢無卡頓。</p>
        </div>
        <div className="glass-panel" style={styles.featureCard}>
          <LayoutGrid size={22} color="var(--accent)" />
          <h4>山林區塊圖譜視覺化</h4>
          <p>支援區塊圖譜（Treemap）與圓環圖，色彩對應各類副檔名，一眼看出空間殺手。</p>
        </div>
        <div className="glass-panel" style={styles.featureCard}>
          <Layers size={22} color="var(--accent)" />
          <h4>深度樹狀鑽取 (Drill down)</h4>
          <p>雙擊資料夾可像檔案總管一樣深度聚焦，配備動態麵包屑導航，追蹤大檔案簡單直覺。</p>
        </div>
      </div>
    </div>
  );
}
