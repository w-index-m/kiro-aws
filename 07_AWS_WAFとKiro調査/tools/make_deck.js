const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");
// pptx スキルのディレクトリ(環境変数 PPTX_SKILL で指定。無ければ ~/.claude/skills/synced/*/pptx を探す)
function findSkill() {
  if (process.env.PPTX_SKILL) return process.env.PPTX_SKILL;
  const base = path.join(process.env.HOME || "/root", ".claude/skills/synced");
  for (const d of fs.existsSync(base) ? fs.readdirSync(base) : []) {
    const p = path.join(base, d, "pptx");
    if (fs.existsSync(path.join(p, "scripts/apply_theme.js"))) return p;
  }
  throw new Error("pptx skill が見つかりません。PPTX_SKILL にそのディレクトリを指定してください");
}
const SKILL = findSkill();
const { applyTheme } = require(SKILL + "/scripts/apply_theme.js");

const THEME = {
  name: "WAF Design",
  headFontFace: "Meiryo",
  bodyFontFace: "Meiryo",
  colors: {
    dk1: "1B2A41", lt1: "FFFFFF", dk2: "324A5F", lt2: "F2F4F7",
    accent1: "F28C28", accent2: "2E7D5B", accent3: "C0392B",
    accent4: "5B7C99", accent5: "8A9BAE", accent6: "E8B04A",
    hlink: "F28C28", folHlink: "5B7C99",
  },
};
const OUT = process.env.DECK_OUT || path.join(__dirname, "..", "docs", "AWS_WAFとKiro調査.pptx");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "AWS WAFとKiro調査";
pres.author = "Claude";
const C = pres.SchemeColor;
const S = pres.ShapeType;
const FOOT = "AWS WAFとKiro調査 v1.27";

// ---------------------------------------------------------------- layouts
pres.defineSlideMaster({
  title: "TITLE",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.0, w: 11.7, h: 1.7, fontSize: 44, bold: true, color: C.background1, align: "left", valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.95, w: 11.7, h: 1.2, fontSize: 20, color: C.accent6, align: "left", valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.13, h: 0.9, fontSize: 36, bold: true, color: C.text1, align: "left", valign: "middle" }, text: "" } },
    { text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: C.text2, margin: 0 } } },
  ],
});
pres.defineSlideMaster({
  title: "CLOSING",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.13, h: 0.9, fontSize: 36, bold: true, color: C.background1, align: "left", valign: "middle" }, text: "" } },
  ],
});

// ---------------------------------------------------------------- helpers
function card(s, x, y, w, h, name, fill) {
  s.addShape(S.roundRect, { x, y, w, h, fill: { color: fill || C.background2 }, line: { color: fill || C.background2, width: 0 }, rectRadius: 0.1, objectName: name });
}
function num(s, n, x, y, name) {
  s.addShape(S.ellipse, { x, y, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: name + " circle" });
  s.addText(String(n), { x, y, w: 0.5, h: 0.5, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true, objectName: name + " no" });
}
function arrow(s, x, y, name) {
  s.addShape(S.rightArrow, { x, y, w: 0.4, h: 0.4, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: name });
}
function cardText(s, title, body, x, y, w, h, name, opt) {
  const o = opt || {};
  s.addText(
    [
      { text: title, options: { bold: true, fontSize: o.tsize || 18, breakLine: true, color: o.color || C.text1 } },
      { text: body, options: { fontSize: o.bsize || 16, color: o.color || C.text1 } },
    ],
    { x, y, w, h, valign: "top", margin: 8, paraSpaceAfter: 8, isTextBox: true, objectName: name }
  );
}
function tcard(s, x, y, w, h, name, title, body, opt) {
  card(s, x, y, w, h, name + " bg", opt && opt.fill);
  cardText(s, title, body, x, y, w, h, name, opt);
}
function stat(s, big, label, x, y, w, h, name) {
  card(s, x, y, w, h, name + " card", C.text1);
  s.addText(big, { x, y: y + 0.1, w, h: h * 0.5, align: "center", valign: "middle", fontSize: 40, bold: true, color: C.accent6, margin: 0, isTextBox: true, objectName: name + " value" });
  s.addText(label, { x: x + 0.15, y: y + h * 0.55, w: w - 0.3, h: h * 0.42, align: "center", valign: "top", fontSize: 14, color: C.background1, margin: 0, isTextBox: true, objectName: name + " label" });
}
function note(s, text, y) {
  s.addText(text, { x: 0.6, y, w: 12.13, h: 0.3, fontSize: 11, color: C.text2, margin: 0, isTextBox: true, objectName: "Source note" });
}
function content(title, sec) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: sec });
  s.addText(title, { placeholder: "title" });
  return s;
}

// ---------------------------------------------------------------- 1 title
pres.addSection({ title: "概要" });
{
  const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "概要" });
  s.addText("AWS WAFとKiro調査", { placeholder: "title" });
  s.addText("AWS WAFの方式設計(02_AWSネットワーク設計書サンプルの構成)と、Kiroの画面・料金・使い方\nv1.27  2026-11-25", { placeholder: "body" });
  s.addNotes("本資料はサンプル値を含みます。実案件の値に置き換えてください。v1.27で、02_AWSネットワーク設計書サンプル(shop-prd-*、VPC 10.20.0.0/16、Network Firewall採用)に値を統一した。");
}

