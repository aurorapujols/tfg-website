/* ═══════════════════════════════════════════════════════════════
   i18n.js  —  English ↔ Catalan translation system

   Usage: add  data-i18n="key"  to any element.
   The MutationObserver re-applies on every router page change.
   Language is persisted in localStorage.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const STORAGE_KEY = 'tfg_lang';
  const DEFAULT     = 'en';

  const T = {

    // ════════════════════════════════════════════════════════════
    en: {

      // ── Nav & Footer ─────────────────────────────────────────
      'nav.logo': 'TFG · 2026 · Mathematical Engineering on Data Science',
      'nav.overview':  'Overview',
      'nav.dataset':   'Dataset',
      'nav.demo':      'Demo',
      'nav.about':     'About',
      'footer.title':  'Contrastive Self-Supervised Learning for Astronomical Phenomena Identification',
      'footer.sub':    'Final Degree Project \u00b7 AURORA Pujols Rial \u00b7 Universitat Pompeu Fabra \u00b7 2026',
      'footer.built':  'Built with Claude.ai \u00b7 Backend Deployed with Railway \u00b7 Hosted on GitHub Pages',

      // ── Home ─────────────────────────────────────────────────
      'home.eyebrow':          'Final Degree Project \u00b7 Universitat Pompeu Fabra \u00b7 2026',
      'home.subtitle':         'From Dataset Construction to Representation Learning, Classification, and Subclass Clustering',
      'home.download':         'Download Report',
      'home.tryDemo':          'Try the Demo',
      'home.scrollHint':       'Scroll to explore',
      'home.s1.label':         '01 \u00b7 Background',
      'home.s1.title':         'Meteoroids, Meteorites, & Meteors',
      'home.s1.p1':            'Meteoritics is the science that studies meteors, meteorites, and meteoroids, with the goal of recovering and analysing rocks from space that penetrate the Earth\u2019s atmosphere \u2014 providing key insights into the origin and evolution of the Solar System and the history of the inner planets.',
      'home.s1.p2':            'Three related terms define the scope of this project: meteoroids are rocks in space ranging from dust grains to small asteroids; meteors are the visible trail of light produced when a meteoroid enters the atmosphere at high speed and burns \u2014 also known as a fireball or shooting star; and meteorites are fragments that survive atmospheric entry and reach the ground.',
      'home.s1.p3':            'Multiple organisations monitor bright meteors continuously, including the NASA All-Sky Fireball Network, the Desert Fireball Network, FRIPON, and the Spanish Fireball and Meteorite Recovery Network (SPMN) \u2014 a multidisciplinary professional-amateur collaboration with 60 stations across Spain, recording thousands of fireballs per year.',
      'home.s1.p4':            'The recorded material does not consist solely of meteors. Planes, birds, artificial lights, and meteorological events are also detected \u2014 often far more frequently than actual meteors. This project focuses on the detection and classification of meteor events from video data collected at the SPMN station located in Folgueroles, Barcelona.',
      'home.glance.label':     'Project at a glance',
      'home.glance.domainKey': 'Domain',
      'home.glance.domainVal': 'Computer Vision & Deep Learning',
      'home.glance.methodKey': 'Method',
      'home.glance.tasksKey':  'Tasks',
      'home.glance.tasksVal':  'Classification + Clustering',
      'home.glance.sourceKey': 'Data source',
      'home.glance.authorKey': 'Author',
      'home.glance.supervisorKey': 'Supervisor',
      'home.report':           'Full Report',
      'home.reportSub':        'PDF \u00b7 ~XX pages',
      'home.s2.label':         '02 \u00b7 Problem Statement',
      'home.s2.title':         'A Classification Problem',
      'home.s2.titleEm':       'Without Labels',
      'home.s2.p1':            'The core challenge this project addresses is the absence of an automated pipeline for classifying meteor events at the SPMN station. Because non-meteor events were historically discarded rather than saved, no labelled dataset for the non-meteor class existed prior to this work \u2014 making it impossible to train a supervised classifier directly.',
      'home.s2.p2':            'Even once negative samples are collected, the non-meteor class contains a heterogeneous mixture of phenomena \u2014 planes, birds, insects, artificial lights, atmospheric events \u2014 none of which carry subclass labels. This gives rise to two coupled challenges:',
      'home.pipe1.title':      'Binary Classification',
      'home.pipe1.desc':       'A meteor vs. non-meteor classifier must be learned from a newly constructed dataset, using a method that does not rely on class labels during representation learning.',
      'home.pipe2.title':      'Subclass Discovery',
      'home.pipe2.desc':       'An unsupervised approach is needed to explore the internal structure of the non-meteor class and assess whether distinct subclasses \u2014 planes, birds, lightning \u2014 can be recovered without manual annotation.',
      'home.pipe3.title':      'Self-Supervised Learning',
      'home.pipe3.desc':       'Contrastive SSL is a natural fit for both challenges: it learns rich visual representations from unlabelled data, and the embeddings can be used for both downstream classification and clustering.',
      'home.s3.label':         '03 \u00b7 Objectives',
      'home.s3.title':         'What This Project Aims to Achieve',
      'home.obj1.title':       'Primary Objective',
      'home.obj1.p1':          'Develop a classification pipeline that reliably distinguishes between meteor and non-meteor events. By learning a representation that generalizes across the visual characteristics of the station\u2019s recordings, the goal is to achieve high binary classification accuracy using a simple linear probe on top of the learned embeddings.',
      'home.obj1.p2':          'Because non-meteor data were normally discarded prior to this project, all detections were saved and labelled into the two main classes for the duration of the data collection period \u2014 by the data provider himself.',
      'home.obj2.title':       'Secondary Objective',
      'home.obj2.p1':          'Classify non-meteor events into specific categories such as planes, birds, insects, lightning, and other sources of false detections. These data carry scientific value in their own right \u2014 for example, recordings of bird migration and flight patterns.',
      'home.obj2.p2':          'The dataset contains no subclass labels for non-meteor phenomena, and its size makes manual annotation impractical. This task is therefore approached using unsupervised clustering applied to the learned embeddings.',
      'home.aim.label':        'Overarching aim',
      'home.aim.text':         'Automate and accelerate the manual classification currently performed at the Folgueroles SPMN station using deep learning \u2014 reducing a nightly, time-consuming screening process to a fully automated pipeline.',
      'home.s4.label':         '04 \u00b7 Key Results',
      'home.s4.title':         'Findings',
      'home.res.accuracy':     'Binary Classification Accuracy',
      'home.res.subclasses':   'Subclasses',
      'home.res.samples':      'Dataset Samples',
      'home.res.dims':         'Embedding Dimensions',
      'home.res.note':         'Specific results explained in the full report.',

      // ── Dataset ──────────────────────────────────────────────
      'data.label':            'Dataset',
      'data.title':            'The Data Behind the Model',
      'data.intro':            'A core contribution of this project is the construction of a curated, balanced dataset of meteor and non-meteor events \u2014 recorded at the SPMN station in Folgueroles, Barcelona, and processed into a form suitable for self-supervised learning.',
      'data.s1.label':         '01 \u00b7 Origins',
      'data.s1.title':         'Where the Data Comes From',
      'data.s1.p1':            'All recordings originate from the Folgueroles station of the Spanish Fireball and Meteorite Recovery Network (SPMN). The station runs four grayscale cameras pointing to different regions of the sky \u2014 North-East, West, South, and East \u2014 continuously capturing the night sky using motion-detection software (UFOCaptureV2).',
      'data.s1.p2':            'Each detected event produces a short video clip alongside XML metadata encoding trajectory coordinates, brightness values, duration, and camera information. Because non-meteor events were historically discarded, systematic saving of both classes began on 4 October 2025 specifically for this project.',
      'data.card.title':       'Dataset Summary',
      'data.card.total':       'Total samples',
      'data.card.meteors':     'Meteors',
      'data.card.nonMeteors':  'Non-meteors',
      'data.card.subclass':    'Subclass labels',
      'data.card.subclassVal': '14 classes \u00b7 2,591 samples',
      'data.card.cameras':     'Cameras',
      'data.card.period':      'Collection period',
      'data.s2.label':         '02 \u00b7 Processing Pipeline',
      'data.s2.title':         'From Raw Video to Training Sample',
      'data.step1.title':      'Manual collection & labelling',
      'data.step1.desc':       'Recordings from all four cameras were saved and manually labelled as meteor or non-meteor using the station\u2019s existing software interface. Meteor data from a prior archive (2023\u20132025) was included to achieve a balanced dataset.',
      'data.step2.title':      'Sum image construction',
      'data.step2.desc':       'Rather than using raw video frames, each clip is compressed into a single sum image: the first frame (background) is subtracted from all subsequent frames, and the results are accumulated via a pixel-wise maximum. This isolates the moving object\u2019s full trajectory in one compact representation.',
      'data.step3.title':      'Cropping',
      'data.step3.desc':       'XML metadata provides the bounding coordinates of the detected trajectory. Each sum image is cropped around this region with a fixed padding, centering the input on the object of interest and discarding irrelevant sky background.',
      'data.step4.title':      'Histogram enhancement',
      'data.step4.desc':       'Four contrast-enhancement techniques are applied to the cropped images \u2014 min-max stretch, percentile stretch, global thresholding, and a custom meteor stretch using per-recording brightness metadata \u2014 and retained as candidate augmentations for the contrastive training stage.',
      'data.step5.title':      'Subclass test-set labelling',
      'data.step5.desc':       'To evaluate the secondary clustering objective, 2,591 non-meteor samples were manually labelled into 14 fine-grained subclasses (planes, birds, insects, lightning, artificial lights, and others), providing a ground-truth reference for unsupervised evaluation.',
      'data.s3.label':         '03 \u00b7 Access & Citation',
      'data.s3.title':         'Download & Cite',
      'data.s3.desc':          'The dataset is publicly available. If you use it in your research, please cite the accompanying project report.',
      'data.downloadLabel':    'SPMN Folgueroles Dataset v1.0',
      'data.download':         'Download',
      'data.bibtexLabel':      'BibTeX citation',

      // ── Demo ─────────────────────────────────────────────────
      'demo.label':            'Interactive Demo',
      'demo.title':            'Explore the Models',
      'demo.intro':            "Upload meteor recording pairs (.avi + .xml) or a .zip archive to run the classifier. Results are shown as a grid of cropped sum images, each with its predicted class and confidence score.",
      'demo.tabPredict':       'Prediction',
      'demo.tabCluster':       'Cluster Explorer',
      'upload.step1':          'Pair each .avi with its .xml (filenames must match)',
      'upload.step2':          'Drop pairs here, or zip them and upload the archive',
      'upload.step3':          'View cropped images with predictions, then download results',
      'upload.primary':        'Drop files or a .zip here',
      'upload.secondary':      'or browse to upload',
      'upload.hint':           '.avi + .xml pairs · .zip archive · Max 200 MB',
      'predict.label':         'Classification Model',
      'predict.title':         'Meteor vs. Non-meteor',
      'predict.desc':          'Upload one or more recording pairs (.avi + matching .xml), or bundle them all into a single .zip file. The server will generate the cropped sum image for each pair and run the trained classifier.',
      'results.csv':           'CSV',
      'results.images':        'Images',
      'results.clear':         'Clear All',
      'cluster.label':         'Cluster Visualisation',
      'cluster.title':         'Embedding Space Explorer',
      'cluster.desc':          'A t-SNE projection of the encoder\u2019s learned embedding space over the non-meteor test set, coloured by true subclass label or by K-Means cluster. Use the toggles to switch between 2D and 3D views.',
      'cluster.dim':           'Dimensions',
      'cluster.colorBy':       'Colour by',
      'cluster.trueLabel':     'True label',
      'cluster.kmeans':        'K-Means cluster',
      'cluster.legend':        'Legend',
      'cluster.plotTitle':     't-SNE cluster plot',
      'cluster.notice':        'Embedding data not yet loaded. Run generate_cluster_data.py and place the outputs at assets/data/embeddings2d.json and assets/data/embeddings3d.json.',
      'storage.warning':       'Approaching storage limit.',
      'storage.downloadClear': 'Download & Clear',
      'error.generic':         'An error occurred.',
      'loading.message':       'Connecting to server...',


      // ── About ────────────────────────────────────────────────
      'about.label':           'About',
      'about.title':           'Project & Author',
      'about.author':          'The Author',
      'about.bio':             'Student of Mathematical Engineering on Data Science at Universitat Pompeu Fabra, Barcelona.',
      'about.ack':             'Acknowledgements',
      'about.res.label':       'Resources',
      'about.res.title':       'Links & Downloads',
      'about.report':          'Full Report',
      'about.report.sub':      'PDF \u00b7 Thesis document',
      'about.code':            'Code Repository',
      'about.code.sub':        'GitHub \u00b7 Source code',
      'about.dataset':         'Dataset',
      'about.dataset.sub':     'Download \u00b7 v1.0',
      'about.ack.p1': 'Thank you to my supervisor Coloma Ballester for their help and contribution to the project, ',
      'about.ack.p2': 'to Pep Pujols Puigdesens as the owner of the SPMN station that provided the data, and to the ',
      'about.ack.p3': ' and its coordinator Prof. Josep M. Trigo-Rodríguez, as well as the Agrupació Astronòmica d’Osona, for their contribution to the scientific field of astronomy.',

    },

    // ════════════════════════════════════════════════════════════
    ca: {

      // ── Nav & Footer ─────────────────────────────────────────
      'nav.logo': 'TFG · 2026 · Enginyeria Matemàtica en Ciència de Dades',
      'nav.overview':  'Resum',
      'nav.dataset':   'Dades',
      'nav.demo':      'Demo',
      'nav.about':     'Sobre',
      'footer.title':  'Aprenentatge Autosupervisat Contrastiu per a la Identificaci\u00f3 de Fen\u00f2mens Astron\u00f2mics',
      'footer.sub':    'Treball Final de Grau \u00b7 AURORA Pujols Rial \u00b7 Universitat Pompeu Fabra \u00b7 2026',
      'footer.built':  'Fet amb Claude.ai \u00b7 Backend desplegat amb Railway \u00b7 Allotjat a GitHub Pages',

      // ── Home ─────────────────────────────────────────────────
      'home.eyebrow':          'Treball Final de Grau \u00b7 Universitat Pompeu Fabra \u00b7 2026',
      'home.subtitle':         'De la Construcci\u00f3 del Conjunt de Dades a l\u2019Aprenentatge de Representaci\u00f3, Classificaci\u00f3 i Agrupament de Subclasses',
      'home.download':         'Descarregar Mem\u00f2ria',
      'home.tryDemo':          'Prova la Demo',
      'home.scrollHint':       'Desapla\u00e7a\u2019t per explorar',                  
      'home.s1.label':         '01 \u00b7 Context',
      'home.s1.title':         'Meteoroides, Meteorits i Meteors',
      'home.s1.p1':            'La meteorit\u00edca \u00e9s la ci\u00e8ncia que estudia els meteors, meteorits i meteoroides, amb l\u2019objectiu de recuperar i analitzar roques de l\u2019espai que penetren l\u2019atm\u00f2sfera terrestre \u2014 proporcionant informaci\u00f3 clau sobre l\u2019origen i evoluci\u00f3 del Sistema Solar i la hist\u00f2ria dels planetes.',
      'home.s1.p2':            'Tres termes relacionats defineixen l\u2019abast d\u2019aquest projecte: els meteoroides s\u00f3n roques a l\u2019espai que van des de grans de pols fins a petits asteroides; els meteors s\u00f3n el rastre de llum visible produit quan un meteoroide entra a l\u2019atm\u00f2sfera a alta velocitat i crema \u2014 tamb\u00e9 conegut com a estrella fugaç; i els meteorits s\u00f3n fragments que sobreviuen l\u2019entrada atmosf\u00e8rica i arriben al s\u00f2l.',
      'home.s1.p3':            'Diverses organitzacions monitoritzen continu\u00efment els meteors brillants, incloent la  NASA All-Sky Fireball Network, la Desert Fireball Network, FRIPON, i la Spanish Fireball and Meteorite Recovery Network (SPMN) \u2014 una col\u00b7laboraci\u00f3 professional-amateur multidisciplin\u00e0ria amb 60 estacions a tota la península.',
      'home.s1.p4':            'El material enregistrat no consisteix \u00fanicament en meteors. Avions, ocells, llums artificials i esdeveniments meteorol\u00f2gics tamb\u00e9 es detecten \u2014 sovint molt m\u00e9s freq\u00fcentment que els meteors reals. Aquest projecte se centra en la detecci\u00f3 i classificaci\u00f3 d\u2019esdeveniments de meteors a partir de dades de v\u00eddeo recollides a l\u2019estaci\u00f3 SPMN de Folgueroles, Barcelona.',
      'home.glance.label':     'El projecte en resum',
      'home.glance.domainKey': '\u00c0mbit',
      'home.glance.domainVal': 'Visi\u00f3 per Computador i Aprenentatge Profund',
      'home.glance.methodKey': 'M\u00e8tode',
      'home.glance.tasksKey':  'Tasques',
      'home.glance.tasksVal':  'Classificaci\u00f3 + Agrupament',
      'home.glance.sourceKey': 'Font de dades',
      'home.glance.authorKey': 'Autora',
      'home.glance.supervisorKey': 'Supervisora',
      'home.report':           'Mem\u00f2ria Completa',
      'home.reportSub':        'PDF \u00b7 ~XX p\u00e0gines',
      'home.s2.label':         '02 \u00b7 Plantejament del Problema',
      'home.s2.title':         'Un Problema de Classificaci\u00f3',
      'home.s2.titleEm':       'Sense Etiquetes',
      'home.s2.p1':            'El repte central que aborda aquest projecte \u00e9s l\u2019abs\u00e8ncia d\u2019un pipeline automatitzat per classificar esdeveniments de meteors a l\u2019estaci\u00f3 SPMN. Com que els esdeveniments de no-meteors hist\u00f2ricament es descartaven en comptes de guardar-los, no existia cap conjunt de dades etiquetades per a la classe no-meteor \u2014 fent impossible entrenar directament un classificador supervisat.',
      'home.s2.p2':            'Fins i tot un cop recollides les mostres negatives, la classe no-meteor cont\u00e9 una barreja heterog\u00e8nia de fen\u00f2mens \u2014 avions, ocells, insectes, llums artificials, esdeveniments atmosf\u00e8rics \u2014 cap dels quals t\u00e9 etiquetes de subclasse. Aix\u00f2 d\u00f3na lloc a dos reptes:',
      'home.pipe1.title':      'Classificaci\u00f3 Bin\u00e0ria',
      'home.pipe1.desc':       'Un classificador de meteor vs. no-meteor s\u2019ha d\u2019aprendre a partir d\u2019un conjunt de dades recentment constru\u00eft, usant un m\u00e8tode que no dep\u00e8n d\u2019etiquetes de classe durant l\u2019aprenentatge de representaci\u00f3.',
      'home.pipe2.title':      'Descoberta de Subclasses',
      'home.pipe2.desc':       'Cal un enfocament no supervisat per explorar l\u2019estructura interna de la classe no-meteor i avaluar si subclasses diferents \u2014 avions, ocells, llamps \u2014 es poden recuperar sense anotaci\u00f3 manual.',
      'home.pipe3.title':      'Aprenentatge Autosupervisat',
      'home.pipe3.desc':       'L\u2019SSL (Self-Supervised Learning) Contrastiu \u00e9s una opci\u00f3 natural per a tots dos reptes: apr\u00e8n representacions visuals riques a partir de dades sense etiquetar, i els embeddings es poden usar tant per a la classificaci\u00f3 com per a l\u2019agrupament.',
      'home.s3.label':         '03 \u00b7 Objectius',
      'home.s3.title':         'Qu\u00e8 Pret\u00e9n Aconseguir Aquest Projecte',
      'home.obj1.title':       'Objectiu Principal',
      'home.obj1.p1':          'Desenvolupar un pipeline de classificaci\u00f3 que distingeixi de manera fiable entre esdeveniments de meteors i no-meteors. Aprenent una representaci\u00f3 que generalitzi les caracter\u00edstiques visuals dels enregistraments de l\u2019estaci\u00f3, l\u2019objectiu \u00e9s assolir una alta precisi\u00f3 de classificaci\u00f3 bin\u00e0ria usant un classificador lineal simple sobre els embeddings apresos.',
      'home.obj1.p2':          'Com que les dades de no-meteor normalment es descartaven abans d\u2019aquest projecte, totes les deteccions es van guardar i etiquetar en les dues classes principals durant el per\u00edode de recollida de dades per la mateixa persona que va proporcionar les dades.',
      'home.obj2.title':       'Objectiu Secundari',
      'home.obj2.p1':          'Classificar els esdeveniments de no-meteor en categories espec\u00edfiques com avions, ocells, insectes, llamps i altres fonts de falses deteccions. Aquestes dades tenen valor cient\u00edfic en si mateixes \u2014 per exemple, enregistraments de migraci\u00f3 i patrons de vol d\u2019ocells.',
      'home.obj2.p2':          'El conjunt de dades no conté etiquetes de subclasse per als fen\u00f2mens de no-meteor, i la seva mida fa que l\u2019anotaci\u00f3 manual sigui impracticable. Aquesta tasca s\u2019aborda per tant mitjan\u00e7ant agrupament no supervisat aplicat als embeddings apresos.',
      'home.aim.label':        'Objectiu global',
      'home.aim.text':         'Automatitzar i accelerar la classificaci\u00f3 manual que es realitza actualment a l\u2019estaci\u00f3 SPMN de Folgueroles mitjan\u00e7ant aprenentatge profund \u2014 reduint un proc\u00e9s labori\u00f3s a un pipeline completament automatitzat.',
      'home.s4.label':         '04 \u00b7 Resultats Principals',
      'home.s4.title':         'Conclusions',
      'home.res.accuracy':     'Precisi\u00f3 de Classificaci\u00f3 Bin\u00e0ria',
      'home.res.subclasses':   'Subclasses',
      'home.res.samples':      'Mostres del Conjunt de Dades',
      'home.res.dims':         'Dimensions de l\u2019Embedding',
      'home.res.note':         'Els resultats espec\u00edfics s\u2019expliquen a la mem\u00f2ria completa.',

      // ── Dataset ──────────────────────────────────────────────
      'data.label':            'Conjunt de dades',
      'data.title':            'Les Dades Darrere del Model',
      'data.intro':            'Una contribuci\u00f3 central d\u2019aquest projecte \u00e9s la construcci\u00f3 d\u2019un conjunt de dades equilibrat d\u2019esdeveniments de meteors i no-meteors \u2014 enregistrats a l\u2019estaci\u00f3 SPMN de Folgueroles, Barcelona, i processats en una forma adequada per a l\u2019aprenentatge autosupervisat.',
      'data.s1.label':         '01 \u00b7 Origen',
      'data.s1.title':         'D\u2019on Provenen les Dades',
      'data.s1.p1':            'Tots els enregistraments provenen de l\u2019estaci\u00f3 de Folgueroles de la Xarxa Espanyola de Boles de Foc i Recuperaci\u00f3 de Meteorits (SPMN). L\u2019estaci\u00f3 funciona amb quatre c\u00e0meres en escala de grisos que apunten a diferents regions del cel \u2014 Nord-est, Oest, Sud i Est \u2014 capturant continu\u00efment el cel nocturn amb el programari de detecci\u00f3 de moviment UFOCaptureV2.',
      'data.s1.p2':            'Cada esdeveniment detectat produeix un clip de v\u00eddeo curt juntament amb metadades XML que codifiquen les coordenades de la traject\u00f2ria, els valors de brillantor, la duraci\u00f3 i la informaci\u00f3 de la c\u00e0mera. Com que els esdeveniments de no-meteor hist\u00f2ricament es descartaven, el guardament sistem\u00e0tic de les dues classes va comen\u00e7ar el 4 d\u2019octubre de 2025 espec\u00edficament per a aquest projecte.',
      'data.card.title':       'Resum del Conjunt de Dades',
      'data.card.total':       'Total de mostres',
      'data.card.meteors':     'Meteors',
      'data.card.nonMeteors':  'No-meteors',
      'data.card.subclass':    'Etiquetes de subclasse',
      'data.card.subclassVal': '13 classes \u00b7 2.591 mostres',
      'data.card.cameras':     'C\u00e0meres',
      'data.card.period':      'Per\u00edode de recollida',
      'data.s2.label':         '02 \u00b7 Pipeline de Processament',
      'data.s2.title':         'Del V\u00eddeo Brut a la Mostra d\u2019Entrenament',
      'data.step1.title':      'Recollida i etiquetatge manual',
      'data.step1.desc':       'Els enregistraments de les quatre c\u00e0meres es van guardar i etiquetar manualment com a meteor o no-meteor usant la interf\u00edcie de programari existent de l\u2019estaci\u00f3. Les dades de meteor d\u2019un arxiu anterior (2023\u20132025) es van incloure per aconseguir un conjunt de dades equilibrat.',
      'data.step2.title':      'Construcci\u00f3 de la imatge suma',
      'data.step2.desc':       'En lloc d\u2019usar fotogrames de v\u00eddeo bruts, cada clip es comprimeix en una sola imatge suma: el primer fotograma (fons) se subtrau de tots els fotogrames posteriors, i els resultats s\u2019acumulen mitjan\u00e7ant un m\u00e0xim p\u00edxel a p\u00edxel. Aix\u00f2 a\u00eflla la traject\u00f2ria completa de l\u2019objecte en moviment en una representaci\u00f3 compacta.',
      'data.step3.title':      'Retallar',
      'data.step3.desc':       'Les metadades XML proporcionen les coordenades del rectangle delimtador de la traject\u00f2ria detectada. Cada imatge suma es retalla al voltant d\u2019aquesta regi\u00f3 amb un encoixinat fix, centrant l\u2019entrada en l\u2019objecte d\u2019inter\u00e8s i descartant el fons de cel irrellevant.',
      'data.step4.title':      'Millora d\u2019histograma',
      'data.step4.desc':       'S\u2019apliquen quatre t\u00e8cniques de millora del contrast a les imatges retallades \u2014 estirament min-m\u00e0x, estirament percentil, llindaritzaci\u00f3 global i un estirament de meteor personalitzat usant metadades de brillantor per enregistrament \u2014 i es retenen com a augmentacions candidates per a l\u2019etapa d\u2019entrenament contrastiu.',
      'data.step5.title':      'Etiquetatge de subclasses del conjunt de prova',
      'data.step5.desc':       'Per avaluar l\u2019objectiu secundari d\u2019agrupament, 2.591 mostres de no-meteor van ser etiquetades manualment en 13 subclasses fines (avions, ocells, insectes, llamps, llums artificials i d\u2019altres), proporcionant una refer\u00e8ncia de veritat del s\u00f2l per a l\u2019avaluaci\u00f3 no supervisada.',
      'data.s3.label':         '03 \u00b7 Acc\u00e9s i Citaci\u00f3',
      'data.s3.title':         'Descarregar i Citar',
      'data.s3.desc':          'El conjunt de dades est\u00e0 disponible p\u00fablicament. Si l\u2019useu a la vostra investigaci\u00f3, si-us-plau citeu la mem\u00f2ria del projecte.',
      'data.downloadLabel':    'Conjunt de dades SPMN Folgueroles v1.0',
      'data.download':         'Descarregar',
      'data.bibtexLabel':      'Citaci\u00f3 BibTeX',

      // ── Demo ─────────────────────────────────────────────────
      'demo.label':            'Demo Interactiva',
      'demo.title':            'Explora els Models',
      'demo.intro':            "Puja parells d\u2019enregistraments de meteors (.avi + .xml) o un arxiu .zip per executar el classificador. Els resultats es mostren com una graella d’imatges suma retallades, cadascuna amb la classe predita i el seu nivell de confiança.",
      'demo.tabPredict':       'Predicció',
      'demo.tabCluster':       'Explorador de Clústers',
      'upload.step1':          'Aparaella cada .avi amd el seu .xml (els noms han de coincidir)',
      'upload.step2':          'Deixa els parells aquí, o comprimeix-los i puja l\u2019arxiu .zip',
      'upload.step3':          'Visualitza les imatges retallades amb les prediccions i descarrega els resultats',
      'upload.primary':        'Arrossega fitxers o un .zip aquí',
      'upload.secondary':      'o navega per pujar-los',
      'upload.hint':           'Parells .avi + .xml · Arxiu .zip · Màx 200 MB',
      'predict.label':         'Model de Classificaci\u00f3',
      'predict.title':         'Meteor vs. No-meteor',
      'predict.desc':          'Puja un o m\u00e9s parells d\u2019enregistraments (.avi + .xml coincident), o comprimeix-los tots en un sol fitxer .zip. El servidor generar\u00e0 la imatge suma retallada per a cada parell i executar\u00e0 el classificador entrenat.',
      'results.csv':           'CSV',
      'results.images':        'Imatges',
      'results.clear':         'Esborrar Tot',
      'cluster.label':         'Visualitzaci\u00f3 de Cl\u00fasters',
      'cluster.title':         'Explorador de l\u2019Espai d\u2019Embedding',
      'cluster.desc':          'Una projecci\u00f3 t-SNE de l\u2019espai d\u2019embedding apr\u00e8s per l\u2019encoder sobre el conjunt de prova de no-meteors, acolorit per etiqueta de subclasse real o per cl\u00faster K-Means.',
      'cluster.dim':           'Dimensions',
      'cluster.colorBy':       'Color per',
      'cluster.trueLabel':     'Etiqueta real',
      'cluster.kmeans':        'Cl\u00faster K-Means',
      'cluster.legend':        'Llegenda',
      'cluster.plotTitle':     'Gr\u00e0fic de cl\u00fasters t-SNE',
      'cluster.notice':        'Les dades d\u2019embedding encara no s\u2019han carregat. Executa generate_cluster_data.py i col\u00b7loca les sortides a assets/data/embeddings2d.json i assets/data/embeddings3d.json.',
      'storage.warning':       'S\u2019està arribant al límit d\u2019emmagatzematge.',
      'storage.downloadClear': 'Descarregar i Netejar',
      'error.generic':         'S\u2019ha produït un error.',
      'loading.message':       'Connectant amb el servidor...',


      // ── About ────────────────────────────────────────────────
      'about.label':           'Sobre',
      'about.title':           'Projecte i Autora',
      'about.author':          'L\u2019Autora',
      'about.bio':             'Estudiant d\u2019Enginyeria Matem\u00e0tica en Ci\u00e8ncia de Dades a la Universitat Pompeu Fabra, Barcelona.',
      'about.ack':             'Agra\u00efments',
      'about.res.label':       'Recursos',
      'about.res.title':       'Enlla\u00e7os i Desc\u00e0rregues',
      'about.report':          'Mem\u00f2ria Completa',
      'about.report.sub':      'PDF \u00b7 Document de la tesi',
      'about.code':            'Repositori de Codi',
      'about.code.sub':        'GitHub \u00b7 Codi font',
      'about.dataset':         'Conjunt de dades',
      'about.dataset.sub':     'Descarregar \u00b7 v1.0',
      'about.ack.p1': 'Agraeixo a la meva supervisora Coloma Ballester per la seva ajuda i contribució al projecte, ',
      'about.ack.p2': 'a Pep Pujols Puigdesens com a propietari de l’estació SPMN que va proporcionar les dades, i a la ',
      'about.ack.p3': ' i al seu coordinador Prof. Josep M. Trigo-Rodríguez, així com a l’Agrupació Astronòmica d’Osona, per la seva contribució al camp científic de l’astronomia.',
      
    },
  };

  // ── State ────────────────────────────────────────────────────────────────
  let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT;

  // ── Apply ─────────────────────────────────────────────────────────────────
  function applyLang(lang) {
    const dict = T[lang] || T[DEFAULT];

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    // Toggle button label shows the OTHER language
    const label = document.getElementById('lang-label');
    const btn   = document.getElementById('lang-toggle');
    if (label) label.textContent = lang === 'en' ? 'CA' : 'EN';
    if (btn)   btn.title         = lang === 'en' ? 'Canvia a catal\u00e0' : 'Switch to English';

    document.documentElement.lang = lang === 'ca' ? 'ca' : 'en';
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────
  document.addEventListener('click', e => {
    if (e.target.closest('#lang-toggle')) {
      applyLang(currentLang === 'en' ? 'ca' : 'en');
    }
  });

  // ── Re-apply after router injects new page ────────────────────────────────
  const appEl = document.getElementById('app');
  if (appEl) {
    new MutationObserver(() => requestAnimationFrame(() => applyLang(currentLang)))
      .observe(appEl, { childList: true });
  }

  // ── First load ─────────────────────────────────────────────────────────────
  setTimeout(() => applyLang(currentLang), 50);

  window.i18n = { apply: applyLang, current: () => currentLang, t: T };
})();
