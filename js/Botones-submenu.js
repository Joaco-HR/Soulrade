document.querySelectorAll('.boton-submenus').forEach(function(button) {
    var targetEl = document.querySelector(button.getAttribute('data-bs-target'));
    if (!targetEl) return;
    targetEl.addEventListener('show.bs.collapse', function() {
        var icon = button.querySelector('svg');
        if (icon) icon.style.transform = 'rotate(90deg)';
    });
    targetEl.addEventListener('hide.bs.collapse', function() {
        var icon = button.querySelector('svg');
        if (icon) icon.style.transform = 'rotate(0deg)';
    });
});
document.querySelectorAll('.mobile-seccion-btn').forEach(function(button) {
    var targetEl = document.querySelector(button.getAttribute('data-bs-target'));
    if (!targetEl) return;
    targetEl.addEventListener('show.bs.collapse', function() {
        var icon = button.querySelector('.mobile-chevron');
        if (icon) icon.style.transform = 'rotate(90deg)';
    });
    targetEl.addEventListener('hide.bs.collapse', function() {
        var icon = button.querySelector('.mobile-chevron');
        if (icon) icon.style.transform = 'rotate(0deg)';
    });
});
document.querySelectorAll('.mobile-submenu').forEach(function(sub) {
    sub.addEventListener('show.bs.collapse', function() {
        document.querySelectorAll('.mobile-submenu.show').forEach(function(otroSub) {
            if (otroSub !== sub) {
                var btn = document.querySelector('[data-bs-target="#' + otroSub.id + '"]');
                if (btn) {
                    var icon = btn.querySelector('.mobile-chevron');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                }
                bootstrap.Collapse.getOrCreateInstance(otroSub).hide();
            }
        });
    });
});
document.addEventListener('mousedown', function(e) {
    var menuWrapper = document.querySelector('li.menu');
    if (menuWrapper && !menuWrapper.contains(e.target)) {
        ['submenuGeneros', 'submenuArtistas', 'menuPrincipal'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(el).hide();
            }
        });
    }
    document.querySelectorAll('.funcional-dropdown.show').forEach(function(drop) {
        var parent = drop.closest('.funcional-item');
        if (parent && !parent.contains(e.target)) {
            bootstrap.Collapse.getOrCreateInstance(drop).hide();
        }
    });
});
document.querySelectorAll('.funcional-dropdown, .mobile-funcion-drop').forEach(function(drop) {
    drop.addEventListener('show.bs.collapse', function() {
        document.querySelectorAll('.funcional-dropdown.show, .mobile-funcion-drop.show').forEach(function(otroDrop) {
            if (otroDrop !== drop) {
                bootstrap.Collapse.getOrCreateInstance(otroDrop).hide();
            }
        });
    });
});
document.querySelectorAll('#menuPrincipal .submenu').forEach(function(sub) {
    sub.addEventListener('show.bs.collapse', function() {
        document.querySelectorAll('#menuPrincipal .submenu.show').forEach(function(otroSub) {
            if (otroSub !== sub) {
                bootstrap.Collapse.getOrCreateInstance(otroSub).hide();
            }
        });
    });
});