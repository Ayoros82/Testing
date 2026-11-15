"use strict";

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  fileList: document.querySelector("#file-list"),
  fileCount: document.querySelector("#file-count"),
  emptyState: document.querySelector("#empty-state"),
  chartContent: document.querySelector("#chart-content"),
  chart: document.querySelector("#chart"),
  tooltip: document.querySelector("#chart-tooltip"),
  mappingPanel: document.querySelector("#mapping-panel"),
  activeFile: document.querySelector("#active-file"),
  dateColumn: document.querySelector("#date-column"),
  timeColumn: document.querySelector("#time-column"),
  valueColumn: document.querySelector("#value-column"),
  previewHead: document.querySelector("#preview-head"),
  previewBody: document.querySelector("#preview-body"),
  unitInput: document.querySelector("#unit-input"),
  dataMessage: document.querySelector("#data-message"),
};

const files = [];
let currentPoints = [];

elements.fileInput.addEventListener("change", (event) => {
  addFiles(event.target.files);
  event.target.value = "";
});

elements.dropZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.fileInput.click();
  }
});

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("drag-over");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("drag-over");
  });
}
elements.dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

elements.activeFile.addEventListener("change", showMapping);
for (const select of [elements.dateColumn, elements.timeColumn, elements.valueColumn]) {
  select.addEventListener("change", () => {
    const file = getActiveFile();
    if (!file) return;
    file.mapping = {
      date: Number(elements.dateColumn.value),
      time: elements.timeColumn.value === "" ? null : Number(elements.timeColumn.value),
      value: Number(elements.valueColumn.value),
    };
    const count = getFilePoints(file).length;
    file.status = `${count} readings${count ? "" : " — check columns"}`;
    renderAll();
  });
}
elements.unitInput.addEventListener("input", renderChart);
document.querySelector("#download-button").addEventListener("click", downloadCsv);

function addFiles(fileList) {
  for (const file of fileList) {
    if (files.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)) continue;
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      extension: file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "file",
      status: "Reading…",
      error: "",
      rows: [],
      headers: [],
      mapping: null,
    };
    files.push(item);
    file.text().then((text) => {
      if (text.includes("\u0000")) throw new Error("This appears to be a binary file. Convert it to a readable text export first.");
      parseFile(item, text);
      renderAll();
    }).catch((error) => {
      item.error = error.message || "Could not read this file.";
      item.status = "Could not read file";
      renderAll();
    });
  }
  renderAll();
}

