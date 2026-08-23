  (function() {
      const url = new URL(window.location.href);
      const clickID = url.searchParams.get("click_id");
      const sourceID = url.searchParams.get("source_id");
      const s = document.createElement("script");
      s.dataset.cfasync = "false";
      s.src = "https://push-sdk.com/f/sdk.js?z=666129";
      s.onload = (opts) => {
          opts.zoneID = 666129;
          opts.extClickID = clickID;
          opts.subID1 = sourceID;
          opts.actions.onPermissionGranted = () => {};
          opts.actions.onPermissionDenied = () => {};
          opts.actions.onAlreadySubscribed = () => {};
          opts.actions.onError = () => {};
      };
      document.head.appendChild(s);
  })()

let turnstileWidgetId = null;

function waitForTurnstile(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (
            window.turnstile &&
            typeof window.turnstile.render === "function"
        ) {
            resolve(window.turnstile);
            return;
        }

        const startedAt = Date.now();

        const intervalId = window.setInterval(() => {
            if (
                window.turnstile &&
                typeof window.turnstile.render === "function"
            ) {
                window.clearInterval(intervalId);
                resolve(window.turnstile);
                return;
            }

            if (Date.now() - startedAt >= timeoutMs) {
                window.clearInterval(intervalId);
                reject(new Error("Turnstile failed to load."));
            }
        }, 100);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const submitButton = document.getElementById("btnSubmit");

    if (!submitButton) {
        return;
    }

    submitButton.addEventListener("click", async () => {
        const urlInput = document.getElementById("txtUrl");
        const url = urlInput ? urlInput.value.trim() : "";

        const errorContainer = document.getElementById("error");
        const errorMessage = document.getElementById("errorMessage");
        const videoCardContainer = document.getElementById("videoCard");
        const captchaContainer =
            document.getElementById("captchaContainer");

        if (errorContainer) {
            errorContainer.style.display = "none";
        }

        if (videoCardContainer) {
            videoCardContainer.innerHTML = "";
        }

        /*
         * Validate the URL before displaying or requesting Turnstile.
         */
        if (!url || !isValidYouTubeUrl(url)) {
            if (errorMessage) {
                errorMessage.textContent =
                    "Please paste a valid YouTube URL.";
            }

            if (errorContainer) {
                errorContainer.style.display = "block";
            }

            if (urlInput) {
                urlInput.focus();
            }

            return;
        }

        if (!captchaContainer) {
            if (errorMessage) {
                errorMessage.textContent =
                    "Captcha could not be initialized. Please reload the page.";
            }

            if (errorContainer) {
                errorContainer.style.display = "block";
            }

            return;
        }

        try {
            submitButton.style.backgroundColor = "#c10841";
            submitButton.style.cursor = "not-allowed";
            submitButton.style.border = "2px solid #c10841";
            submitButton.disabled = true;

            if (
                captchaContainer.getAttribute(
                    "data-captcha-rendered"
                ) !== "true"
            ) {
                const turnstileApi =
                    await waitForTurnstile();

                captchaContainer.style.display = "block";

                turnstileWidgetId =
                    turnstileApi.render(
                        "#captchaContainer",
                        {
                            sitekey:
                                "0x4AAAAAAAxm8eJq-_BKzbuI",

                            callback: function (token) {
                                format(token);
                            },

                            "error-callback": function () {
                                if (errorMessage) {
                                    errorMessage.textContent =
                                        "Captcha could not be verified. Please try again.";
                                }

                                if (errorContainer) {
                                    errorContainer.style.display =
                                        "block";
                                }

                                TurnstileReset();
                            },

                            "expired-callback": function () {
                                if (errorMessage) {
                                    errorMessage.textContent =
                                        "Captcha expired. Please try again.";
                                }

                                if (errorContainer) {
                                    errorContainer.style.display =
                                        "block";
                                }

                                TurnstileReset();
                            },
                        }
                    );

                captchaContainer.setAttribute(
                    "data-captcha-rendered",
                    "true"
                );
            }
        } catch (error) {
            const analyzer =
                document.getElementById("imgAnalyzer");

            if (analyzer) {
                analyzer.style.display = "none";
            }

            if (errorMessage) {
                errorMessage.textContent =
                    "An unexpected error occurred. Please try again.";
            }

            if (errorContainer) {
                errorContainer.style.display = "block";
            }

            console.error("Error:", error);
            TurnstileReset();
        }
    });
});

