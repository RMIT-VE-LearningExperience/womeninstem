#!/usr/bin/env python3
"""
Pull Google Analytics 4 reports for buildyourpath.org.au (stream G-9Y3QTYBPXW).

Auth: Application Default Credentials from gcloud by default, or a service
account key via --credentials. Either way the credential needs the
https://www.googleapis.com/auth/analytics.readonly scope and the Google
account must have Viewer access (or better) on the GA4 property.

If ADC lacks the analytics scope, re-login interactively with:
  gcloud auth application-default login \
    --scopes=https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/analytics.readonly

Dependencies:
  python3 -m pip install google-analytics-data google-analytics-admin

Usage:
  python3 scripts/ga_report.py                     # last 30 days, ending yesterday
  python3 scripts/ga_report.py --days 90
  python3 scripts/ga_report.py --start 2026-01-01 --end 2026-06-30
  python3 scripts/ga_report.py --property 123456789 # skip the property lookup
  python3 scripts/ga_report.py --list               # just list accessible properties

Output: output/ga/<start>_<end>/report.json and report.md (output/ is gitignored).
"""
import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

import google.auth
from google.auth.exceptions import RefreshError
from google.api_core.exceptions import GoogleAPICallError
from google.oauth2 import service_account
from google.analytics.admin_v1beta import AnalyticsAdminServiceClient
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    OrderBy,
    RunReportRequest,
)

SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"]
MEASUREMENT_ID = "G-9Y3QTYBPXW"
REPO_ROOT = Path(__file__).resolve().parents[1]

OVERVIEW_METRICS = [
    "activeUsers", "newUsers", "sessions", "engagedSessions", "screenPageViews",
    "eventCount", "averageSessionDuration", "engagementRate", "bounceRate",
]

# name: (title, dimensions, metrics, order-by, limit)
# order-by is ("metric", name) for desc metric sort or ("dim", name) for asc dimension sort.
REPORTS = [
    ("daily", "Daily trend", ["date"],
     ["activeUsers", "sessions", "screenPageViews"], ("dim", "date"), 400),
    ("pages", "Top pages", ["pagePath", "pageTitle"],
     ["screenPageViews", "activeUsers", "userEngagementDuration"], ("metric", "screenPageViews"), 50),
    ("landing", "Landing pages", ["landingPage"],
     ["sessions", "activeUsers", "engagementRate", "bounceRate"], ("metric", "sessions"), 25),
    ("channels", "Traffic channels", ["sessionDefaultChannelGroup"],
     ["sessions", "activeUsers", "engagedSessions", "engagementRate"], ("metric", "sessions"), 20),
    ("sources", "Sources / mediums", ["sessionSource", "sessionMedium"],
     ["sessions", "activeUsers"], ("metric", "sessions"), 25),
    ("devices", "Devices", ["deviceCategory"],
     ["activeUsers", "sessions", "screenPageViews"], ("metric", "activeUsers"), 10),
    ("browsers", "Browsers", ["browser"],
     ["activeUsers", "sessions"], ("metric", "activeUsers"), 10),
    ("countries", "Countries", ["country"],
     ["activeUsers", "sessions"], ("metric", "activeUsers"), 25),
    ("cities", "Cities", ["city", "region"],
     ["activeUsers", "sessions"], ("metric", "activeUsers"), 25),
    ("events", "Events", ["eventName"],
     ["eventCount", "totalUsers"], ("metric", "eventCount"), 50),
    # Best-effort: only works if event_category / event_label are registered as custom dimensions.
    ("event_labels", "Custom event labels",
     ["eventName", "customEvent:event_category", "customEvent:event_label"],
     ["eventCount"], ("metric", "eventCount"), 100),
]


def parse_num(s):
    try:
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return s


def fmt(metric, v):
    if not isinstance(v, (int, float)):
        return str(v)
    if metric in ("engagementRate", "bounceRate"):
        return f"{v * 100:.1f}%"
    if metric in ("averageSessionDuration", "userEngagementDuration"):
        m, s = divmod(int(round(v)), 60)
        return f"{m}m {s:02d}s"
    if isinstance(v, float):
        return f"{v:,.2f}"
    return f"{v:,}"