// ---------------------------------------------------------------- 2 overview
{
  const s = content("全体像:ALBの手前で攻撃を遮断", "概要");
  const names = ["Internet", "IGW", "Network\nFirewall", "ALB + Web ACL", "App・DB\n(Private)"];
  const x0 = 0.6, bw = 2.0, gap = 0.53, y = 1.6, h = 1.2;
  names.forEach((t, i) => {
    const x = x0 + i * (bw + gap);
    const hl = i === 3;
    card(s, x, y, bw, h, "Flow box " + (i + 1), hl ? C.accent1 : C.background2);
    s.addText(t, { x, y, w: bw, h, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.text1, margin: 4, isTextBox: true, objectName: "Flow label " + (i + 1) });
    if (i < names.length - 1) arrow(s, x + bw + 0.065, y + h / 2 - 0.2, "Flow arrow " + (i + 1));
  });
  const cw = 3.9, cg = 0.215, cy = 3.35, ch = 2.9;
  tcard(s, 0.6, cy, cw, ch, "Card purpose", "目的", "SQLインジェクション等のL7攻撃、既知の不正入力、悪性IP、過剰アクセスを、ALBに届く前に検知・遮断する。", { tsize: 20, bsize: 18 });
  tcard(s, 0.6 + cw + cg, cy, cw, ch, "Card target", "保護対象", "shop-prd-alb(Publicサブネット 1a/1c)に、Web ACL shop-prd-webacl を関連付ける。インターネットからの通信は、先にNetwork Firewallを通る。", { tsize: 20, bsize: 18 });
  tcard(s, 0.6 + 2 * (cw + cg), cy, cw, ch, "Card scope", "スコープと既定動作", "リージョナル(ap-northeast-1)。どのルールにも一致しない通信は許可(ブロックリスト方式)。", { tsize: 20, bsize: 18 });
  s.addNotes("Web ACLは、ルールの並びとデフォルトアクションをまとめた設定の単位。ALBなどに関連付けて使う。");
}
// ---------------------------------------------------------------- reference-based slides (SCS material)
{
  const s = content("WAFの位置づけ:他の防御機能との違い", "概要");
  const H = (t, al) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, align: al || "center" } });
  const L = (t) => ({ text: t, options: { bold: true, fill: { color: C.background2 } } });
  const W = (t) => ({ text: t, options: { fill: { color: "FDEBD3" }, bold: true } });
  const P = (t) => ({ text: t, options: {} });
  const rows = [
    [H("", "left"), H("ネットワークACL"), H("セキュリティグループ"), H("AWS WAF"), H("Network Firewall")],
    [L("動作レイヤー"), P("L3 / L4"), P("L3 / L4"), W("L7(HTTP/HTTPS)"), P("L3〜L7")],
    [L("適用先"), P("サブネット"), P("ENI / インスタンス"), W("ALB、CloudFront、API Gatewayなど"), P("VPC(ルーティング経由)")],
    [L("状態管理"), P("ステートレス"), P("ステートフル"), W("ステートレス"), P("両方")],
    [L("アクション"), P("許可 / 拒否"), P("許可のみ(暗黙の拒否)"), W("許可 / ブロック / カウント / CAPTCHA / Challenge"), P("許可 / 破棄 / アラート")],
    [L("得意な検査"), P("IP、ポート"), P("IP、ポート"), W("URI、ヘッダー、SQLi/XSS、レート、ボット"), P("IPS、ドメインフィルタ")],
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 12.13, colW: [1.9, 2.2, 2.4, 3.2, 2.43], rowH: [0.5, 0.65, 0.8, 0.65, 0.95, 0.95], fontSize: 14, color: C.text1, valign: "middle", align: "center", border: { type: "solid", pt: 0.5, color: "D0D6DD" }, objectName: "Compare table" });
  card(s, 0.6, 6.15, 12.13, 0.6, "Compare banner bg", C.text1);
  s.addText("今回の構成:SG/NACLでL3/L4を守り、WAFでALBに届くHTTPリクエスト(L7)を守る。", { x: 0.6, y: 6.15, w: 12.13, h: 0.6, fontSize: 16, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Compare banner" });
  note(s, "出典: AWS SCS対策資料(maruchin tech)Infrastructure Security", 6.8);
  s.addNotes("DDoS対策の多層防御では、L7はWAF/Shield/CloudFront/ALB、L3/L4はShield/Route 53/ELB/SG/NACLが担う。");
}
{
  const s = content("WAFの基礎:アクション・ルール・対象サービス", "概要");
  tcard(s, 0.6, 1.5, 3.9, 3.9, "Card actions", "アクション(5種)",
    "ALLOW:通過\nBLOCK:拒否(既定は403)\nCOUNT:通過させて記録。テスト用\nCAPTCHA:パズルで人か確認\nCHALLENGE:サイレントで確認",
    { tsize: 20, bsize: 16 });
  tcard(s, 4.715, 1.5, 3.9, 3.9, "Card ruletypes", "ルールの種類",
    "マネージドルール:AWSまたはMarketplaceベンダーが提供・保守。AWSは無料〜一部有料、Marketplaceは有料でベンダーがサポート\nカスタムルール:IP、国、ヘッダー、URI、ボディ、SQLi/XSS、レート",
    { tsize: 20, bsize: 15 });
  tcard(s, 8.83, 1.5, 3.9, 3.9, "Card targets", "関連付けできる対象",
    "CloudFront\nAPI Gateway\nAppSync\nALB\nApp Runner\nVerified Access\n※NLB・GWLBは非対応",
    { tsize: 20, bsize: 16 });
  tcard(s, 0.6, 5.6, 5.96, 1.15, "Card shield", "Shield Advanced との連携", "L7のDDoS検出・緩和でWAFと連携。WAFの料金は含まれる。", { tsize: 16, bsize: 14 });
  tcard(s, 6.77, 5.6, 5.96, 1.15, "Card fm", "Firewall Manager", "複数アカウントのWAFを一元管理。Organizationsへの参加とAWS Configの有効化が前提。", { tsize: 16, bsize: 14 });
  note(s, "出典: AWS SCS対策資料(maruchin tech)Infrastructure Security", 6.82);
  s.addNotes("ALBはWAF連携に対応するが、NLB・GWLBは対応しない(ELB比較表より)。");
}

{
  const s = content("Network Firewallと関連セキュリティサービス", "概要");
  tcard(s, 0.6, 1.5, 5.96, 3.1, "Card nf", "Network Firewallでできること",
    "VPC向けのマネージドFW。ステートフル検査、IPS(Suricata互換)、ドメインフィルタ\nルール評価:ステートレス → ステートフル → デフォルトアクション\n検査VPCにマルチAZで配置し、ルーティング経由で通信を通す",
    { tsize: 20, bsize: 16 });
  tcard(s, 6.77, 1.5, 5.96, 3.1, "Card nf2", "WAFとの使い分け",
    "WAF:L7。SQLi/XSS、レート制限、ボット対策。ALBなどに関連付け\nNetwork Firewall:L3〜L7。IPS、ドメイン制御。VPC全体の通信が対象\n本構成はNetwork FirewallでインターネットとオンプレとのL3〜L7の出入りを、WAFでALB手前のL7を担当する",
    { tsize: 20, bsize: 16 });
  const cats = [["予防", "WAF / Shield / SG・NACL / DNS Firewall"], ["検知", "GuardDuty / Inspector / Macie"], ["集約・調査", "Security Hub / Detective"], ["管理", "Firewall Manager(複数アカウント)"]];
  cats.forEach((c, i) => {
    const x = 0.6 + i * 3.077;
    card(s, x, 4.85, 2.9, 1.9, "Svc card " + (i + 1) + " bg", i === 0 ? C.accent1 : C.background2);
    s.addText([{ text: c[0], options: { bold: true, fontSize: 18, breakLine: true } }, { text: c[1], options: { fontSize: 14 } }], { x, y: 4.85, w: 2.9, h: 1.9, valign: "middle", align: "center", color: C.text1, margin: 10, paraSpaceAfter: 6, isTextBox: true, objectName: "Svc text " + (i + 1) });
  });
  note(s, "出典: AWS SCS対策資料(maruchin tech)。Detective、Macieの説明は一般的な機能理解による", 6.82);
}

// ---------------------------------------------------------------- setup flow & how-to (new)
pres.addSection({ title: "設定方法" });
{
  const s = content("設定の全体の流れ", "設定方法");
  const st = [
    ["事前準備", "ログ用のロググループ、関連付け先のALBを用意する"],
    ["Web ACLを作成", "名前・リージョン・関連付けるALBを指定する"],
    ["ルールを追加", "自前ルール(レート制限)とマネージドルールを追加"],
    ["優先度を決める", "番号の小さい順に評価。既定動作はAllow"],
    ["作成して確認", "Reviewで内容を確認し、Create web ACL"],
    ["ログを有効化", "CloudWatch Logs の aws-waf-logs- で始まる名前へ出力"],
    ["Countで運用", "全ルールをCountにして、ログで誤検知を確認"],
    ["Blockへ切替", "問題のないルールから順にBlockへ"],
  ];
  st.forEach((t, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.6 + col * 3.077, y = 1.5 + row * 2.6;
    card(s, x, y, 2.9, 2.4, "Flow card " + (i + 1) + " bg", C.background2);
    num(s, i + 1, x + 0.15, y + 0.15, "Flow " + (i + 1));
    cardText(s, t[0], t[1], x, y + 0.7, 2.9, 1.65, "Flow text " + (i + 1), { tsize: 18, bsize: 15 });
  });
  note(s, "操作の詳細は次ページ以降(作成手順、自前ルール、ログと確認)。画面の名称や並びは更新されるため、実画面で確認する。", 6.7);
  s.addNotes("1の事前準備は、ログの出力先と関連付け先のALBを先に用意しておく意味。Web ACLの作成後でもルールは追加できる。");
}

{
  const s = content("Web ACLの作成手順(コンソール)", "設定方法");
  card(s, 0.6, 1.5, 7.6, 5.25, "Console steps bg");
  const rows = [
    ["開く", "WAF & Shield > Web ACLs(新表記は protection packs)で、リージョンを東京にして Create web ACL"],
    ["基本情報", "名前、CloudWatchメトリクス名、Resource type(Regional resources)を入力"],
    ["ALBを関連付け", "Add AWS resources で対象のALBを選ぶ"],
    ["ルールと既定動作", "Add rules and rule groups でルールを追加し、デフォルトアクションを設定"],
    ["優先度・確認", "優先度を並べ、メトリクスを確認して Create web ACL"],
  ];
  rows.forEach((r, i) => {
    const y = 1.62 + i * 1.02;
    num(s, i + 1, 0.8, y + 0.1, "Console " + (i + 1));
    cardText(s, r[0], r[1], 1.45, y, 6.6, 1.0, "Console text " + (i + 1), { tsize: 17, bsize: 14 });
  });
  card(s, 8.4, 1.5, 4.33, 5.25, "Sample values bg", C.text2);
  s.addText(
    [
      { text: "入力サンプル", options: { bold: true, fontSize: 18, breakLine: true, color: C.background1 } },
      { text: "名前", options: { bold: true, fontSize: 13, color: C.accent6, breakLine: true } },
      { text: "shop-prd-webacl", options: { fontSize: 15, color: C.background1, breakLine: true } },
      { text: "メトリクス名", options: { bold: true, fontSize: 13, color: C.accent6, breakLine: true } },
      { text: "shop-prd-webacl", options: { fontSize: 15, color: C.background1, breakLine: true } },
      { text: "リージョン / 種別", options: { bold: true, fontSize: 13, color: C.accent6, breakLine: true } },
      { text: "ap-northeast-1 / Regional", options: { fontSize: 15, color: C.background1, breakLine: true } },
      { text: "関連付け先", options: { bold: true, fontSize: 13, color: C.accent6, breakLine: true } },
      { text: "shop-prd-alb", options: { fontSize: 15, color: C.background1, breakLine: true } },
      { text: "デフォルトアクション", options: { bold: true, fontSize: 13, color: C.accent6, breakLine: true } },
      { text: "Allow(どのルールにも一致しない通信)", options: { fontSize: 15, color: C.background1 } },
    ],
    { x: 8.4, y: 1.5, w: 4.33, h: 5.25, valign: "top", margin: 16, paraSpaceAfter: 5, isTextBox: true, objectName: "Sample values" }
  );
  s.addNotes("画面の並びは版によって異なることがある。ルールは作成後にも追加・変更できる。");
}

{
  const s = content("自前ルールの設定:レート制限", "設定方法");
  tcard(s, 0.6, 1.5, 5.96, 4.2, "Card rate", "レート制限(優先度50)",
    "Add my own rules and rule groups > Rule builder で、種別に Rate-based rule を選ぶ\n名前 shop-prd-rate-limit\nしきい値 2,000(サンプル値)\n評価ウィンドウ 5分、集約キー IPアドレス\nアクション = Block(最初はCount)",
    { tsize: 22, bsize: 18 });
  tcard(s, 6.77, 1.5, 5.96, 4.2, "Card noallow", "許可IPのルールは置かない",
    "保守拠点からの通信も、WAFの検査を通す\nAllowに一致すると以降のルールを評価しないため、置くなら対象を最小限にする\n必要になったら、IP setを先に作り、優先度1のAllowルールとして追加する",
    { tsize: 22, bsize: 18 });
  card(s, 0.6, 5.9, 12.13, 0.85, "Own rule banner bg", C.text1);
  s.addText("マネージドルール(優先度10〜40)は、後のページの「Add managed rule groups」の手順で1つずつ追加する。", { x: 0.6, y: 5.9, w: 12.13, h: 0.85, fontSize: 16, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Own rule banner" });
}

{
  const s = content("ログの設定と動作確認", "設定方法");
  tcard(s, 0.6, 1.5, 3.9, 4.0, "Card logging", "ログを有効化",
    "Web ACLの Logging and metrics タブで Enable\n出力先 CloudWatch Logs\nロググループ名 aws-waf-logs-shop-prd\nauthorizationとcookieをマスク",
    { tsize: 22, bsize: 18 });
  tcard(s, 4.715, 1.5, 3.9, 4.0, "Card verify", "設定の確認",
    "Associated AWS resources タブにALBが表示される\nRulesタブに5件が優先度順に並ぶ\nBlockを有効にする前は、ルールのアクションがCountになっている",
    { tsize: 22, bsize: 18 });
  tcard(s, 8.83, 1.5, 3.9, 4.0, "Card test", "動作の確認",
    "テスト環境のALBへ、SQLiを模した文字列をクエリに付けて送る\nCount中はSampled requestsとログに記録される\nBlock化後は403が返る",
    { tsize: 22, bsize: 18 });
  card(s, 0.6, 5.75, 12.13, 1.0, "Test caution bg", C.text1);
  s.addText("テストは自社の環境で、事前に関係者の承認を得て行う。本番で試す場合は、Countの状態で影響を確認してから。", { x: 0.6, y: 5.75, w: 12.13, h: 1.0, fontSize: 16, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Test caution" });
}

// ---------------------------------------------------------------- 3 rules table
pres.addSection({ title: "ルール設計" });
{
  const s = content("ルール構成と評価順", "ルール設計");
  const H = (t, al) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, align: al || "left" } });
  const R = (a, b, c, d, e, z) => [
    { text: a, options: { align: "center", fill: { color: z ? C.background2 : C.background1 } } },
    { text: b, options: { bold: true, fill: { color: z ? C.background2 : C.background1 } } },
    { text: c, options: { fill: { color: z ? C.background2 : C.background1 } } },
    { text: d, options: { fill: { color: z ? C.background2 : C.background1 } } },
    { text: e, options: { align: "center", fill: { color: z ? C.background2 : C.background1 } } },
  ];
  const rows = [
    [H("優先度", "center"), H("ルール"), H("役割"), H("アクション"), H("WCU", "center")],
    R("10", "Amazon IP reputation list", "悪性IPをブロック", "ルール既定", "25", false),
    R("20", "Core rule set", "汎用的な攻撃(XSSなど)", "ルール既定", "700", true),
    R("30", "Known bad inputs", "既知の不正入力", "ルール既定", "200", false),
    R("40", "SQL database", "SQLインジェクション", "ルール既定", "200", true),
    R("50", "レート制限(自前)", "同一IPの過剰アクセス(サンプル 2,000/5分)", "Block", "2", false),
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 12.13, colW: [1.1, 3.9, 4.6, 1.5, 1.03], rowH: 0.55, fontSize: 14, color: C.text1, valign: "middle", border: { type: "solid", pt: 0.5, color: "D0D6DD" }, objectName: "Rule table" });
  card(s, 0.6, 5.65, 12.13, 1.1, "Rule note bg", C.text1);
  s.addText("番号の小さい順に評価し、AllowまたはBlockに一致した時点で終了。初期は全ルールをCountで運用し、確認後にBlockへ。合計は約1,127 WCU(自前のレート制限は概数)。", { x: 0.6, y: 5.65, w: 12.13, h: 1.1, fontSize: 16, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Rule note" });
  s.addNotes("02の構成には許可IPのAllowルールを置いていない。置く場合は、一致するとそれ以降のルールを評価しないため、対象は必要最小限にする。");
}

// ---------------------------------------------------------------- 4 SQLi steps
{
  const s = content("SQLインジェクションを遮断する手順", "ルール設計");
  const steps = [
    ["入口を開く", "Rulesタブで Add rules から Add managed rule groups を選ぶ"],
    ["一覧から選ぶ", "AWS managed rule groups を展開し、SQL database を選ぶ"],
    ["追加する", "Add to web ACL を有効にして Add rules。優先度を調整して保存"],
    ["Countで開始", "ルールグループのアクションをCountに上書きし、誤検知を確認"],
    ["Blockへ切替", "問題なければ上書きを外す。遮断時の応答は403"],
  ];
  steps.forEach((t, i) => {
    const x = 0.6 + i * 2.45;
    card(s, x, 1.55, 2.3, 2.95, "Step card " + (i + 1) + " bg");
    num(s, i + 1, x + 0.15, 1.7, "Step " + (i + 1));
    cardText(s, t[0], t[1], x, 2.3, 2.3, 2.2, "Step text " + (i + 1));
  });
  card(s, 0.6, 4.75, 12.13, 0.95, "Banner bg", C.text1);
  s.addText("根本対策はアプリ側のバインド変数。WAFは追加の防御層として使う。", { x: 0.6, y: 4.75, w: 12.13, h: 0.95, fontSize: 18, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Banner" });
  tcard(s, 0.6, 5.9, 12.13, 0.95, "Own rule", "自前ルールで作る場合", "Inspect = Query string(必要に応じてBody)/ Match = Contains SQL injection attacks / Text transformation = URL decode", { tsize: 14, bsize: 14 });
}

// ---------------------------------------------------------------- 5 add managed rule groups
{
  const s = content("Add managed rule groups の見方", "ルール設計");
  card(s, 0.6, 1.55, 6.5, 5.2, "Left bg");
  const rows = [
    ["入口は1つ", "Rules > Add rules > Add managed rule groups"],
    ["一覧が開く", "ベンダー(AWS / Marketplace)を展開するとルールグループが並ぶ"],
    ["個別に追加", "使うグループごとに Add to web ACL を有効にする"],
    ["確定する", "下部の Add rules > 優先度を調整 > Save。Rulesタブに1グループ1行で並ぶ"],
  ];
  rows.forEach((r, i) => {
    const y = 1.75 + i * 1.25;
    num(s, i + 1, 0.8, y, "Row " + (i + 1));
    cardText(s, r[0], r[1], 1.45, y - 0.12, 5.5, 1.15, "Row text " + (i + 1));
  });
  card(s, 7.35, 1.55, 5.38, 5.2, "Right bg", C.text2);
  s.addText(
    [
      { text: "一覧の主な区分", options: { bold: true, fontSize: 18, breakLine: true, color: C.background1 } },
      { text: "基本", options: { bold: true, fontSize: 14, color: C.accent6, breakLine: true } },
      { text: "Core rule set / Known bad inputs / Admin protection", options: { fontSize: 14, color: C.background1, breakLine: true } },
      { text: "用途別", options: { bold: true, fontSize: 14, color: C.accent6, breakLine: true } },
      { text: "SQL database / WordPress application など", options: { fontSize: 14, color: C.background1, breakLine: true } },
      { text: "IPの評判", options: { bold: true, fontSize: 14, color: C.accent6, breakLine: true } },
      { text: "Amazon IP reputation list / Anonymous IP list", options: { fontSize: 14, color: C.background1, breakLine: true } },
      { text: "有料オプション", options: { bold: true, fontSize: 14, color: C.accent6, breakLine: true } },
      { text: "Bot Control / Anti-DDoS など。追加すると自動で購読になるため、料金を確認してから追加する", options: { fontSize: 14, color: C.background1 } },
    ],
    { x: 7.35, y: 1.55, w: 5.38, h: 5.2, valign: "top", margin: 16, paraSpaceAfter: 6, isTextBox: true, objectName: "Categories" }
  );
}

// ---------------------------------------------------------------- 6 rate limit
pres.addSection({ title: "運用" });
{
  const s = content("レート制限のしきい値の考え方", "運用");
  stat(s, "既定値なし", "AWSが決めた推奨値はない。実トラフィックで決める", 0.6, 1.5, 3.9, 1.75, "Stat default");
  stat(s, "5分", "既定の評価ウィンドウ(1・2・5・10分から選択)", 4.715, 1.5, 3.9, 1.75, "Stat window");
  stat(s, "10", "設定できるしきい値の最小値", 8.83, 1.5, 3.9, 1.75, "Stat min");
  tcard(s, 0.6, 3.5, 3.9, 2.95, "Card measure", "決め方", "まずCountで開始し、ログからIP別のリクエスト数を集計。ベースラインに余裕を足して設定する。");
  tcard(s, 4.715, 3.5, 3.9, 2.95, "Card tiers", "2段構え", "全体用のルールに加え、ログインなど重要URI用に、より低い値のルールを重ねる。");
  tcard(s, 8.83, 3.5, 3.9, 2.95, "Card caveat", "注意", "厳密な制御ではなく、設定値の近くで効く。検知まで数分かかることもある。設計書の2,000/5分はサンプル値。");
  note(s, "出典: AWS WAF Developer Guide(Rate-based rule)、AWS Security Blog、AWS What's New", 6.6);
  s.addNotes("下限は2024年8月の更新で100から10に下がった。古い解説は100と書いていることがある。");
}

// ---------------------------------------------------------------- 7 managed rule updates
{
  const s = content("マネージドルールの更新の仕組み", "運用");
  const fl = [["新しい版が公開", "既定の版は変わらない"], ["SNSで通知", "切替の1週間前と当日"], ["既定が新版へ切替", "既定の版を使っていれば自動"]];
  fl.forEach((f, i) => {
    const x = 0.6 + i * 4.265;
    card(s, x, 1.5, 3.6, 1.2, "Flow " + (i + 1) + " bg", i === 2 ? C.accent1 : C.background2);
    s.addText([{ text: f[0], options: { bold: true, fontSize: 16, breakLine: true } }, { text: f[1], options: { fontSize: 14 } }], { x, y: 1.5, w: 3.6, h: 1.2, align: "center", valign: "middle", color: C.text1, margin: 6, isTextBox: true, objectName: "Flow " + (i + 1) });
    if (i < 2) arrow(s, x + 3.6 + 0.1325, 1.9, "Flow arrow " + (i + 1));
  });
  tcard(s, 0.6, 2.95, 5.96, 1.75, "Card default", "既定の版を使う", "AWSが新しい版へ切り替える。切替前に通知で影響を確認できる。");
  tcard(s, 6.77, 2.95, 5.96, 1.75, "Card pin", "版を固定する", "更新の影響を受けない。ただし版が期限切れになると既定の版が使われる。");
  tcard(s, 0.6, 4.9, 5.96, 1.75, "Card ip", "IPの評判ルール", "版がなく、AWSの脅威情報に基づいて頻繁に更新される。通知の対象外。");
  tcard(s, 6.77, 4.9, 5.96, 1.75, "Card manual", "自動では変わらないもの", "自前ルールの内容。新しいルールグループ(一覧に出るだけで、自動では追加されない)。");
  note(s, "出典: AWS WAF Developer Guide(Version management with managed rule groups)", 6.68);
}

// ---------------------------------------------------------------- 8 rollout
{
  const s = content("導入手順:CountからBlockへ", "運用");
  const st = [
    ["Countで導入", "全ルールをCountにして本番に適用する"],
    ["確認する", "Sampled requestsとログで、一致した通信を確認する"],
    ["誤検知に対処", "該当ルールのみCount、または範囲を限定して除外する"],
    ["Blockへ切替", "問題がなければCountの上書きを外す"],
  ];
  st.forEach((t, i) => {
    const x = 0.6 + i * 3.077;
    num(s, i + 1, x + 0.1, 1.55, "Phase " + (i + 1));
    tcard(s, x, 2.2, 2.9, 2.3, "Phase card " + (i + 1), t[0], t[1]);
  });
  card(s, 0.6, 4.8, 12.13, 1.95, "ALB caution bg", C.text1);
  s.addText(
    [
      { text: "ALBでの注意:アップロード系パス", options: { bold: true, fontSize: 18, color: C.accent6, breakLine: true } },
      { text: "ボディ検査は先頭8KB固定。Core rule setの SizeRestrictions_BODY は8KB超のボディをブロックするため、ファイルアップロード等のパスは、対象を限定して除外する設計が必要。", options: { fontSize: 15, color: C.background1 } },
    ],
    { x: 0.6, y: 4.8, w: 12.13, h: 1.95, valign: "middle", margin: 16, paraSpaceAfter: 6, isTextBox: true, objectName: "ALB caution" }
  );
}

// ---------------------------------------------------------------- 9 logging
{
  const s = content("ログ・監視・権限", "運用");
  tcard(s, 0.6, 1.55, 3.9, 3.3, "Card log", "ログ", "CloudWatch Logs の aws-waf-logs-shop-prd(同一リージョン)に保存。authorizationとcookieはマスク。保持期間は要決定。", { tsize: 20, bsize: 18 });
  tcard(s, 4.715, 1.55, 3.9, 3.3, "Card metric", "メトリクス", "全ルールのCloudWatchメトリクスを有効化。Sampled requestsで一致した通信を確認する。", { tsize: 20, bsize: 18 });
  tcard(s, 8.83, 1.55, 3.9, 3.3, "Card alarm", "アラーム", "Blockの急増を通知する。しきい値は運用で決める。", { tsize: 20, bsize: 18 });
  tcard(s, 0.6, 5.1, 12.13, 1.6, "Card ops", "権限と構成管理", "設定変更の権限と参照の権限を分ける。Terraformでコード管理する予定で、コードとパラメータシートの値を一致させる。", { tsize: 20, bsize: 18 });
}

// ---------------------------------------------------------------- 10 WCU
pres.addSection({ title: "容量・制約" });
{
  const s = content("容量(WCU)と料金", "容量・制約");
  s.addChart(pres.charts.BAR, [{ name: "WCU", labels: ["Core rule set", "SQL database", "Known bad inputs", "IP reputation list", "レート制限(自前)"], values: [700, 200, 200, 25, 2] }], {
    x: 0.6, y: 1.5, w: 7.2, h: 5.0, barDir: "bar", chartColors: [THEME.colors.accent1],
    showTitle: true, title: "ルール別のWCU(自前は概数)", titleFontSize: 14, titleColor: THEME.colors.dk1, titleFontFace: "+mn-lt",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: THEME.colors.dk1, dataLabelFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, catAxisLabelColor: THEME.colors.dk1, catAxisLabelFontFace: "+mn-lt", catAxisOrientation: "maxMin",
    valAxisLabelFontSize: 11, valAxisLabelColor: THEME.colors.dk2, valAxisLabelFontFace: "+mn-lt",
    valGridLine: { color: "E1E5EA", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, barGapWidthPct: 50,
    objectName: "WCU chart",
  });
  stat(s, "約1,127", "本構成の合計WCU(概数)", 8.1, 1.55, 4.63, 1.55, "Stat total");
  stat(s, "1,500", "基本料金に含まれるWCU。超えると追加料金", 8.1, 3.27, 4.63, 1.55, "Stat included");
  stat(s, "5,000", "1つのWeb ACLの上限", 8.1, 4.99, 4.63, 1.55, "Stat max");
  note(s, "出典: AWS WAF Developer Guide(WCU、Managed rule groups)、AWS WAF Pricing、AWS What's New(2023年4月)。単価は公式の料金ページで確認", 6.65);
}

// ---------------------------------------------------------------- 11 limits
{
  const s = content("制約と今後の検討事項", "容量・制約");
  tcard(s, 0.6, 1.55, 5.96, 3.95, "Card limits", "WAFの制約", "ALBのボディ検査は先頭8KB固定(変更不可)。\nヘッダーとCookieも先頭8KB・最大200件まで。\nエンコード等による回避もあり得るため、アプリ側の対策と併用する。", { tsize: 22, bsize: 20 });
  tcard(s, 6.77, 1.55, 5.96, 3.95, "Card later", "今回は未採用(要件次第)", "地理的制限(Geo match)\nBot Control(有料)\nAnti-DDoSルール(50 WCU、追加料金)\nCAPTCHA / Challenge\nAWS WAF Security Automations", { tsize: 22, bsize: 20 });
  card(s, 0.6, 5.75, 12.13, 1.0, "Open items bg", C.text1);
  s.addText("未確認:ALBへの関連付け数の上限。実画面の項目名とクォータは、導入前に公式ドキュメントで確認する。", { x: 0.6, y: 5.75, w: 12.13, h: 1.0, fontSize: 16, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Open items" });
}

// ---------------------------------------------------------------- Kiro screen (schematic)
pres.addSection({ title: "参考:Kiro" });
{
  const s = content("Kiroとは:概要と主な特徴", "参考:Kiro");
  tcard(s, 0.6, 1.5, 5.4, 4.95, "Card kiro overview", "概要",
    "AWSが2025年7月14日に発表した、エージェント型のAI IDE\n「雰囲気コーディングから実用的なコードへ」という位置づけ\nCode OSS(VS Codeのベース)製。VS Codeの設定とOpen VSX拡張に互換\nGoogleまたはGitHubでログインでき、AWSアカウントは不要\nIDEのほか、CLIとWeb版がある。Builder IDやIAM Identity Centerでのサインインも可",
    { tsize: 20, bsize: 15 });
  const f = [
    ["スペック駆動開発", "要件・設計・タスクの3文書に落としてからコードを書く。要件はEARS記法"],
    ["Agent hooks", "ファイルの作成・保存・削除などを契機に、エージェントが自動で動く"],
    ["Steering", "プロジェクト固有のルールや文脈をファイルで与える"],
    ["MCP / Powers", "MCPに対応。Powersは拡張の仕組み"],
    ["GovCloud対応", "AWS GovCloud(US)でも利用できる"],
  ];
  f.forEach((t, i) => {
    const y = 1.5 + i * 1.0;
    card(s, 6.2, y, 6.53, 0.92, "Feature bg " + (i + 1));
    cardText(s, t[0], t[1], 6.3, y, 6.35, 0.92, "Feature text " + (i + 1), { tsize: 16, bsize: 13 });
  });
  note(s, "出典: 報道・紹介記事(TechRadar、DevClass、AWS Builder Centerなど)の整理。内容は公式(kiro.dev)で確認する。", 6.7);
}
{
  const s = content("Kiroの料金・注意点・他ツールとの違い", "参考:Kiro");
  const H = (t, al) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, align: al || "center" } });
  const P = (t, al) => ({ text: t, options: { align: al || "center" } });
  const rows = [
    [H("プラン"), H("月額"), H("含まれるクレジット")],
    [P("Free"), P("$0"), P("50")],
    [P("Pro"), P("$20"), P("1,000")],
    [P("Pro+"), P("$40"), P("2,000")],
    [P("Pro Max"), P("$100"), P("5,000")],
    [P("Power"), P("$200"), P("10,000")],
    [P("Enterprise"), P("$20 / 席(2席〜)"), P("500 / 席(共有)")],
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 5.9, colW: [1.7, 2.2, 2.0], rowH: 0.5, fontSize: 14, color: C.text1, valign: "middle", border: { type: "solid", pt: 0.5, color: "D0D6DD" }, objectName: "Kiro price table" });
  s.addText("追加分は1クレジット$0.04。Freeはオープンウェイトモデルと Claude Sonnet 4.5 のみ。", { x: 0.6, y: 5.1, w: 5.9, h: 0.6, fontSize: 13, color: C.text1, margin: 0, isTextBox: true, objectName: "Price note" });
  tcard(s, 6.7, 1.5, 6.03, 2.1, "Card caution", "注意点",
    "仕様駆動の重い使い方では、無料枠はすぐ尽きるとされる\nOpen VSXのため、Microsoft製C#拡張が使えない\nクラウド型のため、NDA案件では懸念する声がある",
    { tsize: 18, bsize: 14 });
  tcard(s, 6.7, 3.75, 6.03, 1.95, "Card diff", "他ツールとの違い",
    "Cursor、Claude Code:依頼するとすぐ編集する流れが中心\nKiro:先に計画と仕様を固める流れが中心\n設計書を書いてから実装する、インフラ系の作業と相性が良さそう",
    { tsize: 18, bsize: 14 });
  card(s, 0.6, 5.9, 12.13, 0.85, "Price banner bg", C.text1);
  s.addText("料金は2026年11月時点の公式ページ(kiro.dev/pricing)による。変更されるため、契約前に最新を確認する。", { x: 0.6, y: 5.9, w: 12.13, h: 0.85, fontSize: 15, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Price banner" });
}

{
  const s = content("KiroとVS Code、BYOKの関係", "参考:Kiro");
  tcard(s, 0.6, 1.5, 6.4, 4.95, "Card vscode", "VS Codeとの関係",
    "Kiro本体は、VS Codeの基盤の上に作られた独立したIDE(拡張機能ではない)\n設定や拡張機能は引き継げる。ただし拡張は、Open VSX(拡張機能の配布場所)にあるものだけ\nVS Codeの中でKiroを使う方法:ACPとコミュニティ製の拡張機能。エージェントはkiro-cli acpで起動する(公式製品ではない)\nVisual StudioとEclipse:専用プラグインはなく、Kiro CLIを併用する\nJetBrains:AI AssistantにKiroをカスタムエージェントとして追加する",
    { tsize: 22, bsize: 18 });
  tcard(s, 7.2, 1.5, 5.53, 3.2, "Card byok", "BYOK(自分のAPIキー)",
    "公式の対応は、今回の調査では確認できなかった\nGitHubに、自分のAPIキーやカスタムエンドポイントの対応を求める要望がある(#9367、#1409)\n最新の状況は公式で確認する",
    { tsize: 22, bsize: 16 });
  tcard(s, 7.2, 4.85, 5.53, 1.6, "Card byok alt", "BYOKが必須の場合", "他のツールを検討する。例:VS CodeのチャットはBYOKに対応している", { tsize: 18, bsize: 16 });
  note(s, "出典: AWS Builder Center、AWSブログ、Kiro公式ドキュメント、GitHubのKiroリポジトリ、VS Codeのブログ(2026年11月時点の調査)。", 6.65);
}

{
  const s = content("Kiroの画面:ざっくり説明", "参考:Kiro");
  const H = (t, al) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, align: al || "center" } });
  const L = (t) => ({ text: t, options: { bold: true, fill: { color: C.background2 } } });
  const P = (t) => ({ text: t, options: { align: "left" } });
  const rows = [
    [H("場所"), H("何をする所か", "left"), H("覚えておくこと", "left")],
    [L("チャット"), P("Kiroへの依頼を書く。変更案や作業状況もここに出る"), P("Vibe(会話)かSpec(仕様書先行)を選ぶ。#でファイルなどを指定")],
    [L("エディタ"), P("コードや設定ファイル、Specsを見る・直す"), P("差分を見て、承認または修正する")],
    [L("ビュー(左側)"), P("Explorer、Kiroパネル(Specs、Hooks、Steering、MCP)"), P("プロジェクトの決まりごとは、SteeringやHooksに置く")],
    [L("ターミナル"), P("Kiroが実行するコマンドの結果を確認する"), P("実行前の確認は、Supervisedモードで行う")],
    [L("ステータスバー"), P("Gitの状態、エラー数、エージェントの状態、クレジット"), P("クレジットの残りもここで見られる")],
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 12.13, colW: [1.9, 5.3, 4.93], rowH: [0.5, 0.8, 0.7, 0.8, 0.7, 0.7], fontSize: 14, color: C.text1, valign: "middle", border: { type: "solid", pt: 0.5, color: "D0D6DD" }, objectName: "Kiro screen summary table" });
  tcard(s, 0.6, 5.85, 3.9, 0.95, "Card form1", "画面は2種類", "エディタ表示と、チャット中心のエージェント集中モード", { tsize: 14, bsize: 12 });
  tcard(s, 4.715, 5.85, 3.9, 0.95, "Card form2", "使い方は4種類", "IDE、CLI、Web、Mobile", { tsize: 14, bsize: 12 });
  tcard(s, 8.83, 5.85, 3.9, 0.95, "Card form3", "進め方は2種類", "Vibe(会話)とSpec(仕様書先行)", { tsize: 14, bsize: 12 });
  note(s, "次のページ以降に、実画面を載せている。", 6.82);
}

{
  const s = content("Kiroの実画面(エディタ表示)", "参考:Kiro");
  const IW = 7.3, IH = IW * 562 / 804;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_ide.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiro IDEの画面。左にビュー、中央にエディタ、右にチャットパネル、下にステータスバー", objectName: "Kiro screenshot" });
  card(s, 8.15, 1.5, 4.58, 5.04, "Kiro real notes bg");
  s.addText(
    [
      { text: "画面の番号", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "1 エディタ:コードの編集", options: { fontSize: 14, breakLine: true } },
      { text: "2 チャットパネル:AIへの依頼", options: { fontSize: 14, breakLine: true } },
      { text: "3 ビュー:Explorer、Kiroパネルなど", options: { fontSize: 14, breakLine: true } },
      { text: "4 ステータスバー:Git、エラー数など", options: { fontSize: 14, breakLine: true } },
      { text: "チャットの入力欄まわり", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "Vibe:会話しながら進める。Spec:要件と設計を先に作る", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "モデルの選択(画面ではClaude Sonnet 4.0)", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "Autopilotの切替スイッチ", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "#でファイルなどの文脈を指定", options: { fontSize: 14, bullet: true } },
    ],
    { x: 8.15, y: 1.5, w: 4.58, h: 5.04, valign: "top", margin: 14, paraSpaceAfter: 6, color: C.text1, isTextBox: true, objectName: "Kiro real notes" }
  );
  note(s, "出典: Kiro公式ドキュメント(kiro.dev/docs/ide/editor/interface)の画面図。ステータスバーに「Kiro Public Preview」とあり、現行版とは異なる場合がある。", 6.75);
  s.addNotes("公式ドキュメントの図。Vibe(会話型)とSpec(仕様駆動)の2つの進め方を、チャットの開始時に選べる。");
}

{
  const s = content("Kiroの実画面(チャットで作業中の例)", "参考:Kiro");
  const IW = 7.3, IH = IW * 428 / 746;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_chat.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiroでチャットが作業中の画面。チェックポイント、Cancel、入力欄、Autopilotのスイッチ、ステータスバー", objectName: "Kiro chat screenshot" });
  card(s, 8.15, 1.5, 4.58, 5.04, "Kiro chat notes bg");
  s.addText(
    [
      { text: "この画面で分かること", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "Working.. とCancel:作業中で、途中で止められる", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "Checkpoint と Restore:依頼ごとの時点に戻せる", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "回答の下に、使ったクレジット(Est. Credits Used)と所要時間", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "入力欄:#で文脈を指定、ファイル添付、モデル選択、Autopilotのスイッチ", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "ステータスバー:クレジットの使用状況(Kiro Power)", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "Max、Defaultの選択欄の意味は、画面だけでは判断できないため要確認", options: { fontSize: 13, color: C.accent1, bold: true } },
    ],
    { x: 8.15, y: 1.5, w: 4.58, h: 5.04, valign: "top", margin: 14, paraSpaceAfter: 7, color: C.text1, isTextBox: true, objectName: "Kiro chat notes" }
  );
  note(s, "出典: Kiro公式サイト(kiro.dev)の画面。サイト上部のメニュー部分は切り取って掲載。画面は版により異なる。", 6.75);
  s.addNotes("前のスライドより新しい版の画面。変更を依頼すると、チェックポイントが作られ、Restoreで戻せる。");
}

{
  const s = content("Kiroの実画面(Explorerとチャットを開いた例)", "参考:Kiro");
  const IW = 7.3, IH = IW * 395 / 730;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_ide2.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiro IDEの画面。左にファイルツリー、中央にショートカット一覧、下にターミナル、右にチャット", objectName: "Kiro screenshot 2" });
  card(s, 8.15, 1.5, 4.58, 5.04, "Kiro ide2 notes bg");
  s.addText(
    [
      { text: "画面の見どころ", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "左:プロジェクトのファイルツリー(.kiroフォルダを含む)", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "中央:Kiroのロゴと主なショートカット(チャットを開く、コマンド一覧、ファイル検索、ターミナルの切替など)", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "下:ターミナル。Kiroが実行するコマンドも、ここで確認できる", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "右:チャット。依頼の文面とKiroの作業状況(Working)が並ぶ", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "元の画像の解像度が低いため、細かい文字は読めない", options: { fontSize: 13, color: C.accent1, bold: true } },
    ],
    { x: 8.15, y: 1.5, w: 4.58, h: 5.04, valign: "top", margin: 14, paraSpaceAfter: 7, color: C.text1, isTextBox: true, objectName: "Kiro ide2 notes" }
  );
  note(s, "出典: Kiro公式サイト(kiro.dev)の画面(紹介動画のサムネイルで、右下の再生ボタンが重なっている)。画面は版により異なる。", 6.75);
  s.addNotes("エディタ表示の例。依頼の内容はチャットに残り、実行したコマンドはターミナルで確認できる。");
}

{
  const s = content("Kiroの利用形態:IDE・CLI・Web・Mobile", "参考:Kiro");
  const IH = 5.0, IW = IH * 856 / 750;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_web.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiro公式ドキュメントの画面。前提条件と、IDE・CLI・Web・Mobileのタブ。Webタブの手順が表示されている", objectName: "Kiro web docs screenshot" });
  const X = 0.6 + IW + 0.25, Wd = 12.73 - X;
  card(s, X, 1.5, Wd, 5.0, "Kiro forms notes bg");
  s.addText(
    [
      { text: "公式ドキュメントのタブ", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "IDE / CLI / Web / Mobile の4つの使い方がある", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "Webの開始手順", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "1 app.kiro.dev を開いてサインイン", options: { fontSize: 14, breakLine: true } },
      { text: "2 GitHubまたはGitLabを接続し、リポジトリを選ぶ", options: { fontSize: 14, breakLine: true } },
      { text: "3 New sessionでタスクを作り、やりたいことを書く", options: { fontSize: 14, breakLine: true } },
      { text: "前提", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "Kiroのインストール、サインイン、作業するプロジェクト、構成と技術の基本的な理解", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "WAFの設定変更への当てはめ", options: { bold: true, fontSize: 16, color: C.accent1, breakLine: true } },
      { text: "Terraformをリポジトリで管理すれば、Webでも依頼できる見込み(要確認)", options: { fontSize: 14, bullet: true } },
    ],
    { x: X, y: 1.5, w: Wd, h: 5.0, valign: "top", margin: 14, paraSpaceAfter: 6, color: C.text1, isTextBox: true, objectName: "Kiro forms notes" }
  );
  note(s, "出典: Kiro公式ドキュメント(kiro.dev/docs)の画面。CLI・Mobileの手順は今回の画面にないため未記載。", 6.75);
  s.addNotes("Web版はリポジトリを接続して使う形。CLI版とMobile版の手順は、公式ドキュメントのタブで確認する。");
}

{
  const s = content("Kiroの契約とリージョン", "参考:Kiro");
  tcard(s, 0.6, 1.5, 5.6, 2.35, "Region idc", "IAM Identity Centerのリージョン",
    "ユーザーのIDがある場所\n東京・大阪など、多くのリージョンで使える", { tsize: 21, bsize: 18 });
  arrow(s, 6.4, 2.45, "Region arrow");
  s.addText("別々に選べる", { x: 5.9, y: 2.9, w: 1.4, h: 0.4, fontSize: 12, color: C.text2, align: "center", margin: 0, isTextBox: true, objectName: "Region arrow label" });
  tcard(s, 7.0 + 0.35, 1.5, 5.38, 2.35, "Region profile", "Kiroプロファイルのリージョン",
    "データの保存場所(推論もここ)\nバージニア北部、フランクフルト、GovCloud\n東京は対象外(公式の一覧より)", { tsize: 21, bsize: 18 });
  tcard(s, 0.6, 4.05, 3.9, 2.6, "Region personal", "個人契約(Free・Pro等)",
    "Google / GitHub / Builder IDでログイン\nAWSアカウントは不要\nデータはバージニア北部に保存", { tsize: 17, bsize: 15 });
  tcard(s, 4.715, 4.05, 3.9, 2.6, "Region org", "組織契約(enterprise)",
    "IAM Identity CenterまたはOkta等でログイン\n請求はAWS経由で1本化\nプロファイルは、アカウント×リージョンごとに1つ", { tsize: 17, bsize: 15 });
  tcard(s, 8.83, 4.05, 3.9, 2.6, "Region note", "注意",
    "AWSアカウントごとにKiroを作る必要はない\n管理者は、プロファイルを作ったリージョンに切り替えて操作\n対応リージョンは増える可能性あり。導入時に公式で確認", { tsize: 17, bsize: 15, fill: C.background2 });
  note(s, "出典: Kiro公式ドキュメント(Supported regions、Concepts、Data protection)、AWS re:Post。リージョン一覧は2026-11-25時点で確認。", 6.82);
  s.addNotes("ポイントは、IAM Identity Centerのリージョンと、Kiroプロファイルのリージョンが別という点。Identity Centerは東京でも、プロファイルはバージニア北部かフランクフルトを選ぶ。");
}

{
  const s = content("Kiro Webのサインイン画面", "参考:Kiro");
  const IH = 5.0, IW = IH * 440 / 490;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_signin.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiro Webのサインイン画面。Google、GitHub、Builder ID、Your organizationの4つから選ぶ", objectName: "Kiro signin screenshot" });
  const X = 0.6 + IW + 0.3, Wd = 12.73 - X;
  card(s, X, 1.5, Wd, 5.0, "Kiro signin notes bg");
  s.addText(
    [
      { text: "サインイン方法(4種類)", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "Google", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "GitHub", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "Builder ID(AWSのアカウント)", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "Your organization(組織のアカウント)", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "ポイント", options: { bold: true, fontSize: 18, breakLine: true } },
      { text: "新規登録(sign up)も、同じ画面から行う", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "利用時に、AWSカスタマー契約、サービス条件、プライバシー通知、AWS知的財産ライセンスへの同意が必要", options: { fontSize: 15, bullet: true, breakLine: true } },
      { text: "会社で使う場合は「Your organization」が候補。社内のアカウント管理の方式は要確認", options: { fontSize: 15, bullet: true, color: C.accent1, bold: true } },
    ],
    { x: X, y: 1.5, w: Wd, h: 5.0, valign: "top", margin: 14, paraSpaceAfter: 7, color: C.text1, isTextBox: true, objectName: "Kiro signin notes" }
  );
  note(s, "出典: app.kiro.dev/signin の画面(ブラウザのバーは除いて掲載)。画面は版により異なる。", 6.75);
  s.addNotes("会社のアカウント管理(シングルサインオンなど)との関係は、管理者に確認する。");
}

{
  const s = content("Kiroの実画面(新規セッションの開始)", "参考:Kiro");
  const IH = 5.0, IW = IH * 710 / 584;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_new.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiroの新規セッション画面。What are we building today? と出て、Vibe CodingとCode with Specの2つから選ぶ", objectName: "Kiro new session screenshot" });
  const X = 0.6 + IW + 0.3, Wd = 12.73 - X;
  card(s, X, 1.5, Wd, 5.0, "Kiro new notes bg");
  s.addText(
    [
      { text: "進め方を2つから選ぶ", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "Vibe Coding:自由な会話で、相談やコーディングを進める", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "Code with Spec:仕様書を先に作り、機能や新しいアプリを段階的に作る", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "画面の説明文", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "チャットで新しく作るか、既存のコードを、エージェントが作った仕様書で改良する", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "WAFの設計に当てはめると", options: { bold: true, fontSize: 17, color: C.accent1, breakLine: true } },
      { text: "小さな設定変更はVibe、ルール構成の見直しなど大きな変更はSpecが向く(目安)", options: { fontSize: 14, bullet: true, breakLine: true } },
      { text: "ほかに見えるもの", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "Autopilotのスイッチ、左のショートカット、下のターミナル", options: { fontSize: 14, bullet: true } },
    ],
    { x: X, y: 1.5, w: Wd, h: 5.0, valign: "top", margin: 14, paraSpaceAfter: 5, color: C.text1, isTextBox: true, objectName: "Kiro new notes" }
  );
  note(s, "出典: Kiro公式サイトの画面(ステータスバーに「Kiro Public Preview」)。WAFへの当てはめは目安で、公式の記載ではない。", 6.75);
  s.addNotes("チャット開始時に、VibeかSpecを選ぶ。選んだ方で、その後の進め方が変わる。");
}

{
  const s = content("Kiroの実画面(#で文脈を指定する例)", "参考:Kiro");
  const IH = 5.0, IW = IH * 722 / 602;
  s.addImage({ path: require("path").join(__dirname, "kiroimg", "kiro_hash.png"), x: 0.6, y: 1.5, w: IW, h: IH, altText: "Kiroのチャット画面。#を入力すると、Files、Codebase、Docs、Git Diff、Terminalなどの文脈の候補が出る", objectName: "Kiro hash screenshot" });
  const X = 0.6 + IW + 0.3, Wd = 12.73 - X;
  card(s, X, 1.5, Wd, 5.0, "Kiro hash notes bg");
  s.addText(
    [
      { text: "新規セッションの画面", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "「What are we building today?」で、進め方を選ぶ", options: { fontSize: 13, bullet: true, breakLine: true } },
      { text: "Vibe Coding:自由な会話で進める", options: { fontSize: 13, bullet: true, breakLine: true } },
      { text: "Code with Spec:仕様書を先に作って進める", options: { fontSize: 13, bullet: true, breakLine: true } },
      { text: "#で指定できる文脈", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "Files、Codebase、Code、Docs、Repository Map、Git Diff、Terminal(端末の内容)、Problems、Folder、URL、Current File", options: { fontSize: 13, bullet: true, breakLine: true } },
      { text: "ほかに見えるもの", options: { bold: true, fontSize: 17, breakLine: true } },
      { text: "Autopilotのスイッチ(この画面ではON)", options: { fontSize: 13, bullet: true, breakLine: true } },
      { text: "左に主なショートカット(チャットを開く、インラインチャット、ファイル検索など)", options: { fontSize: 13, bullet: true } },
    ],
    { x: X, y: 1.5, w: Wd, h: 5.0, valign: "top", margin: 14, paraSpaceAfter: 5, color: C.text1, isTextBox: true, objectName: "Kiro hash notes" }
  );
  note(s, "出典: Kiro公式サイトの画面(ステータスバーに「Kiro Public Preview」。現行版と異なる場合がある)。", 6.75);
  s.addNotes("チャットは右側のパネル。#でWAFのTerraformファイルやGit差分などを指定して依頼できる。");
}

{
  const s = content("Kiroの画面は2つのレイアウト(概略図)", "参考:Kiro");
  const mock = (X, Y, W, Hh, tag, cols, ttl) => {
    const box = (x, y, w, h, name, fill, label, o) => {
      s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: "C9D0D8", width: 0.75 }, objectName: tag + name });
      if (label) s.addText(label, Object.assign({ x, y, w, h, fontSize: 13, color: C.text1, align: "center", valign: "middle", margin: 4, isTextBox: true, objectName: tag + name + " text" }, o || {}));
    };
    box(X, Y, W, 0.38, " title", C.text1, ttl, { color: C.background1, bold: true, fontSize: 13 });
    let cx = X;
    cols.forEach((c, i) => { const w = c[0] * W; box(cx, Y + 0.38, w, Hh - 0.76, " col" + i, c[1], c[2], c[3]); cx += w; });
    box(X, Y + Hh - 0.38, W, 0.38, " status", "E4E8EE", "ステータスバー(Git、エラー数、エージェント状態)", { fontSize: 11 });
  };
  mock(0.6, 1.5, 5.9, 3.5, "A", [[0.22, C.background2, "Explorer\nKiroパネル\n(Specs、Hooks、\nSteering、MCP)", { fontSize: 11 }], [0.42, C.background1, "エディタ\n(コード、Specs)", { bold: true }], [0.36, "FDEBD3", "チャット", { bold: true }]], "A:エディタ表示(標準)");
  mock(6.83, 1.5, 5.9, 3.5, "B", [[0.22, C.background2, "セッション\n一覧", {}], [0.46, C.background1, "チャット\n(中央)", { bold: true }], [0.32, "FDEBD3", "Specs・差分", { fontSize: 12 }]], "B:エージェント集中モード(実験的)");
  tcard(s, 0.6, 5.2, 5.9, 1.55, "Card layoutA", "A:エディタ表示", "コードを見ながらチャットで依頼する従来型。サイドバーにExplorer、Kiroパネルなどが並ぶ。", { tsize: 17, bsize: 14 });
  tcard(s, 6.83, 5.2, 5.9, 1.55, "Card layoutB", "B:エージェント集中モード", "会話が中心。セッションを並行で動かせ、ワークフロー(Spec、Plan、Bug Fixなど)を選べる。右上のボタンでAと切替。", { tsize: 17, bsize: 14 });
  note(s, "概略図です(実画面ではありません)。このほかCLI版、Web版、Mobile版があり、別の画面です。Autopilot / Supervised は両レイアウトで選べる。出典: kiro.dev/docs", 6.8);
  s.addNotes("出典: Kiro公式ドキュメント(Interface、What's new in 1.0)。図は説明用の模式図。CLI・Web版の画面はこの資料では扱っていない。");
}

