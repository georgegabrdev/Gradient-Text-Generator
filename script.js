(() => {
    const $ = id => document.getElementById(id);

    const input = $("input");
    const fontSelect = $("font-select");
    const modeSelect = $("mode");
    const compress = $("compress");
    const keyframeContainer = $("keyframe-container");
    const addKeyframeButton = $("add-keyframe");
    const presetSelect = $("preset-select");
    const presetName = $("preset-name");
    const savePresetButton = $("save-preset");
    const deletePresetButton = $("delete-preset");
    const visualPreview = $("visual-preview");
    const preview = $("preview");
    const charCount = $("char-count");
    const status = $("status");
    const copyResultButton = $("copy-result");
    const copyCodeButton = $("copy-code");

    const robloxFonts = [
        "Legacy",
        "Arial",
        "ArialBold",
        "SourceSans",
        "SourceSansBold",
        "SourceSansLight",
        "SourceSansItalic",
        "Bodoni",
        "Garamond",
        "Cartoon",
        "Code",
        "Highway",
        "SciFi",
        "Arcade",
        "Fantasy",
        "Antique",
        "SourceSansSemibold",
        "Gotham",
        "GothamMedium",
        "GothamBold",
        "GothamBlack",
        "AmaticSC",
        "Bangers",
        "Creepster",
        "DenkOne",
        "Fondamento",
        "FredokaOne",
        "GrenzeGotisch",
        "IndieFlower",
        "JosefinSans",
        "Jura",
        "Kalam",
        "LuckiestGuy",
        "Merriweather",
        "Michroma",
        "Nunito",
        "Oswald",
        "PatrickHand",
        "PermanentMarker",
        "Roboto",
        "RobotoCondensed",
        "RobotoMono",
        "Sarpanch",
        "SpecialElite",
        "TitilliumWeb",
        "Ubuntu",
        "BuilderSans",
        "BuilderSansMedium",
        "BuilderSansBold",
        "BuilderSansExtraBold",
        "Arimo",
        "ArimoBold"
    ];

    let keyframes = [
        { color: "#00ff88" },
        { color: "#0077ff" }
    ];

    robloxFonts.forEach((font, index) => {
        const option = document.createElement("option");

        option.value = font;
        option.textContent = `${index}: ${font}`;

        fontSelect.appendChild(option);
    });

    function hexToRgb(hex) {
        const value = hex.replace("#", "");

        return {
            r: parseInt(value.slice(0, 2), 16),
            g: parseInt(value.slice(2, 4), 16),
            b: parseInt(value.slice(4, 6), 16)
        };
    }

    function rgbToHex(r, g, b) {
        return "#" + [r, g, b]
            .map(value =>
                Math.round(
                    Math.max(0, Math.min(255, value))
                )
                    .toString(16)
                    .padStart(2, "0")
            )
            .join("");
    }

    function interpolateColor(color1, color2, factor) {
        const c1 = hexToRgb(color1);
        const c2 = hexToRgb(color2);

        return rgbToHex(
            c1.r + factor * (c2.r - c1.r),
            c1.g + factor * (c2.g - c1.g),
            c1.b + factor * (c2.b - c1.b)
        );
    }

    function saveEditorState() {
        const state = {
            text: input.value,
            font: fontSelect.value,
            mode: modeSelect.value,
            compress: compress.checked,
            keyframes: keyframes.map(item => item.color)
        };

        localStorage.setItem(
            "gradient_editor_state",
            JSON.stringify(state)
        );
    }

    function loadEditorState() {
        try {
            const saved =
                localStorage.getItem("gradient_editor_state");

            if (!saved) {
                return;
            }

            const state = JSON.parse(saved);

            if (typeof state.text === "string") {
                input.value = state.text;
            }

            if (
                typeof state.font === "string" &&
                robloxFonts.includes(state.font)
            ) {
                fontSelect.value = state.font;
            }

            if (
                typeof state.mode === "string" &&
                [...modeSelect.options].some(
                    option => option.value === state.mode
                )
            ) {
                modeSelect.value = state.mode;
            }

            if (typeof state.compress === "boolean") {
                compress.checked = state.compress;
            }

            if (
                Array.isArray(state.keyframes) &&
                state.keyframes.length >= 2 &&
                state.keyframes.every(color =>
                    typeof color === "string" &&
                    /^#[0-9a-fA-F]{6}$/.test(color)
                )
            ) {
                keyframes = state.keyframes.map(color => ({
                    color: color.toLowerCase()
                }));
            }
        } catch (error) {
            console.error(
                "Failed to load saved editor state:",
                error
            );
        }
    }

    function addKeyframe(colorValue = null) {
        const color =
            colorValue ||
            `#${Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0")}`;

        keyframes.push({
            color
        });

        saveEditorState();
        renderKeyframes();
        generate();
    }

    function removeKeyframe(index) {
        if (keyframes.length <= 2) {
            return;
        }

        keyframes.splice(index, 1);

        saveEditorState();
        renderKeyframes();
        generate();
    }

    function renderKeyframes() {
        keyframeContainer.innerHTML = "";

        keyframes.forEach((item, index) => {
            const div = document.createElement("div");

            div.className = "keyframe-item";

            const swatch = document.createElement("button");

            swatch.type = "button";
            swatch.className = "color-swatch";
            swatch.style.background = item.color;
            swatch.title = `Edit ${item.color}`;

            swatch.addEventListener("click", () => {
                if (typeof window.openPicker === "function") {
                    window.openPicker(item, () => {
                        saveEditorState();
                        renderKeyframes();
                        generate();
                    });
                } else {
                    console.error(
                        "openPicker is not available. Check colorpicker.js."
                    );
                }
            });

            const info = document.createElement("div");

            info.className = "keyframe-info";

            const title = document.createElement("strong");

            title.textContent = `Color ${index + 1}`;

            const value = document.createElement("span");

            value.textContent = item.color.toUpperCase();

            info.appendChild(title);
            info.appendChild(value);

            const remove = document.createElement("button");

            remove.type = "button";
            remove.className = "remove-keyframe";
            remove.textContent = "×";
            remove.title = "Remove color";

            if (index < 2) {
                remove.style.visibility = "hidden";
            }

            remove.addEventListener("click", () => {
                removeKeyframe(index);
            });

            div.appendChild(swatch);
            div.appendChild(info);
            div.appendChild(remove);

            keyframeContainer.appendChild(div);
        });
    }

    function getGradientColor(position) {
        if (keyframes.length === 1) {
            return keyframes[0].color;
        }

        const segmentCount = keyframes.length - 1;
        const scaledFactor = position * segmentCount;

        const index = Math.min(
            Math.floor(scaledFactor),
            segmentCount - 1
        );

        const localFactor = scaledFactor - index;

        return interpolateColor(
            keyframes[index].color,
            keyframes[index + 1].color,
            localFactor
        );
    }

    function generate() {
        const text = input.value;
        const selectedMode = modeSelect.value;
        const selectedFont = fontSelect.value;
        const slash = compress.checked ? "/" : " / ";

        saveEditorState();

        if (!text) {
            visualPreview.innerHTML =
                '<span class="placeholder">Type something to see preview...</span>';

            preview.textContent = "";
            charCount.textContent = "0";

            return "";
        }

        let codeResult = "";
        let visualHTML = "";

        for (let i = 0; i < text.length; i++) {
            const character = text[i];

            if (character === " ") {
                codeResult += " ";
                visualHTML += " ";
                continue;
            }

            const factor =
                text.length > 1
                    ? i / (text.length - 1)
                    : 0;

            const hex = getGradientColor(factor);

            const c = hexToRgb(hex);

            const darkHex = rgbToHex(
                c.r * 0.3,
                c.g * 0.3,
                c.b * 0.3
            );

            if (selectedMode === "text-only") {
                codeResult += `(${hex}${slash}${character})`;

                visualHTML +=
                    `<span style="color:${hex}">${character}</span>`;
            }
            else if (selectedMode === "outline-only") {
                codeResult += `[${hex}${slash}${character}]`;

                visualHTML +=
                    `<span style="color:white;text-shadow:1px 1px 2px ${hex},-1px -1px 2px ${hex}">${character}</span>`;
            }
            else if (selectedMode === "combined") {
                codeResult +=
                    `(${hex}${slash}[${darkHex}${slash}${character}])`;

                visualHTML +=
                    `<span style="color:${hex};text-shadow:2px 2px 0 ${darkHex}">${character}</span>`;
            }
            else if (selectedMode === "rich-text") {
                codeResult +=
                    `<font color="${hex}">${character}</font>`;

                visualHTML +=
                    `<span style="color:${hex}">${character}</span>`;
            }
        }

        if (selectedFont !== "") {
            if (selectedMode === "rich-text") {
                codeResult =
                    `<font face="${selectedFont}">${codeResult}</font>`;
            } else {
                codeResult =
                    `<${selectedFont}${slash}${codeResult}>`;
            }
        }

        preview.textContent = codeResult;

        visualPreview.innerHTML =
            `<span class="preview-content">${visualHTML}</span>`;

        visualPreview.style.fontFamily =
            selectedFont
                ? `"${selectedFont}", sans-serif`
                : "inherit";

        charCount.textContent =
            codeResult.length.toLocaleString();

        charCount.style.color =
            codeResult.length > 100000
                ? "#ff4444"
                : "#00ff88";

        return codeResult;
    }

    async function copyResult() {
        const code = generate();

        if (!code) {
            return;
        }

        try {
            await navigator.clipboard.writeText(code);

            status.textContent =
                "Copied to clipboard!";

            status.className =
                "status-message success";
        } catch {
            const textarea =
                document.createElement("textarea");

            textarea.value = code;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.select();
            document.execCommand("copy");
            textarea.remove();

            status.textContent =
                "Copied to clipboard!";

            status.className =
                "status-message success";
        }
    }

    function initPresets() {
        presetSelect.innerHTML =
            '<option value="">Select a preset...</option>';

        const presets =
            JSON.parse(
                localStorage.getItem("gradient_presets") || "{}"
            );

        Object.keys(presets).forEach(name => {
            const option =
                document.createElement("option");

            option.value = name;
            option.textContent = name;

            presetSelect.appendChild(option);
        });
    }

    function savePreset() {
        const name = presetName.value.trim();

        if (!name) {
            status.textContent =
                "Enter a preset name.";

            status.className =
                "status-message error";

            return;
        }

        const presets =
            JSON.parse(
                localStorage.getItem("gradient_presets") || "{}"
            );

        presets[name] =
            keyframes.map(item => item.color);

        localStorage.setItem(
            "gradient_presets",
            JSON.stringify(presets)
        );

        presetName.value = "";

        initPresets();

        presetSelect.value = name;

        status.textContent =
            `Saved preset "${name}".`;

        status.className =
            "status-message success";
    }

    function loadPreset() {
        const name = presetSelect.value;

        if (!name) {
            return;
        }

        const presets =
            JSON.parse(
                localStorage.getItem("gradient_presets") || "{}"
            );

        const colors = presets[name];

        if (!colors || colors.length < 2) {
            return;
        }

        keyframes =
            colors.map(color => ({
                color
            }));

        saveEditorState();
        renderKeyframes();
        generate();
    }

    function deletePreset() {
        const name = presetSelect.value;

        if (!name) {
            return;
        }

        const presets =
            JSON.parse(
                localStorage.getItem("gradient_presets") || "{}"
            );

        delete presets[name];

        localStorage.setItem(
            "gradient_presets",
            JSON.stringify(presets)
        );

        initPresets();
        generate();
    }

    input.addEventListener(
        "input",
        generate
    );

    modeSelect.addEventListener(
        "change",
        generate
    );

    compress.addEventListener(
        "change",
        generate
    );

    fontSelect.addEventListener(
        "change",
        generate
    );

    addKeyframeButton.addEventListener(
        "click",
        () => {
            addKeyframe();
        }
    );

    savePresetButton.addEventListener(
        "click",
        savePreset
    );

    deletePresetButton.addEventListener(
        "click",
        deletePreset
    );

    presetSelect.addEventListener(
        "change",
        loadPreset
    );

    copyResultButton.addEventListener(
        "click",
        copyResult
    );

    copyCodeButton.addEventListener(
        "click",
        copyResult
    );

    window.addKeyframe = addKeyframe;
    window.removeKeyframe = removeKeyframe;
    window.generate = generate;
    window.copyResult = copyResult;
    window.savePreset = savePreset;
    window.loadPreset = loadPreset;
    window.deletePreset = deletePreset;

    loadEditorState();
    initPresets();
    renderKeyframes();
    generate();
})();