def load_credentials(path):
    """Service-account key > GA_ACCESS_TOKEN env var > gcloud ADC."""
    if path:
        return service_account.Credentials.from_service_account_file(path, scopes=SCOPES)
    token = os.environ.get("GA_ACCESS_TOKEN")
    if token:
        from google.oauth2.credentials import Credentials
        return Credentials(token=token)
    creds, _ = google.auth.default(scopes=SCOPES)
    return creds


def list_properties(creds):
    """Return [(account, property_name, property_id, [measurement_ids])]."""
    admin = AnalyticsAdminServiceClient(credentials=creds)
    out = []
    for acct in admin.list_account_summaries():
        for prop in acct.property_summaries:
            mids = []
            try:
                for stream in admin.list_data_streams(parent=prop.property):
                    if stream.web_stream_data and stream.web_stream_data.measurement_id:
                        mids.append(stream.web_stream_data.measurement_id)
            except GoogleAPICallError as e:
                mids.append(f"<error: {e.message}>")
            out.append((acct.display_name, prop.display_name, prop.property, mids))
    return out


def run_report(client, prop, dims, mets, ranges, order=None, limit=100):
    req = RunReportRequest(
        property=prop,
        dimensions=[Dimension(name=d) for d in dims],
        metrics=[Metric(name=m) for m in mets],
        date_ranges=[DateRange(start_date=s, end_date=e) for s, e in ranges],
        limit=limit,
    )
    if order and order[0] == "metric":
        req.order_bys = [OrderBy(metric=OrderBy.MetricOrderBy(metric_name=order[1]), desc=True)]
    elif order and order[0] == "dim":
        req.order_bys = [OrderBy(dimension=OrderBy.DimensionOrderBy(dimension_name=order[1]))]
    resp = client.run_report(req)
    dim_names = [h.name for h in resp.dimension_headers]
    met_names = [h.name for h in resp.metric_headers]
    rows = []
    for r in resp.rows:
        row = {n: v.value for n, v in zip(dim_names, r.dimension_values)}
        for n, v in zip(met_names, r.metric_values):
            row[n] = parse_num(v.value)
        rows.append(row)
    return rows


