// ============================================================
// 날짜 범위 검색 기능 — date_range_search.js
// ============================================================
// 사용법: 검색창에 "260520-260524" 형식으로 입력하면
//         2026-05-20 ~ 2026-05-24 사이 신규/변경 항목 조회
// ============================================================

// ── 날짜 파싱 유틸 ──────────────────────────────────────────
/**
 * "260520-260524" → { from: "2026-05-20", to: "2026-05-24" }
 * "260520"        → { from: "2026-05-20", to: "2026-05-20" }
 */
function parseDateRangeQuery(query) {
  const trimmed = query.trim().replace(/\s/g, "");

  // 패턴: YYMMDD-YYMMDD (범위)
  const rangeMatch = trimmed.match(/^(\d{6})-(\d{6})$/);
  if (rangeMatch) {
    return {
      from: parseShortDate(rangeMatch[1]),
      to:   parseShortDate(rangeMatch[2]),
    };
  }

  // 패턴: YYMMDD (단일 날짜)
  const singleMatch = trimmed.match(/^(\d{6})$/);
  if (singleMatch) {
    const d = parseShortDate(singleMatch[1]);
    return { from: d, to: d };
  }

  return null;
}

function parseShortDate(yymmdd) {
  const yy = yymmdd.slice(0, 2);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  return `20${yy}-${mm}-${dd}`;
}

// ── Supabase 날짜 범위 쿼리 ─────────────────────────────────
/**
 * Supabase JS client 사용 예시
 * supabase: createClient(...)로 생성한 인스턴스
 */
async function fetchByDateRange(supabase, from, to, mode = "both") {
  // to 날짜 끝까지 포함하기 위해 +1일
  const toDate = new Date(to);
  toDate.setDate(toDate.getDate() + 1);
  const toStr = toDate.toISOString().slice(0, 10);

  let results = [];

  // 신규 추가 항목 (created_at 기준)
  if (mode === "both" || mode === "new") {
    const { data: newItems, error } = await supabase
      .from("ai_products")
      .select("id, product_name, manufacturer, category_main, created_at, updated_at, verification_status")
      .gte("created_at", `${from}T00:00:00`)
      .lt("created_at",  `${toStr}T00:00:00`)
      .order("created_at", { ascending: false });

    if (!error && newItems) {
      results.push(...newItems.map(r => ({ ...r, _change_type: "신규 추가" })));
    }
  }

  // 변경된 항목 (updated_at 기준, created_at 제외)
  if (mode === "both" || mode === "updated") {
    const { data: updatedItems, error } = await supabase
      .from("ai_products")
      .select("id, product_name, manufacturer, category_main, created_at, updated_at, verification_status")
      .gte("updated_at", `${from}T00:00:00`)
      .lt("updated_at",  `${toStr}T00:00:00`)
      .lt("created_at",  `${from}T00:00:00`)  // 신규 제외
      .order("updated_at", { ascending: false });

    if (!error && updatedItems) {
      results.push(...updatedItems.map(r => ({ ...r, _change_type: "업데이트" })));
    }
  }

  // 중복 제거 (id 기준)
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// ── 검색 핸들러 (기존 검색창과 통합) ────────────────────────
/**
 * 기존 앱의 handleSearch 함수에 아래 로직을 추가하세요.
 *
 * 기존 코드:
 *   async function handleSearch(query) {
 *     // 기존 검색 로직...
 *   }
 *
 * 수정 후:
 *   async function handleSearch(query) {
 *     const dateRange = parseDateRangeQuery(query);
 *     if (dateRange) {
 *       const results = await fetchByDateRange(supabase, dateRange.from, dateRange.to);
 *       displayDateRangeResults(results, dateRange);
 *       return;
 *     }
 *     // 기존 검색 로직...
 *   }
 */

// ── 결과 표시 함수 ───────────────────────────────────────────
function displayDateRangeResults(results, dateRange) {
  const container = document.getElementById("search-results"); // 기존 결과 컨테이너
  if (!container) return;

  const newCount     = results.filter(r => r._change_type === "신규 추가").length;
  const updatedCount = results.filter(r => r._change_type === "업데이트").length;

  // 헤더
  let html = `
    <div class="date-range-header">
      <h3>📅 ${dateRange.from} ~ ${dateRange.to} 변경 내역</h3>
      <div class="date-range-summary">
        <span class="badge new">🆕 신규 추가 ${newCount}개</span>
        <span class="badge updated">🔄 업데이트 ${updatedCount}개</span>
        <span class="badge total">📊 총 ${results.length}개</span>
      </div>
    </div>
  `;

  if (results.length === 0) {
    html += `<div class="no-results">해당 기간에 변경된 항목이 없습니다.</div>`;
    container.innerHTML = html;
    return;
  }

  // 결과 테이블
  html += `
    <table class="date-range-table">
      <thead>
        <tr>
          <th>구분</th>
          <th>AI 엔진명</th>
          <th>제조사</th>
          <th>카테고리</th>
          <th>날짜</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const r of results) {
    const date = r._change_type === "신규 추가"
      ? (r.created_at || "").slice(0, 10)
      : (r.updated_at  || "").slice(0, 10);

    const badgeClass = r._change_type === "신규 추가" ? "badge-new" : "badge-updated";
    const badgeText  = r._change_type === "신규 추가" ? "🆕 신규" : "🔄 수정";

    html += `
      <tr>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td class="product-name">${r.product_name || "-"}</td>
        <td>${r.manufacturer || "-"}</td>
        <td>${(r.category_main || "-").replace(/^\d+\. /, "")}</td>
        <td>${date}</td>
        <td class="status">${(r.verification_status || "-").slice(0, 30)}</td>
      </tr>
    `;
  }

  html += `</tbody></table>`;
  container.innerHTML = html;
}

// ── CSS 스타일 (기존 스타일시트에 추가) ─────────────────────
const DATE_RANGE_STYLES = `
  .date-range-header {
    padding: 16px;
    background: #1a2b4a;
    border-radius: 8px;
    margin-bottom: 12px;
  }
  .date-range-header h3 {
    color: #b89640;
    margin: 0 0 8px 0;
    font-size: 1.1rem;
  }
  .date-range-summary {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .badge.new      { background: #1a4a2b; color: #4adf8a; }
  .badge.updated  { background: #1a2b4a; color: #4a8adf; }
  .badge.total    { background: #2b2b2b; color: #cccccc; }
  .badge-new      { background: #1a4a2b; color: #4adf8a; padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; }
  .badge-updated  { background: #1a2b4a; color: #4a8adf; padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; }

  .date-range-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  .date-range-table th {
    background: #1a2b4a;
    color: #b89640;
    padding: 8px 12px;
    text-align: left;
    border-bottom: 2px solid #b89640;
  }
  .date-range-table td {
    padding: 7px 12px;
    border-bottom: 1px solid #2a2a2a;
    color: #cccccc;
  }
  .date-range-table tr:hover td {
    background: #1a2b4a22;
  }
  .product-name { color: #ffffff; font-weight: 500; }
  .no-results { text-align: center; padding: 40px; color: #888; }
`;

// 스타일 주입 (앱 초기화 시 호출)
function injectDateRangeStyles() {
  const style = document.createElement("style");
  style.textContent = DATE_RANGE_STYLES;
  document.head.appendChild(style);
}

// ── 내보내기 ─────────────────────────────────────────────────
export {
  parseDateRangeQuery,
  fetchByDateRange,
  displayDateRangeResults,
  injectDateRangeStyles,
};