function parseFile(file, text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r\n?|\n/);
  const usefulLines = lines.map((raw, index) => ({ raw: raw.trim(), lineNumber: index + 1 }))
    .filter(({ raw }) => raw && !/^(#|\/\/|;)/.test(raw));
  if (!usefulLines.length) {
    file.status = "No data rows found";
    file.error = "No readable rows were found.";
    return;
  }
  const delimiter = detectDelimiter(usefulLines.slice(0, 12).map(({ raw }) => raw));
  const firstCells = splitLine(usefulLines[0].raw, delimiter);
  const hasHeader = looksLikeHeader(firstCells);
  file.headers = hasHeader ? firstCells.map((cell, index) => cell || `Column ${index + 1}`) : firstCells.map((_, index) => `Column ${index + 1}`);
  const dataLines = hasHeader ? usefulLines.slice(1) : usefulLines;
  file.rows = dataLines.map(({ raw, lineNumber }) => ({
    cells: splitLine(raw, delimiter),
    raw,
    lineNumber,
  })).filter((row) => row.cells.some((cell) => cell.trim()));
  if (!file.rows.length) {
    file.status = "No data rows found";
    file.error = "The file contains a header but no data rows.";
    return;
  }
  file.mapping = detectMapping(file.headers, file.rows);
  const parsedCount = getFilePoints(file).length;
  file.status = `${parsedCount} readings${parsedCount ? "" : " — check columns"}`;
  file.error = "";
}

function detectDelimiter(lines) {
  const candidates = [",", "\t", ";", "|"];
  let best = { delimiter: null, score: 0 };
  for (const delimiter of candidates) {
    const counts = lines.map((line) => splitLine(line, delimiter).length);
    const consistent = counts.filter((count) => count > 1);
    if (!consistent.length) continue;
    const score = consistent.reduce((sum, count) => sum + count, 0) / consistent.length;
    const consistency = consistent.length / counts.length;
    const weighted = score * consistency;
    if (weighted > best.score) best = { delimiter, score: weighted };
  }
  return best.delimiter;
}

function splitLine(line, delimiter) {
  if (!delimiter) return line.trim().split(/\s+/);
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function looksLikeHeader(cells) {
  const names = cells.map(normalizeHeader);
  const hasLabel = names.some((name) => /date|time|tide|water|level|height|elev|timestamp|utc|epoch/.test(name));
  return hasLabel || !cells.some((cell) => parseTimestamp(cell) || parseNumber(cell) !== null);
}

function normalizeHeader(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function detectMapping(headers, rows) {
  const normalized = headers.map(normalizeHeader);
  let date = normalized.findIndex((name) => /datetime|timestamp|date|epoch|utc/.test(name));
  let time = normalized.findIndex((name) => /^(time|timeofday|hhmmss)$/.test(name));
  if (date < 0 && rows.length) {
    date = rows[0].cells.findIndex((cell) => parseTimestamp(cell) !== null);
    if (date < 0 && rows[0].cells.length > 1 && parseDatePart(rows[0].cells[0]) !== null) date = 0;
  }
  if (date < 0) date = 0;
  if (time === date) time = -1;
  if (time < 0 && rows.length && rows[0].cells.length > 1) {
    const datePart = parseDatePart(rows[0].cells[date] || "");
    if (datePart && rows[0].cells.some((cell, index) => index !== date && parseTimePart(cell) !== null)) {
      time = rows[0].cells.findIndex((cell, index) => index !== date && parseTimePart(cell) !== null);
    }
  }
  let value = normalized.findIndex((name) => /tide|waterlevel|level|height|elev|heave/.test(name));
  if (value < 0) {
    const sample = rows[0]?.cells || [];
    const numeric = sample.map((cell, index) => ({ index, value: parseNumber(cell) }))
      .filter(({ index, value: number }) => number !== null && index !== date && index !== time);
    value = numeric.length ? numeric[numeric.length - 1].index : Math.max(0, headers.length - 1);
  }
  return { date, time: time < 0 ? null : time, value };
}

function parseDatePart(value) {
  const text = value.trim();
  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6));
    const day = Number(text.slice(6, 8));
    return makeLocalDate(year, month, day, 0, 0, 0);
  }
  const match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) return makeLocalDate(Number(match[1]), Number(match[2]), Number(match[3]), 0, 0, 0);
  const dmy = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return makeLocalDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]), 0, 0, 0);
  return null;
}

function parseTimePart(value) {
  const text = value.trim();
  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/);
  if (match) {
    const fraction = match[4] ? Number(`0.${match[4]}`) * 1000 : 0;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] || 0);
    if (hour < 24 && minute < 60 && second < 60) return { hour, minute, second, millisecond: Math.round(fraction) };
  }
  if (/^\d{6}$/.test(text)) {
    const hour = Number(text.slice(0, 2));
    const minute = Number(text.slice(2, 4));
    const second = Number(text.slice(4, 6));
    if (hour < 24 && minute < 60 && second < 60) return { hour, minute, second, millisecond: 0 };
  }
  return null;
}

