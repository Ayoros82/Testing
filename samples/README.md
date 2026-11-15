# Sample data

These are the five source files provided for the TideScope project. Originals are kept here unchanged.

| File | Type | Initial assessment |
| --- | --- | --- |
| `B40_VORFLAT_80FIR_LAT_processed_caris 1.tid` | Readable timestamp/value series | 116 readings, nominal 10-minute interval, with three gaps larger than the nominal interval. |
| `LATHC_55.275_-4.842_B40.tid` | Harmonic-constituent metadata | Location 55.275, -4.842; constituent amplitudes/phases and a stated LAT value. Not a timestamped series. |
| `Seeker-SPK-FWD-Tide.fbf` | Binary FBF | Contains embedded `Time`, `Tide`, and `ProcFlags` labels, but is not plain text. Decode only with the applicable format specification or source application. |
| `Tide_sprint_55.275_-4.842_B40.tid` | Readable timestamp/value series | 12,961 readings on a regular 10-minute grid from 2026-11-01 through 2027-01-30; source header states `Z0: 0.000`. |
| `Tide_sprint_55.275_-4.842_B40_TideShift_LAT_CARIS.tid` | Readable timestamp/value series | 12,961 readings on the same grid; values are exactly 2.123 higher than the unshifted series. |

See [`../deliverables/INITIAL_ANALYSIS.md`](../deliverables/INITIAL_ANALYSIS.md) for the initial summary and caveats.