{
  const s = content("チャット中心の画面イメージ", "参考:Kiro");
  const X = 0.6, Y = 1.5, W = 12.13, Hh = 4.95;
  const R = (x, y, w, h, fill, name, line) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: line || "C9D0D8", width: 0.75 }, objectName: name });
  const T = (txt, x, y, w, h, o) => s.addText(txt, Object.assign({ x, y, w, h, fontSize: 13, color: C.text1, margin: 6, valign: "middle", isTextBox: true, objectName: "Mock " + String(txt).slice(0, 8) }, o || {}));
  R(X, Y, W, Hh, C.background1, "Mock frame");
  R(X, Y, 2.3, Hh, C.background2, "Mock sessions bg");
  T("セッション", X, Y + 0.05, 2.3, 0.4, { bold: true, fontSize: 14 });
  ["WAFレート制限の変更", "SQLiルールをBlockへ", "Geo matchの追加"].forEach((t, i) => {
    R(X + 0.15, Y + 0.55 + i * 0.62, 2.0, 0.5, i === 0 ? "FDEBD3" : C.background1, "Mock session item " + (i + 1));
    T(t, X + 0.15, Y + 0.55 + i * 0.62, 2.0, 0.5, { fontSize: 12, align: "left" });
  });
  const cx = X + 2.3 + 0.2, cw = 6.5;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx + 2.2, y: Y + 0.3, w: 4.1, h: 0.62, rectRadius: 0.12, fill: { color: "E4E8EE" }, line: { color: "E4E8EE", width: 0.5 }, objectName: "Mock user bubble" });
  T("レート制限を2,000から1,000に変更して", cx + 2.2, Y + 0.3, 4.1, 0.62, { fontSize: 13 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: Y + 1.15, w: 5.6, h: 1.55, rectRadius: 0.12, fill: { color: C.background1 }, line: { color: "C9D0D8", width: 0.75 }, objectName: "Mock kiro bubble" });
  T([{ text: "Kiro", options: { bold: true, breakLine: true } }, { text: "wafv2.tf のレート制限を1,000に変更します。差分を右に表示しました。承認すると適用します。", options: {} }], cx, Y + 1.15, 5.6, 1.55, { fontSize: 13, align: "left", valign: "top", margin: 10 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: Y + Hh - 1.35, w: cw, h: 1.1, rectRadius: 0.12, fill: { color: C.background1 }, line: { color: C.accent1, width: 1.25 }, objectName: "Mock input" });
  T("質問や依頼を入力…", cx, Y + Hh - 1.35, cw, 0.6, { fontSize: 13, align: "left", color: "7A8696", margin: 12 });
  ["Spec ▾", "Supervised ▾", "モデル ▾"].forEach((t, i) => {
    R(cx + 0.15 + i * 1.5, Y + Hh - 0.7, 1.35, 0.35, "E4E8EE", "Mock chip " + (i + 1), "E4E8EE");
    T(t, cx + 0.15 + i * 1.5, Y + Hh - 0.7, 1.35, 0.35, { fontSize: 11, align: "center", margin: 2 });
  });
  const rx = cx + cw + 0.2;
  R(rx, Y, X + W - rx, Hh, "FAF6F0", "Mock diff bg");
  T("差分 / Specs", rx, Y + 0.05, X + W - rx, 0.4, { bold: true, fontSize: 14 });
  R(rx + 0.15, Y + 0.65, X + W - rx - 0.3, 0.45, "FBE3E3", "Mock diff old", "FBE3E3");
  T("-  limit = 2000", rx + 0.15, Y + 0.65, X + W - rx - 0.3, 0.45, { fontSize: 13, align: "left", fontFace: "Courier New" });
  R(rx + 0.15, Y + 1.1, X + W - rx - 0.3, 0.45, "E0F3E3", "Mock diff new", "E0F3E3");
  T("+  limit = 1000", rx + 0.15, Y + 1.1, X + W - rx - 0.3, 0.45, { fontSize: 13, align: "left", fontFace: "Courier New" });
  T("承認 / 却下", rx, Y + 1.8, X + W - rx, 0.5, { fontSize: 12, color: "7A8696" });
  note(s, "イメージ図です(実画面ではありません)。公式ドキュメントの説明(会話が中央、左にセッション、右にSpecsと差分)を元に、依頼の内容は例として作成。", 6.55);
  s.addNotes("実画面は、サインイン後に撮影したスクリーンショットで差し替える。ボタンの名称や位置は実際と異なる。");
}