function extractYouTubeId(url) {
    try {
        const parsedUrl = new URL(
            /^https?:\/\//i.test(url)
                ? url
                : "https://" + url
        );

        const host = parsedUrl.hostname
            .replace(/^www\./i, "")
            .toLowerCase();

        let videoId = null;

        if (host === "youtu.be") {
            videoId =
                parsedUrl.pathname
                    .split("/")
                    .filter(Boolean)[0] || null;
        } else if (
            host === "youtube.com" ||
            host.endsWith(".youtube.com")
        ) {
            const pathMatch =
                parsedUrl.pathname.match(
                    /^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/
                );

            if (pathMatch) {
                videoId = pathMatch[1];
            } else if (
                parsedUrl.pathname === "/watch" ||
                parsedUrl.pathname === "/watch/"
            ) {
                videoId =
                    parsedUrl.searchParams.get("v");
            }
        }

        if (
            typeof videoId === "string" &&
            /^[A-Za-z0-9_-]{11}$/.test(videoId)
        ) {
            return videoId;
        }
    } catch (error) {
        // Invalid or unsupported URL.
    }

    return null;
}

function isValidYouTubeUrl(url) {
    return extractYouTubeId(url) !== null;
}

function TurnstileReset() {
    const captchaContainer =
        document.getElementById("captchaContainer");

    if (
        window.turnstile &&
        turnstileWidgetId !== null
    ) {
        try {
            window.turnstile.remove(
                turnstileWidgetId
            );
        } catch (error) {
            // The widget may already have been removed.
        }
    }

    turnstileWidgetId = null;

    if (captchaContainer) {
        captchaContainer.innerHTML = "";
        captchaContainer.style.display = "none";

        captchaContainer.setAttribute(
            "data-captcha-rendered",
            "false"
        );
    }

    const button =
        document.getElementById("btnSubmit");

    if (button) {
        button.style.backgroundColor = "#ff0068";
        button.style.border = "2px solid #ff0068";
        button.style.cursor = "pointer";
        button.disabled = false;
    }
}

