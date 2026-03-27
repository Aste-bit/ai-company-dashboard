/**
 * AI Company Dashboard API — GitHub Gist中継方式
 *
 * GASがデータを収集し、GitHub Gistに書き込む。
 * Gistの raw URL は認証なしでアクセス可能（CORS対応）。
 *
 * セットアップ手順:
 * 1. GitHub で Classic PAT を作成（gist スコープのみ）
 *    → https://github.com/settings/tokens/new?scopes=gist
 * 2. GASエディタで setupGist() を実行
 *    → プロンプトで PAT を入力
 *    → Gist が作成され、raw URL がログに表示される
 * 3. ログの GIST_RAW_URL を App.jsx の DATA_URL に設定
 */

// ====== 設定 ======
const FOLDER_ID = '1FC80yoajsgjAn9EP74FgmZpf7388Q1rN'; // 「仕事用」フォルダのGoogle Drive ID
const GIST_FILENAME = 'dashboard.json';

// ====== セットアップ（初回1回だけ実行） ======
function setupGist() {
  // PAT を Script Properties に保存（初回はここに直接書いて実行、実行後に消す）
  const TEMP_PAT = 'ここにPATを貼り付け'; // ← 実行後にこの行を消してください

  let token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
  if (!token) {
    if (TEMP_PAT === 'ここにPATを貼り付け') {
      Logger.log('エラー: TEMP_PAT にGitHub PATを設定してから実行してください');
      return;
    }
    token = TEMP_PAT;
    PropertiesService.getScriptProperties().setProperty('GITHUB_PAT', token);
    Logger.log('PAT を Script Properties に保存しました（コードからTEMP_PATを消してOK）');
  }

  // Gist を作成
  const data = collectAllData();
  const response = UrlFetchApp.fetch('https://api.github.com/gists', {
    method: 'post',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Dashboard-GAS'
    },
    contentType: 'application/json',
    payload: JSON.stringify({
      description: 'AI Company Dashboard Data (auto-updated)',
      public: false,  // secret gist（URLを知ってる人はアクセス可）
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  const gist = JSON.parse(response.getContentText());
  const gistId = gist.id;
  const rawUrl = gist.files[GIST_FILENAME].raw_url;

  // Gist ID を保存
  PropertiesService.getScriptProperties().setProperty('GIST_ID', gistId);

  // 5分おきの定期トリガー作成
  const triggers = ScriptApp.getProjectTriggers();
  const hasTimeTrigger = triggers.some(t => t.getHandlerFunction() === 'updateGist');
  if (!hasTimeTrigger) {
    ScriptApp.newTrigger('updateGist')
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log('5分トリガー作成完了');
  }

  Logger.log('=== セットアップ完了 ===');
  Logger.log('Gist ID: ' + gistId);
  Logger.log('GIST_RAW_URL: ' + rawUrl);
  Logger.log('↑ この raw URL を App.jsx の DATA_URL に設定してください');
}

// ====== Gist更新（5分おきに自動実行） ======
function updateGist() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
  const gistId = PropertiesService.getScriptProperties().getProperty('GIST_ID');

  if (!token || !gistId) {
    Logger.log('Error: setupGist() を先に実行してください');
    return;
  }

  const data = collectAllData();

  UrlFetchApp.fetch('https://api.github.com/gists/' + gistId, {
    method: 'patch',
    headers: {
      'Authorization': 'token ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Dashboard-GAS'
    },
    contentType: 'application/json',
    payload: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  Logger.log('Gist更新完了: ' + new Date().toISOString());
}

// ====== データ収集 ======
function collectAllData() {
  const folder = DriveApp.getFolderById(FOLDER_ID);

  return {
    timestamp: new Date().toISOString(),
    departments: collectDepartmentStatus(folder),
    tasks: collectTaskStatus(),
    kpi: collectKPI(folder),
    alerts: collectAlerts(folder),
    pipeline: collectPipeline(folder)
  };
}

function collectDepartmentStatus(folder) {
  const depts = {};

  // CTO Status
  const ctoStatus = readFileContent(folder, 'Cortex/cto-status.md');
  depts.CTO = parseStatusFile(ctoStatus, 'CTO');

  // COO Status
  const cooStatus = readFileContent(folder, 'フリーランス/_管理/coo-status.md');
  depts.COO = parseStatusFile(cooStatus, 'COO');

  // CMO Status
  const cmoStatus = readFileContent(folder, 'フリーランス/_管理/cmo-status.md');
  depts.CMO = parseStatusFile(cmoStatus, 'CMO');

  // CFO Status
  const cfoStatus = readFileContent(folder, '経理周り自動化プロジェクト/cfo-status.md');
  depts.CFO = parseStatusFile(cfoStatus, 'CFO');

  // CSO Status
  const csoStatus = readFileContent(folder, 'フリーランス/_管理/cso-status.md');
  depts.CSO = parseStatusFile(csoStatus, 'CSO');

  return depts;
}

function collectTaskStatus() {
  const tasks = [
    { id: 'ceo-briefing', name: 'CEO Briefing', dept: 'CEO', schedule: '07:45', frequency: 'daily' },
    { id: 'sns-morning-post', name: 'SNS朝投稿', dept: 'CMO', schedule: '07:30', frequency: 'daily' },
    { id: 'weekly-optimizer', name: '週次最適化', dept: 'COO', schedule: '08:30', frequency: 'monday' },
    { id: 'cortex-autonomous', name: 'CTO自律モード', dept: 'CTO', schedule: '09:00', frequency: 'daily' },
    { id: 'todo-morning-picker', name: 'Todoピッカー', dept: 'COO', schedule: '10:00', frequency: 'daily' },
    { id: 'coconala-optimizer', name: 'ココナラ最適化', dept: 'COO', schedule: '11:00', frequency: '1st-15th' },
    { id: 'skill-demand-analyzer', name: 'スキル需要分析', dept: 'COO', schedule: '10:00', frequency: '1st' },
    { id: 'job-scanner', name: '案件スキャン(昼)', dept: 'COO', schedule: '12:00', frequency: 'daily' },
    { id: 'market-monitor', name: '市場モニター', dept: 'COO', schedule: '12:00', frequency: 'wednesday' },
    { id: 'inbound-content', name: 'コンテンツ生成', dept: 'CMO', schedule: '12:00', frequency: 'friday' },
    { id: 'sns-engagement', name: 'SNSエンゲージ', dept: 'CMO', schedule: '13:00', frequency: 'daily' },
    { id: 'tech-trend-scout', name: '技術トレンド', dept: 'CMO', schedule: '14:00', frequency: 'daily' },
    { id: 'sns-afternoon-post', name: 'SNS午後投稿', dept: 'CMO', schedule: '15:00', frequency: 'daily' },
    { id: 'job-scanner-evening', name: '案件スキャン(夕)', dept: 'COO', schedule: '16:00', frequency: 'daily' },
    { id: 'proposal-tracker', name: '応募追跡', dept: 'COO', schedule: '18:00', frequency: 'daily' },
    { id: 'cso-strategy', name: 'CSO戦略分析', dept: 'CSO', schedule: '19:00', frequency: 'sunday' },
    { id: 'knowledge-gardener', name: 'ナレッジ整理', dept: 'COO', schedule: '20:00', frequency: 'daily' },
    { id: 'sns-nightly-collect', name: 'SNSデータ収集', dept: 'CMO', schedule: '21:00', frequency: 'daily' },
    { id: 'post-delivery', name: '納品後処理', dept: 'COO', schedule: 'manual', frequency: 'event' },
    { id: 'freelance-morning', name: '旧朝ブリーフィング', dept: 'CEO', schedule: '08:00', frequency: 'disabled' }
  ];

  return tasks.map(t => ({
    ...t,
    status: t.frequency === 'disabled' ? 'disabled' : 'active'
  }));
}

function collectKPI(folder) {
  const revenueEngine = readFileContent(folder, 'フリーランス/_管理/REVENUE_ENGINE.md');
  const proposalTracker = readFileContent(folder, 'フリーランス/_管理/proposal_tracker.md');

  const kpi = {
    activeTasks: 19,
    totalTasks: 20,
    revenue: extractRevenue(revenueEngine),
    revenueTarget: 50000,
    pipeline: extractPipelineCount(proposalTracker),
    alerts: 0
  };

  return kpi;
}

function collectAlerts(folder) {
  const alerts = [];
  const revenueEngine = readFileContent(folder, 'フリーランス/_管理/REVENUE_ENGINE.md');

  if (revenueEngine.includes('⬜ 未作成') || revenueEngine.includes('⬜ 未設定')) {
    if (revenueEngine.includes('X アカウント') && revenueEngine.includes('⬜ 未作成')) {
      alerts.push({ type: 'warning', message: 'X アカウント未作成 — CMO部門のSNS投稿が待機中', time: new Date().toISOString() });
    }
    if (revenueEngine.includes('X API キー') && revenueEngine.includes('⬜ 未設定')) {
      alerts.push({ type: 'warning', message: 'X API キー未設定 — 自動投稿+学習が待機中', time: new Date().toISOString() });
    }
    if (revenueEngine.includes('CrowdWorks') && revenueEngine.includes('⬜ 未登録')) {
      alerts.push({ type: 'warning', message: 'CrowdWorks 未登録 — job-scannerが待機中', time: new Date().toISOString() });
    }
    if (revenueEngine.includes('ランサーズ') && revenueEngine.includes('⬜ 未登録')) {
      alerts.push({ type: 'warning', message: 'ランサーズ 未登録 — 巡回対象に追加待ち', time: new Date().toISOString() });
    }
  }

  const cfoStatus = readFileContent(folder, '経理周り自動化プロジェクト/cfo-status.md');
  if (cfoStatus.includes('認証期限切れ') || cfoStatus.includes('認証切れ')) {
    alerts.push({ type: 'error', message: 'freeeサイン認証期限切れ — CFO部門の契約同期が停止', time: new Date().toISOString() });
  }

  return alerts;
}

function collectPipeline(folder) {
  const tracker = readFileContent(folder, 'フリーランス/_管理/proposal_tracker.md');

  return {
    draft: countStatus(tracker, 'ドラフト'),
    pending: countStatus(tracker, '承認待ち'),
    sent: countStatus(tracker, '送信済み'),
    won: countStatus(tracker, '受注'),
    lost: countStatus(tracker, '不採用')
  };
}

// ====== ヘルパー関数 ======
function readFileContent(folder, relativePath) {
  try {
    const parts = relativePath.split('/');
    let current = folder;

    for (let i = 0; i < parts.length - 1; i++) {
      const folders = current.getFoldersByName(parts[i]);
      if (!folders.hasNext()) return '';
      current = folders.next();
    }

    const fileName = parts[parts.length - 1];
    const files = current.getFilesByName(fileName);
    if (!files.hasNext()) return '';

    return files.next().getBlob().getDataAsString();
  } catch (e) {
    return '';
  }
}

function parseStatusFile(content, deptName) {
  if (!content) {
    return { health: 'unknown', lastUpdate: null, metrics: {}, raw: '' };
  }

  let health = 'green';
  if (content.includes('❌') || content.includes('エラー') || content.includes('失敗')) {
    health = 'red';
  } else if (content.includes('⚠') || content.includes('警告') || content.includes('期限切れ')) {
    health = 'yellow';
  }

  return {
    health,
    lastUpdate: extractDate(content),
    metrics: extractMetrics(content, deptName),
    raw: content.substring(0, 500)
  };
}

function extractDate(content) {
  const match = content.match(/更新[:\s：]*(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2})/);
  if (match) return match[1];
  const match2 = content.match(/(\d{4}-\d{2}-\d{2})/);
  return match2 ? match2[1] : null;
}

function extractMetrics(content, dept) {
  const metrics = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const kvMatch = line.match(/[-*]\s*(.+?)[:\s：]+(.+)/);
    if (kvMatch) {
      metrics[kvMatch[1].trim()] = kvMatch[2].trim();
    }
  }
  return metrics;
}

function extractRevenue(content) {
  const match = content.match(/売上[^|]*\|\s*(\d[\d,]*)/);
  return match ? parseInt(match[1].replace(/,/g, '')) : 0;
}

function extractPipelineCount(content) {
  const matches = content.match(/送信済み/g);
  return matches ? matches.length : 0;
}

function countStatus(content, status) {
  const regex = new RegExp(status, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}
