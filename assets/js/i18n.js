/* ═══════════════════════════════════════════════════════════════
   i18n.js
   English ↔ Catalan translation toggle.

   HOW IT WORKS
   ─────────────
   Elements with a data-i18n="key" attribute have their textContent
   (or innerHTML for keys ending in _html) replaced when the language
   changes. The current language is saved in localStorage so it persists
   across page refreshes and navigation.

   TO ADD A NEW STRING
   ────────────────────
   1. Add  data-i18n="my.key"  to the HTML element.
   2. Add the key to both TRANSLATIONS.en and TRANSLATIONS.ca below.
   3. For HTML content use  data-i18n="my.key_html"  and put the key
      under the _html sub-object — it will use innerHTML instead.

   ADDING A NEW PAGE
   ──────────────────
   The router re-applies translations after each page load automatically
   via the MutationObserver at the bottom of this file.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const STORAGE_KEY = 'tfg_lang';
  const DEFAULT     = 'en';

  // ── Translations ──────────────────────────────────────────────────────────
  const T = {
    en: {
      // ── Nav ─────────────────────────────────────────────────
      'nav.overview':  'Overview',
      'nav.dataset':   'Dataset',
      'nav.demo':      'Demo',
      'nav.about':     'About',

      // ── Home ────────────────────────────────────────────────
      'home.eyebrow':       'Final Degree Project · Universitat Pompeu Fabra · 2026',
      'home.subtitle':      'From Dataset Construction to Representation Learning, Classification, and Subclass Clustering',
      'home.download':      'Download Report',
      'home.tryDemo':       'Try the Demo',
      'home.scrollHint':    'Scroll to explore',
      'home.s1.label':      '01 · Background',
      'home.s1.title':      'Meteoroids, Meteorites, & Meteors',
      'home.glance.label':  'Project at a glance',
      'home.glance.domain': 'Computer Vision & Deep Learning',
      'home.glance.method': 'Contrastive SSL',
      'home.glance.tasks':  'Classification + Clustering',
      'home.glance.source': 'SPMN · Folgueroles',
      'home.s2.label':      '02 · Problem Statement',
      'home.s2.title':      'A Classification Problem Without Labels',
      'home.s3.label':      '03 · Objectives',
      'home.s3.title':      'What This Project Aims to Achieve',
      'home.s4.label':      '04 · Key Results',
      'home.s4.title':      'Findings',
      'home.results.note':  'Specific results explained in the full report.',

      // ── Dataset ─────────────────────────────────────────────
      'data.label':        'Dataset',
      'data.title':        'The Data Behind the Model',
      'data.intro':        'A core contribution of this project is the construction of a curated, balanced dataset of meteor and non-meteor events — recorded at the SPMN station in Folgueroles, Barcelona.',
      'data.s1.label':     '01 · Origins',
      'data.s1.title':     'Where the Data Comes From',
      'data.s2.label':     '02 · Processing Pipeline',
      'data.s2.title':     'From Raw Video to Training Sample',
      'data.s3.label':     '03 · Access & Citation',
      'data.s3.title':     'Download & Cite',
      'data.download':     'Download',

      // ── Demo ────────────────────────────────────────────────
      'demo.label':        'Interactive Demo',
      'demo.title':        'Explore the Models',
      'demo.tabs.predict': 'Prediction',
      'demo.tabs.cluster': 'Cluster Explorer',
      'predict.label':     'Classification Model',
      'predict.title':     'Meteor vs. Non-meteor',
      'predict.desc':      'Upload one or more recording pairs (.avi + matching .xml), or bundle them all into a single .zip file.',
      'predict.step1':     'Pair each .avi with its .xml — filenames must match',
      'predict.step2':     'Drop pairs here, or zip them and upload the archive',
      'predict.step3':     'View cropped images with predictions, then download results',
      'predict.drop':      'Drop files or a .zip here',
      'predict.browse':    'browse to upload',
      'predict.hint':      '.avi + .xml pairs · .zip archive · Max 200 MB',
      'predict.connecting':'Connecting to server…',
      'predict.processing':'Processing recordings… (this may take a minute)',
      'predict.csvBtn':    'CSV',
      'predict.imgsBtn':   'Images',
      'predict.clearBtn':  'Clear All',
      'cluster.label':     'Cluster Visualisation',
      'cluster.title':     'Embedding Space Explorer',
      'cluster.desc':      'A t-SNE projection of the encoder\'s learned embedding space over the non-meteor test set.',
      'cluster.dim':       'Dimensions',
      'cluster.colorBy':   'Colour by',
      'cluster.trueLabel': 'True label',
      'cluster.kmeans':    'K-Means cluster',
      'cluster.legend':    'Legend',
      'cluster.plotTitle': 't-SNE cluster plot',
      'cluster.notice':    'Embedding data not yet loaded. Run generate_cluster_data.py and place the outputs at assets/data/embeddings2d.json and assets/data/embeddings3d.json.',

      // ── About ───────────────────────────────────────────────
      'about.label':    'About',
      'about.title':    'Project & Author',
      'about.author':   'The Author',
      'about.bio':      'Student of Mathematical Engineering on Data Science at Universitat Pompeu Fabra, Barcelona.',
      'about.ack':      'Acknowledgements',
      'about.res.label':'Resources',
      'about.res.title':'Links & Downloads',
      'about.report':   'Full Report',
      'about.report.sub':'PDF · Thesis document',
      'about.code':     'Code Repository',
      'about.code.sub': 'GitHub · Source code',
      'about.dataset':  'Dataset',
      'about.dataset.sub':'Download · v1.0',
    },

    ca: {
      // ── Nav ─────────────────────────────────────────────────
      'nav.overview':  'Resum',
      'nav.dataset':   'Conjunt de dades',
      'nav.demo':      'Demo',
      'nav.about':     'Sobre',

      // ── Home ────────────────────────────────────────────────
      'home.eyebrow':       'Treball Final de Grau · Universitat Pompeu Fabra · 2026',
      'home.subtitle':      'De la Construcció del Conjunt de Dades a l\'Aprenentatge de Representació, Classificació i Agrupament de Subclasses',
      'home.download':      'Descarregar Memòria',
      'home.tryDemo':       'Prova la Demo',
      'home.scrollHint':    'Desplaça\'t per explorar',
      'home.s1.label':      '01 · Context',
      'home.s1.title':      'Meteoroides, Meteorits i Meteors',
      'home.glance.label':  'El projecte en resum',
      'home.glance.domain': 'Visió per Computador i Aprenentatge Profund',
      'home.glance.method': 'SSL Contrastiu',
      'home.glance.tasks':  'Classificació + Agrupament',
      'home.glance.source': 'SPMN · Folgueroles',
      'home.s2.label':      '02 · Plantejament del Problema',
      'home.s2.title':      'Un Problema de Classificació Sense Etiquetes',
      'home.s3.label':      '03 · Objectius',
      'home.s3.title':      'Què Pretén Aconseguir Aquest Projecte',
      'home.s4.label':      '04 · Resultats Principals',
      'home.s4.title':      'Conclusions',
      'home.results.note':  'Els resultats específics s\'expliquen a la memòria completa.',

      // ── Dataset ─────────────────────────────────────────────
      'data.label':        'Conjunt de dades',
      'data.title':        'Les Dades Darrere del Model',
      'data.intro':        'Una contribució central d\'aquest projecte és la construcció d\'un conjunt de dades equilibrat d\'esdeveniments de meteors i no-meteors — enregistrats a l\'estació SPMN de Folgueroles, Barcelona.',
      'data.s1.label':     '01 · Origen',
      'data.s1.title':     'D\'on Provenen les Dades',
      'data.s2.label':     '02 · Pipeline de Processament',
      'data.s2.title':     'Del Vídeo Brut a la Mostra d\'Entrenament',
      'data.s3.label':     '03 · Accés i Citació',
      'data.s3.title':     'Descarregar i Citar',
      'data.download':     'Descarregar',

      // ── Demo ────────────────────────────────────────────────
      'demo.label':        'Demo Interactiva',
      'demo.title':        'Explora els Models',
      'demo.tabs.predict': 'Predicció',
      'demo.tabs.cluster': 'Explorador de Clústers',
      'predict.label':     'Model de Classificació',
      'predict.title':     'Meteor vs. No-meteor',
      'predict.desc':      'Puja un o més parells d\'enregistraments (.avi + .xml coincident), o comprimeix-los tots en un sol fitxer .zip.',
      'predict.step1':     'Emparella cada .avi amb el seu .xml — els noms de fitxer han de coincidir',
      'predict.step2':     'Deixa caure els parells aquí, o comprimeix-los i puja l\'arxiu',
      'predict.step3':     'Visualitza les imatges retallades amb les prediccions i descarrega els resultats',
      'predict.drop':      'Deixa caure fitxers o un .zip aquí',
      'predict.browse':    'navega per pujar',
      'predict.hint':      'Parells .avi + .xml · Arxiu .zip · Màx 200 MB',
      'predict.connecting':'Connectant al servidor…',
      'predict.processing':'Processant enregistraments… (pot trigar un minut)',
      'predict.csvBtn':    'CSV',
      'predict.imgsBtn':   'Imatges',
      'predict.clearBtn':  'Esborrar tot',
      'cluster.label':     'Visualització de Clústers',
      'cluster.title':     'Explorador de l\'Espai d\'Embedding',
      'cluster.desc':      'Una projecció t-SNE de l\'espai d\'embedding après per l\'encoder sobre el conjunt de prova de no-meteors.',
      'cluster.dim':       'Dimensions',
      'cluster.colorBy':   'Color per',
      'cluster.trueLabel': 'Etiqueta real',
      'cluster.kmeans':    'Clúster K-Means',
      'cluster.legend':    'Llegenda',
      'cluster.plotTitle': 'Gràfic de clústers t-SNE',
      'cluster.notice':    'Les dades d\'embedding encara no s\'han carregat. Executa generate_cluster_data.py i col·loca les sortides a assets/data/embeddings2d.json i assets/data/embeddings3d.json.',

      // ── About ───────────────────────────────────────────────
      'about.label':    'Sobre',
      'about.title':    'Projecte i Autora',
      'about.author':   'L\'Autora',
      'about.bio':      'Estudiant d\'Enginyeria Matemàtica en Ciència de Dades a la Universitat Pompeu Fabra, Barcelona.',
      'about.ack':      'Agraïments',
      'about.res.label':'Recursos',
      'about.res.title':'Enllaços i Descàrregues',
      'about.report':   'Memòria Completa',
      'about.report.sub':'PDF · Document de la tesi',
      'about.code':     'Repositori de Codi',
      'about.code.sub': 'GitHub · Codi font',
      'about.dataset':  'Conjunt de dades',
      'about.dataset.sub':'Descarregar · v1.0',
    },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT;

  // ── Apply translations ────────────────────────────────────────────────────
  function applyLang(lang) {
    const dict = T[lang] || T[DEFAULT];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) {
        el.textContent = dict[key];
      }
    });

    // Update toggle button label — show the OTHER language (what clicking will switch to)
    const btn   = document.getElementById('lang-toggle');
    const label = document.getElementById('lang-label');
    if (btn && label) {
      label.textContent = lang === 'en' ? 'CA' : 'EN';
      btn.title = lang === 'en' ? 'Canvia a català' : 'Switch to English';
    }

    // Update html lang attribute
    document.documentElement.lang = lang === 'ca' ? 'ca' : 'en';

    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }

  // ── Toggle ────────────────────────────────────────────────────────────────
  // Delegated — works even after nav is re-injected by components.js
  document.addEventListener('click', e => {
    if (e.target.closest('#lang-toggle')) {
      applyLang(currentLang === 'en' ? 'ca' : 'en');
    }
  });

  // ── Re-apply after router injects new page HTML ──────────────────────────
  const appEl = document.getElementById('app');
  if (appEl) {
    new MutationObserver(() => {
      // Small delay so the new page HTML is fully parsed
      requestAnimationFrame(() => applyLang(currentLang));
    }).observe(appEl, { childList: true });
  }

  // ── Apply on first load ───────────────────────────────────────────────────
  // Wait for components.js to mount the nav (lang toggle lives there)
  setTimeout(() => applyLang(currentLang), 50);

  // Expose for manual use
  window.i18n = { apply: applyLang, current: () => currentLang, t: T };
})();
