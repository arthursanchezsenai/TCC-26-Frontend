const placeholders = [...document.querySelectorAll('[data-component]')];

async function loadComponents() {
  await Promise.all(placeholders.map(async (placeholder) => {
    const name = placeholder.dataset.component;
const placeholders = [
    ...document.querySelectorAll('[data-component]')
];

async function loadComponents() {
    await Promise.all(
        placeholders.map(async (placeholder) => {
            const name = placeholder.dataset.component;

            const url = new URL(
                `../html/${name}.html`,
                import.meta.url
            );

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Não foi possível carregar: ${name}.html`
                );
            }

            placeholder.outerHTML = await response.text();
        })
    );

    await import('./script.js');
}

loadComponents().catch((error) => {
    console.error('Erro ao carregar componentes:', error);
    document.body.classList.add('component-load-error');
});
    if (!response.ok) throw new Error(`Não foi possível carregar o componente ${name}`);
    placeholder.outerHTML = await response.text();
  }));

  await import('./script.js');
}

loadComponents().catch((error) => {
  console.error(error);
  document.body.classList.add('component-load-error');
});