{
  const s = content("Kiroで設定変更を依頼する流れ(WAFの例)", "参考:Kiro");
  const st = [
    ["チャットで依頼", "「レート制限を2,000から1,000に変更して」のように日本語で頼む。#Fileで対象ファイルを指定できる"],
    ["Kiroが変更案を作る", "Terraformなどの該当箇所を読み、書き換え案を作る。大きな変更はSpecsで要件・設計・タスクに分ける"],
    ["差分を確認して承認", "Supervisedは変更ごとに差分を確認。Autopilotは確認なしで進むので、本番には向かない"],
    ["AWSへ反映", "terraform planで差分を確認してからapply。AWSを直接操作する場合はMCPサーバー経由"],
    ["動作を確認", "WAFのログ、Sampled requests、CloudWatchで、期待どおりに動くかを確認する"],
  ];
  st.forEach((t, i) => {
    const y = 1.5 + i * 1.02;
    card(s, 0.6, y, 8.2, 0.94, "Req step bg " + (i + 1));
    num(s, i + 1, 0.75, y + 0.2, "Req " + (i + 1));
    cardText(s, t[0], t[1], 1.4, y + 0.02, 7.3, 0.92, "Req text " + (i + 1), { tsize: 16, bsize: 13 });
  });
  card(s, 9.0, 1.5, 3.73, 5.04, "Req side bg", C.text2);
  s.addText(
    [
      { text: "依頼の例", options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: "「Web ACLに、Geo matchで日本以外をCountにするルールを追加して」", options: { fontSize: 14, color: C.background1, breakLine: true } },
      { text: "「SQL databaseルールをCountからBlockに切り替えて」", options: { fontSize: 14, color: C.background1, breakLine: true } },
      { text: "変更前に確認したいこと", options: { bold: true, fontSize: 16, color: C.accent6, breakLine: true } },
      { text: "WCUの合計が上限内か", options: { fontSize: 14, color: C.background1, bullet: true, breakLine: true } },
      { text: "優先度の並びが変わらないか", options: { fontSize: 14, color: C.background1, bullet: true, breakLine: true } },
      { text: "Blockの前にCountで影響を見たか", options: { fontSize: 14, color: C.background1, bullet: true } },
    ],
    { x: 9.0, y: 1.5, w: 3.73, h: 5.04, valign: "top", margin: 14, paraSpaceAfter: 7, isTextBox: true, objectName: "Req side" }
  );
  note(s, "流れの説明用の例です。実際の挙動や承認の単位は、Kiroの設定(Autopilot/Supervised、権限)によって変わります。", 6.75);
  s.addNotes("チャットでの依頼が基本。大きな機能追加はSpecs、繰り返しの確認はHooksやSteeringで自動化できる。");
}

