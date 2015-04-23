SpawnKill - Quelques conventions
=========

Fonctionnement des branches
---------------------------

- La branche `master` est la branche stable. C'est cette version qui est releasée.
- La branche `dev` est la branche de développement. C'est de celle-ci que vous devez partir. Les modifications effectuées sur `dev` sont ensuite mergées dans `master` quand elles sont assez matures.
- Pour ajouter une fonctionnalité, partez de la branche `dev` pour en créer une nouvelle `nom-de-votre-fonctionnalite`. Quand votre code est prêt, faites votre `pull request` depuis la branche `dev`


Conventions de code
-------------------

### Conventions de nommage

- Les modules, variables et fonctions sont nommés en anglais. Vous pouvez vous inspirer des noms existants.

### Indentation

- L'indentation se fait avec des espaces et pas des tabulations. Un niveau d'indentation correspond à quatre espaces. La plupart des éditeurs permettent de remplacer les tabulations par des espaces à la saisie.

### Longueur des lignes

- Autant que possible, essayez de maintenir la longueur de vos lignes de code sous 80 caractères. Lorsque vous coupez une ligne trop longue, indentez la ligne suivante avec 8 espaces.

### Commentaires

- Commentez votre code pour faciliter sa lecture par ceux qui vont travailler dessus (il y a de grandes chances que ce soit moi :smile: ). Utilisez `//` pour commenter à l'intérieur des fonctions et `/** ... */` pour commenter les modules ou fonctions.

### Chaînes de caractères

- Utilisez toujours les double-quotes `"` pour délimiter vos chaînes de caractères.

### Déclarations de variables

- Déclarez toutes vos variables avant de les utiliser pour faciliter la compréhension du code.

### Fin d'instructions

- Terminez toutes vos instructions par des `;`, même s'il n'est pas nécessaire.

Utilisation de Git
------------------

### Commits fonctionnels

- Evitez de commiter du code qui ne fonctionne pas. La fonctionnalité peut être incomplète mais le script doit s'exécuter correctement pour faciliter la navigation dans l'historique des versions.

### Messages de commit

- Autant que possible, essayez d'écrire de bons messages de commit en français (jeuxvideo.com est un site français)

Schéma classique :

```
Première ligne : titre du commit

Corps et description de la modification juste après une ligne blanche.
```

La première ligne doit faire moins que 72 caractères et toujours commencer par un verbe d'action. Par exemple :

```
Ajoute le démarrage des GIF au scroll de la page

Les gifs commençaient dès le chargement de la page, du coup on pouvait
les voir en cours de route.
Ce commit permet de démarrer le gif seulement quand on l'a atteint en
scrollant.
```

---

D'autres règles suivront au fur-et-à-mesure du développement de l'application. Pensez à passer relire ce fichier de temps à autres :+1:
