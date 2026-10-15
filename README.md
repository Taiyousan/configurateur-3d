# Configurateur 3D

Configurateur de modèles 3D dans le navigateur : glissez-déposez un modèle, sélectionnez ses pièces et personnalisez leurs matériaux.

**Stack** : React 19 · TypeScript · Vite · React Three Fiber · drei · postprocessing · zustand

## Fonctionnalités

- **Import par glisser-déposer** : `.glb`, `.gltf` (avec ses `.bin`/textures, ou un dossier entier), `.fbx`, `.obj`, `.stl`, compression DRACO et Meshopt
- **Sélection des pièces** au clic dans la vue 3D ou dans l'arborescence, multi-sélection (Maj+clic), sélection d'un groupe ou de toutes les pièces partageant un matériau
- **Édition des matériaux** : couleur, palette, finitions (mat, satiné, brillant, métal), rugosité, métallique, texture d'origine on/off
- **Annuler / rétablir** (Ctrl+Z / Ctrl+Y)
- **Coloris** : enregistrer plusieurs variantes et passer de l'une à l'autre, ou générer un coloris aléatoire
- **Mise en scène** : environnements HDR, fond, ombres au sol, rotation automatique, cadrage animé (double-clic sur une pièce)
- **Export** : capture PNG et export du modèle personnalisé en `.glb`

## Lancer le projet

```bash
npm install
npm run dev
```

## Organisation

| Fichier | Rôle |
| --- | --- |
| `src/lib/loadModel.ts` | Chargement des formats, résolution des fichiers externes d'un glTF |
| `src/lib/materials.ts` | Préparation du modèle (un matériau par mesh, états d'origine, stats, normalisation) |
| `src/store.ts` | État global : modèle, sélection, historique, coloris, réglages de scène |
| `src/components/Viewer.tsx` | Scène R3F : caméra, interactions, contours de sélection |
| `src/components/*Panel*.tsx`, `SceneTree.tsx` | Interface |

## Crédits

Modèle de chaussure : [pmndrs/examples](https://github.com/pmndrs/examples/tree/main/examples/shoe-configurator) (licence MIT, © Poimandres).
