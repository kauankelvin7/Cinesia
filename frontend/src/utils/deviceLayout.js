// Detecta se é um celular (mobile) ou tablet/desktop
export function setDeviceLayoutClass() {
  const isMobile =
    /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
    window.innerWidth < 768;

  if (isMobile) {
    document.body.classList.add('mobile-layout');
    document.body.classList.remove('desktop-layout');
  } else {
    document.body.classList.add('desktop-layout');
    document.body.classList.remove('mobile-layout');
  }
}

// Chama na inicialização e no resize
window.addEventListener('resize', setDeviceLayoutClass);
setDeviceLayoutClass();
