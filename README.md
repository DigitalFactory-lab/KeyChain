# Atelier porte-clés

Application statique de personnalisation de porte-clés pour Digital Factory.

Texte vectorisé localement avec OpenType.js, huit polices embarquées, un motif configurable, union et décalage des contours avec Clipper. La silhouette finale forme une seule pièce, avec un seul trou d’anneau. Les contreformes des lettres ne sont pas découpées. Les dimensions, bordure et diamètre du trou sont exprimés en millimètres.

Exports laser PDF vectoriel avec tracé noir de 0,6 mm ; UV PDF vectoriel avec chemins colorés ; UV PNG transparent à 600 ppp avec métadonnées pHYs. Un PDF complet réunit les trois vues en 3 pages : aperçu du porte-clés fini (support, lettres, motif, liseré gris pour distinguer le plexi blanc), découpe laser, impression UV. Les PDF partagent la même origine et le même format. Le PNG conserve ce format à l’arrondi d’un pixel près. Ne pas recadrer les exports avant le positionnement dans le logiciel d’impression. Le support choisi (plexi noir, plexi blanc ou bois clair) apparaît dans l’aperçu uniquement. Les yeux et le nez du crâne sont des contreformes transparentes dans les exports UV PDF et PNG ; ils ne créent aucune découpe laser supplémentaire. Le veinage du bois est une représentation indicative. La sous-couche de blanc doit conserver ces transparences. La sous-couche de blanc, les paramètres machine et le gabarit physique sont à préparer dans le logiciel machine.

L’anneau et le motif se calent contre le contour réel des lettres, pas contre leur boîte : ils restent soudés à la silhouette même quand la première ou la dernière lettre est penchée ou creuse (D de Sedgwick, y de Knewave, T ou J seul). L’écart réglé sépare réellement le motif de la lettre la plus proche, et le trou garde une bordure pleine. Les ponts restent un dernier recours, pour un signe isolé comme une apostrophe. Les réglages ne constituent pas une validation de résistance pour un matériau donné. Une découpe et une impression d’essai permettent de valider le réglage choisi.

## Polices

Chaque carte de police affiche le texte saisi, tracé avec les mêmes contours que la découpe.

| Police | Style | Licence |
|---|---|---|
| Bagel Fat One | bulle | OFL |
| Russo One | sport, techno | OFL |
| Knewave | pinceau | OFL |
| Sedgwick Ave Display | graffiti | OFL |
| Shrikhand | rétro années 70 | OFL |
| Bungee | signalétique, majuscules | OFL |
| Chewy | cartoon | Apache 2.0 |
| Luckiest Guy | BD, jeu vidéo | Apache 2.0 |

Toutes proviennent de Google Fonts, contiennent les accents français et autorisent l’usage commercial et la redistribution. Les licences sont dans `assets/<police>-OFL.txt` ou `assets/<police>-LICENSE.txt`.

Pour ajouter une police : déposer le fichier `.ttf` et sa licence dans `assets/`, ajouter une entrée dans `FONTS` (`src/geometry.js`), puis reconstruire. Éviter les polices « usage personnel uniquement » : le dépôt est public, donc les fichiers sont redistribués.

## Développement

`npm ci`, `npm run build`, `npm test`.

Sources dans `src/`, sortie statique à la racine. `npm test` lance les sept scripts de vérification (géométrie, multiligne, attache de l’anneau et du motif, supports, interface, PDF, PNG).

## GitHub Pages

Dans Settings → Pages, sélectionner Deploy from a branch, puis main et / (root).

Le site fonctionne aussi depuis un serveur statique local. Les retours à la ligne, l’interligne, la bordure et la distance du motif sont réglables.

Les PDF sont générés localement via jsPDF et svg2pdf.js. Chaque page reprend les dimensions exactes du porte-clés en mm, sans marge ni fond de matériau. Le laser contient uniquement des traits vectoriels noirs ; l’UV conserve les contreformes et les couleurs, y compris le blanc. Les couches spéciales VersaWorks (blanc/vernis/découpe) restent à configurer dans le logiciel de production.
