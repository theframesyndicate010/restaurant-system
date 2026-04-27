const renderComponentLoadError = (hostElement) => {
    if (!hostElement) return;

    hostElement.textContent = "";
    const errorNode = document.createElement("div");
    errorNode.style.padding = "20px";
    errorNode.style.color = "#ef4444";
    errorNode.textContent = "Please run via a local server (like VS Code Live Server) to allow file loading.";
    hostElement.appendChild(errorNode);
};

const trimTrailingSlash = (value) => value.replace(/\/$/, "");

// Resolve component asset path from the currently executing script URL.
// This is resilient to different hosting roots (/, /frontend, /app/frontend, etc.).
const getComponentBasePath = () => {
    const currentScript = document.currentScript;
    if (currentScript?.src) {
        return trimTrailingSlash(new URL('.', currentScript.src).pathname);
    }

    const fallbackScript = Array.from(document.querySelectorAll('script[src]')).find((script) =>
        script.getAttribute('src')?.includes('/shared/components/component.js')
    );
    if (fallbackScript?.src) {
        return trimTrailingSlash(new URL('.', fallbackScript.src).pathname);
    }

    return '/frontend/shared/components';
};

const componentBasePath = getComponentBasePath();
const frontendBasePath = trimTrailingSlash(componentBasePath.replace(/\/shared\/components$/, "")) || "/frontend";
const resolveFrontendRoute = (route) => {
    const normalizedRoute = route.replace(/^\.?\/+/, "");
    return `${frontendBasePath}/${normalizedRoute}`.replace(/\/+/g, "/");
};

const normalizeTemplateRoutes = (rootElement) => {
    if (!rootElement) return;
    rootElement.querySelectorAll('[href]').forEach((el) => {
        const href = el.getAttribute('href');
        if (!href || href.startsWith('#') || /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) return;
        if (href.startsWith('/')) return;
        const normalized = href.replace(/^\.\.\/+/, '');
        if (normalized.endsWith('.html')) {
            el.setAttribute('href', resolveFrontendRoute(normalized));
        }
    });
};

class ListenableElement extends HTMLElement {
    constructor() {
        super();
        this._listeners = [];
    }

    _addListener(target, type, handler, options) {
        if (!target) return;
        target.addEventListener(type, handler, options);
        this._listeners.push(() => target.removeEventListener(type, handler, options));
    }

    _clearListeners() {
        this._listeners.forEach((cleanup) => cleanup());
        this._listeners = [];
    }

    disconnectedCallback() {
        this._clearListeners();
    }
}

class AppSidebar extends ListenableElement {

