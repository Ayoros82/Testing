# Initial tide-data analysis

## Summary

The five supplied files contain three readable time series, one harmonic-constituent file, and one binary FBF file. The two long `Tide_sprint` series share all 12,961 timestamps and differ by exactly `+2.123` at every timestamp. The constituent file separately states `LAT value: -2.123 m`, consistent with the named LAT-shifted series applying the opposite of that stated LAT value as an additive offset.

The shorter `B40_VORFLAT...` series overlaps the long series for 116 readings, but its coverage has large gaps. At those coincident timestamps, it is closer to the LAT-shifted series than to the unshifted series, though it remains lower throughout the overlap. This is a preliminary comparison, not a validation or datum certification.

## Readable series statistics

| Source | Readings | Time span in file | Median interval | Minimum | Maximum | Mean |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| `B40_VORFLAT_80FIR_LAT_processed_caris 1.tid` | 116 | 2026-11-01 07:10 to 2026-11-04 14:00 | 10 min | 0.709 at 2026-11-01 10:00 | 2.773 at 2026-11-01 16:00 | 1.437 |
| `Tide_sprint_55.275_-4.842_B40.tid` | 12,961 | 2026-11-01 00:00 to 2027-01-30 00:00 | 10 min | -2.035 at 2027-01-24 19:10 | 1.747 at 2027-01-25 14:00 | approximately 0.000 |
| `Tide_sprint_55.275_-4.842_B40_TideShift_LAT_CARIS.tid` | 12,961 | 2026-11-01 00:00 to 2027-01-30 00:00 | 10 min | 0.088 at 2027-01-24 19:10 | 3.870 at 2027-01-25 14:00 | 2.123 |

The short series has three non-10-minute intervals: 2026-11-01 10:00–10:20 (20 minutes), 2026-11-01 16:00–2026-11-03 10:10 (42 hours 10 minutes), and 2026-11-03 16:30–2026-11-04 10:10 (17 hours 40 minutes). Its reported extrema and mean describe only the supplied readings; because of these gaps, they should not be treated as complete-period extrema or summary statistics.

The long series covers 90 days at 10-minute spacing, inclusive of both endpoints. Its raw and shifted versions have identical timing and shape; only the constant vertical offset differs.

## Coincident-time comparison

For the 116 timestamps shared by the short CARIS series and the long series:

| Comparison | Mean difference | MAE | RMSE | Difference range |
| --- | ---: | ---: | ---: | ---: |
| Short series minus unshifted `Tide_sprint` | +1.663 | 1.663 | 1.665 | +1.556 to +1.869 |
| Short series minus LAT-shifted `Tide_sprint` | -0.460 | 0.460 | 0.465 | -0.567 to -0.254 |

Differences are in the numeric units as supplied; the short series itself does not state its unit. The residuals are defined as `short series - comparison series`. The comparison CSV contains the row-level values for all 116 shared timestamps.

## Constituent metadata

`LATHC_55.275_-4.842_B40.tid` reports latitude `55.275`, longitude `-4.842`, and `LAT value: -2.123 m`. Its largest listed constituent amplitudes are M2 `1.086 m`, S2 `0.290 m`, and N2 `0.219 m`. The file gives amplitudes and phases for M2, S2, N2, K2, K1, O1, P1, Q1, Mf, Mm, M4, MS4, and MN4. These are harmonic constants, not date-stamped tide observations; the app's time-series chart should not ingest them as readings.

## Files not fully analyzed

- `Seeker-SPK-FWD-Tide.fbf` is binary rather than readable delimited text. Its header contains labels `Time`, `Tide`, and `ProcFlags`, but this initial review did not decode its records. Use the source software or a verified FBF format specification before interpreting it.
- The source time strings do not declare a timezone. Timestamps above are reproduced as written and should not be assumed to be UTC or local civil time.
- No units are stated in the two `Tide_sprint` time-series headers beyond `Height`; do not infer unit conversion or vertical-datum correctness from the filenames alone.

## Recommended next checks

1. Confirm the time zone, units, and vertical-datum meaning for each series with the data owner or source software.
2. Investigate the short series' three gaps and verify whether its readings are observations, corrected data, or another product.
3. Confirm that the stated `-2.123 m` LAT value and the `+2.123` series shift use the intended sign convention and reference datum.
4. Decode the FBF only with a documented, validated method, then compare its time and tide fields against the readable series.

## Generated comparison artifact

- [`B40-vs-TideSprint-comparison.csv`](B40-vs-TideSprint-comparison.csv) — 116 coincident timestamps with the short-series value, both `Tide_sprint` values, and the short-minus-shifted residual.
