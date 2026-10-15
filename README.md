# Configurateur 3D

Configurateur de modèles 3D dans le navigateur : glissez-déposez un modèle, sélectionnez ses pièces et personnalisez leurs matériaux.

**Stack** : React 19 · TypeScript · Vite · React Three Fiber · drei · postprocessing · zustand

## Fonctionnalités

- **Modèles d'exemple** pour tester sans fichier : chaussure, fauteuil, canapé, voiture concept, lunettes de soleil
- **Import par glisser-déposer** : `.glb`, `.gltf` (avec ses `.bin`/textures, ou un dossier entier), `.fbx`, `.obj`, `.stl`, compression DRACO et Meshopt
- **Sélection des pièces** au clic dans la vue 3D ou dans l'arborescence, multi-sélection (Maj+clic), sélection d'un groupe ou de toutes les pièces partageant un matériau
- **Édition des matériaux** : couleur, palette, finitions (mat, satiné, brillant, métal), rugosité, métallique, texture d'origine on/off
- **Annuler / rétablir** (Ctrl+Z / Ctrl+Y)
- **Coloris** : enregistrer plusieurs variantes et passer de l'une à l'autre, ou générer un coloris aléatoire
- **Mise en scène** : environnements HDR, fond, ombres au sol, rotation automatique, cadrage animé (double-clic sur une pièce)
- **Export** : capture PNG et export du modèle personnalisé en `.glb`
- **Mode d'emploi** intégré, ouvert à la première visite puis avec la touche `?`

## Lancer le projet

```bash
npm install
npm run dev
```

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/lib/loadModel.ts` | Chargement des formats (FBX, OBJ, STL chargés à la demande), fichiers externes d'un glTF |
| `src/lib/materials.ts` | Préparation du modèle (un matériau par mesh, états d'origine, stats, normalisation), palette |
| `src/lib/samples.ts` | Catalogue des modèles d'exemple (`public/models`) et leurs crédits |
| `src/lib/exporters.ts` | Capture PNG et export GLB |
| `src/store.ts` | État global : modèle, sélection, historique, coloris, réglages de scène |
| `src/components/Viewer.tsx` | Scène R3F rendue à la demande : caméra, interactions, contours de sélection |
| `src/components/*Panel*.tsx`, `SceneTree.tsx`, `Toolbar.tsx` | Interface |
| `src/components/ui.tsx` | Primitives partagées (section, curseur) |
| `src/site.ts` | Auteur et liens |

## Crédits

- Chaussure : [pmndrs/examples](https://github.com/pmndrs/examples/tree/main/examples/shoe-configurator) (licence MIT, © Poimandres)
- Fauteuil : [SheenChair](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenChair), Eric Chadwick pour Wayfair (CC0)
- Canapé : [GlamVelvetSofa](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/GlamVelvetSofa), Eric Chadwick pour Wayfair ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))
- Voiture concept : [CarConcept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), Eric Chadwick pour Darmstadt Graphics Group, d'après un modèle de Unity Fan ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))
- Lunettes de soleil : [SunglassesKhronos](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SunglassesKhronos), Eric Chadwick pour Darmstadt Graphics Group ([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/))
- Éclairages : HDRI de [Poly Haven](https://polyhaven.com) (CC0), via drei

Les modèles Khronos ont été compressés avec [glTF Transform](https://gltf-transform.dev) (géométrie Draco, textures WebP ≤ 1024 px). Le canapé n'a plus sa lumière intégrée.

Par [Shams Benhamou](https://portfolio-train-livid.vercel.app/). L'identité visuelle reprend les couleurs et les polices de mon portfolio.
