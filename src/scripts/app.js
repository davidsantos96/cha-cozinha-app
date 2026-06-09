// src/scripts/app.js
// ─────────────────────────────────────────────────────────────────────────────
// ✏️  Edite as informações abaixo com os dados reais do evento.
// ─────────────────────────────────────────────────────────────────────────────
var EVENT = {
  title:    'Chá de Cozinha Juliane E Lucas',
  //host:     'de Juliane e Lucas',
  date:     '11 de Julho de 2026: 14h',
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
  var form             = document.getElementById('confirmation-form');
  var nomeInput        = document.getElementById('nome');
  var telefoneInput    = document.getElementById('telefone');
  var btnSim           = document.getElementById('btn-sim');
  var btnNao           = document.getElementById('btn-nao');
  var giftField        = document.getElementById('gift-field');
  var giftSelect       = document.getElementById('presente');       // trigger button
  var presenteHidden   = document.getElementById('presente-hidden');
  var presenteText     = document.getElementById('presente-text');
  var presenteList     = document.getElementById('presente-list');
  var presenteDropdown = document.getElementById('presente-dropdown');
  var submitBtn        = document.getElementById('submit-btn');
  var submitText       = document.getElementById('submit-text');
  var submitSpinner    = document.getElementById('submit-spinner');
  var giftCounter      = document.getElementById('gift-counter');
  var giftCountEl      = document.getElementById('gift-count');
  var formSection      = document.getElementById('form-section');
  var successSection   = document.getElementById('success-section');
  var successIcon      = document.getElementById('success-icon');
  var successMsg       = document.getElementById('success-message');
  var successNome      = document.getElementById('success-nome');
  var successPresente  = document.getElementById('success-presente');
  var successGiftRow   = document.getElementById('success-gift-row');
  var errorBanner      = document.getElementById('error-banner');

  var selectedPresenca = null;

  // ── Máscara de telefone ────────────────────────────────────────────────────
  Validation.applyPhoneMask(telefoneInput);

  // ── Custom dropdown de presentes ──────────────────────────────────────────
  giftSelect.addEventListener('click', function () {
    presenteDropdown.classList.contains('open') ? closeDropdown() : openDropdown();
  });

  document.addEventListener('click', function (e) {
    if (!presenteDropdown.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDropdown();
  });

  function openDropdown() {
    presenteDropdown.classList.add('open');
    giftSelect.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    presenteDropdown.classList.remove('open');
    giftSelect.setAttribute('aria-expanded', 'false');
  }

  function chooseOption(value, label) {
    presenteHidden.value = value;
    presenteText.textContent = label;
    presenteText.classList.remove('placeholder');
    Array.from(presenteList.children).forEach(function (li) {
      li.classList.toggle('selected', li.dataset.value === value);
    });
    closeDropdown();
  }

  function resetGiftSelect() {
    presenteHidden.value = '';
    presenteText.textContent = 'Selecione um presente...';
    presenteText.classList.add('placeholder');
    Array.from(presenteList.children).forEach(function (li) {
      li.classList.remove('selected');
    });
    closeDropdown();
  }

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
    presenteList.innerHTML = '';
    resetGiftSelect();

    presentes.forEach(function (p) {
      var li = document.createElement('li');
      li.className = 'custom-select__option';
      li.setAttribute('role', 'option');
      li.dataset.value = String(p.id);
      li.textContent = p.categoria ? p.nome + ' (' + p.categoria + ')' : p.nome;
      li.addEventListener('click', function () {
        chooseOption(li.dataset.value, li.textContent);
        clearError('presente');
      });
      presenteList.appendChild(li);
    });

    giftCountEl.textContent = presentes.length;
    giftCounter.style.display = presentes.length > 0 ? 'block' : 'none';
  }

  // ── Toggle de presença ─────────────────────────────────────────────────────
  btnSim.addEventListener('click', function () {
    selectedPresenca = 'sim';
    btnSim.classList.add('active');
    btnNao.classList.remove('active');
    clearError('presenca');
    giftField.style.display = 'block';
  });

  btnNao.addEventListener('click', function () {
    selectedPresenca = 'nao';
    btnNao.classList.add('active');
    btnSim.classList.remove('active');
    clearError('presenca');
    giftField.style.display = 'none';
    resetGiftSelect();
    clearError('presente');
    submitForm();
  });

  // ── Limpar erros inline ao digitar ────────────────────────────────────────
  nomeInput.addEventListener('input',   function () { clearError('nome'); });
  telefoneInput.addEventListener('input', function () { clearError('telefone'); });

  // ── Submit ─────────────────────────────────────────────────────────────────
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitForm();
  });

  function submitForm() {
    var data = {
      nome:       nomeInput.value.trim(),
      telefone:   telefoneInput.value.trim(),
      presenca:   selectedPresenca,
      presenteId: presenteHidden.value || null
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
          var gifLabel = presenteText.classList.contains('placeholder') ? null : presenteText.textContent;
          showSuccess(data.presenca, data.nome, gifLabel);
          return;
        }

        if (res.error === 'already_confirmed') {
          showBannerError(
            'Este número de WhatsApp já possui uma confirmação registrada.'
          );
        } else if (res.error === 'already_taken') {
          showBannerError(
            'Este presente acabou de ser escolhido por outra pessoa. ' +
            'Por favor, selecione outro item da lista.'
          );
          resetGiftSelect();
          loadGifts();
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
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function setLoading(loading) {
    submitBtn.disabled           = loading;
    submitText.style.display     = loading ? 'none'         : 'inline';
    submitSpinner.style.display  = loading ? 'inline-block' : 'none';
  }

  function showSuccess(presenca, nome, presenteNome) {
    formSection.style.display    = 'none';
    successSection.style.display = 'block';

    if (presenca === 'sim') {
      successIcon.textContent = '✓';
      successIcon.classList.remove('sad');
    } else {
      successIcon.textContent = '😢';
      successIcon.classList.add('sad');
    }

    successMsg.textContent = presenca === 'sim'
      ? 'Sua presença foi confirmada. Mal podemos esperar para te ver!'
      : 'Obrigado por nos avisar. Sentiremos sua falta!';

    successNome.textContent = nome;

    if (presenteNome) {
      successPresente.textContent    = presenteNome;
      successGiftRow.style.display   = '';
    } else {
      successGiftRow.style.display   = 'none';
    }
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
    var firstError = form.querySelector('.field-input.error, .custom-select__trigger.error, .toggle-btn.active + .toggle-btn');
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
