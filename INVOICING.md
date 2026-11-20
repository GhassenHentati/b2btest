# Module Facturation (style Zoho Invoice)

Système de facturation greffé sur la stack existante (Express + Firestore, Angular/Ionic),
reconstruit à partir du modèle fonctionnel de Zoho Invoice : clients, articles, devis →
factures, TVA multi-taux, remises ligne & globale, paiements partiels, PDF.

## Collections Firestore
| Collection | Rôle |
|---|---|
| `invoices` | Factures (items, totaux, paiements embarqués, statut) |
| `estimates` | Devis, convertibles en facture |
| `invoiceSettings/default` | Infos société, devise, préfixes, TVA & échéance par défaut |
| `counters/{invoice\|estimate}` | Séquences de numérotation atomiques (transaction) |

Les clients sont les documents de la collection `users` existante ; les produits (`products`)
avec leur TVA alimentent les lignes.

## Statuts
- **Facture** : `draft → sent → partially_paid → paid` ; `overdue` (calculé si échéance dépassée) ; `cancelled`.
- **Devis** : `draft → sent → accepted/declined/expired → invoiced`.

## API (`/api`)

### Factures — `/invoices`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/invoices?status=&clientId=` | admin | Liste filtrable |
| GET | `/invoices/me` | client | Ses propres factures (hors brouillons) |
| GET | `/invoices/:id` | admin / propriétaire | Détail |
| POST | `/invoices` | admin | Créer (status `draft` ou `sent`) |
| POST | `/invoices/from-order/:orderId` | admin | Générer depuis une commande |
| PATCH | `/invoices/:id` | admin | Modifier (brouillon uniquement) |
| PATCH | `/invoices/:id/status` | admin | `draft` / `sent` / `cancelled` |
| POST | `/invoices/:id/payments` | admin | Enregistrer un paiement (statut recalculé) |
| DELETE | `/invoices/:id/payments/:paymentId` | admin | Supprimer un paiement |
| DELETE | `/invoices/:id` | admin | Supprimer (brouillon uniquement) |
| GET | `/invoices/:id/pdf` | admin / propriétaire | HTML imprimable (→ PDF via navigateur) |

### Devis — `/estimates`
`GET /`, `GET /:id`, `POST /`, `PATCH /:id/status`, `POST /:id/convert` (→ facture), `DELETE /:id`.

### Paramètres — `/invoice-settings`
`GET /` et `PUT /` (admin).

## Calcul des totaux (`backend/src/utils/invoice.ts`)
Par ligne : `base = PU × qté` → remise ligne % → `sous-total HT` → TVA → total ligne.
Remise globale (% ou montant) appliquée au sous-total et répartie au prorata pour garder une
ventilation de TVA exacte. `amountDue = total − somme(paiements)`. Arrondi monétaire à 2 décimales.

## Frontend (admin)
`/admin/invoices` → liste (segment Factures/Devis, filtre statut, KPI encours)
· `/new` & `/:id/edit` → éditeur (lignes, produits, remises, totaux live, brouillon/envoyée)
· `/:id` → détail (paiements, annulation, PDF) · `/settings` → paramètres société.

## Pré-requis build (bugs préexistants, hors de ce module)
1. `backend/package.json` : `jsonwebtoken` doit être `^9.0.2` (le `^9.1.0` actuel n'existe pas → `npm install` échoue).
2. `frontend/angular.json` : structure workspace invalide (`version: "1.0.0"` au lieu de `1`, clés à plat au lieu de `projects`) → `ng build` échoue.

> Le code du module de facturation compile sans erreur côté backend et n'introduit aucune
> erreur TS nouvelle côté frontend.
