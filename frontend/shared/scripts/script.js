/* ================================================
   GLOBAL JAVASCRIPT
   Shared behavior used across the entire POS dashboard context.
   ================================================ */

(() => {
    let autoToolbarCounter = 0;

    const pageTitleText = () => {
        const title = (document.title || "Smart Cafeteria")
            .replace(/\s*-\s*Smart Cafeteria\s*$/i, "")
            .trim();
        return title || "Smart Cafeteria";
    };

    const findScrollableContainer = (mainContent) => {
        if (!mainContent) return null;
        return (
            mainContent.querySelector(":scope > .container-fluid.overflow-auto") ||
            mainContent.querySelector(":scope > .dashboard-scroll") ||
            mainContent.querySelector(":scope > .container-fluid")
        );
    };

    const getTopLevelChild = (container, node) => {
        if (!container || !node) return null;
        let current = node;
        while (current && current.parentElement !== container) {
            current = current.parentElement;
        }
        return current;
    };

    const createAutoHeaderCard = (hasDataTable) => {
        const card = document.createElement("div");
        card.className = "card page-header-card auto-generated-header-card";

        const body = document.createElement("div");
        body.className = "card-body d-flex flex-column gap-1";

        const title = document.createElement("h4");
        title.className = "page-header-title";
        title.textContent = pageTitleText();

        const subtitle = document.createElement("p");
        subtitle.className = "page-header-subtitle";
        subtitle.textContent = hasDataTable
            ? "Use the function tools below to search, filter, and manage records."
            : "Use the function tools below to perform page actions and manage content.";

        body.appendChild(title);
        body.appendChild(subtitle);
        card.appendChild(body);
        return card;
    };

    const createRefreshButton = () => {
        const refreshButton = document.createElement("button");
        refreshButton.type = "button";
        refreshButton.className = "btn auto-toolbar-refresh";
        refreshButton.title = "Refresh";

        const icon = document.createElement("i");
        icon.className = "fa-solid fa-rotate-right";
        refreshButton.appendChild(icon);
        return refreshButton;
    };

    const createLengthSelect = () => {
        const select = document.createElement("select");
        select.className = "form-select filter-dropdown auto-toolbar-length";

        [10, 25, 50, 100].forEach((value) => {
            const option = document.createElement("option");
            option.value = String(value);
            option.textContent = String(value);
            if (value === 50) option.selected = true;
            select.appendChild(option);
        });

        return select;
    };

    const createAutoToolbarCard = (container) => {
        const hasDataTable = Boolean(container.querySelector(".datatable-init"));

        const card = document.createElement("div");
        card.className = "card filter-toolbar-card auto-function-toolbar-card";

        const cardBody = document.createElement("div");
        cardBody.className = "card-body";

        const layout = document.createElement("div");
        layout.className = "d-flex flex-column flex-lg-row gap-3 align-items-stretch align-items-lg-center";

        const helperText = document.createElement("div");
        helperText.className = "auto-toolbar-note";
        helperText.textContent = hasDataTable
            ? "Functions: quick search, page size, and refresh."
            : "Functions: quick page actions and workflow helpers.";

        const controls = document.createElement("div");
        controls.className = "d-flex flex-wrap align-items-center gap-2 ms-lg-auto auto-toolbar-controls";

        if (hasDataTable) {
            const toolbarId = "auto-toolbar-" + (++autoToolbarCounter);
            const table = container.querySelector(".datatable-init");

            if (table && !table.id) {
                table.id = "auto-toolbar-table-" + autoToolbarCounter;
            }

            card.dataset.toolbarType = "table";
            card.dataset.toolbarId = toolbarId;
            card.dataset.targetTableId = table ? table.id : "";

            const searchInput = document.createElement("input");
            searchInput.type = "search";
            searchInput.className = "form-control filter-search-input auto-toolbar-search";
            searchInput.placeholder = "Search";
            searchInput.setAttribute("aria-label", "Search records");

            const pageLength = createLengthSelect();
            const refreshButton = createRefreshButton();

            controls.appendChild(searchInput);
            controls.appendChild(pageLength);
            controls.appendChild(refreshButton);
        } else {
            card.dataset.toolbarType = "general";

            const resetButton = document.createElement("button");
            resetButton.type = "button";
            resetButton.className = "btn auto-toolbar-button";
            resetButton.textContent = "Reset";
            resetButton.setAttribute("data-action", "reset");

            const refreshButton = createRefreshButton();
            refreshButton.classList.add("auto-toolbar-button");

            controls.appendChild(resetButton);
            controls.appendChild(refreshButton);
        }

        layout.appendChild(helperText);
        layout.appendChild(controls);
        cardBody.appendChild(layout);
        card.appendChild(cardBody);

        return card;
    };

    const ensureThreeContainerLayout = () => {
        const mainContentList = document.querySelectorAll(".main-content");

        mainContentList.forEach((mainContent) => {
            const scrollContainer = findScrollableContainer(mainContent);
            if (!scrollContainer) return;

            const hasDataTable = Boolean(scrollContainer.querySelector(".datatable-init"));
            const hasHeaderCard = Boolean(scrollContainer.querySelector(".page-header-card"));
            const hasToolbarCard = Boolean(scrollContainer.querySelector(".filter-toolbar-card"));
            const contentCard = scrollContainer.querySelector(".content-card");

            if (!contentCard) return;

            if (!hasHeaderCard) {
                const autoHeader = createAutoHeaderCard(hasDataTable);
                scrollContainer.insertBefore(autoHeader, scrollContainer.firstChild);
            }

            if (!hasToolbarCard) {
                const toolbar = createAutoToolbarCard(scrollContainer);
                const contentAnchor = getTopLevelChild(scrollContainer, contentCard) || contentCard;
                if (contentAnchor && contentAnchor.parentElement === scrollContainer) {
                    scrollContainer.insertBefore(toolbar, contentAnchor);
                } else {
                    scrollContainer.appendChild(toolbar);
                }
            }
        });
    };

    const tryBindAutoDataTableToolbar = (toolbarCard) => {
        if (!toolbarCard || toolbarCard.dataset.bound === "true") return true;
        if (toolbarCard.dataset.toolbarType !== "table") return true;

        const tableId = toolbarCard.dataset.targetTableId;
        const tableElement = tableId ? document.getElementById(tableId) : null;

        if (!tableElement || !window.jQuery || !jQuery.fn || !jQuery.fn.DataTable) {
            return false;
        }

        if (!jQuery.fn.DataTable.isDataTable(tableElement)) {
            return false;
        }

        const tableApi = jQuery(tableElement).DataTable();
        const searchInput = toolbarCard.querySelector(".auto-toolbar-search");
        const pageLength = toolbarCard.querySelector(".auto-toolbar-length");
        const refreshButton = toolbarCard.querySelector(".auto-toolbar-refresh");

        if (pageLength) {
            const currentLength = tableApi.page.len();
            const hasCurrentOption = Array.from(pageLength.options).some((opt) => parseInt(opt.value, 10) === currentLength);
            if (hasCurrentOption) {
                pageLength.value = String(currentLength);
            }
        }

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                tableApi.search(searchInput.value).draw();
            });
        }

        if (pageLength) {
            pageLength.addEventListener("change", () => {
                const selectedLength = parseInt(pageLength.value, 10);
                if (Number.isFinite(selectedLength)) {
                    tableApi.page.len(selectedLength).draw();
                }
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener("click", () => {
                if (searchInput) {
                    searchInput.value = "";
                }

                tableApi.search("");

                if (pageLength) {
                    const defaultOption = Array.from(pageLength.options).find((opt) => opt.value === "50");
                    if (defaultOption) {
                        pageLength.value = "50";
                        tableApi.page.len(50);
                    }
                }

                tableApi.draw();
            });
        }

        toolbarCard.dataset.bound = "true";
        return true;
    };

    const bindAutoDataTableToolbars = () => {
        const toolbars = document.querySelectorAll(".auto-function-toolbar-card[data-toolbar-type='table']");

        toolbars.forEach((toolbarCard) => {
            const maxAttempts = 50;
            let attempts = 0;

            const bindWithRetry = () => {
                const done = tryBindAutoDataTableToolbar(toolbarCard);
                if (done) return;

                attempts += 1;
                if (attempts < maxAttempts) {
                    setTimeout(bindWithRetry, 120);
                }
            };

            bindWithRetry();
        });
    };

    const bindGeneralToolbars = () => {
        const toolbars = document.querySelectorAll(".auto-function-toolbar-card[data-toolbar-type='general']");

        toolbars.forEach((toolbarCard) => {
            if (toolbarCard.dataset.bound === "true") return;

            const resetButton = toolbarCard.querySelector("[data-action='reset']");
            const refreshButton = toolbarCard.querySelector(".auto-toolbar-refresh");

            if (resetButton) {
                resetButton.addEventListener("click", () => {
                    const sectionRoot = toolbarCard.closest(".container-fluid, .dashboard-scroll") || document;
                    const form = sectionRoot.querySelector("form");

                    if (form) {
                        form.reset();
                    } else {
                        window.location.reload();
                    }
                });
            }

            if (refreshButton) {
                refreshButton.addEventListener("click", () => {
                    window.location.reload();
                });
            }

            toolbarCard.dataset.bound = "true";
        });
    };

    const runGlobalLayoutPass = () => {
        ensureThreeContainerLayout();
        bindGeneralToolbars();
        bindAutoDataTableToolbars();
    };

    document.addEventListener("DOMContentLoaded", runGlobalLayoutPass);
    document.addEventListener("datatableLoaded", runGlobalLayoutPass);
})();
