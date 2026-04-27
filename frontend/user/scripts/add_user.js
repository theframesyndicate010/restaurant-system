document.addEventListener("DOMContentLoaded", () => {
    const USER_STORAGE_KEY = "staff_user_master_list";
    const ROLE_STORAGE_KEY = "staff_role_master_list";

    const form = document.getElementById("addUserForm");
    const resetButton = document.getElementById("addUserResetBtn");
    const alertBox = document.getElementById("addUserAlert");

    const fullNameInput = document.getElementById("userFullName");
    const primaryAddressInput = document.getElementById("userPrimaryAddress");
    const secondaryAddressInput = document.getElementById("userSecondaryAddress");
    const primaryContactInput = document.getElementById("userPrimaryContact");
    const secondaryContactInput = document.getElementById("userSecondaryContact");
    const emailInput = document.getElementById("userEmailAddress");
    const usernameInput = document.getElementById("userUsername");
    const passwordInput = document.getElementById("userPassword");
    const confirmPasswordInput = document.getElementById("userConfirmPassword");
    const imageInput = document.getElementById("userImage");
    const imageHint = document.getElementById("userImageHint");
    const roleOptionsContainer = document.getElementById("userRoleOptions");

    if (!form || !resetButton || !alertBox || !fullNameInput || !primaryAddressInput || !secondaryAddressInput ||
        !primaryContactInput || !secondaryContactInput || !emailInput || !usernameInput || !passwordInput ||
        !confirmPasswordInput || !imageInput || !imageHint || !roleOptionsContainer) {
        return;
    }

    const normalizeText = (value, fallback = "") => {
        const text = String(value || "").trim();
        return text || fallback;
    };

    const normalizePhone = (value) => {
        return String(value || "").replace(/[^\d+\-\s()]/g, "").trim();
    };

    const parseStoredList = (storageKey) => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    };

    const getNextUserId = (records) => {
        const maxNo = records.reduce((maxValue, item) => {
            const match = String(item && item.userId ? item.userId : "").match(/USR-(\d+)/i);
            if (!match) {
                return maxValue;
            }

            const current = parseInt(match[1], 10);
            if (!Number.isFinite(current)) {
                return maxValue;
            }

            return Math.max(maxValue, current);
        }, 1000);

        return "USR-" + String(maxNo + 1);
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

    const getRoleNames = () => {
        const roleRows = parseStoredList(ROLE_STORAGE_KEY);
        const activeRoleNames = roleRows
            .filter((item) => String(item && item.status ? item.status : "enabled").toLowerCase() !== "disabled")
            .map((item) => normalizeText(item && item.name ? item.name : ""))
            .filter(Boolean);

        const uniqueRoleNames = [];
        activeRoleNames.forEach((name) => {
            if (!uniqueRoleNames.some((row) => row.toLowerCase() === name.toLowerCase())) {
                uniqueRoleNames.push(name);
            }
        });

        if (!uniqueRoleNames.length) {
            return ["Admin", "Cashier"];
        }

        return uniqueRoleNames;
    };

    const renderRoleOptions = (roleNames) => {
        roleOptionsContainer.innerHTML = "";

        roleNames.forEach((roleName, index) => {
            const label = document.createElement("label");
            label.className = "add-user-role-option";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "userRole";
            input.value = roleName;
            input.required = true;
            input.checked = index === 0;

            const textNode = document.createElement("span");
            textNode.textContent = roleName;

            label.appendChild(input);
            label.appendChild(textNode);
            roleOptionsContainer.appendChild(label);
        });
    };

    const getSelectedRole = () => {
        const selected = roleOptionsContainer.querySelector('input[name="userRole"]:checked');
        return selected ? normalizeText(selected.value) : "";
    };

    const validateForm = (existingUsers) => {
        const fullName = normalizeText(fullNameInput.value);
        const primaryAddress = normalizeText(primaryAddressInput.value);
        const secondaryAddress = normalizeText(secondaryAddressInput.value);
        const primaryContact = normalizePhone(primaryContactInput.value);
        const secondaryContact = normalizePhone(secondaryContactInput.value);
        const email = normalizeText(emailInput.value);
        const username = normalizeText(usernameInput.value);
        const password = String(passwordInput.value || "");
        const confirmPassword = String(confirmPasswordInput.value || "");
        const role = getSelectedRole();
        const imageFile = imageInput.files && imageInput.files.length ? imageInput.files[0] : null;

        if (!fullName || !primaryAddress || !primaryContact || !email || !username || !password || !confirmPassword || !role) {
            showAlert("warning", "Please fill all mandatory fields marked with *.");
            return null;
        }

        if (primaryContact.replace(/\D/g, "").length < 7) {
            showAlert("warning", "Primary Contact looks invalid.");
            return null;
        }

        if (secondaryContact && secondaryContact.replace(/\D/g, "").length < 7) {
            showAlert("warning", "Secondary Contact looks invalid.");
            return null;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert("warning", "Please enter a valid email address.");
            return null;
        }

        if (password.length < 6) {
            showAlert("warning", "Password must be at least 6 characters.");
            return null;
        }

        if (password !== confirmPassword) {
            showAlert("warning", "Password and Confirm Password do not match.");
            return null;
        }

        const duplicateUsername = existingUsers.some((item) => {
            const existingUsername = normalizeText(item && item.username ? item.username : "").toLowerCase();
            return existingUsername === username.toLowerCase();
        });

        if (duplicateUsername) {
            showAlert("warning", "Username already exists.");
            return null;
        }

        return {
            fullName,
            primaryAddress,
            secondaryAddress,
            primaryContact,
            secondaryContact,
            email,
            username,
            password,
            role,
            imageName: imageFile ? imageFile.name : ""
        };
    };

    renderRoleOptions(getRoleNames());

    imageInput.addEventListener("change", () => {
        const fileName = imageInput.files && imageInput.files.length ? imageInput.files[0].name : "";
        imageHint.textContent = fileName || "No file chosen";
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        hideAlert();

        const users = parseStoredList(USER_STORAGE_KEY);
        const values = validateForm(users);
        if (!values) {
            return;
        }

        users.push({
            userId: getNextUserId(users),
            fullName: values.fullName,
            address1: values.primaryAddress,
            address2: values.secondaryAddress,
            contact: values.primaryContact,
            secondaryContact: values.secondaryContact,
            email: values.email,
            createdDate: new Date().toISOString().slice(0, 10),
            username: values.username,
            role: values.role,
            imageName: values.imageName,
            password: values.password,
            status: "enabled"
        });

        try {
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
            showAlert("success", "User saved successfully. Redirecting to Users list...");
            setTimeout(() => {
                window.location.href = "users.html";
            }, 800);
        } catch (error) {
            showAlert("danger", "Unable to save user in browser storage.");
        }
    });

    resetButton.addEventListener("click", () => {
        hideAlert();

        setTimeout(() => {
            imageHint.textContent = "No file chosen";
            const firstRole = roleOptionsContainer.querySelector('input[name="userRole"]');
            if (firstRole) {
                firstRole.checked = true;
            }
        }, 0);
    });
});
