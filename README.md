# TideScope

A lightweight, client-side tide chart app for readable `.tid`, `.txt`, `.csv`, `.fbf`, and `.pos` files. Files are read and charted locally in your browser; the app does not upload data to a server.

## Project files

- [Project brief](docs/PROJECT.md) — purpose, scope, requirements, and completion criteria.
- [Workflow chart](docs/WORKFLOW.md) — the data-import, review, chart, and export flow.
- [Sample data](samples/README.md) — inventory and initial format notes for the five supplied files.
- [Initial data analysis](deliverables/INITIAL_ANALYSIS.md) — preliminary statistics, comparisons, and caveats.
- [Deliverables](deliverables/README.md) — output inventory and storage guidance.

## Run

Open `index.html` in a modern browser. No build step or package installation is required.

## Importing files

Drop one or more files into the import area, or select them from the file picker. The app reads comma-, tab-, semicolon-, pipe-, and whitespace-separated text. A header row is optional. Common date/time and tide, water-level, height, or elevation headers are detected automatically; use **Review columns** to correct the mapping and preview the parsed rows.

Whitespace-separated records with separate date, time, and value fields are supported. Timestamps can also be in ISO, common year-month-day or day/month/year, compact `YYYYMMDD` or `YYYYMMDDHHMM`, or Unix seconds/milliseconds form. Tide values are plotted as provided, so set the unit label to match the source data.

Fugro Starfix `.fbf` and `.pos` extensions are accepted when the files contain readable text and date/time and value columns. The app does not decode proprietary binary formats or infer which Starfix field represents tide; convert binary exports to text and select the correct value column. Review the chart and column preview before using exported values.

The chart combines valid rows across imported files, sorts them by time, and reports the observed high, mean, and low. **Download CSV** exports all plotted readings with timestamps and source filenames.
