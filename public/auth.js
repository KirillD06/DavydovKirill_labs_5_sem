document.querySelectorAll('form[data-auth]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const error = document.querySelector('[data-auth-error]');
    error.hidden = true;
    button.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: form.method,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form)),
      });
      if (!response.ok) {
        const result = await response.json();
        error.textContent = Array.isArray(result.message)
          ? result.message.join('. ')
          : result.message || 'Не удалось выполнить запрос. Попробуйте ещё раз.';
        error.hidden = false;
        return;
      }
      window.location.assign('/soil_types');
    } catch {
      error.textContent = 'Не удалось связаться с сервером. Попробуйте ещё раз.';
      error.hidden = false;
    } finally {
      button.disabled = false;
    }
  });
});