{
  const s = content("CLIの結果をKiroで使う(AWS CLI)", "参考:Kiro");
  tcard(s, 0.6, 1.5, 3.9, 3.6, "Card cli1", "1 結果を渡して相談",
    "ターミナルでaws wafv2 get-web-aclなどを実行\nチャットで#を打ち、Terminalを選ぶ(端末の内容を参照)\n「優先度に問題はないか」と相談する",
    { tsize: 20, bsize: 15 });
  tcard(s, 4.715, 1.5, 3.9, 3.6, "Card cli2", "2 Kiroに実行させる",
    "「現在の設定を取得して」と頼むと、Kiroがコマンドを実行する\n実行の許可はAutopilot/Supervisedと信頼するコマンドの設定で変わる\n変更系はSupervisedで確認する",
    { tsize: 20, bsize: 15 });
  tcard(s, 8.83, 1.5, 3.9, 3.6, "Card cli3", "3 AWSを直接変更",
    "AWS CLIの変更コマンド、またはAWSのMCPサーバー経由\nAWS側の権限(IAM)の範囲でだけ動く\n本番はTerraformで差分を確認してから反映する",
    { tsize: 20, bsize: 15 });
  card(s, 0.6, 5.3, 12.13, 1.4, "CLI caution bg", C.text1);
  s.addText(
    [
      { text: "注意", options: { bold: true, fontSize: 16, color: C.accent6, breakLine: true } },
      { text: "ターミナルの出力には、IPアドレス、アカウントID、キーが含まれることがある。Kiroに渡す前に確認する。実際の挙動は、版と設定で変わるため、実機で一度試す。", options: { fontSize: 15, color: C.background1 } },
    ],
    { x: 0.6, y: 5.3, w: 12.13, h: 1.4, valign: "middle", margin: 16, isTextBox: true, objectName: "CLI caution" }
  );
  note(s, "出典: Kiro公式サイトの画面(#のTerminal候補)、DevelopersIO(カスタムエージェントのshellツール)。", 6.78);
}

