// DEPRECATED
module.exports = () => {
  const faviconFrames = [
    '/images/favicon/0.gif',
    '/images/favicon/1.gif',
    '/images/favicon/2.gif',
    '/images/favicon/3.gif',
    '/images/favicon/4.gif',
    '/images/favicon/5.gif',
    '/images/favicon/6.gif',
    '/images/favicon/7.gif',
  ];
  let faviconFrameCursor = 0;
  const head = document.querySelector('head');
  let faviconTag = document.querySelector('link[rel="icon"]');

  // preload images
  const imagesLoaders = [];
  for (let i = 0; i < faviconFrames.length; i++) {
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = faviconFrames[i];
    });

    imagesLoaders.push(promise);
  }

  Promise.all(imagesLoaders)
    .then(() => {
      setInterval(function() {
        // remove previous tag
        faviconTag.remove();

        // create new tag
        faviconTag = document.createElement('link');
        faviconTag.setAttribute('rel', 'icon');
        faviconTag.setAttribute('type', 'image/gif');
        faviconTag.setAttribute('href', faviconFrames[faviconFrameCursor]);

        // add new tag
        head.appendChild(faviconTag);

        // cycle
        faviconFrameCursor = (faviconFrameCursor + 1) % faviconFrames.length;
      }, 800);
    })
    .catch(() => {
      console.log('Failed to load some favicon frames... using the default one');
    });

}