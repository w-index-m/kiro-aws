# kiro-aws — AWS Kiro Materials (Consolidated)

[日本語](README.md) | **English**

This repository **consolidates** materials on AWS Kiro and building on AWS in one place.
The sources are the investigation notes in [w-index-m/nirvana-lab](https://github.com/w-index-m/nirvana-lab) and two separately prepared bundles ("AWS資料まとめ" and "AWS WAFとKiro調査").
Because Kiro and AWS were **researched twice**, the overlaps and inconsistencies have been sorted out and bound together here.

> All values, company names, IPs and ASNs are fictional samples. Kiro itself was not actually run; the content is a summary of official information as of 2026-11. Versions, features and pricing change often, so check the latest official docs before use.
> Most documents inside the folders are written in Japanese.

## What is where

| Folder | Contents | Open first |
|---|---|---|
| `01_Kiro資料/` | "Building AWS with Kiro" deck (34 slides) and its text version | `ai-driven-dev-kiro.pptx` / `.pdf`, `ai-driven-aws.md` |
| `02_AWSネットワーク設計書サンプル/` | Basic design, parameter sheet and consistency check for VPC, Direct Connect, ALB, NAT, WAF and Network Firewall (**Sample A**, VPC `10.20.0.0/16`) | `出力/basic-design.md`, `出力/parameter-sheet.xlsx` |
| `03_FirewallからNetworkFirewallへの移行/` | Draft, mapping table and test flows for migrating a mock IPCOM firewall to Network Firewall | `README.md`, `出力/report.md` |
| `04_ALB設計書の自動作成/` | Generate a design doc and parameter sheet from ALB `describe` output | `出力/basic-design.md` |
| `05_DirectConnect_BGP/` | On-prem BGP design for Direct Connect, verified in the lab first | `README.md` |
| `06_ラボのALB模擬/` | Mock ALB driven by aws-cli syntax | `README.md` |
| `07_AWS_WAFとKiro調査/` | WAF design, VPC/DX design (**Sample B**, VPC `10.10.0.0/16`), Terraform sample, and the Kiro screens/pricing research deck (42 slides) | `docs/AWS_WAFとKiro調査.pdf`, `design/` |
| `08_補助資料/` | Comparison of AI agent sandboxes | `ai-agent-sandboxes.md` |

Chapters 1–11 below summarize Kiro and building on AWS (mainly from `01`); chapter 12 summarizes `07`.

## Sorting out the duplicate research (overlap, conflicts, which to use)

| Topic | `01`–`06` (AWS materials) | `07` (WAF & Kiro research) | Treatment |
|---|---|---|---|
| Using Kiro / building AWS | **Primary source** (34 slides + text, latest) | Overview, pricing, screens only | Use `01` for procedures and rules |
| Kiro pricing, plans, screens, BYOK, other editors | None | **Primary source** (slides 19–42) | Use `07` |
| VPC / DX design sample | `02` (`10.20.0.0/16`; Network Firewall inspects in/out; 2 DX locations; primary path via BGP communities) | `07/design` (`10.10.0.0/16`; no Network Firewall; VLAN 100/101; Local Pref prefers connection A) | **Separate samples; values are not compatible** (see below). Pick one as the reference |
| WAF design | Simple version in `02` (4 managed rule groups + rate limit) | **Detailed version** (6 rules, WCU, logging, exam viewpoints, security feature comparison) | Use `07` for WAF details |
| Network Firewall | `02` (built into the design), `03` (migration from an existing FW) | `07` has a comparison table only (not adopted) | Use `02` and `03` |
| Terraform | `03` `main.tf` (Network Firewall only) | `07/terraform` (VPC, DX, NACL/SG) | Complementary; both usable |
| Design doc generators | Python in `02`, `03`, `04` | `07/tools/build_waf_design.py` | Different targets; no overlap |
| `ai-driven-aws.md` | New version (`01`: adds "Changing AWS: directly or via IaC"; slide numbers shift by one) | — | Old version replaced (kept in Git history) |

### Conflicts (decision needed)

1. **VPC CIDR differs**: Sample A `10.20.0.0/16` vs Sample B `10.10.0.0/16`. Values chain through subnets, routes, NACLs and `terraform.tfvars`, so do not mix them.
2. **WAF rule count differs**: A has 4 managed groups + rate limit; B has 6 rules (allow-IP + rate limit + 4 managed, about 1,128 WCU). The rate-limit threshold (2,000 requests / 5 min) is the same.
3. **Network Firewall**: A inspects continuously via edge route tables on the IGW/VGW; B does not use it (WAF + NACL/SG only). Adopting it in B requires revising B's routing design.
4. **Naming**: A uses `shop-prd-*`, B uses `sample-prd-*`.

→ Proposed direction: take Sample A (`02`) as the baseline and rebuild B's WAF details and Terraform values to match A. Alternatively, keep B as a standalone "WAF-only sample". Undecided.

## Notes

- Links inside the READMEs and design docs of `01`–`06` point to locations in nirvana-lab and may be broken here (the originals are in that repository).
- The Python tools need Python 3.10+. Excel output needs openpyxl; API-shape checks need botocore (otherwise those parts are skipped).
- `07/tools/make_deck.js` does not run as-is without the image folder (kiroimg). The Kiro screens in the slides are official screenshots; check the terms of use before publishing.

---

# Summary of key points

## 1. What is Kiro

AWS's AI development tool: a VS Code–based (Code OSS) editor, plus a CLI (`kiro-cli`, successor to the Amazon Q Developer CLI) and a web version.
Its hallmark is that it **starts from specs**.

| Mechanism | What it does | Claude Code equivalent |
|---|---|---|
| Specs | Produces `requirements.md` → `design.md` → `tasks.md` from a request, then implements in order (`.kiro/specs/<feature>/`) | Decide in conversation and record in `docs/` |
| Steering | Gives the agent project rules in Markdown every time (`.kiro/steering/`) | `CLAUDE.md` |
| Hooks | Runs set tasks on save / create / delete etc. (`.kiro/hooks/`) | Claude Code hooks |
| Cloud sessions / autonomous agent | Works in a managed, isolated cloud environment (`kiro-cli --cloud`; autonomous agent is in preview) | Cloud sandbox |
| MCP / Powers | Connects external tools. Powers include guidance for CDK/CloudFormation, SAM and Terraform | MCP / skills |

Modes: the default is Autopilot. For anything touching AWS, **Supervised** (a human confirms each file change) is recommended.

## 2. Prerequisites

- **Sign-in**: GitHub / Google / AWS Builder ID / IAM Identity Center (IAM Identity Center is the baseline for company use)
- **Plan**: the free tier is only 50 credits per month. Serious use needs a paid plan (for companies, Enterprise billed through AWS)
- **Changing AWS**: valid credentials on the PC (temporary SSO credentials preferred) and minimal IAM permissions
- **Tools**: AWS CLI, CDK 2.x or Terraform (SAM CLI if using SAM), MCP config (`~/.kiro/settings/mcp.json` or Powers)
- AWS can be changed two ways: ① the terminal (`aws`, `cdk deploy`, `terraform apply`) ② AWS MCP Server (SigV4 / OAuth). Authentication uses the PC's AWS configuration, not Kiro

## 3. Safety rules (most important)

1. Try it first in a **sandbox AWS account**
2. Give Kiro **read-only permissions only** (ViewOnlyAccess / SecurityAudit + temporary SSO credentials). Permissions, not Steering wording, are what truly prevent writes
3. Production `apply` goes **PR → CI → human approval → CI/CD**. Never apply directly from Kiro
4. If `plan` shows **deletions, forced replacements, or 0.0.0.0/0 allowances**, stop and report
5. Set cost-limit alerts with AWS Budgets
6. **Kiro's cloud sandbox has no outbound restriction by default** (the official docs warn of prompt injection and secret exfiltration). Do not place strong credentials there
7. Check company rules before giving confidential data (VPN pre-shared keys, password hashes, SNMP community strings, etc.) to an external AI. Also check Kiro's data handling (training-use settings)

## 4. Standard workflow (building AWS with Kiro)

1. **Prepare (human)**: install Kiro, sign in, open the Git repository
2. **Steering (human)**: write `product.md`, `tech.md`, `structure.md`, plus company rules and a rule to stop on replacement
3. **AWS setup (human)**: MCP/Powers and a read-only SSO profile
4. **Create the Spec (Kiro)**: requirements → design → tasks; a human approves each stage
5. **Run tasks (Kiro)**: in Supervised mode
6. **Up to plan (Kiro)**: fmt, validate, plan. Stop if a replacement appears
7. **Apply (human)**: PR → CI checks → approval → apply via CI/CD
8. **Verify (Kiro)**: confirm with `describe`, regenerate the design doc and parameter sheet

Tip for requests: don't say "apply it". Ask for "fix the IaC, produce a plan, and open a PR". Be specific about environment, files and goal; also state what must not be done and how to verify.

Steering example (`.kiro/steering/aws-change.md`):

```
- Do not run apply or AWS write commands (authorize-*/revoke-*/delete-*, etc.)
- Change only files under terraform/
- If the plan contains a deletion, replacement or 0.0.0.0/0 allowance, stop and report
- The PR body must include a plan summary, impact scope, rollback steps and post-change verification commands
```

(The Japanese original of this example is in the Japanese README and in `01_Kiro資料/ai-driven-aws.md`.)

## 5. What gets easier, what remains

- **Easier**: writing IaC (CDK, CloudFormation, Terraform); investigating (AWS MCP for docs and current resources); deploying (AWS MCP Server deployment SOPs, preview)
- **More work**: creating Specs first adds an up-front step (fewer rework cycles later)
- **Stays with humans**: judgments on network design, permissions and cost; checking plans and results; approvals

## 6. VPC / Direct Connect / ALB / NLB

| Component | Delegate to Kiro | Human decides | Watch out for |
|---|---|---|---|
| VPC | CIDR, subnets, routes, NAT, endpoints, flow logs | CIDR design (no overlap), number of AZs, number of NATs (cost) | Changing later forces recreation; initial design matters most |
| Direct Connect | DXGW, VGW/TGW association, VIFs, route propagation | Circuit order, LOA, cabling, BGP ASN/VLAN/keys, on-prem BGP | Physical and contractual parts cannot be coded; a routing mistake stops production traffic |
| ALB | Listeners, rules, target groups, health checks, SG, WAF | ACM certificate, exposure scope, rule priority | DNS validation needs DNS-side work; wrong rule order misroutes |
| NLB | Listeners, target groups, EIPs, cross-zone, TLS | Fixed IPs, client-IP preservation, health-check method | Subnet/EIP changes force recreation; client-IP handling changes SG rules |

**DX → DXGW → VPC** has 3 stages: ① physical circuit (days to weeks; humans/carrier) ② AWS logical side (DXGW, VIF, VGW/TGW, association, propagation — one apply, minutes to tens of minutes) ③ on-prem BGP (humans). Stage ② can be built ahead, in parallel with ①.

| Gateway | VIF | Suited for | Limit per DXGW (default) |
|---|---|---|---|
| VGW | private | Few VPCs | 20 (cannot be raised) |
| TGW | transit | Many VPCs / VPC-to-VPC traffic | 6 |
| Cloud WAN core network | — | Multiple regions unified with Cloud WAN | Check |

Working rules: stop on replacement; have the design list DX routes (advertised, received, priority) in a table and have a human cross-check against the on-prem config; production changes at a set time via CI/CD; treat the parameter sheet as the source of truth for CIDR, ASN, VLAN and EIP.

ALB HTTPS needs an ACM certificate (same region). Order: VPC foundation → ACM request and DNS validation → ALB → NLB → name resolution. The wait is DNS validation (with Route 53 it completes in the same apply).

## 7. Can Kiro produce documents?

| Document | Verdict |
|---|---|
| Requirements definition | A draft, yes. `requirements.md` covers one feature (EARS format) and is narrow. Supplement non-functional requirements by putting the IPA non-functional requirements grade list in Steering. It is an agreement document, so review and approval are required |
| Basic / detailed design | Can be produced, but the output is developer-style Markdown notes. Add a cover page, revision history and value tables. **Don't let the AI invent values; derive them mechanically from IaC and `describe` results.** Word via pandoc, Excel via a conversion script |
| Work / operations procedures | A draft is possible (pre-checks, steps, verification, rollback, operations). Run it once in a test environment before production |

## 8. Changes and operations

- **Must changes also be made in Kiro?** → No. Ordinary IaC and Markdown live in Git, so other tools can change them. But avoid direct console changes, detect drift regularly, and update the Spec and design docs when changing outside Kiro
- **Can a chat change the firewall?** → Yes, via API (SG, NACL, Network Firewall, WAF). Direct changes only in test environments; for production: fix the IaC → plan → PR → CI → approval → CI/CD
- **How changes are applied** → In production, CI/CD runs the IaC tool (`terraform apply` / change set / `cdk deploy`). aws-cli is for `describe-*` checks before and after
- **Can Kiro read AWS state?** → Yes, with read permissions (describe calls, CloudWatch, CloudTrail, Config, `terraform plan -refresh-only`, drift detection). Do not let it read secrets (e.g., Lambda environment variables)
- **Verification by another AI** → 4 layers: machine checks (validate/tflint/checkov/cfn-lint/cfn-guard) → another AI compares requirements to the plan diff → human approval → post-apply real-traffic checks (Reachability Analyzer, Network Access Analyzer). The AI adds a layer; it does not replace approval

## 9. Existing firewall → AWS Network Firewall

A draft is possible. Always have it produce a **rule-by-rule mapping table (with reasons for anything not migrated)** and have a human cross-check it.

- No zones (inside/outside/DMZ) → build the traffic path with VPCs, subnets and route tables
- Rules evaluate top to bottom → choose strict order
- NAT and IPsec VPN are not done by Network Firewall (provide separately)
- App identification, AV and URL categories can only partly be replaced; simple allow rules are often fine as security groups
- Lab test: 6 mock IPCOM rules → 8 new rules. Of 21 test flows, 1 mismatched (LAN→outside 22/tcp: the WAN-side deny matched first because interface distinction was lost)

## 10. Other AWS AI tools

| Tool | Purpose |
|---|---|
| **Kiro** (editor/CLI/Web) | Build new things starting from specs (requirements, design, IaC, plan, document drafts) |
| Amazon Q Developer | IDE completion and console consultation. Kiro CLI succeeds Q Developer CLI (2025-11) |
| AWS Transform | Migrate existing systems (VMware, mainframe, .NET) to AWS |
| AWS DevOps Agent | Operations and incident response (GA 2026-03) |
| Amazon Bedrock (AgentCore) | Platform for building your own AI agents |

With any of them: least privilege, and production changes through human approval and CI/CD. No AI can turn Direct Connect's physical work and contracts into code.

## 11. Sandbox comparison (where Kiro stands)

Kiro's cloud sessions are disposable isolated environments like those of other vendors (Claude Code Web, Codex, Copilot cloud agent, etc.), but **outbound traffic is unrestricted by default** (others are mostly allow-listed or off by default). Details in `08_補助資料/ai-agent-sandboxes.md`.

## 12. AWS WAF and Kiro research (additional material)

`07_AWS_WAFとKiro調査/` holds the separately prepared "AWS WAF and Kiro research" bundle (slides, design samples, Terraform sample, generator scripts).
Everything is sample content, as of 2026-11-25 (slides v1.26).

| Path | Contents |
|---|---|
| `07_AWS_WAFとKiro調査/docs/AWS_WAFとKiro調査.pptx` / `.pdf` | Research slides (42) |
| `07_AWS_WAFとKiro調査/design/AWS_WAF_方式設計書_サンプル.xlsx` / `.md` | WAF architecture design (v1.3) |
| `07_AWS_WAFとKiro調査/design/AWS_WAF_画面一覧_入力サンプル.xlsx` | Input sample for the WAF console screens |
| `07_AWS_WAFとKiro調査/design/AWS_VPC_DX_方式設計書_パラメータシート_サンプル.xlsx` / `.md` | VPC / Direct Connect architecture design |
| `07_AWS_WAFとKiro調査/terraform/` | Terraform sample for VPC, DX, NACL/SG (`terraform.tfvars` maps to the parameter sheet) |
| `07_AWS_WAFとKiro調査/tools/` | Deck generator `make_deck.js`, design doc generator `build_waf_design.py` |

Note: `make_deck.js` does not run as-is without the image folder (kiroimg). The Kiro screens in the slides are official screenshots; check terms of use before publishing.

### WAF design highlights (`AWS_WAF_方式設計書_サンプル`)

- **Layout**: Internet → IGW → ALB (+ regional Web ACL `sample-prd-waf-alb`) → App → DB. Default action is Allow (blocklist approach)
- **Rule order**: 1 allow-IP (Allow) → 2 rate limit (Block at 2,000 requests / 5 min) → 3 IP reputation → 4 Core rule set → 5 Known bad inputs → 6 SQL database
- **Rollout**: start every rule in Count, check false positives via sampled requests and logs, then move to Block. On ALB, body inspection is fixed at the first 8 KB, so upload paths must be excluded narrowly from the Core rule set's `SizeRestrictions_BODY`
- **WCU and pricing**: about 1,128 WCU total (limit 5,000; only up to 1,500 is covered by the base price). Paid managed rule groups auto-subscribe when added
- **Logs**: to S3 with a name starting `aws-waf-logs-`; authorization and cookie headers masked; retained 90 days
- **Can be associated with**: CloudFront, ALB, API Gateway (REST), AppSync, App Runner, Verified Access, etc. Not NLB or GWLB
- **Division of roles**: NACL/SG = L3/L4, WAF = L7, Network Firewall = L3–L7 (not adopted), Shield = DDoS, Firewall Manager = multi-account central management
- **Managed rule updates**: the default version does not change automatically when a new version is published; SNS notifications arrive one week before and on the day of the switch. IP reputation has no versions, updates frequently and is not notified

### More about Kiro (slides 19–42)

- **Overview**: an agentic IDE announced by AWS on 2025-07-14. Built on Code OSS; compatible with VS Code settings and Open VSX extensions. Sign in with Google / GitHub, no AWS account needed. IDE, CLI and Web versions exist
- **Pricing (as of 2026-11, official kiro.dev/pricing)**:

| Plan | Monthly | Credits |
|---|---|---|
| Free | $0 | 50 |
| Pro | $20 | 1,000 |
| Pro+ | $40 | 2,000 |
| Pro Max | $100 | 5,000 |
| Power | $200 | 10,000 |
| Enterprise | $20/seat (2 seats min.) | 500/seat (shared) |

  Extra usage is $0.04 per credit. Free includes only open-weight models and Claude Sonnet 4.5
- **Cautions**: heavy spec-driven use exhausts the free tier quickly / Open VSX means Microsoft's C# extension is unavailable / being cloud-based raises concerns for NDA projects
- **Versus other tools**: Cursor and Claude Code edit immediately on request; Kiro fixes the plan and spec first — likely a good fit for infrastructure work where design precedes implementation
- **BYOK (bring your own API key)**: official support could not be confirmed in this research (requests exist on GitHub: #9367, #1409)
- **Other editors**: in VS Code, via ACP (`kiro-cli acp`) and community extensions; Visual Studio / Eclipse use Kiro CLI alongside; JetBrains adds Kiro as a custom agent in AI Assistant
- For **asking Kiro to change WAF settings**, **using AWS CLI results in Kiro**, **Steering vs Skills vs Powers** (who writes them, when) and **a Power's scope (Aurora DSQL example)**, see slides 33–41
