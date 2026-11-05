const placeholders = document.querySelectorAll('[data-component]');

async function loadComponents() {
    for (const placeholder of placeholders) {
        const name = placeholder.dataset.component;

        const componentUrl = new URL(
            `../html/${name}.html`,
            import.meta.url
        );

        console.log('Carregando componente:', componentUrl.href);

        const response = await fetch(componentUrl);

        if (!response.ok) {
            throw new Error(
                `Erro ${response.status} ao carregar ${name}.html`
            );
        }

        placeholder.outerHTML = await response.text();
    }

    console.log('Todos os componentes foram carregados.');

    await import('./script.js');
}

loadComponents().catch(error => {
    console.error('FALHA AO INICIAR O SITE:', error);

    document.body.insertAdjacentHTML(
        'afterbegin',
        `<pre style="color:red;background:white;padding:20px">
            ${error.message}
        </pre>`
    );
});