function makeLocalDate(year, month, day, hour, minute, second, millisecond = 0) {
  const date = new Date(year, month - 1, day, hour, minute, second, millisecond);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function parseTimestamp(value, timeValue = "") {
  const text = value.trim();
  if (!text) return null;
  const datePart = parseDatePart(text);
  const timePart = parseTimePart(timeValue);
  if (datePart) {
    if (!timeValue || !timePart) return datePart;
    return makeLocalDate(datePart.getFullYear(), datePart.getMonth() + 1, datePart.getDate(),
      timePart.hour, timePart.minute, timePart.second, timePart.millisecond);
  }
  if (/^\d{12}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6));
    const day = Number(text.slice(6, 8));
    const hour = Number(text.slice(8, 10));
    const minute = Number(text.slice(10, 12));
    if (hour >= 24 || minute >= 60) return null;
    return makeLocalDate(year, month, day, hour, minute, 0);
  }
  if (/^\d{10}(?:\d{3})?$/.test(text)) {
    const epoch = Number(text);
    const date = new Date(text.length === 13 ? epoch : epoch * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime()) && /[-T:/]/.test(text)) return iso;
  return null;
}

function parseNumber(value) {
  const text = value.trim();
  if (!text) return null;
  const normalized = text.includes(",") && !text.includes(".") && /^\s*[-+]?\d+,\d+\s*$/.test(text)
    ? text.replace(",", ".")
    : text.replace(/,/g, "");
  const match = normalized.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) ? number : null;
}

function getFilePoints(file) {
  if (!file.mapping) return [];
  const { date, time, value } = file.mapping;
  return file.rows.flatMap((row) => {
    const dateCell = row.cells[date] || "";
    const timeCell = time === null ? "" : row.cells[time] || "";
    const timestamp = parseTimestamp(dateCell, timeCell);
    const reading = parseNumber(row.cells[value] || "");
    return timestamp && reading !== null ? [{ timestamp, value: reading, file: file.name, lineNumber: row.lineNumber }] : [];
  });
}

function getActiveFile() {
  return files.find((file) => file.id === elements.activeFile.value);
}

function renderAll() {
  renderFileList();
  renderFilePicker();
  renderChart();
  elements.mappingPanel.hidden = files.length === 0;
  if (files.length && getActiveFile()) showMapping();
}