    async connectedCallback() {
        this._clearListeners();
        try {
            // Load the HTML strictly from the sidebar.html file
            const response = await fetch(`${componentBasePath}/sidebar.html`, { cache: 'no-store' });
            if(!response.ok) throw new Error("Failed to load");
            
            const html = await response.text();
            this.innerHTML = html;

            normalizeTemplateRoutes(this);

            const sidebar = this.querySelector('.sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (sidebar) {

                const isMobile = () => window.innerWidth <= 768;
                const isInteractiveSidebarState = () => {
                    return sidebar.classList.contains('expanded') || sidebar.classList.contains('mobile-open');
                };
                const collapseToggleSelector = '.sidebar-menu [data-bs-toggle="collapse"], .sidebar-menu [data-sidebar-toggle="collapse"]';

                const closeAllSubmenus = (exceptMenu = null) => {
                    const allSubmenus = sidebar.querySelectorAll('.sidebar-menu .dropdown-menu-container');
                    allSubmenus.forEach(menu => {
                        if (menu !== exceptMenu) {
                            menu.classList.remove('show');
                        }
                    });

                    const allToggles = sidebar.querySelectorAll(collapseToggleSelector);
                    allToggles.forEach(toggle => {
                        const targetId = toggle.getAttribute('href');
                        const targetMenu = targetId ? sidebar.querySelector(targetId) : null;
                        const isExpanded = targetMenu ? targetMenu.classList.contains('show') : false;
                        toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
                    });
                };

                // Close mobile sidebar
                const closeMobileSidebar = () => {
                    sidebar.classList.remove('mobile-open');
                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                };

                // Open mobile sidebar
                const openMobileSidebar = () => {
                    sidebar.classList.add('mobile-open');
                    if (overlay) {
                        overlay.classList.add('active');
                    }
                };

                // Overlay tap closes sidebar
                if (overlay) {
                    this._addListener(overlay, 'click', closeMobileSidebar);
                }

                // Close sidebar on swipe left (mobile)
                let touchStartX = 0;
                const touchStartOptions = { passive: true };
                const onTouchStart = (e) => {
                    touchStartX = e.touches[0].clientX;
                };
                const onTouchEnd = (e) => {
                    const diff = touchStartX - e.changedTouches[0].clientX;
                    if (diff > 60) closeMobileSidebar(); // swipe left
                };
                this._addListener(sidebar, 'touchstart', onTouchStart, touchStartOptions);
                this._addListener(sidebar, 'touchend', onTouchEnd, touchStartOptions);

                // Dynamically set active class based on current URL
                const currentPath = window.location.pathname.split('/').pop() || 'index.html';
                const navLinks = sidebar.querySelectorAll('.sidebar-menu .nav-link');
                const collapseToggles = sidebar.querySelectorAll(collapseToggleSelector);

                // Normalize to custom toggles so close/open behavior is always deterministic.
                collapseToggles.forEach(toggle => {
                    if (toggle.getAttribute('data-bs-toggle') === 'collapse') {
                        toggle.removeAttribute('data-bs-toggle');
                        toggle.setAttribute('data-sidebar-toggle', 'collapse');
                    }
                });
                
                // Clear existing active class
                sidebar.querySelectorAll('.nav-item.active').forEach(item => item.classList.remove('active'));
                
                // Find matching link and set it to active
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const hrefFile = href ? href.split('/').pop() : '';
                    if (href && href !== '#' && hrefFile && currentPath.includes(hrefFile)) {
                        link.closest('.nav-item').classList.add('active');
                        // If it's a dropdown toggle (like Billing), keep it expanded
                        if (link.matches(collapseToggleSelector)) {
                            const targetId = link.getAttribute('href');
                            const targetMenu = sidebar.querySelector(targetId);
                            if (targetMenu) {
                                targetMenu.classList.add('show');
                                link.setAttribute('aria-expanded', 'true');
                            }
                        }
                    } else if (currentPath === 'index.html' && (href === '#' || href === 'index.html') && link.querySelector('.fa-th-large')) {
                        // Default to dashboard specifically if on index
                        link.closest('.nav-item').classList.add('active');
                    }
                });
                
                // Also handle sub-menu links for active state (e.g. billing.html inside the billing submenu)
                const subLinks = sidebar.querySelectorAll('.custom-submenu a');
                subLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const hrefFile = href ? href.split('/').pop() : '';
                    if (href && hrefFile && currentPath.includes(hrefFile)) {
                        // Mark the parent nav-item as active too
                        const parentNavItem = link.closest('.nav-item');
                        if (parentNavItem) {
                            parentNavItem.classList.add('active');
                            const toggleBtn = parentNavItem.querySelector(collapseToggleSelector);
                            const subMenu = parentNavItem.querySelector('.collapse');
                            if (toggleBtn && subMenu) {
                                toggleBtn.setAttribute('aria-expanded', 'true');
                                subMenu.classList.add('show');
                            }
                        }
                        // Optionally highlight the submenu item itself
                        link.style.background = 'rgba(255,255,255,0.1)';
                        link.style.color = '#fff';
                        link.style.opacity = '1';
                    }
                });

                collapseToggles.forEach(toggle => {
                    const targetId = toggle.getAttribute('href');
                    if (!targetId || !targetId.startsWith('#')) return;

                    const targetMenu = sidebar.querySelector(targetId);
                    if (!targetMenu) return;

                    this._addListener(toggle, 'click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        const collapsedDesktop = !isMobile() && !isInteractiveSidebarState();
                        if (collapsedDesktop) return;

                        const isNestedToggle = Boolean(toggle.closest('.custom-submenu'));
                        const willOpen = !targetMenu.classList.contains('show');

                        if (!isNestedToggle) {
                            closeAllSubmenus(willOpen ? targetMenu : null);
                        }

                        targetMenu.classList.toggle('show', willOpen);
                        toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                    });
                });

                this._addListener(document, 'click', (e) => {
                    if (!isInteractiveSidebarState()) return;
                    if (!sidebar.contains(e.target)) {
                        closeAllSubmenus();
                    }
                });

                this._addListener(document, 'keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeAllSubmenus();
                    }
                });

                // Listen for custom event triggered by the header toggle button
                this._addListener(document, 'toggleSidebarStatus', () => {
                    if (isMobile()) {
                        // Mobile: toggle drawer open/close
                        if (sidebar.classList.contains('mobile-open')) {
                            closeMobileSidebar();
                        } else {
                            openMobileSidebar();
                        }
                    } else {
                        // Desktop: toggle sidebar expand/collapse by button only
                        sidebar.classList.toggle('expanded');
                        if (!sidebar.classList.contains('expanded')) {
                            closeAllSubmenus();
                        }
                    }
                });

                // On resize, clean up state
                this._addListener(window, 'resize', () => {
                    if (!isMobile()) {
                        closeMobileSidebar();
                    } else {
                        sidebar.classList.remove('expanded');
                    }
                });
            }
        } catch (error) {
            console.error(error);
            renderComponentLoadError(this);
        }
    }
}

