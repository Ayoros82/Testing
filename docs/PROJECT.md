# TideScope project brief

## Overview

TideScope is a browser-based tool for importing readable tide and survey data files, reviewing how their columns are interpreted, and visualizing water-level readings over time. It combines readings from multiple files and can export the plotted data as CSV.

## Problem and intended users

Surveyors, field teams, and other users with tide readings in text-based exports need a quick way to inspect their data without installing a desktop application or uploading potentially sensitive field files to a service.

## Objectives

- Make it straightforward to load one or more supported files by browsing or drag-and-drop.
- Parse common delimited and whitespace-separated text records, with or without a header row.
- Let users preview rows and correct date, time, and value column mappings.
- Show chronologically sorted readings, observed high/mean/low values, and an interactive chart.
- Export the plotted readings, timestamps, units, and source filenames to CSV.
- Keep file reading and charting in the user's browser.

## Scope

### Included

- File extensions `.tid`, `.txt`, `.csv`, `.fbf`, `.pos`, `.log`, and `.dat`.
- Text data separated by commas, tabs, semicolons, pipes, or whitespace.
- Automatic mapping for common date/time and tide, water-level, height, elevation, or heave columns; user-adjustable mappings and a row preview.
- ISO-like, common year-month-day or day/month/year, compact `YYYYMMDD` dates and `YYYYMMDDHHMM` timestamps, and Unix seconds/milliseconds timestamps.
- Local chart rendering, observed summary statistics, and CSV download.

### Not included

- Server-side storage, upload, accounts, or collaboration.
- Decoding proprietary or binary `.fbf` / `.pos` formats. Those extensions are accepted only when their contents are readable text.
- Automatically determining the meaning or unit of an ambiguous source column. Users must review the mapping and set the unit label to match their data.
- Tide prediction, harmonic analysis, datum conversion, or quality-control certification.

## Requirements and acceptance criteria

1. A user can add and remove multiple files using the picker or drop zone.
2. Readable records are parsed, sorted by timestamp, and combined in the chart; invalid rows do not become plotted readings.
3. The user can choose the date/timestamp, optional time, and value columns and inspect a sample of each file.
4. The chart reports the observed high, arithmetic mean, low, and plotted reading count, and exposes reading details on chart points.
5. The CSV export contains timestamp, tide value, unit, and source file for each plotted reading.
6. File processing requires no network service or build step.
7. Unsupported binary content and unusable input are communicated as file errors or a prompt to review columns rather than being presented as valid readings.

## Data handling and constraints

Files are read using the browser's File API; the application contains no upload or persistence workflow. Data is transient in the page and is not retained after the page is closed. Exported CSV is created locally by the browser. Displayed values retain the source numeric value; the unit field is a user-provided label and does not convert values.

## Current project structure

| Path | Purpose |
| --- | --- |
| `index.html` | Application interface and accessible control structure |
| `styles.css` | Responsive visual styling |
| `app.js` | File parsing, column review, chart rendering, and CSV export |
| `docs/PROJECT.md` | This project brief |
| `docs/WORKFLOW.md` | User and data-processing workflow |
| `samples/` | Supplied tide data and a source-file inventory |
| `deliverables/` | Project output inventory and location for reviewed exports |

## Completion status

The browser application and its core import/chart/export flow are present. Five source files are now in `samples/`; an initial analysis and coincident-time comparison CSV are in `deliverables/`. Final interpretation remains subject to confirmation of units, time zone, vertical datum, data gaps, and the binary FBF format.