{
  const s = content("Kiroの設計の考え方:チームの一員に育てる", "参考:Kiro");
  const ph = [
    ["1 企画", "Kiroと壁打ちして構想を言語化。手書きの図や画面イメージも画像で渡せる"],
    ["2 準備", "Agent Skillsで知識、Agent Steeringで開発ルールを与え、土台(ハーネス)を作る"],
    ["3 開発", "要件定義から設計、実装、テスト、デプロイまでをKiroと進める。AI-DLCは一例"],
    ["4 改善", "ガイドライン改定に追従。SAST、テスト、Hooksを整えて検査を自動化"],
  ];
  ph.forEach((t, i) => tcard(s, 0.6 + i * 3.077, 1.5, 2.9, 2.6, "Phase " + (i + 1), t[0], t[1], { tsize: 22, bsize: 17 }));
  card(s, 0.6, 4.3, 12.13, 1.55, "Loop bg", C.text1);
  s.addText(
    [
      { text: "全フェーズ共通の制御ループ", options: { bold: true, fontSize: 16, color: C.accent6, breakLine: true } },
      { text: "人間が依頼 → AIが計画 → 人間がレビュー → 人間が承認 → AIが実行 → 人間が検証", options: { fontSize: 17, bold: true, color: C.background1, breakLine: true } },
      { text: "計画に[Question]で不明点を挙げさせ、人間が[Answer]で答える。曖昧なまま進めない", options: { fontSize: 14, color: C.background1 } },
    ],
    { x: 0.6, y: 4.3, w: 12.13, h: 1.55, valign: "middle", margin: 16, paraSpaceAfter: 5, isTextBox: true, objectName: "Loop text" }
  );
  tcard(s, 0.6, 6.0, 12.13, 0.75, "Phase point", "ポイント", "丸投げにしない。人間が意思決定と最終的な責任を持つ。", { tsize: 14, bsize: 13 });
  note(s, "出典: AWSブログ「Kiroとともに医療情報システムのガイドライン遵守開発に挑む」(2026年7月、実験的なアプローチと紹介されている)", 6.8);
}
{
  const s = content("Kiroの機能・操作の新しい点", "参考:Kiro");
  const c = [
    ["Agent Skills", "SKILL.mdに参照する場面、referencesに詳細を置く。必要なときだけ読み込む。作成もKiroに任せられる"],
    ["Agent Steering", "product.md、tech.md、structure.mdなどをMarkdownで定義。毎セッション自動で読み込まれる"],
    ["Agent Hooks", "ファイル保存やタスク完了を契機に、SAST、テスト、レビューを自動で実行する"],
    ["入力の手段", "ドキュメントの添付、web_fetchでWebの取り込み、画像(手書き図や画面イメージ)"],
    ["コンテキスト管理", "入力が長いほど性能が落ちる。ガイドライン1編で約29%を消費した例(100万トークンの枠)。必要な分だけ渡す"],
    ["チームで共有", "SkillsとSteeringはMarkdown。Gitで履歴を管理し、全員に配布できる"],
  ];
  c.forEach((t, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    tcard(s, 0.6 + col * 4.115, 1.5 + row * 2.15, 3.9, 2.0, "Func " + (i + 1), t[0], t[1], { tsize: 20, bsize: 16 });
  });
  card(s, 0.6, 5.85, 12.13, 0.9, "Func banner bg", C.text1);
  s.addText("IDE 1.0:エージェントセレクターでカスタムエージェント(.kiro/agents/名前.md)を切り替え。Agent Focusで複数セッションを並行実行。", { x: 0.6, y: 5.85, w: 12.13, h: 0.9, fontSize: 14, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "Func banner" });
  note(s, "出典: AWSブログ(医療情報システム)、DevelopersIO(Kiro IDE 1.0のカスタムエージェント、Agent Focus)、Kiro changelog", 6.8);
}
{
  const s = content("WAF設計へ当てはめる(見立て)", "参考:Kiro");
  const rows = [
    ["Steering", "WAF設計の前提を置く", "Web ACL名、命名規則、タグ、既定動作(Allow)、WCU上限、Count→Blockの方針"],
    ["Skills", "WAFの知識をトピック別に置く", "マネージドルールの種類、レート制限の考え方、更新の仕組み、ログ設計"],
    ["Hooks", "変更時の検査を自動化", "保存時にterraform validate、WCU合計と優先度の確認"],
    ["制御ループ", "変更依頼を計画から検証まで回す", "計画 → [Question]で確認 → 承認 → 実行 → ログとSampled requestsで検証"],
  ];
  rows.forEach((r, i) => {
    const y = 1.5 + i * 1.18;
    card(s, 0.6, y, 12.13, 1.08, "Map bg " + (i + 1));
    s.addText(r[0], { x: 0.75, y, w: 1.9, h: 1.08, fontSize: 18, bold: true, color: C.accent1, valign: "middle", margin: 4, isTextBox: true, objectName: "Map key " + (i + 1) });
    cardText(s, r[1], r[2], 2.7, y, 9.9, 1.08, "Map text " + (i + 1), { tsize: 16, bsize: 14 });
  });
  card(s, 0.6, 6.25, 12.13, 0.5, "Map banner bg", C.background2);
  s.addText("公式記事の考え方をWAFの設計に当てはめた、当方の見立て。実際の運用は組織に合わせて調整する。", { x: 0.6, y: 6.25, w: 12.13, h: 0.5, fontSize: 13, bold: true, color: C.accent1, margin: 10, valign: "middle", isTextBox: true, objectName: "Map banner" });
}

