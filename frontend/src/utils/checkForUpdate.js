let currentVersion = null;

export async function checkForUpdate() {
  try {
    const response = await fetch('/index.html', {
      method: 'GET',
      cache: 'no-store'
    });

    const text = await response.text();
    const version = text.match(/<meta name="build-version" content="(.+?)"/);

    if (!version) return;

    const newVersion = version[1];

    if (currentVersion === null) {
      currentVersion = newVersion;
      return;
    }

    if (currentVersion !== newVersion) {
      console.log("Nova versão detectada. Atualizando...");
      window.location.reload(true);
    }
  } catch (err) {
    console.warn("Erro ao verificar atualização:", err);
  }
}