// Define the custom element
customElements.define('app-sidebar', AppSidebar);

class AppHeader extends ListenableElement {

    async connectedCallback() {
        this._clearListeners();
        try {
            const response = await fetch(`${componentBasePath}/header.html`);
            if(!response.ok) throw new Error("Failed to load");
            
            const html = await response.text();
            this.innerHTML = html;

            normalizeTemplateRoutes(this);

            // Attach event listener to header toggle button
            const headerToggleBtn = this.querySelector('#headerToggleBtn');
            if(headerToggleBtn) {
                this._addListener(headerToggleBtn, 'click', () => {
                    // Dispatch a custom event that the sidebar listens to
                    document.dispatchEvent(new CustomEvent('toggleSidebarStatus'));
                });
            }

            const headerTabs = this.querySelectorAll('.header-tabs .nav-tab');
            const currentPath = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();

            const setActiveHeaderTab = (activeTab) => {
                headerTabs.forEach(tab => {
                    if (tab === activeTab) {
                        tab.classList.add('active-tab');
                    } else {
                        tab.classList.remove('active-tab');
                    }
                });
            };

            let matchedTab = null;
            headerTabs.forEach(tab => {
                const href = (tab.getAttribute('href') || '').toLowerCase();
                const hrefFile = href ? href.split('/').pop() : '';
                if (href && href !== '#' && hrefFile && currentPath === hrefFile) {
                    matchedTab = tab;
                }
            });

            if (matchedTab) {
                setActiveHeaderTab(matchedTab);
            } else {
                headerTabs.forEach(tab => tab.classList.remove('active-tab'));
            }

            headerTabs.forEach(tab => {
                this._addListener(tab, 'click', () => {
                    setActiveHeaderTab(tab);
                });
            });

            // Profile Popup Toggle Logic
            const profileTrigger = this.querySelector('#profileTrigger');
            const profilePopup = this.querySelector('#profilePopup');

            if (profileTrigger && profilePopup) {
                // Toggle popup on image click
                this._addListener(profileTrigger, 'click', (e) => {
                    e.stopPropagation();
                    profilePopup.classList.toggle('show');
                });

                // Close popup when clicking outside
                this._addListener(document, 'click', (e) => {
                    // We check if the click target is outside the profile wrapper
                    if (!profilePopup.contains(e.target) && e.target !== profileTrigger) {
                        profilePopup.classList.remove('show');
                    }
                });
            }
        } catch (error) {
            console.error(error);
            renderComponentLoadError(this);
        }
    }
}

// Define the custom element
customElements.define('app-header', AppHeader);

class AppDatatable extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch(`${componentBasePath}/datatable.html`);
            if(!response.ok) throw new Error("Failed to load");
            
            const html = await response.text();
            
            // Extract templates and append to body if they don't exist
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const templates = tempDiv.querySelectorAll('template');
            
            templates.forEach(tpl => {
                if (!document.getElementById(tpl.id)) {
                    document.body.appendChild(tpl);
                }
            });

            document.dispatchEvent(new CustomEvent('datatableLoaded'));
        } catch (error) {
            console.error(error);
        }
    }
}

// Define the custom element
customElements.define('app-datatable', AppDatatable);
