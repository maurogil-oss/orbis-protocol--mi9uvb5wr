/**
 * Orbis Protocol - Eco-Seal Web Widget
 * Script público e leve para embutir selos ecológicos de DPP em e-commerces e catálogos de CDV
 * Formato do snippet:
 * <div class="orbis-eco-seal" data-seal="PR-SEAL-2026-991823" data-co2="41.33kg">🌱 Peça Circular: -41.33kg CO₂e</div>
 * <script src="https://sua-url/orbis-cdv-embed.js" async></script>
 */
;(function () {
  function initOrbisEcoSeals() {
    var elements = document.querySelectorAll('.orbis-eco-seal:not([data-orbis-rendered])')
    if (!elements || elements.length === 0) return

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i]
      el.setAttribute('data-orbis-rendered', 'true')
      var seal = el.getAttribute('data-seal') || ''
      var co2 = el.getAttribute('data-co2') || ''

      // Estilização institucional do widget
      el.style.display = 'inline-flex'
      el.style.alignItems = 'center'
      el.style.gap = '8px'
      el.style.padding = '6px 12px'
      el.style.borderRadius = '9999px'
      el.style.backgroundColor = '#111820'
      el.style.border = '1px solid rgba(18, 184, 134, 0.4)'
      el.style.color = '#F4F7FA'
      el.style.fontFamily = 'system-ui, -apple-system, sans-serif'
      el.style.fontSize = '12px'
      el.style.fontWeight = '600'
      el.style.textDecoration = 'none'
      el.style.boxShadow = '0 0 12px rgba(18, 184, 134, 0.2)'
      el.style.cursor = 'pointer'
      el.style.transition = 'all 0.2s ease'

      var co2Text = co2 ? ' -' + co2.replace(/^-/, '') : ''
      el.innerHTML =
        '<span style="color:#12B886;font-size:14px;">🌱</span>' +
        '<span>Peça Circular dMRV' +
        (co2Text ? ': <strong style="color:#12B886;">' + co2Text + ' CO₂e</strong>' : '') +
        '</span>' +
        '<span style="font-family:monospace;font-size:10px;color:#D9B36C;background:#16202B;padding:2px 6px;border-radius:4px;border:1px solid rgba(217,179,108,0.3);">' +
        seal +
        '</span>'

      ;(function (currentSeal) {
        el.addEventListener('click', function () {
          var targetUrl = window.location.origin + '/passaporte/' + encodeURIComponent(currentSeal)
          window.open(targetUrl, '_blank')
        })
        el.addEventListener('mouseenter', function () {
          el.style.transform = 'scale(1.02)'
          el.style.borderColor = '#12B886'
        })
        el.addEventListener('mouseleave', function () {
          el.style.transform = 'scale(1)'
          el.style.borderColor = 'rgba(18, 184, 134, 0.4)'
        })
      })(seal)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrbisEcoSeals)
  } else {
    initOrbisEcoSeals()
  }
})()
