# TideScope deliverables

This folder is the project location for reviewed outputs created from real tide data. The initial data review is in [`INITIAL_ANALYSIS.md`](INITIAL_ANALYSIS.md), and a row-level comparison is available as CSV.

## Output inventory

| Deliverable | Status | Notes |
| --- | --- | --- |
| TideScope browser application | Available | See `../index.html`, `../app.js`, and `../styles.css`. |
| Project brief and requirements | Available | See `../docs/PROJECT.md`. |
| Data workflow chart | Available | See `../docs/WORKFLOW.md`. |
| Initial source-data analysis | Available | Preliminary findings and limitations in [`INITIAL_ANALYSIS.md`](INITIAL_ANALYSIS.md). |
| Coincident-time comparison CSV | Available | [`B40-vs-TideSprint-comparison.csv`](B40-vs-TideSprint-comparison.csv); values are unconverted source values. |
| Reviewed tide chart / final analysis | In progress | Confirm units, timezone, datum, short-series gaps, and FBF decoding before treating outputs as verified. |

## Adding a project output

Save additional reviewed exports in this folder with descriptive names, for example `site-name_tide-readings.csv`. Include a short note alongside each output recording:

- source filenames and collection period;
- selected timestamp, time, and tide-value columns;
- the unit label and any known datum or conversion information;
- review date and any exclusions or caveats.

Do not treat an unreviewed automatic column mapping as verified data. The app exports values as provided and does not convert units or decode proprietary binary files.
