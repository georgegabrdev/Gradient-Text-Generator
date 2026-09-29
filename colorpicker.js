(() => {
    const picker = document.getElementById("picker");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const dot = document.getElementById("dot");
    const hue = document.getElementById("hue");

    const hexInput = document.getElementById("hex");
    const rInput = document.getElementById("r");
    const gInput = document.getElementById("g");
    const bInput = document.getElementById("b");

    const pickerPreview = document.getElementById("pickerPreview");
    const closeBtn = document.getElementById("closeBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const okBtn = document.getElementById("okBtn");
    const titlebar = document.getElementById("titlebar");
    const targetLabel = document.getElementById("picker-target");

    let targetItem = null;
    let onApply = null;
    let currentHex = "#00ff88";
    let originalHex = "#00ff88";

    let h = 120;
    let s = 1;
    let v = 1;

    let draggingCanvas = false;
    let draggingWindow = false;

    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function hsvToRgb(hueValue, saturation, value) {
        const c = value * saturation;
        const x = c * (1 - Math.abs((hueValue / 60) % 2 - 1));
        const m = value - c;

        let r = 0;
        let g = 0;
        let b = 0;

        if (hueValue < 60) {
            r = c;
            g = x;
        } else if (hueValue < 120) {
            r = x;
            g = c;
        } else if (hueValue < 180) {
            g = c;
            b = x;
        } else if (hueValue < 240) {
            g = x;
            b = c;
        } else if (hueValue < 300) {
            r = x;
            b = c;
        } else {
            r = c;
            b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    function rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const d = max - min;

        let hueValue = 0;

        if (d !== 0) {
            if (max === r) {
                hueValue = 60 * (((g - b) / d) % 6);
            } else if (max === g) {
                hueValue = 60 * ((b - r) / d + 2);
            } else {
                hueValue = 60 * ((r - g) / d + 4);
            }
        }

        if (hueValue < 0) {
            hueValue += 360;
        }

        const saturation = max === 0 ? 0 : d / max;

        return {
            h: hueValue,
            s: saturation,
            v: max
        };
    }

    function componentToHex(value) {
        return value.toString(16).padStart(2, "0");
    }

    function rgbToHex(r, g, b) {
        return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
    }

    function hexToRgb(value) {
        let hex = value.trim().replace("#", "");

        if (hex.length === 3) {
            hex = hex
                .split("")
                .map(char => char + char)
                .join("");
        }

        if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
            return null;
        }

        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16)
        };
    }

    function drawCanvas() {
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const hueGradient = ctx.createLinearGradient(0, 0, width, 0);

        hueGradient.addColorStop(0, "#ff0000");
        hueGradient.addColorStop(1 / 6, "#ffff00");
        hueGradient.addColorStop(2 / 6, "#00ff00");
        hueGradient.addColorStop(3 / 6, "#00ffff");
        hueGradient.addColorStop(4 / 6, "#0000ff");
        hueGradient.addColorStop(5 / 6, "#ff00ff");
        hueGradient.addColorStop(1, "#ff0000");

        ctx.fillStyle = `hsl(${h}, 100%, 50%)`;
        ctx.fillRect(0, 0, width, height);

        const whiteGradient = ctx.createLinearGradient(
            0,
            0,
            width,
            0
        );

        whiteGradient.addColorStop(0, "#ffffff");
        whiteGradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = whiteGradient;
        ctx.fillRect(0, 0, width, height);

        const blackGradient = ctx.createLinearGradient(
            0,
            0,
            0,
            height
        );

        blackGradient.addColorStop(0, "rgba(0,0,0,0)");
        blackGradient.addColorStop(1, "#000000");

        ctx.fillStyle = blackGradient;
        ctx.fillRect(0, 0, width, height);

        dot.style.left = `${s * 100}%`;
        dot.style.top = `${(1 - v) * 100}%`;

        const rgb = hsvToRgb(h, s, v);
        updateFields(rgb);
    }

    function updateFields(rgb) {
        currentHex = rgbToHex(rgb.r, rgb.g, rgb.b);

        hexInput.value = currentHex;

        rInput.value = rgb.r;
        gInput.value = rgb.g;
        bInput.value = rgb.b;

        pickerPreview.style.background = currentHex;
    }

    function setFromHex(value) {
        const rgb = hexToRgb(value);

        if (!rgb) {
            return;
        }

        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        h = hsv.h;
        s = hsv.s;
        v = hsv.v;

        hue.value = h;

        drawCanvas();
    }

    function setFromRgb() {
        const r = clamp(Number(rInput.value) || 0, 0, 255);
        const g = clamp(Number(gInput.value) || 0, 0, 255);
        const b = clamp(Number(bInput.value) || 0, 0, 255);

        const hsv = rgbToHsv(r, g, b);

        h = hsv.h;
        s = hsv.s;
        v = hsv.v;

        hue.value = h;

        drawCanvas();
    }

    function updateCanvasPosition(event) {
        const rect = canvas.getBoundingClientRect();

        s = clamp(
            (event.clientX - rect.left) / rect.width,
            0,
            1
        );

        v = clamp(
            1 - (event.clientY - rect.top) / rect.height,
            0,
            1
        );

        drawCanvas();
    }

    function openPicker(item, cb) {
        if (!item) {
            return;
        }
        onApply = cb;

        targetItem = item;

        originalHex = item.color || "#00ff88";
        currentHex = originalHex;

        targetLabel.textContent = originalHex;

        const rgb = hexToRgb(originalHex) || {
            r: 0,
            g: 255,
            b: 136
        };

        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        h = hsv.h;
        s = hsv.s;
        v = hsv.v;

        hue.value = h;

        picker.hidden = false;
        picker.classList.add("open");

        drawCanvas();
    }

    function closePicker() {
        picker.classList.remove("open");
        picker.hidden = true;
        targetItem = null;
    }

    function applyPicker() {
        if (!targetItem) {
            return;
        }

        targetItem.color = currentHex;
        onApply?.();

        if (typeof window.generate === "function") {
            window.generate();
        }

        closePicker();
    }

    function cancelPicker() {
        closePicker();
    }

    canvas.addEventListener("pointerdown", event => {
        draggingCanvas = true;
        canvas.setPointerCapture(event.pointerId);
        updateCanvasPosition(event);
    });

    canvas.addEventListener("pointermove", event => {
        if (!draggingCanvas) {
            return;
        }

        updateCanvasPosition(event);
    });

    canvas.addEventListener("pointerup", () => {
        draggingCanvas = false;
    });

    canvas.addEventListener("pointercancel", () => {
        draggingCanvas = false;
    });

    hue.addEventListener("input", () => {
        h = Number(hue.value);
        drawCanvas();
    });

    hexInput.addEventListener("change", () => {
        setFromHex(hexInput.value);
    });

    hexInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            setFromHex(hexInput.value);
        }
    });

    rInput.addEventListener("input", setFromRgb);
    gInput.addEventListener("input", setFromRgb);
    bInput.addEventListener("input", setFromRgb);

    okBtn.addEventListener("click", applyPicker);
    cancelBtn.addEventListener("click", cancelPicker);
    closeBtn.addEventListener("click", cancelPicker);

    document.addEventListener("keydown", event => {
        if (picker.hidden) {
            return;
        }

        if (event.key === "Escape") {
            cancelPicker();
        }

        if (event.key === "Enter") {
            applyPicker();
        }
    });

    titlebar.addEventListener("pointerdown", event => {
        if (
            event.target === closeBtn ||
            event.target.closest("button")
        ) {
            return;
        }

        draggingWindow = true;

        const rect = picker.getBoundingClientRect();

        dragOffsetX = event.clientX - rect.left;
        dragOffsetY = event.clientY - rect.top;

        titlebar.setPointerCapture(event.pointerId);
    });

    titlebar.addEventListener("pointermove", event => {
        if (!draggingWindow) {
            return;
        }

        picker.style.left = `${event.clientX - dragOffsetX}px`;
        picker.style.top = `${event.clientY - dragOffsetY}px`;
        picker.style.transform = "none";
    });

    titlebar.addEventListener("pointerup", () => {
        draggingWindow = false;
    });

    window.openPicker = openPicker;
})();
