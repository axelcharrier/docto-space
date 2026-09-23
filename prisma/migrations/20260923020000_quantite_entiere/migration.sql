-- La quantité par prise passe d'un texte libre ("2 comprimés") à un nombre
-- d'unités lu par le distributeur. Les lignes existantes gardent le premier
-- nombre de leur texte, borné à 1..10, et 1 à défaut.

-- AlterTable
ALTER TABLE `LignePrescription` ADD COLUMN `quantite_unites` INTEGER NOT NULL DEFAULT 1;

UPDATE `LignePrescription`
SET `quantite_unites` = LEAST(GREATEST(CAST(REGEXP_SUBSTR(`quantite`, '[0-9]+') AS UNSIGNED), 1), 10)
WHERE REGEXP_SUBSTR(`quantite`, '[0-9]+') <> '';

ALTER TABLE `LignePrescription` DROP COLUMN `quantite`;

ALTER TABLE `LignePrescription` CHANGE `quantite_unites` `quantite` INTEGER NOT NULL DEFAULT 1;
