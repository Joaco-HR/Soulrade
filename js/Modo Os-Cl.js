var html = document.documentElement;

function getSvgs(btn) {
    return {
        luna: btn.querySelector('.modo-oscuro'),
        sol: btn.querySelector('.modo-claro')
    };
}

function aplicarTema(tema, animar) {
    html.setAttribute('data-theme', tema);
    localStorage.setItem('tema', tema);

    [document.getElementById('themeToggle'), document.getElementById('themeToggleMobile')].forEach(function(btn) {
        if (!btn) return;
        var ic = getSvgs(btn);
        var saliente = tema === 'light' ? ic.luna : ic.sol;
        var entrante = tema === 'light' ? ic.sol : ic.luna;

        if (animar) {
            saliente.style.transition = 'transform 0.4s ease, opacity 0.3s ease';
            saliente.style.transform = 'rotate(360deg)';
            saliente.style.opacity = '0';
            setTimeout(function() {
                saliente.style.display = 'none';
                saliente.style.transform = 'rotate(0deg)';
                entrante.style.display = 'block';
                entrante.style.transition = 'none';
                entrante.style.transform = 'rotate(-360deg)';
                entrante.style.opacity = '0';
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        entrante.style.transition = 'transform 0.4s ease, opacity 0.3s ease';
                        entrante.style.transform = 'rotate(0deg)';
                        entrante.style.opacity = '1';
                    });
                });
            }, 400);
        } else {
            ic.luna.removeAttribute('style');
            ic.sol.removeAttribute('style');
            if (tema === 'light') {
                ic.luna.style.display = 'none';
                ic.sol.style.display = 'block';
            } else {
                ic.luna.style.display = 'block';
                ic.sol.style.display = 'none';
            }
        }
    });
}

['themeToggle', 'themeToggleMobile'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function() {
        aplicarTema(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
});

var temaGuardado = localStorage.getItem('tema');
if (temaGuardado) aplicarTema(temaGuardado, false);