function renderFileList() {
  elements.fileCount.textContent = `${files.length} ${files.length === 1 ? "file" : "files"}`;
  elements.fileList.replaceChildren();
  for (const file of files) {
    const row = document.createElement("div");
    row.className = "file-item";
    const type = document.createElement("span");
    type.className = "file-type";
    type.textContent = file.extension;
    const info = document.createElement("div");
    info.className = "file-info";
    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = file.name;
    name.title = file.name;
    const status = document.createElement("div");
    status.className = `file-status${file.error ? " error" : ""}`;
    status.textContent = file.error || file.status;
    info.append(name, status);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-file";
    remove.setAttribute("aria-label", `Remove ${file.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      const wasActive = elements.activeFile.value === file.id;
      files.splice(files.indexOf(file), 1);
      renderAll();
      if (wasActive && files.length) showMapping();
    });
    row.append(type, info, remove);
    elements.fileList.append(row);
  }
}

function renderFilePicker() {
  const currentId = elements.activeFile.value;
  elements.activeFile.replaceChildren();
  for (const file of files) {
    const option = document.createElement("option");
    option.value = file.id;
    option.textContent = file.name;
    elements.activeFile.append(option);
  }
  if (files.some((file) => file.id === currentId)) elements.activeFile.value = currentId;
}

function showMapping() {
  const file = getActiveFile();
  if (!file) return;
  const options = file.headers.map((header, index) => ({ value: index, label: `${header} (${index + 1})` }));
  populateSelect(elements.dateColumn, options, file.mapping?.date ?? 0, false);
  populateSelect(elements.timeColumn, [{ value: "", label: "Not used" }, ...options], file.mapping?.time ?? "", true);
  populateSelect(elements.valueColumn, options, file.mapping?.value ?? Math.max(0, file.headers.length - 1), false);
  renderPreview(file);
}

function populateSelect(select, options, selected, allowEmpty) {
  select.replaceChildren();
  for (const optionData of options) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    select.append(option);
  }
  if (allowEmpty && selected === null) select.value = "";
  else select.value = String(selected);
}

function renderPreview(file) {
  const headRow = document.createElement("tr");
  for (const header of file.headers) {
    const cell = document.createElement("th");
    cell.textContent = header;
    headRow.append(cell);
  }
  elements.previewHead.replaceChildren(headRow);
  elements.previewBody.replaceChildren();
  for (const row of file.rows.slice(0, 5)) {
    const tr = document.createElement("tr");
    file.headers.forEach((_, index) => {
      const td = document.createElement("td");
      td.textContent = row.cells[index] || "";
      td.title = td.textContent;
      tr.append(td);
    });
    elements.previewBody.append(tr);
  }
}

function renderChart() {
  currentPoints = files.flatMap(getFilePoints).sort((a, b) => a.timestamp - b.timestamp);
  elements.emptyState.hidden = currentPoints.length > 0;
  elements.chartContent.hidden = currentPoints.length === 0;
  elements.dataMessage.hidden = true;
  if (!currentPoints.length) {
    elements.chart.replaceChildren();
    elements.tooltip.hidden = true;
    return;
  }
  const high = currentPoints.reduce((best, point) => point.value > best.value ? point : best);
  const low = currentPoints.reduce((best, point) => point.value < best.value ? point : best);
  const mean = currentPoints.reduce((total, point) => total + point.value, 0) / currentPoints.length;
  const unit = elements.unitInput.value.trim();
  document.querySelector("#high-stat").textContent = `${formatValue(high.value)} ${unit}`.trim();
  document.querySelector("#mean-stat").textContent = `${formatValue(mean)} ${unit}`.trim();
  document.querySelector("#low-stat").textContent = `${formatValue(low.value)} ${unit}`.trim();
  document.querySelector("#high-time").textContent = formatDate(high.timestamp);
  document.querySelector("#low-time").textContent = formatDate(low.timestamp);
  document.querySelector("#reading-count").textContent = `${currentPoints.length.toLocaleString()} readings`;
  const first = currentPoints[0].timestamp;
  const last = currentPoints[currentPoints.length - 1].timestamp;
  document.querySelector("#time-range").textContent = first.getTime() === last.getTime()
    ? formatDate(first)
    : `${formatDate(first)} — ${formatDate(last)}`;
  drawSvgChart(currentPoints, unit);
}

function formatValue(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function formatDate(date) {
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function drawSvgChart(points, unit) {
  const width = 720;
  const height = 245;
  const margin = { top: 14, right: 12, bottom: 36, left: 56 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const minTime = points[0].timestamp.getTime();
  const maxTime = points[points.length - 1].timestamp.getTime();
  const values = points.map((point) => point.value);
  let minValue = values.reduce((minimum, value) => Math.min(minimum, value), Infinity);
  let maxValue = values.reduce((maximum, value) => Math.max(maximum, value), -Infinity);
  if (minValue === maxValue) {
    const padding = Math.abs(minValue) * 0.08 || 1;
    minValue -= padding;
    maxValue += padding;
  } else {
    const padding = (maxValue - minValue) * 0.12;
    minValue -= padding;
    maxValue += padding;
  }
  const x = (date) => margin.left + ((date.getTime() - minTime) / (maxTime - minTime || 1)) * plotWidth;
  const y = (value) => margin.top + (1 - (value - minValue) / (maxValue - minValue)) * plotHeight;
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const defs = document.createElementNS(ns, "defs");
  const gradient = document.createElementNS(ns, "linearGradient");
  gradient.id = "chartFill";
  gradient.setAttribute("x1", "0");
  gradient.setAttribute("x2", "0");
  gradient.setAttribute("y1", "0");
  gradient.setAttribute("y2", "1");
  for (const [offset, opacity] of [["0%", ".24"], ["100%", "0"]]) {
    const stop = document.createElementNS(ns, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", "#47d6c3");
    stop.setAttribute("stop-opacity", opacity);
    gradient.append(stop);
  }
  defs.append(gradient);
  svg.append(defs);

  for (let index = 0; index <= 4; index += 1) {
    const value = maxValue - ((maxValue - minValue) * index) / 4;
    const grid = document.createElementNS(ns, "line");
    grid.setAttribute("x1", margin.left);
    grid.setAttribute("x2", width - margin.right);
    grid.setAttribute("y1", y(value));
    grid.setAttribute("y2", y(value));
    grid.setAttribute("class", "chart-grid");
    svg.append(grid);
    addSvgText(svg, 0, y(value) + 3, `${formatValue(value)}${unit ? ` ${unit}` : ""}`, "chart-axis-label");
  }

  const labelIndexes = points.length === 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  [...new Set(labelIndexes)].forEach((index) => {
    const text = points[index].timestamp.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const labelX = points.length === 1 ? margin.left : x(points[index].timestamp);
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", height - 7);
    label.setAttribute("text-anchor", index === 0 ? "start" : index === points.length - 1 ? "end" : "middle");
    label.setAttribute("class", "chart-axis-label");
    label.textContent = text;
    svg.append(label);
  });

  const linePath = points.map((point, index) => `${index ? "L" : "M"}${x(point.timestamp)},${y(point.value)}`).join(" ");
  const areaPath = `${linePath} L${x(points[points.length - 1].timestamp)},${margin.top + plotHeight} L${x(points[0].timestamp)},${margin.top + plotHeight} Z`;
  const area = document.createElementNS(ns, "path");
  area.setAttribute("d", areaPath);
  area.setAttribute("class", "chart-area");
  svg.append(area);
  const line = document.createElementNS(ns, "path");
  line.setAttribute("d", linePath);
  line.setAttribute("class", "chart-line");
  svg.append(line);

  const stride = Math.max(1, Math.ceil(points.length / 300));
  points.forEach((point, index) => {
    if (index % stride !== 0 && index !== points.length - 1) return;
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", x(point.timestamp));
    circle.setAttribute("cy", y(point.value));
    circle.setAttribute("r", points.length < 50 ? "3.5" : "2");
    circle.setAttribute("class", "chart-point");
    circle.setAttribute("tabindex", "0");
    const label = `${formatDate(point.timestamp)} · ${formatValue(point.value)} ${unit}`.trim();
    circle.setAttribute("aria-label", label);
    circle.addEventListener("mouseenter", (event) => showTooltip(event, label));
    circle.addEventListener("focus", (event) => showTooltip(event, label));
    circle.addEventListener("mouseleave", () => { elements.tooltip.hidden = true; });
    circle.addEventListener("blur", () => { elements.tooltip.hidden = true; });
    svg.append(circle);
  });
  elements.chart.replaceChildren(svg);
}

function addSvgText(svg, x, y, text, className) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
  node.setAttribute("x", x);
  node.setAttribute("y", y);
  node.setAttribute("class", className);
  node.textContent = text;
  svg.append(node);
}

function showTooltip(event, text) {
  const chartBounds = elements.chart.getBoundingClientRect();
  const pointBounds = event.currentTarget.getBoundingClientRect();
  elements.tooltip.textContent = text;
  elements.tooltip.hidden = false;
  const left = pointBounds.left - chartBounds.left + pointBounds.width / 2;
  const top = pointBounds.top - chartBounds.top;
  elements.tooltip.style.left = `${Math.max(4, Math.min(chartBounds.width - 190, left + 9))}px`;
  elements.tooltip.style.top = `${Math.max(0, top - 42)}px`;
}

function downloadCsv() {
  if (!currentPoints.length) return;
  const rows = [["timestamp", "tide_value", "unit", "source"], ...currentPoints.map((point) => [
    point.timestamp.toISOString(),
    String(point.value),
    elements.unitInput.value.trim(),
    point.file,
  ])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "tide-readings.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}
