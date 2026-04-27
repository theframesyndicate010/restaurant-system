document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "staff_role_master_list";

    const form = document.getElementById("addRoleForm");
    const resetButton = document.getElementById("addRoleResetBtn");
    const alertBox = document.getElementById("addRoleAlert");
    const roleNameInput = document.getElementById("roleName");

    const statusInputs = Array.from(document.querySelectorAll('input[name="roleStatus"]'));
    const moduleChecks = Array.from(document.querySelectorAll(".permission-module-check"));
    const actionChecks = Array.from(document.querySelectorAll(".permission-action-check"));
    const toggleButtons = Array.from(document.querySelectorAll(".permission-toggle-btn"));

    if (!form || !resetButton || !alertBox || !roleNameInput || !statusInputs.length || !moduleChecks.length) {
        return;
    }

    const normalizeText = (value, fallback = "") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const parseStoredRoles = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    const getNextRoleId = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.roleId ? item.roleId : "").match(/ROL-(\d+)/i);
            if (!match) return maxValue;

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) return maxValue;

            return Math.max(maxValue, current);
        }, 1000);

        return "ROL-" + String(maxNo + 1);
    };

    const showAlert = (type, message) => {
        alertBox.classList.remove("d-none", "alert-success", "alert-danger", "alert-warning");

        const klass = type === "success" ? "alert-success" : type === "warning" ? "alert-warning" : "alert-danger";
        alertBox.classList.add(klass);
        alertBox.textContent = message;
    };

    const hideAlert = () => {
        alertBox.classList.add("d-none");
        alertBox.textContent = "";
        alertBox.classList.remove("alert-success", "alert-danger", "alert-warning");
    };

    const setPanelOpen = (button, shouldOpen) => {
        const targetId = button.getAttribute("data-target") || "";
        const panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) {
            return;
        }

        button.classList.toggle("is-open", shouldOpen);
        button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
        panel.classList.toggle("is-open", shouldOpen);
    };

    const updateModuleActionState = () => {
        moduleChecks.forEach((moduleCheck) => {
            const module = moduleCheck.value;
            const isEnabled = moduleCheck.checked;

            actionChecks
                .filter((actionCheck) => actionCheck.dataset.module === module)
                .forEach((actionCheck) => {
                    actionCheck.disabled = !isEnabled;
                    if (!isEnabled) {
                        actionCheck.checked = false;
                    }
                });
        });
    };

    const getSelectedStatus = () => {
        const selected = statusInputs.find((input) => input.checked);
        return selected ? selected.value : "";
    };

    const collectPermissions = () => {
        const selectedModules = moduleChecks.filter((check) => check.checked);

        return selectedModules.map((moduleCheck) => {
            const moduleKey = moduleCheck.value;
            const moduleTitleNode = moduleCheck.closest(".permission-module-label")?.querySelector(".permission-module-title");
            const moduleTitle = normalizeText(moduleTitleNode ? moduleTitleNode.textContent : moduleKey, moduleKey);

            const selectedActions = actionChecks
                .filter((check) => check.dataset.module === moduleKey && check.checked)
                .map((check) => check.value);

            return {
                key: moduleKey,
                module: moduleTitle,
                actions: selectedActions.length ? selectedActions : ["view"]
            };
        });
    };

    const validateForm = () => {
        const roleName = normalizeText(roleNameInput.value);
        const status = getSelectedStatus();
        const permissions = collectPermissions();

        if (!roleName) {
            showAlert("warning", "Please enter role name.");
            return null;
        }

        if (!status) {
            showAlert("warning", "Please select role status.");
            return null;
        }

        if (!permissions.length) {
            showAlert("warning", "Please select at least one permission module.");
            return null;
        }

        return {
            roleName,
            status,
            permissions
        };
    };

    toggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const currentlyOpen = button.classList.contains("is-open");
            setPanelOpen(button, !currentlyOpen);
        });
    });

    moduleChecks.forEach((moduleCheck) => {
        moduleCheck.addEventListener("change", () => {
            updateModuleActionState();

            const row = moduleCheck.closest(".permission-item");
            const toggleButton = row ? row.querySelector(".permission-toggle-btn") : null;
            if (toggleButton && moduleCheck.checked) {
                setPanelOpen(toggleButton, true);
            }
        });
    });

    updateModuleActionState();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideAlert();

        const values = validateForm();
        if (!values) {
            return;
        }

        const roles = parseStoredRoles();
        const duplicate = roles.some((item) => {
            const existingName = normalizeText(item && item.name ? item.name : "").toLowerCase();
            return existingName === values.roleName.toLowerCase();
        });

        if (duplicate) {
            showAlert("warning", "Role name already exists.");
            return;
        }

        roles.push({
            roleId: getNextRoleId(roles),
            name: values.roleName,
            status: values.status,
            permissions: values.permissions,
            createdAt: new Date().toISOString()
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
            showAlert("success", "Role saved successfully. Redirecting to Roles list...");
            setTimeout(() => {
                window.location.href = "roles.html";
            }, 800);
        } catch (error) {
            showAlert("danger", "Unable to save role in browser storage.");
        }
    });

    resetButton.addEventListener("click", () => {
        hideAlert();
        setTimeout(() => {
            toggleButtons.forEach((button) => {
                setPanelOpen(button, false);
            });
            updateModuleActionState();
        }, 0);
    });
});