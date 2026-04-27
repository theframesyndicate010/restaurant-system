/* ================================================
   data_table.js
   Reusable DataTables initialization with advanced features
   ================================================ */

document.addEventListener('datatableLoaded', function () {

    const getTpl = (id) => document.getElementById(id) ? document.getElementById(id).innerHTML : '';
    const dtDomLayout = 'rt' + String.fromCharCode(60) + '"dt-bottom-bar"ip' + String.fromCharCode(62);
    const initializedTables = [];

    const adjustAllTables = () => {
        initializedTables.forEach((dt) => dt.columns.adjust().draw(false));
    };

    const debounce = (fn, wait = 120) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), wait);
        };
    };

    const ensureTableScrollScope = (api) => {
        const tableNode = $(api.table().node());
        if (!tableNode.parent().hasClass('dt-table-scroll')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'dt-table-scroll';
            tableNode.wrap(wrapper);
        }
    };

    // ============================================
    // 1. INITIALIZE ALL DATATABLES
    // ============================================
    $('.datatable-init').each(function () {
        if ($.fn.DataTable.isDataTable(this)) return;

        const tableElement = $(this);
        const skipFirstColumnWidth = tableElement.hasClass('dt-no-first-col-width');
        const skipColumnMenu = tableElement.hasClass('dt-no-col-menu');
        const columnDefinitions = [];

        if (!skipFirstColumnWidth) {
            columnDefinitions.push({
                targets: 0,
                width: '60px'
            });
        }

        columnDefinitions.push({
            targets: -1,
            orderable: false,
            searchable: false,
            responsivePriority: 1
        });

        const dtInstance = tableElement.DataTable({
            // --- Pagination ---
            paging: true,
            pageLength: 6,
            lengthMenu: [6, 12, 18, 50, 100],

            // --- Search ---
            searching: true,

            // --- Sorting ---
            ordering: true,
            order: [[0, 'asc']],

            // --- Info ---
            info: true,

            // --- Styling ---
            autoWidth: false,

            // --- State Saving ---
            stateSave: true,
            stateDuration: 60 * 60 * 24 * 7,

            // --- Responsive (Set to false to allow horizontal scrolling) ---
            responsive: false,

            // --- Export Buttons ---
            dom: dtDomLayout,

            // --- Language Customization ---
            language: {
                search: getTpl('dt-search-icon'),
                searchPlaceholder: "Search...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ entries",
                infoEmpty: "No entries available",
                infoFiltered: "(filtered from _MAX_ total)",
                zeroRecords: getTpl('dt-zero-records'),
                emptyTable: getTpl('dt-empty-table'),
                paginate: {
                    first: getTpl('dt-paginate-first'),
                    last: getTpl('dt-paginate-last'),
                    next: getTpl('dt-paginate-next'),
                    previous: getTpl('dt-paginate-prev')
                }
            },

            // --- Column Definitions ---
            columnDefs: columnDefinitions,

            // --- Callbacks ---
            drawCallback: function () {
                tableElement.find('tbody tr').each(function (index) {
                    $(this).css({ 'opacity': '0', 'transform': 'translateY(8px)' });
                    $(this).delay(index * 40).animate(
                        { opacity: 1 },
                        {
                            duration: 300,
                            step: function (now) {
                                $(this).css('transform', 'translateY(' + (8 - 8 * now) + 'px)');
                            }
                        }
                    );
                });
            },

            initComplete: function () {
                const api = this.api();

                ensureTableScrollScope(api);

                // Build column header dropdown menus after init
                if (!skipColumnMenu) {
                    buildColumnMenus(api);
                }

                // Recalculate after wrapping table to avoid width jitter.
                setTimeout(() => api.columns.adjust().draw(false), 0);
            }
        });

        initializedTables.push(dtInstance);

        // ROW HIGHLIGHT ON CLICK
        tableElement.find('tbody').on('click', 'tr', function (event) {
            if ($(event.target).closest('.action-btn').length) return;
            $(this).toggleClass('dt-row-selected');
        });
    });


    // ============================================
    // 2. COLUMN HEADER DROPDOWN MENUS
    // ============================================
    function buildColumnMenus(api) {
        api.columns().every(function (colIndex) {
            const column = this;
            const header = $(column.header());

            const colDefs = api.settings()[0].aoColumns[colIndex];
            if (!colDefs.bSortable && !colDefs.bSearchable) return;

            const headerText = header.text().trim();

            header.html('');
            const headerContentElement = document.createElement('div');
            headerContentElement.className = 'col-header-content';

            const headerTextElement = document.createElement('span');
            headerTextElement.className = 'col-header-text';
            headerTextElement.textContent = headerText;
            headerContentElement.appendChild(headerTextElement);

            const menuBtnElement = document.createElement('button');
            menuBtnElement.className = 'col-menu-btn';
            menuBtnElement.title = 'Column options';

            const menuIconElement = document.createElement('i');
            menuIconElement.className = 'fa-solid fa-ellipsis-vertical';
            menuBtnElement.appendChild(menuIconElement);

            const headerContent = $(headerContentElement);
            const menuBtn = $(menuBtnElement);
            headerContent.append(menuBtn);
            header.append(headerContent);

            let menuHtml = getTpl('dt-menu-template');
            if (menuHtml) {
                menuHtml = menuHtml.replace(/{colIndex}/g, colIndex).replace(/{headerText}/g, headerText);
            }
            const menu = $(menuHtml);
            $('body').append(menu);

            menuBtn.on('click', function (e) {
                e.stopPropagation();
                e.preventDefault();
                $('.col-header-menu.open').not(menu).removeClass('open');
                const btnRect = menuBtn[0].getBoundingClientRect();
                menu.css({
                    top: btnRect.bottom + 6 + 'px',
                    left: Math.min(btnRect.left, window.innerWidth - 260) + 'px'
                });
                menu.toggleClass('open');
                updateSortChecks(api, menu, colIndex);
            });

            menu.on('click', function (e) { e.stopPropagation(); });

            const searchInput = menu.find('.col-menu-search');
            const filterType = menu.find('.col-menu-filter-type');

            searchInput.on('keyup change', function () {
                applyColumnFilter(column, searchInput.val(), filterType.val());
            });

            filterType.on('change', function () {
                applyColumnFilter(column, searchInput.val(), filterType.val());
            });

            menu.find('.col-menu-sort-asc').on('click', function () {
                api.order([colIndex, 'asc']).draw();
                updateSortChecks(api, menu, colIndex);
            });

            menu.find('.col-menu-sort-desc').on('click', function () {
                api.order([colIndex, 'desc']).draw();
                updateSortChecks(api, menu, colIndex);
            });

            menu.find('.col-menu-clear-sort').on('click', function () {
                api.order([0, 'asc']).draw();
                updateSortChecks(api, menu, colIndex);
            });
        });

        $(document).on('click', function () {
            $('.col-header-menu.open').removeClass('open');
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape') {
                $('.col-header-menu.open').removeClass('open');
            }
        });
    }

    function applyColumnFilter(column, value, type) {
        if (!value) {
            column.search('').draw();
            return;
        }

        let regex = false;
        let smart = false;
        let searchVal = value;

        switch (type) {
            case 'exact':
                searchVal = '^' + escapeRegex(value) + '$';
                regex = true;
                break;
            case 'startsWith':
                searchVal = '^' + escapeRegex(value);
                regex = true;
                break;
            case 'endsWith':
                searchVal = escapeRegex(value) + '$';
                regex = true;
                break;
            case 'contains':
            default:
                regex = false;
                smart = true;
                break;
        }

        column.search(searchVal, regex, smart).draw();
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function updateSortChecks(api, menu, colIndex) {
        const currentOrder = api.order();
        const ascBtn = menu.find('.col-menu-sort-asc');
        const descBtn = menu.find('.col-menu-sort-desc');

        ascBtn.removeClass('active');
        descBtn.removeClass('active');

        if (currentOrder.length > 0 && currentOrder[0][0] === colIndex) {
            if (currentOrder[0][1] === 'asc') {
                ascBtn.addClass('active');
            } else {
                descBtn.addClass('active');
            }
        }
    }

    // KEYBOARD SHORTCUT (Ctrl+F)
    $(document).on('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            const visibleTable = $('.datatable-init:visible').first();
            if (visibleTable.length) {
                e.preventDefault();
                visibleTable.closest('.dataTables_wrapper').find('.dataTables_filter input').focus().select();
            }
        }
    });

    const debouncedAdjust = debounce(adjustAllTables);
    window.addEventListener('resize', debouncedAdjust);

    document.addEventListener('toggleSidebarStatus', function () {
        // Match sidebar transition timing before re-measuring table widths.
        setTimeout(adjustAllTables, 380);
    });

});