async function format(token) {
    const urlInput =
        document.getElementById("txtUrl");

    const url = urlInput
        ? urlInput.value.trim()
        : "";

    const csrfMeta = document.querySelector(
        'meta[name="csrf-token"]'
    );

    const csrfToken = csrfMeta
        ? csrfMeta.getAttribute("content")
        : "";

    const analyzer =
        document.getElementById("imgAnalyzer");

    if (analyzer) {
        analyzer.style.display = "block";
    }

    const errorContainer =
        document.getElementById("error");

    const errorMessage =
        document.getElementById("errorMessage");

    const videoCardContainer =
        document.getElementById("videoCard");

    /*
     * Validate again in case the user changed the input while
     * the Turnstile widget was displayed.
     */
    if (!url || !isValidYouTubeUrl(url)) {
        if (analyzer) {
            analyzer.style.display = "none";
        }

        if (errorMessage) {
            errorMessage.textContent =
                "Please paste a valid YouTube URL.";
        }

        if (errorContainer) {
            errorContainer.style.display = "block";
        }

        if (urlInput) {
            urlInput.focus();
        }

        TurnstileReset();
        return;
    }

    try {
        const dataResponse = await fetch(
            "/getdata",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "X-CSRF-TOKEN":
                        csrfToken,
                },

                body: JSON.stringify({
                    url: url,

                    "cf-turnstile-response":
                        token,
                }),
            }
        );

        if (!dataResponse.ok) {
            throw new Error(
                "HTTP " + dataResponse.status
            );
        }

        const result =
            await dataResponse.json();

        if (result.error) {
            if (analyzer) {
                analyzer.style.display = "none";
            }

            if (errorMessage) {
                errorMessage.textContent =
                    result.message ||
                    "An error occurred while fetching video data.";
            }

            if (errorContainer) {
                errorContainer.style.display =
                    "block";
            }

            TurnstileReset();
            return;
        }

        if (
            !result.data ||
            !result.data.id
        ) {
            throw new Error(
                "The server returned an invalid response."
            );
        }

        const encryptedId =
            result.data.id;

        const videoId =
            extractYouTubeId(url);

        const oembedUrl =
            "https://www.youtube.com/oembed?url=" +
            encodeURIComponent(
                videoId
                    ? "https://www.youtube.com/watch?v=" +
                          videoId
                    : url
            ) +
            "&format=json";

        const response =
            await fetch(oembedUrl);

        if (analyzer) {
            analyzer.style.display = "none";
        }

        if (!response.ok) {
            if (errorMessage) {
                errorMessage.textContent =
                    "This video is unavailable, private or does not exist.";
            }

            if (errorContainer) {
                errorContainer.style.display =
                    "block";
            }

            TurnstileReset();
            return;
        }

        const oembed =
            await response.json();

        const data = {
            id: encryptedId,
            title: oembed.title,
            channel: oembed.author_name,

            thumbnail:
                oembed.thumbnail_url ||
                (
                    videoId
                        ? "https://i.ytimg.com/vi/" +
                          videoId +
                          "/hqdefault.jpg"
                        : ""
                ),
        };

        const card =
            document.createElement("div");

        card.innerHTML = `
            <div class="card">
                <div>
                    <img
                        class="thumbnail-img"
                        src="${data.thumbnail}"
                        alt="${data.title}"
                    >
                </div>

                <div class="card-content">
                    <p>
                        <b>${data.title}</b>
                    </p>

                    <p>${data.channel}</p>

                    <p>
                        Audio Quality:
                        <b>128kbps</b>
                    </p>

                    <p>
                        Video Quality:
                        <b>360p</b>
                    </p>

                    <div class="button-group">
                        <a
                            href="javascript:void(0);"
                            onclick="handleDownload(this, '${data.id}', 'mp3')"
                        >
                            Convert MP3
                        </a>

                        <a
                            href="javascript:void(0);"
                            onclick="handleDownload(this, '${data.id}', 'mp4')"
                        >
                            Convert MP4
                        </a>
                    </div>
                </div>
            </div>

            <div
                class="pb-2 pb-lg-3 pb-md-3 pe-1 pe-md-3 ps-1 ps-md-3 pt-2 pt-lg-3 pt-md-3 row text-center"
                style="max-width:800px;margin:0 auto;"
            >
                <a
                    href="https://pnutdownloader.com/download/"
                    target="_blank"
                    rel="nofollow noopener"
                    class="text-white btn fs-5 fw-medium w-100"
                    role="button"
                    style="background-color:#ff0068;margin:0;font-weight:bold;border-radius:5px;"
                >
                    <span
                        class="glyphicon glyphicon-download-alt"
                    ></span>

                    Download with PNUT Downloader
                </a>
            </div>
        `;

        if (videoCardContainer) {
            videoCardContainer.appendChild(card);
        }

        TurnstileReset();
    } catch (error) {
        if (analyzer) {
            analyzer.style.display = "none";
        }

        if (errorMessage) {
            errorMessage.textContent =
                "An unexpected error occurred. Please try again.";
        }

        if (errorContainer) {
            errorContainer.style.display =
                "block";
        }

        console.error("Error:", error);
        TurnstileReset();
    }
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        "use strict";

        if (
            typeof window.jQuery ===
            "undefined"
        ) {
            console.error(
                "jQuery not loaded yet."
            );

            return;
        }

        (function ($) {
            const $modal =
                $("#downloadModal");

            const $statusWrapper =
                $("#dl-status-wrap");

            let downloadInProgress =
                false;

            if (
                $modal.length === 0 ||
                $statusWrapper.length === 0
            ) {
                return;
            }

            function showModal() {
                $statusWrapper.html(
                    '<button id="dl-status-btn" class="yb-btn yb-btn-primary" disabled>' +
                        '<span class="spinner" aria-hidden="true"></span>' +
                        '<span class="btn-text">Preparing your fileâ€¦</span>' +
                    "</button>"
                );

                $modal
                    .modal({
                        backdrop: true,
                        keyboard: true,
                    })
                    .modal("show");
            }

            function setElementBusy(
                element,
                busy
            ) {
                if (!element) {
                    return;
                }

                element.dataset.processing =
                    busy
                        ? "true"
                        : "false";

                element.style.pointerEvents =
                    busy
                        ? "none"
                        : "";

                if (busy) {
                    element.setAttribute(
                        "aria-disabled",
                        "true"
                    );
                } else {
                    element.removeAttribute(
                        "aria-disabled"
                    );
                }
            }

            window.handleDownload =
                function handleDownload(
                    element,
                    id,
                    format
                ) {
                    if (
                        downloadInProgress
                    ) {
                        return;
                    }

                    downloadInProgress =
                        true;

                    setElementBusy(
                        element,
                        true
                    );

                    showModal();

                    const csrfMeta =
                        document.querySelector(
                            'meta[name="csrf-token"]'
                        );

                    const csrfToken =
                        csrfMeta
                            ? csrfMeta.getAttribute(
                                  "content"
                              )
                            : "";

                    const MIN_WAIT_MS =
                        13000;

                    const startedAt =
                        Date.now();

                    let intervalId = null;
                    let finished = false;
                    let readyScheduled = false;
                    let requestInFlight = false;

                    function releaseDownloadLock() {
                        downloadInProgress =
                            false;

                        setElementBusy(
                            element,
                            false
                        );
                    }

                    function setReady(
                        downloadUrl
                    ) {
                        if (
                            finished ||
                            readyScheduled
                        ) {
                            return;
                        }

                        readyScheduled = true;

                        if (
                            intervalId !== null
                        ) {
                            clearInterval(
                                intervalId
                            );
                        }

                        const elapsed =
                            Date.now() -
                            startedAt;

                        const waitMore =
                            Math.max(
                                0,
                                MIN_WAIT_MS -
                                    elapsed
                            );

                        setTimeout(
                            function () {
                                if (finished) {
                                    return;
                                }

                                finished = true;

                                $statusWrapper.html(
                                    '<a id="dl-status-btn" class="yb-btn yb-btn-primary" ' +
                                        'href="' +
                                        downloadUrl +
                                        '" target="_blank" rel="nofollow noopener">' +
                                        "Download " +
                                        String(
                                            format ||
                                                ""
                                        ).toUpperCase() +
                                        '<span class="glyphicon glyphicon-new-window" style="margin:0;top:0"></span>' +
                                    "</a>"
                                );

                                releaseDownloadLock();
                            },
                            waitMore
                        );
                    }

                    async function attemptDownload() {
                        if (
                            finished ||
                            readyScheduled ||
                            requestInFlight
                        ) {
                            return;
                        }

                        requestInFlight = true;

                        try {
                            const response =
                                await fetch(
                                    "/getconvert",
                                    {
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json",

                                            "X-CSRF-TOKEN":
                                                csrfToken,
                                        },

                                        body:
                                            JSON.stringify(
                                                {
                                                    id:
                                                        id,

                                                    format:
                                                        format,
                                                }
                                            ),
                                    }
                                );

                            if (
                                !response.ok
                            ) {
                                throw new Error(
                                    "HTTP " +
                                        response.status
                                );
                            }

                            const result =
                                await response.json();

                            if (
                                result &&
                                result.progress ===
                                    100 &&
                                result.download
                            ) {
                                setReady(
                                    result.download
                                );
                            }
                        } catch (error) {
                            console.error(
                                "Download error:",
                                error
                            );

                            if (
                                intervalId !==
                                null
                            ) {
                                clearInterval(
                                    intervalId
                                );
                            }

                            if (!finished) {
                                finished = true;

                                $statusWrapper.html(
                                    '<button class="yb-btn yb-btn-primary" disabled>' +
                                        "Unexpected error. Please try again." +
                                    "</button>"
                                );

                                releaseDownloadLock();
                            }
                        } finally {
                            requestInFlight =
                                false;
                        }
                    }

                    intervalId =
                        setInterval(
                            attemptDownload,
                            5000
                        );

                    attemptDownload();
                };
        })(window.jQuery);
    }
);

