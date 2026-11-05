const placeholders = [...document.querySelectorAll('[data-component]')];

async function loadComponents() {
  await Promise.all(placeholders.map(async (placeholder) => {
    const name = placeholder.dataset.component;
    const response = await fetch(`/front/html/${name}.html`);
    if (!response.ok) throw new Error(`Não foi possível carregar o componente ${name}`);
    placeholder.outerHTML = await response.text();
  }));

  await import('./script.js');
}

loadComponents().catch((error) => {
  console.error(error);
  document.body.classList.add('component-load-error');
});