def md_table(rows, cols, max_rows=None):
    if not rows:
        return "_no data_\n"
    lines = ["| " + " | ".join(cols) + " |", "|" + "|".join("---" for _ in cols) + "|"]
    for r in rows[: max_rows or len(rows)]:
        lines.append("| " + " | ".join(fmt(c, r.get(c, "")).replace("|", "\\|") for c in cols) + " |")
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--days", type=int, default=30, help="window length ending yesterday (default 30)")
    ap.add_argument("--start", help="YYYY-MM-DD (overrides --days)")
    ap.add_argument("--end", help="YYYY-MM-DD (default yesterday)")
    ap.add_argument("--since", default="2025-01-01", help="start of the all-time monthly trend")
    ap.add_argument("--property", help="numeric GA4 property ID (skips the lookup)")
    ap.add_argument("--measurement-id", default=MEASUREMENT_ID)
    ap.add_argument("--credentials", help="service-account JSON key (default: gcloud ADC)")
    ap.add_argument("--out", help="output directory (default output/ga/<start>_<end>)")
    ap.add_argument("--list", action="store_true", help="list accessible GA4 properties and exit")
    args = ap.parse_args()

    try:
        creds = load_credentials(args.credentials)
    except Exception as e:  # noqa: BLE001
        sys.exit(f"Could not load credentials: {e}")

    try:
        if args.list or not args.property:
            props = list_properties(creds)
            if args.list:
                for acct, name, pid, mids in props:
                    print(f"{pid:<24} {name:<40} account={acct}  streams={','.join(mids) or '-'}")
                return
            match = [p for p in props if args.measurement_id in p[3]]
            if not match:
                print(f"No accessible property has a web stream with measurement ID {args.measurement_id}.", file=sys.stderr)
                print("Accessible properties:", file=sys.stderr)
                for acct, name, pid, mids in props:
                    print(f"  {pid:<24} {name:<40} account={acct}  streams={','.join(mids) or '-'}", file=sys.stderr)
                sys.exit(2)
            acct_name, prop_name, prop, _ = match[0]
        else:
            prop = f"properties/{args.property}"
            acct_name, prop_name = "?", "?"
    except RefreshError as e:
        sys.exit(
            "Token refresh failed: %s\n\nYour gcloud ADC probably lacks the analytics.readonly scope. Re-login with:\n"
            "  gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform,"
            "https://www.googleapis.com/auth/analytics.readonly" % e
        )
    except GoogleAPICallError as e:
        sys.exit(f"Analytics Admin API call failed: {e.message}")

    end = dt.date.fromisoformat(args.end) if args.end else dt.date.today() - dt.timedelta(days=1)
    start = dt.date.fromisoformat(args.start) if args.start else end - dt.timedelta(days=args.days - 1)
    span = (end - start).days + 1
    prev_end = start - dt.timedelta(days=1)
    prev_start = prev_end - dt.timedelta(days=span - 1)
    cur = (start.isoformat(), end.isoformat())
    prev = (prev_start.isoformat(), prev_end.isoformat())

    out_dir = Path(args.out) if args.out else REPO_ROOT / "output" / "ga" / f"{cur[0]}_{cur[1]}"
    out_dir.mkdir(parents=True, exist_ok=True)

    client = BetaAnalyticsDataClient(credentials=creds)
    result = {
        "property": prop, "property_name": prop_name, "account": acct_name,
        "measurement_id": args.measurement_id,
        "range": {"start": cur[0], "end": cur[1], "days": span},
        "previous_range": {"start": prev[0], "end": prev[1]},
        "generated_at": dt.datetime.now().isoformat(timespec="seconds"),
        "reports": {}, "errors": {},
    }

    def attempt(name, fn):
        try:
            result["reports"][name] = fn()
        except GoogleAPICallError as e:
            result["errors"][name] = e.message
            print(f"  ! {name}: {e.message.splitlines()[0]}", file=sys.stderr)

    print(f"Property {prop} ({prop_name}) in account {acct_name}", file=sys.stderr)
    print(f"Range {cur[0]}..{cur[1]} ({span} days), compared with {prev[0]}..{prev[1]}", file=sys.stderr)

    attempt("overview", lambda: run_report(client, prop, [], OVERVIEW_METRICS, [cur, prev]))
    for name, _title, dims, mets, order, limit in REPORTS:
        attempt(name, lambda d=dims, m=mets, o=order, l=limit: run_report(client, prop, d, m, [cur], o, l))
    attempt("monthly", lambda: run_report(
        client, prop, ["yearMonth"], ["activeUsers", "newUsers", "sessions", "screenPageViews"],
        [(args.since, cur[1])], ("dim", "yearMonth"), 200))

    (out_dir / "report.json").write_text(json.dumps(result, indent=2))

    # ---- Markdown ----
    md = [f"# GA4 report: {prop_name} ({args.measurement_id})",
          f"Range: **{cur[0]} to {cur[1]}** ({span} days). Previous period: {prev[0]} to {prev[1]}.  ",
          f"Generated {result['generated_at']}.", ""]
    ov = result["reports"].get("overview", [])
    if ov:
        cur_row = next((r for r in ov if r.get("dateRange") == "date_range_0"), {})
        prev_row = next((r for r in ov if r.get("dateRange") == "date_range_1"), {})
        md += ["## Overview", "", "| Metric | Current | Previous | Change |", "|---|---|---|---|"]
        for m in OVERVIEW_METRICS:
            c, p = cur_row.get(m, 0), prev_row.get(m, 0)
            delta = "n/a" if not isinstance(p, (int, float)) or p == 0 else f"{(c - p) / p * 100:+.0f}%"
            md.append(f"| {m} | {fmt(m, c)} | {fmt(m, p)} | {delta} |")
        md.append("")
    for name, title, dims, mets, _o, _l in REPORTS:
        rows = result["reports"].get(name)
        md.append(f"## {title}")
        md.append("")
        if rows is None:
            md.append(f"_skipped: {result['errors'].get(name, 'unknown error').splitlines()[0]}_")
        else:
            md.append(md_table(rows, dims + mets, max_rows=40 if name != "daily" else None))
        md.append("")
    monthly = result["reports"].get("monthly")
    md += ["## Monthly since " + args.since, ""]
    md.append(md_table(monthly, ["yearMonth", "activeUsers", "newUsers", "sessions", "screenPageViews"])
              if monthly is not None else f"_skipped: {result['errors'].get('monthly', '')}_")
    text = "\n".join(md)
    (out_dir / "report.md").write_text(text)
    print(text)
    print(f"\nSaved {out_dir / 'report.json'} and {out_dir / 'report.md'}", file=sys.stderr)


if __name__ == "__main__":
    main()
