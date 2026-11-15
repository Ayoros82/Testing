# TideScope workflow

## End-to-end workflow

```mermaid
flowchart TD
    A[Open TideScope in a modern browser] --> B[Select or drop one or more files]
    B --> C{Can the file be read as text?}
    C -- No --> D[Show file read error; convert binary export to text]
    D --> B
    C -- Yes --> E[Detect delimiter, headers, and likely columns]
    E --> F[Preview rows and review date, time, and value mapping]
    F --> G{Mapping produces valid readings?}
    G -- No --> H[Adjust column selections or check source file]
    H --> F
    G -- Yes --> I[Combine readings and sort by timestamp]
    I --> J[Render chart, time range, and high/mean/low]
    J --> K{Need to correct a file or unit?}
    K -- Yes --> F
    K -- No --> L[Download CSV]
    L --> M[Review exported values and record provenance]
    M --> N[Place approved project output in deliverables/]
```

## Workflow notes

- All parsing and charting occur locally in the browser. The app does not send files to a server.
- Each imported file has its own column mapping. Changing a mapping updates the combined chart.
- Rows without a parseable timestamp or numeric value are omitted from the chart.
- Values are charted as supplied; the unit label does not perform unit conversion.
- Binary or proprietary `.fbf` and `.pos` files must first be converted to readable text. The application cannot infer which ambiguous field represents tide height.
- Review the source file, selected columns, unit, and exported CSV before using results in reports or field decisions.
