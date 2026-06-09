// src/scripts/validation.js

var Validation = {
  /**
   * Valida os dados do formulário antes de enviar.
   * @param {{nome: string, telefone: string, presenca: string|null, presenteId: string|null}} data
   * @returns {{valid: boolean, errors: Object.<string, string>}}
   */
  validateForm: function (data) {
    var errors = {};

    if (!data.nome || data.nome.trim().length < 2) {
      errors.nome = 'Informe seu nome completo.';
    }

    var digitsPhone = (data.telefone || '').replace(/\D/g, '');
    if (digitsPhone.length < 10 || digitsPhone.length > 11) {
      errors.telefone = 'Informe um WhatsApp válido com DDD.';
    }

    if (!data.presenca) {
      errors.presenca = 'Informe se você vai comparecer.';
    }

    if (data.presenca === 'sim' && !data.presenteId) {
      errors.presente = 'Escolha um presente para reservar.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors
    };
  },

  /**
   * Aplica máscara brasileira de telefone ao campo:
   * (XX) XXXX-XXXX  ou  (XX) XXXXX-XXXX
   * @param {HTMLInputElement} input
   */
  applyPhoneMask: function (input) {
    input.addEventListener('input', function () {
      var digits = input.value.replace(/\D/g, '').slice(0, 11);
      var formatted = '';

      if (digits.length === 0) {
        formatted = '';
      } else if (digits.length <= 2) {
        formatted = '(' + digits;
      } else if (digits.length <= 6) {
        formatted = '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
      } else if (digits.length <= 10) {
        formatted = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 6) + '-' + digits.slice(6);
      } else {
        formatted = '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
      }

      input.value = formatted;
    });
  }
};