document.addEventListener(
    "DOMContentLoaded",
    function () {
        const inputs =
            document.querySelectorAll(
                "input.deletable"
            );

        inputs.forEach(function (input) {
            if (
                input.dataset
                    .pasteClearInitialized ===
                "true"
            ) {
                return;
            }

            input.dataset
                .pasteClearInitialized =
                "true";

            const originalParent =
                input.parentNode;

            const wrapper =
                document.createElement(
                    "span"
                );

            wrapper.className =
                "deleteicon paste-clear-wrapper";

            const actionButton =
                document.createElement(
                    "button"
                );

            actionButton.type = "button";

            actionButton.className =
                "paste-clear-action";

            const pasteLabel =
                input.getAttribute(
                    "data-paste-label"
                ) || "Paste";

            const clearLabel =
                input.getAttribute(
                    "data-clear-label"
                ) || "Clear";

            function hasValue() {
                return (
                    input.value.trim()
                        .length > 0
                );
            }

            function dispatchInputEvents() {
                input.dispatchEvent(
                    new Event("input", {
                        bubbles: true,
                    })
                );

                input.dispatchEvent(
                    new Event("change", {
                        bubbles: true,
                    })
                );
            }

            function renderPasteButton() {
                actionButton.classList.remove(
                    "is-clear"
                );

                actionButton.setAttribute(
                    "aria-label",
                    pasteLabel
                );

                actionButton.setAttribute(
                    "title",
                    pasteLabel
                );

                actionButton.innerHTML = `
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d="M9 5h6m-5-2h4a1 1 0 0 1 1 1v2H9V4a1 1 0 0 1 1-1Z"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />

                        <path
                            d="M8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16"
                            stroke="currentColor"
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>

                    <span>${pasteLabel}</span>
                `;
            }

            function renderClearButton() {
                actionButton.classList.add(
                    "is-clear"
                );

                actionButton.setAttribute(
                    "aria-label",
                    clearLabel
                );

                actionButton.setAttribute(
                    "title",
                    clearLabel
                );

                actionButton.innerHTML = `
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <path
                            d="M7 7L17 17M17 7L7 17"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>

                    <span>${clearLabel}</span>
                `;
            }

            function updateActionButton() {
                if (hasValue()) {
                    renderClearButton();
                } else {
                    renderPasteButton();
                }
            }

            async function pasteFromClipboard() {
                input.focus();

                if (
                    !navigator.clipboard ||
                    typeof navigator.clipboard
                        .readText !==
                        "function"
                ) {
                    return;
                }

                try {
                    const clipboardText =
                        (
                            await navigator.clipboard.readText()
                        ).trim();

                    if (!clipboardText) {
                        return;
                    }

                    input.value =
                        clipboardText;

                    dispatchInputEvents();
                    updateActionButton();
                    input.focus();
                } catch (error) {
                    input.focus();
                }
            }

            function clearInput() {
                input.value = "";
                dispatchInputEvents();
                updateActionButton();
                input.focus();
            }

            actionButton.addEventListener(
                "click",
                function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (hasValue()) {
                        clearInput();
                    } else {
                        pasteFromClipboard();
                    }
                }
            );

            input.addEventListener(
                "input",
                updateActionButton
            );

            input.addEventListener(
                "change",
                updateActionButton
            );

            input.addEventListener(
                "paste",
                function () {
                    setTimeout(
                        updateActionButton,
                        0
                    );
                }
            );

            input.addEventListener(
                "cut",
                function () {
                    setTimeout(
                        updateActionButton,
                        0
                    );
                }
            );

            originalParent.insertBefore(
                wrapper,
                input
            );

            wrapper.appendChild(input);

            wrapper.appendChild(
                actionButton
            );

            updateActionButton();
        });

        window.addEventListener(
            "pageshow",
            function () {
                document
                    .querySelectorAll(
                        "input.deletable"
                    )
                    .forEach(
                        function (input) {
                            input.dispatchEvent(
                                new Event(
                                    "input",
                                    {
                                        bubbles:
                                            true,
                                    }
                                )
                            );
                        }
                    );
            }
        );
    }
);

document.addEventListener(
    "DOMContentLoaded",
    function () {
        function clickButton(buttonId) {
            const videoCardContainer =
                document.getElementById(
                    "videoCard"
                );

            const button =
                document.getElementById(
                    buttonId
                );

            if (videoCardContainer) {
                videoCardContainer.innerHTML =
                    "";
            }

            if (button) {
                button.click();
            }
        }

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlParam =
            params.get("url");

        const videoParam =
            params.get("v");

        const urlInput =
            document.getElementById(
                "txtUrl"
            );

        if (!urlInput) {
            return;
        }

        if (urlParam) {
            urlInput.value = urlParam;

            urlInput.dispatchEvent(
                new Event("input", {
                    bubbles: true,
                })
            );

            clickButton("btnSubmit");
            return;
        }

        if (videoParam) {
            urlInput.value =
                "https://www.youtube.com/watch?v=" +
                videoParam;

            urlInput.dispatchEvent(
                new Event("input", {
                    bubbles: true,
                })
            );

            clickButton("btnSubmit");
        }
    }
);
