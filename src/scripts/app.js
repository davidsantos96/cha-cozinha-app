// src/scripts/app.js
// ─────────────────────────────────────────────────────────────────────────────
// ✏️  Edite as informações abaixo com os dados reais do evento.
// ─────────────────────────────────────────────────────────────────────────────
var EVENT = {
  title:    'Chá de Cozinha Juliane E Lucas',
  //host:     'de Juliane e Lucas',
  date:     '11 de Julho de 2026',
  location: 'Mangô',
  message:  'Gostaríamos muito da sua presença neste momento especial. ' +
            'Confirme sua presença e, se quiser, escolha um presente para nos ' +
            'ajudar a montar nossa nova cozinha.'
};
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

  // ── Preencher dados do evento ──────────────────────────────────────────────
  document.getElementById('event-title').textContent    = EVENT.title;
  //document.getElementById('event-host').textContent     = EVENT.host;
  document.getElementById('event-date').textContent     = EVENT.date;
  document.getElementById('event-location').textContent = EVENT.location;
  document.getElementById('event-message').textContent  = EVENT.message;

  // ── Referências DOM ────────────────────────────────────────────────────────
  var form           = document.getElementById('confirmation-form');
  var nomeInput      = document.getElementById('nome');
  var telefoneInput  = document.getElementById('telefone');
  var btnSim         = document.getElementById('btn-sim');
  var btnNao         = document.getElementById('btn-nao');
  var giftField      = document.getElementById('gift-field');
  var giftSelect     = document.getElementById('presente');
  var submitBtn      = document.getElementById('submit-btn');
  var submitText     = document.getElementById('submit-text');
  var submitSpinner  = document.getElementById('submit-spinner');
  var giftCounter    = document.getElementById('gift-counter');
  var giftCountEl    = document.getElementById('gift-count');
  var formSection    = document.getElementById('form-section');
  var successSection = document.getElementById('success-section');
  var successMsg     = document.getElementById('success-message');
  var errorBanner    = document.getElementById('error-banner');

  var selectedPresenca = null;

  // ── Máscara de telefone ────────────────────────────────────────────────────
  Validation.applyPhoneMask(telefoneInput);

  // ── Carregar presentes ao abrir a página ──────────────────────────────────
  loadGifts();

  function loadGifts() {
    Api.fetchGifts()
      .then(function (data) {
        console.log('[loadGifts] resposta da API:', data);
        if (data.ok && Array.isArray(data.presentes)) {
          populateGiftSelect(data.presentes);
        } else {
          console.warn('[loadGifts] API retornou ok=false ou presentes inválido:', data);
        }
      })
      .catch(function (err) {
        console.error('[loadGifts] erro ao buscar presentes:', err);
      });
  }

  function populateGiftSelect(presentes) {
    // Remover opções anteriores (mantém a primeira — placeholder)
    while (giftSelect.options.length > 1) {
      giftSelect.remove(1);
    }

    presentes.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = String(p.id);
      opt.textContent = p.categoria
        ? p.nome + ' (' + p.categoria + ')'
        : p.nome;
      giftSelect.appendChild(opt);
    });

    giftCountEl.textContent = presentes.length;
    giftCounter.style.display = presentes.length > 0 ? 'block' : 'none';
  }

  // ── Toggle de presença ─────────────────────────────────────────────────────
  [btnSim, btnNao].forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedPresenca = btn.dataset.value;

      btnSim.classList.toggle('active', selectedPresenca === 'sim');
      btnNao.classList.toggle('active', selectedPresenca === 'nao');
      clearError('presenca');

      if (selectedPresenca === 'sim') {
        giftField.style.display = 'block';
      } else {
        giftField.style.display = 'none';
        giftSelect.value = '';
        clearError('presente');
      }
    });
  });

  // ── Limpar erros inline ao digitar ────────────────────────────────────────
  nomeInput.addEventListener('input',   function () { clearError('nome'); });
  telefoneInput.addEventListener('input', function () { clearError('telefone'); });
  giftSelect.addEventListener('change', function () { clearError('presente'); });

  // ── Submit ─────────────────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
      nome:       nomeInput.value.trim(),
      telefone:   telefoneInput.value.trim(),
      presenca:   selectedPresenca,
      presenteId: giftSelect.value || null
    };

    var result = Validation.validateForm(data);

    if (!result.valid) {
      displayErrors(result.errors);
      return;
    }

    setLoading(true);
    clearAllErrors();

    Api.submitConfirmation(data)
      .then(function (res) {
        if (res.ok) {
          showSuccess(data.presenca);
          return;
        }

        if (res.error === 'already_taken') {
          showBannerError(
            'Este presente acabou de ser escolhido por outra pessoa. ' +
            'Por favor, selecione outro item da lista.'
          );
          giftSelect.value = '';
          loadGifts(); // Recarregar lista atualizada
        } else {
          showBannerError(
            'Não foi possível enviar sua confirmação. Tente novamente em instantes.'
          );
        }

        setLoading(false);
      })
      .catch(function () {
        showBannerError(
          'Não foi possível enviar sua confirmação. ' +
          'Verifique sua conexão e tente novamente.'
        );
        setLoading(false);
      });
  });

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setLoading(loading) {
    submitBtn.disabled           = loading;
    submitText.style.display     = loading ? 'none'         : 'inline';
    submitSpinner.style.display  = loading ? 'inline-block' : 'none';
  }

  function showSuccess(presenca) {
    formSection.style.display    = 'none';
    successSection.style.display = 'block';

    successMsg.textContent = presenca === 'sim'
      ? 'Sua presença foi confirmada. Mal podemos esperar para te ver!'
      : 'Obrigado por nos avisar. Sentiremos sua falta!';
  }

  function displayErrors(errors) {
    Object.keys(errors).forEach(function (field) {
      var errorEl = document.getElementById('error-' + field);
      if (errorEl) errorEl.textContent = errors[field];

      var inputId = field === 'presente' ? 'presente' : field;
      var inputEl = document.getElementById(inputId);
      if (inputEl) inputEl.classList.add('error');
    });

    // Rolar suavemente até o primeiro campo com erro
    var firstError = form.querySelector('.field-input.error, .field-select.error, .toggle-btn.active + .toggle-btn');
    if (!firstError) firstError = form.querySelector('.field-error:not(:empty)');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearError(field) {
    var errorEl = document.getElementById('error-' + field);
    if (errorEl) errorEl.textContent = '';

    var inputId = field === 'presente' ? 'presente' : field;
    var inputEl = document.getElementById(inputId);
    if (inputEl) inputEl.classList.remove('error');
  }

  function clearAllErrors() {
    ['nome', 'telefone', 'presenca', 'presente'].forEach(clearError);
    hideBannerError();
  }

  function showBannerError(msg) {
    errorBanner.textContent = msg;
    errorBanner.classList.add('visible');
  }

  function hideBannerError() {
    errorBanner.textContent = '';
    errorBanner.classList.remove('visible');
  }

});