{
  const s = content("Steering・Skills・Powersの違い", "参考:Kiro");
  const H = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text1 }, align: "center" } });
  const L = (t) => ({ text: t, options: { bold: true, fill: { color: C.background2 } } });
  const P = (t) => ({ text: t, options: { align: "left" } });
  const rows = [
    [H(""), H("Steering"), H("Skills"), H("Powers")],
    [L("一言で"), P("プロジェクトの決まりごと(Kiro独自)"), P("手順と知識のパッケージ(オープン標準)"), P("外部ツール(MCP)と知識・手順のセット")],
    [L("中身"), P("Markdown。always / auto / fileMatch / manual のモードがある"), P("SKILL.md(必須)。scripts、references、assetsは任意"), P("plugin.json(必須、起動キーワード)。skills/とmcp.jsonは任意")],
    [L("読み込み"), P("設定したモードに従う"), P("名前と説明だけ先に読み、依頼に合うと全文を読む"), P("会話のキーワードで、関連するものだけ読む")],
    [L("入手"), P("自分で書く"), P("自分で書く。GitHub/GitLabやフォルダから取り込みも可"), P("ワンクリックで導入(kiro.dev/powers、GitHubなど)")],
    [L("必須か"), P("必須とは書かれていない"), P("必須ではない"), P("必須とは書かれていない")],
  ];
  s.addTable(rows, { x: 0.6, y: 1.5, w: 12.13, colW: [1.3, 3.6, 3.9, 3.33], rowH: [0.45, 0.75, 0.9, 0.75, 0.8, 0.5], fontSize: 12, color: C.text1, valign: "middle", border: { type: "solid", pt: 0.5, color: "D0D6DD" }, objectName: "Steering Skills Powers table" });
  card(s, 0.6, 6.15, 12.13, 0.6, "SSP banner bg", C.text1);
  s.addText("公式ドキュメントでは、どれも必須とは書かれていない。", { x: 0.6, y: 6.15, w: 12.13, h: 0.6, fontSize: 16, bold: true, color: C.background1, margin: 14, valign: "middle", isTextBox: true, objectName: "SSP banner" });
  note(s, "出典: Kiro公式ドキュメント(docs/skills、docs/powers)。新しいPowersはAgent Plugins形式が推奨で、従来のPOWER.md形式も動作する。", 6.8);
}
{
  const s = content("どんなときに必要か、誰が書くか", "参考:Kiro");
  tcard(s, 0.6, 1.5, 6.0, 4.0, "Card when", "必要になる場面",
    "Steering:毎回守らせたい規約(命名、タグ、設計の前提)\nSkills:手順や知識が多く、必要なときだけ読ませたい。チームで共有したい\nPowers:外部サービス(MCP)と、その使い方の知識をセットで使いたい\n不要:小さな作業や、標準の機能で足りる場合",
    { tsize: 22, bsize: 17 });
  tcard(s, 6.73, 1.5, 6.0, 4.0, "Card who", "AIに書かせられるか、人が必要か",
    "Skills:SKILL.mdはMarkdownなので、Kiroに書かせられる。AWSブログでは、Kiroに作らせて人がレビューする方法を紹介\nPowers:公式は作成ガイドを用意。Kiroが自動で作るとは書かれていない。既存のものを導入するのが基本\n人が必ずやること:何を守らせるかの決定、内容が正しいかのレビュー、機密情報を入れないこと、改定時の更新",
    { tsize: 22, bsize: 15 });
  card(s, 0.6, 5.7, 12.13, 1.05, "Need banner bg", C.background2);
  s.addText("WAFの設計では、最初はSteeringだけで十分。知識が増えたらSkills、外部サービスとつなぐ必要が出たらPowers、の順で足す(見立て)。", { x: 0.6, y: 5.7, w: 12.13, h: 1.05, fontSize: 15, bold: true, color: C.accent1, margin: 14, valign: "middle", isTextBox: true, objectName: "Need banner" });
  note(s, "出典: Kiro公式ドキュメント、AWSブログ(医療情報システム)、AWS Summit Japan AIM452資料。「必要な場面」の整理と末尾の順序は当方の見立て。", 6.82);
}
{
  const s = content("Powerの守備範囲(Aurora DSQLの例)", "参考:Kiro");
  tcard(s, 0.6, 1.5, 5.96, 2.6, "Card kiro can", "Kiroが提案できる",
    "専門知識をSkillsやPowersで持たせると、検証や実装ガイドを出せる\n例:dsql_lintによる互換性の検証(SERIALからUUIDへの置換、外部キーの検出、非同期インデックス化)、Steeringによる実装ガイド",
    { tsize: 22, bsize: 17 });
  tcard(s, 6.77, 1.5, 5.96, 2.6, "Card human gives", "人間が与える・確認する",
    "文脈:主要なクエリパターン、負荷の特性、整合性の要件\n問い:ホットキーがないか、整合性をどの層で担保するか",
    { tsize: 22, bsize: 17 });
  card(s, 0.6, 4.3, 12.13, 1.5, "Role banner bg", C.text1);
  s.addText(
    [
      { text: "Kiroはトレードオフを答える。意思決定するのは開発者", options: { bold: true, fontSize: 18, color: C.background1, breakLine: true } },
      { text: "DDLを読むだけでは、どんなクエリが来るかは分からない。問いを立て、前提を覆す判断をするのは人間の仕事", options: { fontSize: 14, color: C.background1 } },
    ],
    { x: 0.6, y: 4.3, w: 12.13, h: 1.5, valign: "middle", margin: 16, paraSpaceAfter: 6, isTextBox: true, objectName: "Role banner" }
  );
  tcard(s, 0.6, 5.95, 12.13, 0.8, "Role waf", "WAFに当てはめると", "Kiroはルール案とWCUの計算まで。どのURIが重要か、許容できる誤検知はどの程度かは、人間が与える(見立て)。", { tsize: 14, bsize: 13 });
  note(s, "出典: AWS Summit Japan 2026 AIM452「Kiroでつくる!Aurora DSQLの特性を活かしたスキーマ設計」。当てはめは当方の見立て。", 6.82);
}

