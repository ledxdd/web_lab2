"use strict";

const form = document.getElementById("point-form");
const API = form.getAttribute("action");
const xInput = document.getElementById("x-value");
const yInput = document.getElementById("y-value");
const rInput = document.getElementById("r-value");
const message = document.getElementById("form-message");
const clearButton = document.getElementById("clear-history");
const tableBody = document.querySelector("#results-table tbody");
const canvas = document.getElementById("area-canvas");
const context = canvas.getContext("2d");

let history = [];
let busy = false;

function setMessage(text, kind = "") {
    message.textContent = text;
    message.dataset.kind = kind;
}

function parseY(value) {
    const text = value.trim().replace(",", ".");

    if (!/^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(text)) {
        return null;
    }

    const negative = text.startsWith("-");
    const [whole, fraction = ""] = (negative ? text.slice(1) : text).split(".");
    const scale = 10n ** BigInt(fraction.length);
    const numerator = BigInt((whole || "0") + fraction) * (negative ? -1n : 1n);

    return numerator > -5n * scale && numerator < 3n * scale ? text : null;
}

function setBusy(value) {
    busy = value;
    form.querySelectorAll("button, input").forEach(element => { element.disabled = value; });

    clearButton.disabled = value || history.length === 0;
}

function renderHistory() {
    tableBody.replaceChildren();

    for (const entry of [...history].reverse()) {
        const row = document.createElement("tr");
        const values = [entry.x, entry.y, entry.r, entry.hit ? "Попадание" : "Промах",
               new Date(entry.time).toLocaleString("ru-RU"), (entry.elapsedNanos / 1e6).toFixed(3)];

        for (const value of values) {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.append(cell);
        }

        tableBody.append(row);
    }

    if (!history.length) {
        const row = tableBody.insertRow();

        const cell = row.insertCell();
        cell.colSpan = 6;

        cell.textContent = "Проверок пока нет";
    }
}

async function request(query = "", body = null) {
    if (busy) {
        return;
    }

    setBusy(true);
    setMessage("Загрузка…");

    try {
        const options = {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
            headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
            body: body ?? ""
        };
        const action = body === null ? "?action=history" : query;
        const response = await fetch(API + action, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Ошибка HTTP ${response.status}`);
        }

        history = data.results;
        renderHistory();
        drawGraph(history.at(-1));
        const last = history.at(-1);

        setMessage(body === null ? "История загружена." : query ? "История очищена."
            : last.hit ? "Точка попала в область." : "Точка не попала в область.", "success");
    } catch (error) {
        setMessage(`Не удалось выполнить запрос: ${error.message}`, "error");
    } finally {
        setBusy(false);
    }
}

for (const name of ["x", "r"]) {
    const input = name === "x" ? xInput : rInput;
    const buttons = [...document.querySelectorAll(`button[data-${name}]`)];

    for (const button of buttons) {
        button.addEventListener("click", () => {
            input.value = button.dataset[name];
            buttons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
            setMessage("");

            if (name === "r") {
                drawGraph(history.at(-1));
            }
        });
    }
}

yInput.addEventListener("input", () => {
    yInput.removeAttribute("aria-invalid");
    setMessage("");
});

form.addEventListener("submit", event => {
    event.preventDefault();
    if (!xInput.value) {
        return setMessage("Выберите X.", "error");
    }

    const y = parseY(yInput.value);
    yInput.setAttribute("aria-invalid", String(y === null));

    if (y === null) {
        yInput.focus();

        return setMessage("Введите число Y: −5 < Y < 3.", "error");
    }

    if (!rInput.value) {
        return setMessage("Выберите R.", "error");
    }

    request("", new URLSearchParams({x: xInput.value, y, r: rInput.value}));
});

clearButton.addEventListener("click", () => request("?action=clear", ""));

function drawLine(x1, y1, x2, y2) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function drawGraph(point = null) {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusPixels = 150;
    const halfRadiusPixels = radiusPixels / 2;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#3498ed";
    context.strokeStyle = "#1976c8";
    context.lineWidth = 2;

    context.beginPath();
    context.rect(centerX, centerY, radiusPixels, radiusPixels);
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(centerX + radiusPixels, centerY);
    context.lineTo(centerX, centerY - radiusPixels);
    context.lineTo(centerX, centerY);
    context.closePath();
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radiusPixels, Math.PI, 1.5 * Math.PI);
    context.closePath();
    context.fill();
    context.stroke();

    context.strokeStyle = "#172033";
    context.fillStyle = "#172033";
    context.lineWidth = 2;
    drawLine(34, centerY, width - 28, centerY);
    drawLine(centerX, height - 34, centerX, 28);

    context.beginPath();
    context.moveTo(width - 28, centerY);
    context.lineTo(width - 39, centerY - 6);
    context.moveTo(width - 28, centerY);
    context.lineTo(width - 39, centerY + 6);
    context.moveTo(centerX, 28);
    context.lineTo(centerX - 6, 39);
    context.moveTo(centerX, 28);
    context.lineTo(centerX + 6, 39);
    context.stroke();

    const ticks = [-radiusPixels, -halfRadiusPixels, halfRadiusPixels, radiusPixels];
    ticks.forEach((offset) => {
        drawLine(centerX + offset, centerY - 5, centerX + offset, centerY + 5);
        drawLine(centerX - 5, centerY + offset, centerX + 5, centerY + offset);
    });

    context.font = "17px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText("−R", centerX - radiusPixels, centerY + 10);
    context.fillText("−R/2", centerX - halfRadiusPixels, centerY + 10);
    context.fillText("R/2", centerX + halfRadiusPixels, centerY + 10);
    context.fillText("R", centerX + radiusPixels, centerY + 10);

    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText("R", centerX + 10, centerY - radiusPixels);
    context.fillText("R/2", centerX + 10, centerY - halfRadiusPixels);
    context.fillText("−R/2", centerX + 10, centerY + halfRadiusPixels);
    context.fillText("−R", centerX + 10, centerY + radiusPixels);
    context.font = "italic 21px Georgia, serif";
    context.fillText("x", width - 24, centerY - 17);
    context.fillText("y", centerX + 12, 21);

    if (point && Number(rInput.value) === Number(point.r)) {
        const scale = radiusPixels / point.r;
        const numericX = Number(String(point.x).replace(",", "."));
        const pointX = centerX + numericX * scale;
        const pointY = centerY - point.y * scale;
        context.beginPath();
        context.arc(pointX, pointY, 6, 0, Math.PI * 2);
        context.fillStyle = point.hit ? "#159447" : "#d33b34";
        context.fill();
        context.strokeStyle = "#fff";
        context.lineWidth = 2;
        context.stroke();
    }
}

renderHistory();
drawGraph();
request();