{
  const s = content("考え方:型にはまるのではなく、型を内在化する", "参考:Kiro");
  card(s, 0.6, 1.5, 12.13, 1.1, "Mind headline bg", C.text1);
  s.addText("「型にはまる」のではなく、型を内在化する", { x: 0.6, y: 1.5, w: 12.13, h: 1.1, fontSize: 26, bold: true, color: C.background1, align: "center", valign: "middle", margin: 10, isTextBox: true, objectName: "Mind headline" });
  tcard(s, 0.6, 2.8, 3.9, 2.7, "Card mind1", "ツールは選べる",
    "Kiro IDE、Kiro CLI\nまたは、あなたが好きなツールや技術で",
    { tsize: 20, bsize: 17 });
  tcard(s, 4.715, 2.8, 3.9, 2.7, "Card mind2", "良いツールは叡智を含む",
    "ツールには、先人の知恵(進め方の型)が入っている",
    { tsize: 20, bsize: 17 });
  tcard(s, 8.83, 2.8, 3.9, 2.7, "Card mind3", "大切なのは個人の叡智",
    "ツール自体よりも、個人が叡智を獲得することが重要",
    { tsize: 20, bsize: 17 });
  card(s, 0.6, 5.7, 12.13, 1.05, "Mind waf bg", C.background2);
  s.addText("WAFの設計に当てはめると:Kiroの進め方(要件→設計→タスク、依頼→計画→承認→検証)を理解して身につければ、Kiro以外のツールでも、Excelの方式設計書でも使える(見立て)。", { x: 0.6, y: 5.7, w: 12.13, h: 1.05, fontSize: 15, bold: true, color: C.accent1, margin: 14, valign: "middle", isTextBox: true, objectName: "Mind waf" });
  note(s, "出典: AWS講演資料のスライド(講演名は画像から不明)。「型」の解釈とWAFへの当てはめは当方の見立て。", 6.82);
}

// ---------------------------------------------------------------- 12 closing
{
  const s = pres.addSlide({ masterName: "CLOSING", sectionTitle: "容量・制約" });
  s.addText("まとめと次のステップ", { placeholder: "title" });
  tcard(s, 0.6, 1.6, 5.96, 4.9, "Summary", "まとめ", "Web ACLをALBに関連付け、6つのルールをCountから段階的にBlockへ。\nしきい値は既定値がなく、ログで測って決める。\nマネージドルールは版の切替で更新される。通知を購読して影響を確認する。", { fill: C.text2, color: C.background1, tsize: 24, bsize: 20 });
  tcard(s, 6.77, 1.6, 5.96, 4.9, "Next", "次のステップ", "実際のIP、名称、タグ、しきい値を決める。\nTerraform(wafv2.tf)でコード化する。\nCount運用を開始し、ログからしきい値を見直す。", { fill: C.text2, color: C.background1, tsize: 24, bsize: 20 });
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("done", OUT);
})();
